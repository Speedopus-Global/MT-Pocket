import { Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
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
  // Opens (or fetches) the thread tied to one lender's offer on one
  // request. REST rather than a socket event so it also works as a plain
  // page navigation / deep link (e.g. clicking "Message lender" from the
  // offers list before the socket has even connected).
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
  // REST fallback for the socket's 'mark_read' event — covers opening a
  // thread before the socket has finished connecting.
  @Post('conversations/:id/read')
  markRead(@Param('id') id: string, @Req() req: Request) {
    return this.chatService.markRead(id, (req.user as any).sub);
  }
}