import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ReportsService } from './reports.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { FileReportDto } from './dto/file-report.dto';

@Controller('reports')
@UseGuards(JwtAccessGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // POST /reports
  @Post()
  fileReport(@Req() req: Request, @Body() dto: FileReportDto) {
    const reporterId = (req.user as any).sub;
    return this.reportsService.fileReport({
      reporterId,
      reportedUserId: dto.reportedUserId,
      reason: dto.reason as any,
      details: dto.details ?? null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string | undefined,
      reportContext: dto.reportContext,
    });
  }

  // GET /reports/mine
  @Get('mine')
  getMyReports(@Req() req: Request) {
    const reporterId = (req.user as any).sub;
    return this.reportsService.getMyReports(reporterId);
  }
}