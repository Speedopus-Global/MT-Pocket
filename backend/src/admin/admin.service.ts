import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Report, ReportDocument } from '../reports/schemas/report.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private readonly notifService: NotificationsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── Users ─────────────────────────────────────────────────────────────────

  async getAllUsers(page = 1, limit = 20, search = '') {
    const query = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { phone:    { $regex: search, $options: 'i' } },
            { email:    { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-passwordHash -refreshTokenHash -otpHash -emailOtpHash -passwordResetOtpHash -idDocumentUrl -idDocumentPublicId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getUserDetail(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-passwordHash -refreshTokenHash -otpHash -emailOtpHash -passwordResetOtpHash -idDocumentUrl -idDocumentPublicId')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async suspendUser(userId: string, reason: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { accountStatus: 'suspended', suspensionReason: reason },
      { returnDocument: 'after' },
    );
    if (!user) throw new NotFoundException('User not found');
    await this.notifService.create(userId, 'account_suspended',
      `Your account has been suspended. Reason: ${reason}`);
    return { message: 'User suspended' };
  }

  async unsuspendUser(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { accountStatus: 'active', suspensionReason: null },
      { returnDocument: 'after' },
    );
    if (!user) throw new NotFoundException('User not found');
    await this.notifService.create(userId, 'account_unsuspended',
      'Your account suspension has been lifted. You can now use MT Pocket again.');
    return { message: 'User unsuspended' };
  }

  async banUser(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { accountStatus: 'banned' },
      { returnDocument: 'after' },
    );
    if (!user) throw new NotFoundException('User not found');
    await this.notifService.create(userId, 'account_banned',
      'Your account has been permanently banned from MT Pocket.');
    return { message: 'User banned' };
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  async getPendingDocuments() {
    // Deliberately NOT selecting idDocumentUrl/idDocumentPublicId here —
    // it's a private Cloudinary asset and not directly viewable. The
    // frontend fetches a short-lived signed URL per-document via
    // getDocumentViewUrl() only when the admin clicks "View".
    return this.userModel
      .find({ idDocumentStatus: 'pending' })
      .select('fullName phone email idDocumentType idDocumentStatus idDocumentSubmittedAt')
      .sort({ idDocumentSubmittedAt: 1 })
      .lean();
  }

  // Fetches the raw bytes of a user's private KYC document from Cloudinary
  // (server-side, via a signed URL that's never exposed to the browser)
  // so AdminController can stream it back through our own JWT-guarded
  // endpoint. "Expiry" comes for free from the caller needing a valid
  // (15-min) access token on every request — no Cloudinary token-auth
  // add-on required.
  async getDocumentFile(userId: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const user = await this.userModel
      .findById(userId)
      .select('idDocumentPublicId idDocumentResourceType idDocumentType')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    if (!user.idDocumentPublicId) {
      throw new BadRequestException('No document on file for this user');
    }

    const resourceType = (user.idDocumentResourceType as 'image' | 'raw' | 'video') ?? 'image';
    const fetchUrl = this.cloudinaryService.getSignedFetchUrl(user.idDocumentPublicId, resourceType);

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new BadRequestException('Could not retrieve document from storage');
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type')
      || (resourceType === 'raw' ? 'application/pdf' : 'image/jpeg');
    const extension = contentType.includes('pdf') ? 'pdf' : (contentType.split('/')[1] || 'jpg');

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
      filename: `${user.idDocumentType || 'document'}-${userId}.${extension}`,
    };
  }

  async approveDocument(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { identityVerified: true, idDocumentStatus: 'approved', idDocumentRejectionReason: null },
      { returnDocument: 'after' },
    );
    if (!user) throw new NotFoundException('User not found');
    await this.notifService.create(userId, 'doc_approved',
      'Your identity document has been verified! Your Identity Verified badge is now active.');
    return { message: 'Document approved' };
  }

  async rejectDocument(userId: string, reason: string) {
    if (!reason) throw new BadRequestException('Rejection reason is required');
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { identityVerified: false, idDocumentStatus: 'rejected', idDocumentRejectionReason: reason },
      { returnDocument: 'after' },
    );
    if (!user) throw new NotFoundException('User not found');
    await this.notifService.create(userId, 'doc_rejected',
      `Your identity document was rejected. Reason: ${reason}. You may resubmit.`);
    return { message: 'Document rejected' };
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  async getAllReports(status: 'open' | 'reviewed' | 'dismissed' = 'open') {
    return this.reportModel
      .find({ status })
      .populate('reporterId',     'fullName phone')
      .populate('reportedUserId', 'fullName phone accountStatus')
      .sort({ createdAt: -1 })
      .lean();
  }

  async reviewReport(reportId: string, adminNotes: string) {
    const report = await this.reportModel.findByIdAndUpdate(
      reportId,
      { status: 'reviewed', adminNotes },
      { returnDocument: 'after' },
    );
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async dismissReport(reportId: string) {
    const report = await this.reportModel.findByIdAndUpdate(
      reportId,
      { status: 'dismissed' },
      { returnDocument: 'after' },
    );
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}