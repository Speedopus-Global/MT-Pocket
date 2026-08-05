import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ReportsService } from './reports.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { FileReportDto } from './dto/file-report.dto';

@Controller('reports')
@UseGuards(JwtAccessGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // POST /reports — file a report against another user
  @Post()
  fileReport(@Req() req: Request, @Body() dto: FileReportDto) {
    const reporterId = (req.user as any).sub;
    return this.reportsService.fileReport(
      reporterId,
      dto.reportedUserId,
      dto.reason,
      dto.details ?? null,
    );
  }

  // GET /reports/mine — see reports the current user has filed
  @Get('mine')
  getMyReports(@Req() req: Request) {
    const reporterId = (req.user as any).sub;
    return this.reportsService.getMyReports(reporterId);
  }
}