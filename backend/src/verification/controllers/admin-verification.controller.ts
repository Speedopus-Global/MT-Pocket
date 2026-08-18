import {
  Controller, Get, Post, Param, Query, Req, Res, Body,
  UseGuards, StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { VerificationService } from '../services/verification.service';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import {
  RolesGuard, RequireRoles, RequirePermission, PermissionGuard,
} from '../guards/rbac.guard';

function auditCtx(req: Request) {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

@Controller('admin/verification')
@UseGuards(JwtAccessGuard, RolesGuard)
@RequireRoles('reviewer', 'super_admin')
export class AdminVerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // GET /admin/verification/queue?status=pending&page=1&limit=20
  @Get('queue')
  @UseGuards(PermissionGuard)
  @RequirePermission('kyc:view_queue')
  getQueue(
    @Query('status') status = 'pending',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.verificationService.getPendingQueue(status as any, +page, +limit);
  }

  // POST /admin/verification/:id/claim
  @Post(':id/claim')
  @UseGuards(PermissionGuard)
  @RequirePermission('kyc:claim_for_review')
  claim(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;
    return this.verificationService.claimForReview(id, admin.sub, admin.systemRole, auditCtx(req));
  }

  // GET /admin/verification/:id/file — stream document bytes
  @Get(':id/file')
  @UseGuards(PermissionGuard)
  @RequirePermission('kyc:view_document')
  async getFile(
    @Param('id') id: string,
    @Query('download') download: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const admin = req.user as any;
    const action = download === '1' ? 'downloaded' : 'viewed';
    const { buffer, contentType, filename } = await this.verificationService.getDocumentFile(
      id, admin.sub, admin.systemRole, action, auditCtx(req),
    );

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `${action === 'downloaded' ? 'attachment' : 'inline'}; filename="${filename}"`,
      // Never cache — every access goes through the backend auth check
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    });

    return new StreamableFile(buffer);
  }

  // GET /admin/verification/:id/selfie — stream the selfie image bytes
  @Get(':id/selfie')
  @UseGuards(PermissionGuard)
  @RequirePermission('kyc:view_document')
  async getSelfie(
    @Param('id') id: string,
    @Query('download') download: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const admin = req.user as any;
    const action = download === '1' ? 'downloaded' : 'viewed';
    const { buffer, contentType, filename } = await this.verificationService.getSelfieFile(
      id, admin.sub, admin.systemRole, action, auditCtx(req),
    );

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `${action === 'downloaded' ? 'attachment' : 'inline'}; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    });

    return new StreamableFile(buffer);
  }

  // POST /admin/verification/:id/approve
  @Post(':id/approve')
  @UseGuards(PermissionGuard)
  @RequirePermission('kyc:approve')
  approve(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;
    return this.verificationService.approve(id, admin.sub, admin.systemRole, auditCtx(req));
  }

  // POST /admin/verification/:id/reject
  @Post(':id/reject')
  @UseGuards(PermissionGuard)
  @RequirePermission('kyc:reject')
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    const admin = req.user as any;
    return this.verificationService.reject(id, admin.sub, admin.systemRole, reason, auditCtx(req));
  }

  // POST /admin/verification/:id/reupload
  @Post(':id/reupload')
  @UseGuards(PermissionGuard)
  @RequirePermission('kyc:request_reupload')
  requestReupload(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    const admin = req.user as any;
    return this.verificationService.requestReupload(
      id, admin.sub, admin.systemRole, reason, auditCtx(req),
    );
  }

  // GET /admin/verification/:id/audit — full immutable timeline for one document
  @Get(':id/audit')
  @UseGuards(PermissionGuard)
  @RequirePermission('kyc:view_audit_trail')
  getAuditTrail(@Param('id') id: string) {
    return this.verificationService.getAuditTrail(id);
  }
}