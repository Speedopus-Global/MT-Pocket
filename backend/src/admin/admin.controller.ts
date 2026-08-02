import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { AdminGuard } from './guards/admin.guard';
import { Report } from '../reports/schemas/report.schema';

// Pulled from the schema so this stays in sync automatically — if you
// ever add a status value to the Report schema, this picks it up for free.
type ReportStatus = Report['status'];

@Controller('admin')
@UseGuards(JwtAccessGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Users ────────────────────────────────────────────────────────────

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
  suspendUser(@Param('id') id: string, @Body('reason') reason: string) {
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

  // ── Documents ────────────────────────────────────────────────────────

  @Get('documents/pending')
  getPendingDocuments() {
    return this.adminService.getPendingDocuments();
  }

  @Post('documents/:userId/approve')
  approveDocument(@Param('userId') userId: string) {
    return this.adminService.approveDocument(userId);
  }

  @Post('documents/:userId/reject')
  rejectDocument(
    @Param('userId') userId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectDocument(userId, reason);
  }

  // ── Reports ──────────────────────────────────────────────────────────

  @Get('reports')
  getAllReports(@Query('status') status: ReportStatus = 'open') {
    return this.adminService.getAllReports(status);
  }

  @Post('reports/:id/review')
  reviewReport(
    @Param('id') id: string,
    @Body('adminNotes') adminNotes: string,
  ) {
    return this.adminService.reviewReport(id, adminNotes);
  }

  @Post('reports/:id/dismiss')
  dismissReport(@Param('id') id: string) {
    return this.adminService.dismissReport(id);
  }
}