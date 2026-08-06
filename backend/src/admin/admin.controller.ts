import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminService } from './admin.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAccessGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────

  @Get('users')
  getAllUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search = '',
  ) {
    return this.adminService.getAllUsers(+page, +limit, search);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/suspend')
  suspendUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.suspendUser(id, reason);
  }

  @Post('users/:id/unsuspend')
  unsuspendUser(@Param('id') id: string) {
    return this.adminService.unsuspendUser(id);
  }

  @Post('users/:id/ban')
  banUser(@Param('id') id: string) {
    return this.adminService.banUser(id);
  }
}