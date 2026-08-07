import { Controller, Get, Post, Delete, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { BlocksService } from './Block.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('blocks')
@UseGuards(JwtAccessGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  // POST /blocks/:userId
  @Post(':userId')
  block(@Param('userId') userId: string, @Req() req: Request) {
    const blockerId = (req.user as any).sub;
    return this.blocksService.block(blockerId, userId);
  }

  // DELETE /blocks/:userId
  @Delete(':userId')
  unblock(@Param('userId') userId: string, @Req() req: Request) {
    const blockerId = (req.user as any).sub;
    return this.blocksService.unblock(blockerId, userId);
  }

  // GET /blocks/mine — full records, for a "Blocked users" settings screen
  @Get('mine')
  getMine(@Req() req: Request) {
    const blockerId = (req.user as any).sub;
    return this.blocksService.getMyBlockedUsers(blockerId);
  }

  // GET /blocks/mine/ids — just the ids, for client-side result filtering
  @Get('mine/ids')
  getMineIds(@Req() req: Request) {
    const blockerId = (req.user as any).sub;
    return this.blocksService.getMyBlockedUserIds(blockerId);
  }
}