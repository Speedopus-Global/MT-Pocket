import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ReportsService } from './reports.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  RolesGuard,
  RequireRoles,
  PermissionGuard,
  RequirePermission,
} from '../verification/guards/rbac.guard';

// Register this controller in ReportsModule's `controllers` array.
//
// FIX: previously gated only by the coarse AdminGuard, which let ANY
// reviewer or super_admin review/dismiss reports. Per rbac.guard.ts's own
// matrix, a reviewer only has 'report:view' — reviewing and dismissing are
// 'report:review' / 'report:dismiss', both super_admin-only. Listing stays
// open to both roles.
@Controller('admin/reports')
@UseGuards(JwtAccessGuard, RolesGuard)
@RequireRoles('reviewer', 'super_admin')
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // GET /admin/reports?status=open&severity=critical&page=1&limit=20
  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('report:view')
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
  @UseGuards(PermissionGuard)
  @RequirePermission('report:review')
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
  @UseGuards(PermissionGuard)
  @RequirePermission('report:dismiss')
  dismissReport(
    @Param('id') id: string,
    @Body('note') note: string,
    @Req() req: Request,
  ) {
    const admin = req.user as any;
    return this.reportsService.dismissReport(id, admin.sub, admin.systemRole, note);
  }
}