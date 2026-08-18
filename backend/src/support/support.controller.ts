import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupportService } from './support.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // POST /support/tickets — create a support ticket (open to all / optionally authed)
  @Post('tickets')
  createTicket(
    @Body() dto: CreateSupportTicketDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const userId = dto.userId || user?.sub || user?.id;
    const senderEmail = dto.senderEmail || user?.email;
    const senderName = dto.senderName || user?.fullName;

    return this.supportService.createTicket({
      userId,
      senderEmail,
      senderName,
      category: dto.category || 'General Inquiry',
      subject: dto.subject,
      message: dto.message,
    });
  }

  // GET /support/my-tickets — list tickets for logged in user
  @Get('my-tickets')
  @UseGuards(JwtAccessGuard)
  getMyTickets(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.supportService.getMyTickets(userId);
  }

  // GET /support/admin/tickets — list all tickets for Admin Dashboard
  @Get('admin/tickets')
  @UseGuards(JwtAccessGuard)
  listAdminTickets(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.listTickets({
      status,
      category,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  // PATCH /support/admin/tickets/:id/status — update status / notes (Admin)
  @Patch('admin/tickets/:id/status')
  @UseGuards(JwtAccessGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'open' | 'in_progress' | 'resolved' | 'closed'; adminNotes?: string },
  ) {
    return this.supportService.updateTicketStatus(id, body.status, body.adminNotes);
  }
}
