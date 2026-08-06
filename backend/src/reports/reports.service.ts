import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument, ReportReason } from './schemas/report.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';

// Severity matrix — certain abuse types are always high/critical regardless
// of whether the reporter provided details.
const SEVERITY_MAP: Record<ReportReason, 'low' | 'medium' | 'high' | 'critical'> = {
  fake_identity:     'critical',
  fraud_attempt:     'critical',
  impersonation:     'high',
  harassment:        'high',
  abusive_behaviour: 'medium',
  spam:              'low',
  other:             'medium',
};

// How many reports against a user before they're auto-flagged for admin review
const AUTO_FLAG_THRESHOLD = 3;

interface FileReportInput {
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  details: string | null;
  ip?: string;
  userAgent?: string;
  deviceId?: string;
  reportContext?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)   private reportModel: Model<ReportDocument>,
    @InjectModel(User.name)     private userModel: Model<UserDocument>,
    private readonly notifService: NotificationsService,
  ) {}

  async fileReport(input: FileReportInput) {
    const { reporterId, reportedUserId, reason, details, ip, userAgent, deviceId, reportContext } = input;

    // Can't report yourself
    if (reporterId === reportedUserId) {
      throw new BadRequestException('You cannot report yourself');
    }

    // 'other' must include details
    if (reason === 'other' && !details?.trim()) {
      throw new BadRequestException('Please provide details when selecting "other" as the reason');
    }

    const reported = await this.userModel.findById(reportedUserId).lean();
    if (!reported) throw new NotFoundException('Reported user not found');

    // Check how many existing open/under_review reports against this user
    const openReportCount = await this.reportModel.countDocuments({
      reportedUserId: new Types.ObjectId(reportedUserId),
      status: { $in: ['open', 'under_review'] },
    });
    const autoFlagged = openReportCount >= AUTO_FLAG_THRESHOLD;
    const severity = SEVERITY_MAP[reason] ?? 'medium';

    const report = await this.reportModel.create({
      reporterId:      new Types.ObjectId(reporterId),
      reportedUserId:  new Types.ObjectId(reportedUserId),
      reason,
      details:         details ?? null,
      severity,
      autoFlagged,
      reporterIp:      ip ?? null,
      reporterUserAgent: userAgent ?? null,
      reporterDeviceId:  deviceId ?? null,
      reportContext:   reportContext ?? null,
      actionLog: [{
        action: 'filed',
        by:     new Types.ObjectId(reporterId),
        byRole: 'user',
        at:     new Date(),
        note:   null,
      }],
    });

    // Bump reported user's reportCount
    await this.userModel.findByIdAndUpdate(reportedUserId, {
      $inc: { reportCount: 1 },
    });

    // Notify all admins
    const admins = await this.getAdminUserIds();
    const urgency = severity === 'critical' ? '🚨 CRITICAL' : severity === 'high' ? '⚠️ HIGH' : '';
    await this.notifService.notifyAdmins(
      admins,
      'admin_report_filed',
      `${urgency} New ${reason.replace(/_/g, ' ')} report filed against ${reported.fullName || reported.phone}${autoFlagged ? ' — USER AUTO-FLAGGED' : ''}`,
      { relatedId: report._id.toString(), relatedModel: 'Report' },
    );

    return {
      message: 'Report submitted. Our team will review it.',
      reportId: report._id.toString(),
      severity,
    };
  }

  async getMyReports(reporterId: string) {
    return this.reportModel
      .find({ reporterId: new Types.ObjectId(reporterId) })
      .populate('reportedUserId', 'fullName phone')
      .select('-reporterIp -reporterUserAgent -reporterDeviceId') // never expose to reporter
      .sort({ createdAt: -1 })
      .lean();
  }

  // ── Admin ──────────────────────────────────────────────────────────────

  async getAllReports(
    status = 'open',
    severity?: string,
    page = 1,
    limit = 20,
  ) {
    const query: Record<string, unknown> = { status };
    if (severity) query.severity = severity;

    const [reports, total] = await Promise.all([
      this.reportModel
        .find(query)
        .populate('reporterId',     'fullName phone')
        .populate('reportedUserId', 'fullName phone accountStatus reportCount')
        .sort({ severity: -1, createdAt: -1 }) // critical first, then oldest
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.reportModel.countDocuments(query),
    ]);

    return { reports, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async reviewReport(reportId: string, adminId: string, adminRole: string, adminNotes: string) {
    const report = await this.reportModel.findById(reportId);
    if (!report) throw new NotFoundException('Report not found');

    report.status = 'reviewed';
    report.adminNotes = adminNotes;
    report.reviewedBy = new Types.ObjectId(adminId);
    report.reviewedAt = new Date();
    report.actionLog.push({
      action: 'reviewed',
      by: new Types.ObjectId(adminId),
      byRole: adminRole,
      at: new Date(),
      note: adminNotes,
    });

    return report.save();
  }

  async dismissReport(reportId: string, adminId: string, adminRole: string, note?: string) {
    const report = await this.reportModel.findById(reportId);
    if (!report) throw new NotFoundException('Report not found');

    report.status = 'dismissed';
    report.reviewedBy = new Types.ObjectId(adminId);
    report.reviewedAt = new Date();
    report.actionLog.push({
      action: 'dismissed',
      by: new Types.ObjectId(adminId),
      byRole: adminRole,
      at: new Date(),
      note: note ?? null,
    });

    return report.save();
  }

  async escalateReport(reportId: string, adminId: string, adminRole: string, note: string) {
    const report = await this.reportModel.findById(reportId);
    if (!report) throw new NotFoundException('Report not found');

    report.status = 'escalated';
    report.actionLog.push({
      action: 'escalated',
      by: new Types.ObjectId(adminId),
      byRole: adminRole,
      at: new Date(),
      note,
    });

    return report.save();
  }

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.userModel
      .find({ systemRole: { $in: ['reviewer', 'super_admin'] } })
      .select('_id')
      .lean();
    return admins.map((a) => a._id.toString());
  }
}