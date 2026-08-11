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
import {
  RolesGuard,
  RequireRoles,
  PermissionGuard,
  RequirePermission,
} from '../verification/guards/rbac.guard';

// Coarse gate: must be a reviewer or super_admin to reach this controller at
// all. The FIX is below — every route here now also carries its own
// PermissionGuard + @RequirePermission(...), matching the matrix documented
// in rbac.guard.ts. Per that matrix every route in this file is currently
// super_admin-only (reviewers get no `user:*` grants), so a reviewer will
// correctly get a 403 on all five endpoints, not just be silently allowed
// through the old `AdminGuard` check like before.
@Controller('admin')
@UseGuards(JwtAccessGuard, RolesGuard)
@RequireRoles('reviewer', 'super_admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────

  @Get('users')
  @UseGuards(PermissionGuard)
  @RequirePermission('user:view_all')
  getAllUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search = '',
  ) {
    return this.adminService.getAllUsers(+page, +limit, search);
  }

  @Get('users/:id')
  @UseGuards(PermissionGuard)
  @RequirePermission('user:view_all')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/suspend')
  @UseGuards(PermissionGuard)
  @RequirePermission('user:suspend')
  suspendUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.suspendUser(id, reason);
  }

  @Post('users/:id/unsuspend')
  @UseGuards(PermissionGuard)
  @RequirePermission('user:unsuspend')
  unsuspendUser(@Param('id') id: string) {
    return this.adminService.unsuspendUser(id);
  }

  @Post('users/:id/ban')
  @UseGuards(PermissionGuard)
  @RequirePermission('user:ban')
  banUser(@Param('id') id: string) {
    return this.adminService.banUser(id);
  }
}