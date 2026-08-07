import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ReportsService } from './reports.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

// Register this controller in ReportsModule's `controllers` array.
@Controller('admin/reports')
@UseGuards(JwtAccessGuard, AdminGuard)
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // GET /admin/reports?status=open&severity=critical&page=1&limit=20
  @Get()
  getAllReports(
    @Query('status') status = 'open',
    @Query('severity') severity?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.reportsService.getAllReports(status, severity, +page, +limit);
  }

  // POST /admin/reports/:id/review  { adminNotes }
  @Post(':id/review')
  reviewReport(
    @Param('id') id: string,
    @Body('adminNotes') adminNotes: string,
    @Req() req: Request,
  ) {
    const admin = req.user as any;
    return this.reportsService.reviewReport(id, admin.sub, admin.systemRole, adminNotes);
  }

  // POST /admin/reports/:id/dismiss  { note? }
  @Post(':id/dismiss')
  dismissReport(
    @Param('id') id: string,
    @Body('note') note: string,
    @Req() req: Request,
  ) {
    const admin = req.user as any;
    return this.reportsService.dismissReport(id, admin.sub, admin.systemRole, note);
  }
}