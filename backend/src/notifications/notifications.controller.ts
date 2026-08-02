import { Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('notifications')
@UseGuards(JwtAccessGuard)
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Get()
  getMyNotifications(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.notifService.findForUser(userId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.notifService.unreadCount(userId);
  }

  @Put(':id/read')
  markRead(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.notifService.markRead(id, userId);
  }

  @Put('read-all')
  markAllRead(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.notifService.markAllRead(userId);
  }
}
