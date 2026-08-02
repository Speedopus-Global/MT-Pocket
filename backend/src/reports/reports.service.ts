import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  async fileReport(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    details: string | null,
  ) {
    return this.reportModel.create({
      reporterId: new Types.ObjectId(reporterId),
      reportedUserId: new Types.ObjectId(reportedUserId),
      reason,
      details: details ?? null,
    });
  }

  async getMyReports(reporterId: string) {
    return this.reportModel
      .find({ reporterId: new Types.ObjectId(reporterId) })
      .populate('reportedUserId', 'fullName phone')
      .sort({ createdAt: -1 })
      .lean();
  }
}
