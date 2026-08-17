import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody,
  ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ChatService } from './chat.service';

interface AuthedSocket extends Socket {
  data: { userId: string; joinedConversations: Set<string> };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env.FRONTEND_URL || '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  // userId -> set of connected socket ids. A user can have more than one
  // tab/device open at once, so "online" only flips false once the LAST
  // socket for that user disconnects, not the first.
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly chatService: ChatService,
  ) {}

  // ── Auth on connect ──────────────────────────────────────────────────
  // Sockets never pass through JwtAccessGuard/passport — the handshake
  // carries the same access token the REST API uses. Verified by hand here
  // with the same "re-check accountStatus live" principle as
  // JwtAccessStrategy, so a suspend/ban drops the socket immediately
  // instead of waiting for the access token to expire (up to 15 min).
  async handleConnection(socket: AuthedSocket) {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.headers.authorization?.replace('Bearer ', '') as string);
      if (!token) throw new UnauthorizedException('No token provided');

      const payload = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET! });
      const user = await this.userModel.findById(payload.sub).select('accountStatus').lean();
      if (!user || user.accountStatus !== 'active') {
        throw new UnauthorizedException('Account is not active');
      }

      socket.data.userId = payload.sub;
      socket.data.joinedConversations = new Set();

      const set = this.onlineUsers.get(payload.sub) ?? new Set();
      set.add(socket.id);
      this.onlineUsers.set(payload.sub, set);

      // Personal room — lets the server target this user across ALL their
      // open tabs/devices without knowing individual socket ids.
      socket.join(`user:${payload.sub}`);
    } catch (err) {
      this.logger.warn(`Rejected socket connection: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: AuthedSocket) {
    const userId = socket.data?.userId;
    if (!userId) return;

    const set = this.onlineUsers.get(userId);
    set?.delete(socket.id);

    if (!set || set.size === 0) {
      this.onlineUsers.delete(userId);
      await this.chatService.touchLastActive(userId);

      for (const conversationId of socket.data.joinedConversations ?? []) {
        socket.to(`conversation:${conversationId}`).emit('presence', {
          userId,
          online: false,
          lastActiveAt: new Date(),
        });
      }
    }
  }

  isOnline(userId: string): boolean {
    return (this.onlineUsers.get(userId)?.size ?? 0) > 0;
  }

  // ── Join a thread ────────────────────────────────────────────────────
  // Membership is re-verified inside ChatService, not trusted from the
  // client — joining a room you're not a participant in throws.
  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = socket.data.userId;
    await this.chatService.markDelivered(data.conversationId, userId);

    socket.join(`conversation:${data.conversationId}`);
    socket.data.joinedConversations.add(data.conversationId);

    socket.to(`conversation:${data.conversationId}`).emit('presence', {
      userId,
      online: true,
      lastActiveAt: null,
    });

    return { joined: data.conversationId };
  }

  @SubscribeMessage('leave_conversation')
  leaveConversation(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    socket.leave(`conversation:${data.conversationId}`);
    socket.data.joinedConversations?.delete(data.conversationId);
  }

  // ── Send a message ──────────────────────────────────────────────────
  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: {
      conversationId: string;
      text?: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'file';
      fileName?: string;
      fileSize?: number;
    },
  ) {
    const senderId = socket.data.userId;
    const { message, recipientId } = await this.chatService.createMessage(
      data.conversationId,
      senderId,
      data.text,
      {
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        fileName: data.fileName,
        fileSize: data.fileSize,
      },
    );

    // Push to everyone actively in the thread — both participants, every
    // open tab, including the sender (so multi-device stays in sync).
    this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);

    let preview = message.text;
    if (!preview && message.mediaUrl) {
      preview = message.mediaType === 'image' ? '📷 Photo' : `📎 ${message.fileName || 'Attachment'}`;
    }

    // Nudge the recipient's personal room
    this.server.to(`user:${recipientId}`).emit('conversation_updated', {
      conversationId: data.conversationId,
      lastMessagePreview: preview,
      lastMessageAt: (message as any).createdAt,
    });

    if (!this.isOnline(recipientId)) {
      await this.chatService.notifyOfflineRecipient(recipientId, data.conversationId, preview);
    }

    return { sent: true, messageId: message._id };
  }

  // ── Edit a message (within 15 minutes) ───────────────────────────────
  @SubscribeMessage('edit_message')
  async editMessage(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { conversationId: string; messageId: string; text: string },
  ) {
    const userId = socket.data.userId;
    const updated = await this.chatService.editMessage(data.messageId, userId, data.text);

    this.server.to(`conversation:${data.conversationId}`).emit('message_edited', {
      messageId: updated._id,
      text: updated.text,
      isEdited: updated.isEdited,
      editedAt: updated.editedAt,
    });

    return { success: true, message: updated };
  }

  // ── React to a message ───────────────────────────────────────────────
  @SubscribeMessage('react_message')
  async reactMessage(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { conversationId: string; messageId: string; emoji: string },
  ) {
    const userId = socket.data.userId;
    const updated = await this.chatService.reactMessage(data.messageId, userId, data.emoji);

    this.server.to(`conversation:${data.conversationId}`).emit('message_reacted', {
      messageId: updated._id,
      reactions: updated.reactions,
    });

    return { success: true, reactions: updated.reactions };
  }

  // ── Delete for me ────────────────────────────────────────────────────
  @SubscribeMessage('delete_for_me')
  async deleteForMe(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    const userId = socket.data.userId;
    await this.chatService.deleteForMe(data.messageId, userId);
    return { success: true, messageId: data.messageId };
  }

  // ── Typing indicator — ephemeral, no DB write ────────────────────────
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    socket.to(`conversation:${data.conversationId}`).emit('typing', {
      userId: socket.data.userId,
      isTyping: data.isTyping,
    });
  }

  // ── Read receipts ────────────────────────────────────────────────────
  @SubscribeMessage('mark_read')
  async markRead(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = socket.data.userId;
    await this.chatService.markRead(data.conversationId, userId);
    socket.to(`conversation:${data.conversationId}`).emit('read_receipt', {
      conversationId: data.conversationId,
      readBy: userId,
      readAt: new Date(),
    });
  }
}