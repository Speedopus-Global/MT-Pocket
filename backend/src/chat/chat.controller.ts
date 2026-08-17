import {
  Controller, Get, Post, Delete, Param, Body, Query, Req, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('chat')
@UseGuards(JwtAccessGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // GET /chat/conversations
  @Get('conversations')
  list(@Req() req: Request) {
    return this.chatService.listConversations((req.user as any).sub);
  }

  // GET /chat/conversations/for-offer/:loanRequestId/:lenderId
  @Get('conversations/for-offer/:loanRequestId/:lenderId')
  getOrCreate(
    @Param('loanRequestId') loanRequestId: string,
    @Param('lenderId') lenderId: string,
    @Req() req: Request,
  ) {
    return this.chatService.getOrCreateConversation((req.user as any).sub, loanRequestId, lenderId);
  }

  // GET /chat/conversations/:id/messages?before=<messageId>&limit=30
  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('before') before: string,
    @Query('limit') limit: string,
    @Req() req: Request,
  ) {
    return this.chatService.getMessages(id, (req.user as any).sub, before, limit ? +limit : undefined);
  }

  // POST /chat/conversations/:id/read
  @Post('conversations/:id/read')
  markRead(@Param('id') id: string, @Req() req: Request) {
    return this.chatService.markRead(id, (req.user as any).sub);
  }

  // POST /chat/conversations/:id/messages — REST fallback for sending
  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { text?: string; mediaUrl?: string; mediaType?: 'image' | 'file'; fileName?: string; fileSize?: number },
    @Req() req: Request,
  ) {
    const { message } = await this.chatService.createMessage(
      id,
      (req.user as any).sub,
      body.text,
      body,
    );
    return message;
  }

  // POST /chat/upload — upload chat media (photo/document) to Cloudinary
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.chatService.uploadMedia(file, (req.user as any).sub);
  }

  // POST /chat/messages/:id/edit — edit own message within 15 minutes
  @Post('messages/:id/edit')
  editMessage(
    @Param('id') id: string,
    @Body('text') text: string,
    @Req() req: Request,
  ) {
    return this.chatService.editMessage(id, (req.user as any).sub, text);
  }

  // POST /chat/messages/:id/react — emoji reactions
  @Post('messages/:id/react')
  reactMessage(
    @Param('id') id: string,
    @Body('emoji') emoji: string,
    @Req() req: Request,
  ) {
    return this.chatService.reactMessage(id, (req.user as any).sub, emoji);
  }

  // DELETE /chat/messages/:id/for-me — delete message for myself only
  @Delete('messages/:id/for-me')
  deleteForMe(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.chatService.deleteForMe(id, (req.user as any).sub);
  }
}