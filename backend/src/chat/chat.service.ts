import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { LoanRequest, LoanRequestDocument } from '../Loan/schemas/loan-request.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { BlocksService } from '../Block/Block.service';
import { NotificationsService } from '../notifications/notifications.service';

const DEFAULT_PAGE_SIZE = 30;

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(LoanRequest.name) private loanModel: Model<LoanRequestDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly blocksService: BlocksService,
    private readonly notifService: NotificationsService,
  ) {}

  // ── Get-or-create ─────────────────────────────────────────────────────
  // Callable only by the borrower who owns the request, or the specific
  // lender named — never a third party — and only once a real offer from
  // that lender exists on that request. This is the entire access-control
  // story for opening a thread; everything downstream (send/read/etc)
  // re-derives membership from the Conversation document itself, never
  // trusts the caller's claim about who they are.
  async getOrCreateConversation(requesterId: string, loanRequestId: string, lenderId: string) {
    const req = await this.loanModel.findById(loanRequestId).select('borrowerId offers').lean();
    if (!req) throw new NotFoundException('Loan request not found');

    const borrowerId = req.borrowerId.toString();
    const isBorrower = requesterId === borrowerId;
    const isNamedLender = requesterId === lenderId;
    if (!isBorrower && !isNamedLender) {
      throw new ForbiddenException('Not a party to this request');
    }

    const hasOffer = req.offers.some((o: any) => o.lenderId.toString() === lenderId);
    if (!hasOffer) {
      throw new BadRequestException('No offer from this lender on this request yet');
    }

    const blocked = await this.blocksService.isBlockedEitherWay(borrowerId, lenderId);
    if (blocked) throw new ForbiddenException('Chat unavailable between these users');

    const existing = await this.conversationModel.findOne({
      loanRequestId: new Types.ObjectId(loanRequestId),
      lenderId: new Types.ObjectId(lenderId),
    });
    if (existing) return existing;

    return this.conversationModel.create({
      participantIds: [new Types.ObjectId(borrowerId), new Types.ObjectId(lenderId)],
      loanRequestId: new Types.ObjectId(loanRequestId),
      lenderId: new Types.ObjectId(lenderId),
      borrowerId: new Types.ObjectId(borrowerId),
    });
  }

  // ── List threads for the logged-in user, most recent activity first ────
  async listConversations(userId: string) {
    const uid = new Types.ObjectId(userId);
    const conversations = await this.conversationModel
      .find({ participantIds: uid })
      .populate('borrowerId', 'fullName avatarUrl lastActiveAt')
      .populate('lenderId', 'fullName avatarUrl lastActiveAt')
      .populate('loanRequestId', 'amount category status')
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    if (!conversations.length) return [];

    const unreadCounts = await this.messageModel.aggregate([
      {
        $match: {
          conversationId: { $in: conversations.map((c: any) => c._id) },
          senderId: { $ne: uid },
          status: { $ne: 'read' },
        },
      },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map(unreadCounts.map((u: any) => [u._id.toString(), u.count]));

    return conversations.map((c: any) => {
      const other = c.borrowerId._id.toString() === userId ? c.lenderId : c.borrowerId;
      return {
        conversationId: c._id,
        loanRequest: c.loanRequestId,
        otherParticipant: other,
        lastMessagePreview: c.lastMessagePreview,
        lastMessageAt: c.lastMessageAt,
        unreadCount: unreadMap.get(c._id.toString()) ?? 0,
      };
    });
  }

  private async assertMember(conversationId: string, userId: string): Promise<ConversationDocument> {
    const convo = await this.conversationModel.findById(conversationId);
    if (!convo) throw new NotFoundException('Conversation not found');
    if (!convo.participantIds.some((p) => p.toString() === userId)) {
      throw new ForbiddenException('Not a participant in this conversation');
    }
    return convo;
  }

  // ── Paginated history — newest page first, "before" cursor pages older ──
  // The frontend's "load earlier messages" button at the top of the thread
  // passes the oldest message _id it currently holds as `before`.
  async getMessages(conversationId: string, userId: string, before?: string, limit = DEFAULT_PAGE_SIZE) {
    await this.assertMember(conversationId, userId);

    const query: Record<string, any> = { conversationId: new Types.ObjectId(conversationId) };
    if (before) query._id = { $lt: new Types.ObjectId(before) };

    const messages = await this.messageModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    return messages.reverse(); // chronological order for rendering
  }

  // ── Send ─────────────────────────────────────────────────────────────
  async createMessage(conversationId: string, senderId: string, text: string) {
    const trimmed = text?.trim();
    if (!trimmed) throw new BadRequestException('Message cannot be empty');
    if (trimmed.length > 4000) throw new BadRequestException('Message too long');

    const convo = await this.assertMember(conversationId, senderId);
    const recipientId = convo.participantIds.find((p) => p.toString() !== senderId)!.toString();

    // Re-checked on every send, not just at thread creation — a block that
    // happens mid-conversation should stop new messages immediately.
    const blocked = await this.blocksService.isBlockedEitherWay(senderId, recipientId);
    if (blocked) throw new ForbiddenException('You cannot message this user');

    const message = await this.messageModel.create({
      conversationId: convo._id,
      senderId: new Types.ObjectId(senderId),
      text: trimmed,
      status: 'sent',
    });

    convo.lastMessagePreview = trimmed.slice(0, 120);
    convo.lastMessageAt = (message as any).createdAt;
    convo.lastMessageSenderId = new Types.ObjectId(senderId);
    await convo.save();

    return { message, recipientId };
  }

  // ── Delivery / read receipts ────────────────────────────────────────────
  // Delivered = the recipient's socket joined this thread (gateway calls
  // this on 'join_conversation'), NOT just "recipient is online somewhere".
  async markDelivered(conversationId: string, userId: string) {
    const uid = new Types.ObjectId(userId);
    await this.messageModel.updateMany(
      { conversationId: new Types.ObjectId(conversationId), senderId: { $ne: uid }, status: 'sent' },
      { status: 'delivered', deliveredAt: new Date() },
    );
  }

  // Read = the recipient explicitly viewed the thread (frontend fires this
  // on open/focus) — separate from delivered so "delivered but not yet
  // read" is a real, visible state, same as any other chat app.
  async markRead(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    const uid = new Types.ObjectId(userId);
    const result = await this.messageModel.updateMany(
      { conversationId: new Types.ObjectId(conversationId), senderId: { $ne: uid }, status: { $ne: 'read' } },
      { status: 'read', readAt: new Date() },
    );
    return { modified: result.modifiedCount };
  }

  // ── Presence ─────────────────────────────────────────────────────────
  async touchLastActive(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
  }

  // Fallback for a recipient with no socket connected at all — the gateway
  // decides when this applies (see ChatGateway.sendMessage).
  async notifyOfflineRecipient(recipientId: string, conversationId: string, preview: string) {
    await this.notifService.create(
      recipientId,
      'new_message',
      preview.length > 80 ? `${preview.slice(0, 80)}…` : preview,
      { relatedId: conversationId, relatedModel: 'Conversation' },
    );
  }
}