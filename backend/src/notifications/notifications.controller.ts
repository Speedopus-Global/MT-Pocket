import { Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('notifications')
@UseGuards(JwtAccessGuard)
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  // GET /notifications?adminOnly=true — admin dashboard uses adminOnly=true
  @Get()
  getMyNotifications(
    @Req() req: Request,
    @Query('adminOnly') adminOnly: string,
  ) {
    const userId = (req as any).user.sub;
    return this.notifService.findForUser(userId, adminOnly === 'true');
  }

  // GET /notifications/unread-count?adminOnly=true
  @Get('unread-count')
  getUnreadCount(
    @Req() req: Request,
    @Query('adminOnly') adminOnly: string,
  ) {
    const userId = (req as any).user.sub;
    return this.notifService.unreadCount(userId, adminOnly === 'true');
  }

  @Put(':id/read')
  markRead(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.notifService.markRead(id, userId);
  }

  // PUT /notifications/read-all?adminOnly=true
  @Put('read-all')
  markAllRead(
    @Req() req: Request,
    @Query('adminOnly') adminOnly: string,
  ) {
    const userId = (req as any).user.sub;
    return this.notifService.markAllRead(userId, adminOnly === 'true');
  }
}