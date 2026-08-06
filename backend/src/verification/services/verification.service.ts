import {
  Injectable, Logger, BadRequestException,
  NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  VerificationDocument,
  VerificationDocumentDocument,
  DocStatus,
  IdDocumentType,
} from '../schemas/verification-document.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { DocumentAuditService, AuditContext } from './document-audit.service';
import { ActorRole } from '../schemas/document-audit.schema';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService } from '../../common/email/email.service';
import {
  kycSubmittedEmail, kycApprovedEmail, kycRejectedEmail,
  kycReuploadEmail, kycUnderReviewEmail, kycDuplicateAlertEmail,
} from '../email-templates/kyc-emails';

// Images below this blur score are flagged for admin attention.
// 40/100 is conservative — most readable documents score 60+.
const MIN_BLUR_SCORE = 40;

// Image dimensions — reject obviously too-small uploads
const MIN_DIMENSION_PX = 400;

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectModel(VerificationDocument.name)
    private verificationModel: Model<VerificationDocumentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly auditService: DocumentAuditService,
    private readonly notifService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  // ── UPLOAD ─────────────────────────────────────────────────────────────
  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    documentType: IdDocumentType,
    ctx: AuditContext,
  ) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    if (user.accountStatus !== 'active') {
      throw new ForbiddenException('Suspended or banned accounts cannot submit documents');
    }

    // ── Version: monotonically increasing per user ──────────────────────
    const lastDoc = await this.verificationModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .sort({ version: -1 })
      .select('version')
      .lean();
    const nextVersion = (lastDoc?.version ?? 0) + 1;

    // ── Archive any existing current document ───────────────────────────
    if (lastDoc) {
      await this.verificationModel.updateMany(
        { userId: new Types.ObjectId(userId), isCurrent: true },
        { isCurrent: false, status: 'archived' },
      );
    }

    // ── Upload to Cloudinary ────────────────────────────────────────────
    const upload = await this.cloudinaryService.uploadDocument(
      file.buffer,
      file.mimetype,
      userId,
      nextVersion,
    );

    // ── Duplicate detection ─────────────────────────────────────────────
    const duplicate = await this.verificationModel
      .findOne({
        fileHash: upload.fileHash,
        userId: { $ne: new Types.ObjectId(userId) }, // same hash, different user
      })
      .select('userId')
      .lean();

    const isDuplicate = !!duplicate;
    if (isDuplicate) {
      this.logger.warn(
        `Duplicate document hash detected: user ${userId} submitted same ` +
        `doc as user ${duplicate!.userId}`,
      );
    }

    // ── Quality flags ───────────────────────────────────────────────────
    const isBlurry =
      upload.blurScore !== null && upload.blurScore < MIN_BLUR_SCORE;
    const isTooSmall =
      upload.imageWidth !== null &&
      upload.imageHeight !== null &&
      (upload.imageWidth < MIN_DIMENSION_PX || upload.imageHeight < MIN_DIMENSION_PX);
    const qualityFlagged = isBlurry || isTooSmall;

    // ── Create VerificationDocument record ─────────────────────────────
    // Fields are written flat to match the schema's explicit @Prop
    // definitions — blurScore/imageWidth/imageHeight live at the top level,
    // not nested inside imageQuality, so the admin queue can filter on them.
    const verificationDoc = (await this.verificationModel.create({
      userId: new Types.ObjectId(userId),
      version: nextVersion,
      documentType,
      status: 'pending',
      publicId: upload.publicId,
      assetId: upload.assetId,
      secureUrl: upload.secureUrl,
      cloudinaryVersion: upload.cloudinaryVersion,
      resourceType: upload.resourceType,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: upload.fileSize,
      fileHash: upload.fileHash,          // flat field — for duplicate detection
      blurScore: upload.blurScore,        // flat field — for queue filtering
      imageWidth: upload.imageWidth,      // flat field — for queue filtering
      imageHeight: upload.imageHeight,    // flat field — for queue filtering
      isCurrent: true,
      uploadedAt: new Date(),
      uploadedBy: new Types.ObjectId(userId),
      metadata: {
        qualityFlagged,
        isBlurry,
        isTooSmall,
        isDuplicate,
      },
    })) as VerificationDocumentDocument;

    // ── Update User denormalized status ─────────────────────────────────
    await this.userModel.findByIdAndUpdate(new Types.ObjectId(userId), {
      verificationStatus: 'pending',
      currentVerificationId: verificationDoc._id,
      identityVerified: false,
    });

    const verificationId = verificationDoc._id.toString();

    // ── Audit log ───────────────────────────────────────────────────────
    // All action strings match the AuditAction enum in document-audit.schema.ts
    await this.auditService.log(
      verificationId, userId, 'upload', userId, 'user',
      { ...ctx, metadata: { version: nextVersion, documentType, fileSize: upload.fileSize } },
    );

    if (isDuplicate) {
      await this.auditService.log(
        verificationId, userId, 'duplicate_detected', userId, 'system',
        { metadata: { duplicateOfUser: duplicate!.userId.toString() } },
      );
    }

    if (qualityFlagged) {
      await this.auditService.log(
        verificationId, userId, 'quality_flagged', userId, 'system',
        { metadata: { isBlurry, isTooSmall, blurScore: upload.blurScore } },
      );
    }

    // ── In-app notifications ─────────────────────────────────────────────
    const isResubmission = nextVersion > 1;
    await this.notifService.create(
      userId,
      'doc_submitted',
      `Your ${documentType} (v${nextVersion}) has been received and is queued for review.`,
      { relatedId: verificationId, relatedModel: 'VerificationDocument' },
    );

    const admins = await this.getAdminUserIds();
    const adminType = isResubmission ? 'admin_doc_resubmitted' : 'admin_doc_submitted';
    const adminMsg = isResubmission
      ? `User ${user.fullName || user.phone} resubmitted a document (v${nextVersion}, ${documentType})${qualityFlagged ? ' ⚠️ Quality flagged' : ''}${isDuplicate ? ' 🚨 Duplicate detected' : ''}`
      : `New KYC document submitted by ${user.fullName || user.phone} (${documentType})${qualityFlagged ? ' ⚠️ Quality flagged' : ''}${isDuplicate ? ' 🚨 Duplicate detected' : ''}`;

    await this.notifService.notifyAdmins(admins, adminType, adminMsg, {
      relatedId: verificationId,
      relatedModel: 'VerificationDocument',
    });

    if (isDuplicate) {
      await this.notifService.notifyAdmins(
        admins, 'admin_duplicate_detected',
        `🚨 Duplicate document: ${user.fullName || user.phone} submitted a doc with the same hash as another user.`,
        { relatedId: verificationId, relatedModel: 'VerificationDocument' },
      );
    }

    // ── Emails ───────────────────────────────────────────────────────────
    if (user.email && user.emailVerified) {
      const { subject, html } = kycSubmittedEmail(user.fullName ?? '', documentType, nextVersion);
      await this.emailService.sendMail(user.email, subject, html);

      if (isDuplicate) {
        const dupe = kycDuplicateAlertEmail(user.fullName ?? '');
        await this.emailService.sendMail(user.email, dupe.subject, dupe.html);
      }
    }

    return {
      message: 'Document submitted for review',
      verificationId,
      version: nextVersion,
      status: 'pending',
      qualityFlagged,
    };
  }

  // ── CLAIM FOR REVIEW (reviewer takes ownership) ─────────────────────────
  async claimForReview(
    verificationId: string,
    adminId: string,
    adminRole: ActorRole,
    ctx: AuditContext,
  ) {
    const doc = await this.verificationModel
      .findOneAndUpdate(
        { _id: verificationId, status: 'pending', isCurrent: true },
        {
          status: 'under_review',
          reviewedBy: new Types.ObjectId(adminId),
          // reviewStartedAt records when the reviewer claimed the doc — separate
          // from reviewedAt (final decision) so queue time is measurable.
          reviewStartedAt: new Date(),
          reviewerRole: adminRole,
        },
        { returnDocument: 'after' },
      )
      .lean();

    if (!doc) throw new BadRequestException('Document not found or not in pending status');

    await this.userModel.findByIdAndUpdate(doc.userId.toString(), {
      verificationStatus: 'under_review',
    });

    // 'review_start' matches the AuditAction enum
    await this.auditService.log(
      verificationId, doc.userId.toString(), 'review_start',
      adminId, adminRole, ctx,
    );

    const user = await this.userModel.findById(doc.userId).lean();
    if (user?.email && user.emailVerified) {
      const { subject, html } = kycUnderReviewEmail(user.fullName ?? '');
      await this.emailService.sendMail(user.email, subject, html);
    }
    await this.notifService.create(
      doc.userId.toString(), 'doc_under_review',
      'Your document is now being actively reviewed. You\'ll hear from us shortly.',
      { relatedId: verificationId, relatedModel: 'VerificationDocument' },
    );

    return { message: 'Document claimed for review', verificationId };
  }

  // ── APPROVE ────────────────────────────────────────────────────────────
  async approve(
    verificationId: string,
    adminId: string,
    adminRole: ActorRole,
    ctx: AuditContext,
  ) {
    const doc = await this.verificationModel
      .findOneAndUpdate(
        { _id: verificationId, status: { $in: ['pending', 'under_review'] }, isCurrent: true },
        {
          status: 'approved',
          reviewedBy: new Types.ObjectId(adminId),
          reviewedAt: new Date(),
          reviewerRole: adminRole,
          rejectionReason: null,
          reuploadReason: null,
        },
        { returnDocument: 'after' },
      )
      .lean();

    if (!doc) throw new BadRequestException('Document not found or already actioned');

    await this.userModel.findByIdAndUpdate(doc.userId.toString(), {
      verificationStatus: 'approved',
      identityVerified: true,
    });

    // 'approve' matches the AuditAction enum
    await this.auditService.log(
      verificationId, doc.userId.toString(), 'approve', adminId, adminRole, ctx,
    );

    const user = await this.userModel.findById(doc.userId).lean();
    await this.notifService.create(
      doc.userId.toString(), 'doc_approved',
      'Your identity has been verified! Your Identity Verified badge is now active.',
      { relatedId: verificationId, relatedModel: 'VerificationDocument' },
    );
    if (user?.email && user.emailVerified) {
      const { subject, html } = kycApprovedEmail(user.fullName ?? '');
      await this.emailService.sendMail(user.email, subject, html);
    }

    return { message: 'Document approved', verificationId };
  }

  // ── REJECT ─────────────────────────────────────────────────────────────
  async reject(
    verificationId: string,
    adminId: string,
    adminRole: ActorRole,
    reason: string,
    ctx: AuditContext,
  ) {
    if (!reason?.trim()) throw new BadRequestException('Rejection reason is required');

    const doc = await this.verificationModel
      .findOneAndUpdate(
        { _id: verificationId, status: { $in: ['pending', 'under_review'] }, isCurrent: true },
        {
          status: 'rejected',
          reviewedBy: new Types.ObjectId(adminId),
          reviewedAt: new Date(),
          reviewerRole: adminRole,
          rejectionReason: reason,
          reuploadReason: null,
        },
        { returnDocument: 'after' },
      )
      .lean();

    if (!doc) throw new BadRequestException('Document not found or already actioned');

    await this.userModel.findByIdAndUpdate(doc.userId.toString(), {
      verificationStatus: 'rejected',
      identityVerified: false,
    });

    // 'reject' matches the AuditAction enum
    await this.auditService.log(
      verificationId, doc.userId.toString(), 'reject', adminId, adminRole,
      { ...ctx, reason },
    );

    const user = await this.userModel.findById(doc.userId).lean();
    await this.notifService.create(
      doc.userId.toString(), 'doc_rejected',
      `Your document was rejected. Reason: ${reason}. Please resubmit.`,
      { relatedId: verificationId, relatedModel: 'VerificationDocument' },
    );
    if (user?.email && user.emailVerified) {
      const { subject, html } = kycRejectedEmail(user.fullName ?? '', reason);
      await this.emailService.sendMail(user.email, subject, html);
    }

    return { message: 'Document rejected', verificationId };
  }

  // ── REQUEST REUPLOAD ────────────────────────────────────────────────────
  async requestReupload(
    verificationId: string,
    adminId: string,
    adminRole: ActorRole,
    reason: string,
    ctx: AuditContext,
  ) {
    if (!reason?.trim()) throw new BadRequestException('Reason is required');

    const doc = await this.verificationModel
      .findOneAndUpdate(
        { _id: verificationId, isCurrent: true },
        {
          status: 'reupload_required',
          reviewedBy: new Types.ObjectId(adminId),
          reviewedAt: new Date(),
          reviewerRole: adminRole,
          // reuploadReason is the right field here — not rejectionReason.
          // They serve different purposes: rejectionReason = permanently rejected,
          // reuploadReason = admin wants a better copy but not an outright denial.
          reuploadReason: reason,
          rejectionReason: null, // clear any previous rejection
        },
        { returnDocument: 'after' },
      )
      .lean();

    if (!doc) throw new BadRequestException('Document not found');

    await this.userModel.findByIdAndUpdate(doc.userId.toString(), {
      verificationStatus: 'reupload_required',
      identityVerified: false,
    });

    // 'reupload_request' matches the AuditAction enum
    await this.auditService.log(
      verificationId, doc.userId.toString(), 'reupload_request',
      adminId, adminRole, { ...ctx, reason },
    );

    const user = await this.userModel.findById(doc.userId).lean();
    await this.notifService.create(
      doc.userId.toString(), 'doc_reupload_required',
      `Please resubmit your document. Reason: ${reason}`,
      { relatedId: verificationId, relatedModel: 'VerificationDocument' },
    );
    if (user?.email && user.emailVerified) {
      const { subject, html } = kycReuploadEmail(user.fullName ?? '', reason);
      await this.emailService.sendMail(user.email, subject, html);
    }

    return { message: 'Reupload requested', verificationId };
  }

  // ── STREAM DOCUMENT (admin view/download) ───────────────────────────────
  async getDocumentFile(
    verificationId: string,
    adminId: string,
    adminRole: ActorRole,
    action: 'viewed' | 'downloaded',
    ctx: AuditContext,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const doc = await this.verificationModel
      .findById(verificationId)
      .select('publicId resourceType documentType userId cloudinaryVersion isCurrent')
      .lean();

    if (!doc) throw new NotFoundException('Verification document not found');

    const fetchUrl = this.cloudinaryService.getSignedFetchUrl(
      doc.publicId,
      doc.resourceType,
    );

    // 'view' / 'download' match the AuditAction enum
    await this.auditService.log(
      verificationId, doc.userId.toString(),
      action === 'downloaded' ? 'download' : 'view',
      adminId, adminRole,
      { ...ctx, metadata: { publicId: doc.publicId } },
    );

    // Log signed URL generation separately — every URL gen is auditable
    // 'signed_url' matches the AuditAction enum
    await this.auditService.log(
      verificationId, doc.userId.toString(), 'signed_url',
      adminId, adminRole,
      { metadata: { purpose: action } },
    );

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new BadRequestException('Could not retrieve document from storage');
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type')
      || (doc.resourceType === 'raw' ? 'application/pdf' : 'image/jpeg');
    const ext = contentType.includes('pdf') ? 'pdf' : contentType.split('/')[1] || 'jpg';

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
      filename: `${doc.documentType}-${doc.userId}-v${doc.cloudinaryVersion}.${ext}`,
    };
  }

  // ── QUEUE ───────────────────────────────────────────────────────────────
  async getPendingQueue(status: DocStatus = 'pending', page = 1, limit = 20) {
    const query = { status, isCurrent: true };
    const [docs, total] = await Promise.all([
      this.verificationModel
        .find(query)
        .populate('userId', 'fullName phone email verificationStatus')
        .sort({ uploadedAt: 1 }) // FIFO — oldest first
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-secureUrl -publicId') // never expose these in list views
        .lean(),
      this.verificationModel.countDocuments(query),
    ]);

    return { docs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── USER STATUS ─────────────────────────────────────────────────────────
  async getMyStatus(userId: string) {
    const doc = await this.verificationModel
      .findOne({ userId: new Types.ObjectId(userId), isCurrent: true })
      .select('status version documentType uploadedAt rejectionReason reuploadReason metadata')
      .lean();
    return doc ?? { status: 'none' };
  }

  // ── VERSION HISTORY ─────────────────────────────────────────────────────
  async getVersionHistory(userId: string) {
    return this.verificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('-secureUrl -publicId -assetId -fileHash') // no internal storage refs
      .sort({ version: -1 })
      .lean();
  }

  // ── AUDIT TRAIL ─────────────────────────────────────────────────────────
  async getAuditTrail(verificationId: string) {
    return this.auditService.getTrailForDocument(verificationId);
  }

  // ── HELPERS ─────────────────────────────────────────────────────────────
  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.userModel
      .find({ systemRole: { $in: ['reviewer', 'super_admin'] } })
      .select('_id')
      .lean();
    return admins.map((a) => a._id.toString());
  }
}