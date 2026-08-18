import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DocumentAuditDocument = HydratedDocument<DocumentAudit>;

export type AuditAction =
  | 'upload'              // user submitted a document
  | 'selfie_upload'       // user submitted a selfie alongside the document
  | 'view'               // admin opened/viewed the document
  | 'selfie_view'        // admin opened/viewed the selfie
  | 'selfie_download'    // admin explicitly downloaded the selfie
  | 'download'           // admin explicitly downloaded the file
  | 'signed_url'         // a signed URL was generated (who, when, expires when)
  | 'review_start'       // admin claimed the document for review
  | 'approve'            // admin approved the document
  | 'reject'             // admin rejected the document with a reason
  | 'reupload_request'   // admin requested the user re-upload
  | 'archive'            // old version archived on new upload
  | 'ocr_run'            // OCR was run on the document
  | 'quality_check'      // image quality check ran at upload time
  | 'duplicate_detected' // same file hash submitted by two different users
  | 'quality_flagged';   // blur or resolution below acceptable threshold

export type ActorRole =
  | 'user'
  | 'reviewer'
  | 'super_admin'
  | 'system'; // automated actions (quality checks, OCR)

// Audit records are NEVER updated or deleted. The schema has no
// timestamps: true because we set timestamp manually so it can't be
// patched by Mongoose's findByIdAndUpdate (which would let someone
// update createdAt). The collection should have a write-only MongoDB
// role in production.
@Schema({ timestamps: false })
export class DocumentAudit {
  // ── What ─────────────────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'VerificationDocument', required: true, index: true })
  verificationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId; // the user whose document this is

  @Prop({
    type: String,
    enum: [
      'upload', 'selfie_upload', 'view', 'selfie_view',
      'selfie_download', 'download', 'signed_url',
      'review_start', 'approve', 'reject', 'reupload_request',
      'archive', 'ocr_run', 'quality_check',
      'duplicate_detected', 'quality_flagged',
    ],
    required: true,
    index: true,
  })
  action: AuditAction;

  // ── Who ──────────────────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  performedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['user', 'reviewer', 'super_admin', 'system'],
    required: true,
  })
  performedByRole: ActorRole;

  // ── When ─────────────────────────────────────────────────────────────────
  // Set explicitly — never rely on Mongoose auto-timestamps for audit records
  // because those fields are mutable via findByIdAndUpdate.
  @Prop({ type: Date, required: true, index: true })
  timestamp: Date;

  // ── Context ──────────────────────────────────────────────────────────────
  @Prop({ type: String, default: null })
  ip: string | null;

  @Prop({ type: String, default: null })
  userAgent: string | null;

  // Human-readable reason (required for reject/reupload_request, optional others)
  @Prop({ type: String, default: null })
  reason: string | null;

  // For signed_url actions: when the URL expired (so we know the access window)
  @Prop({ type: Date, default: null })
  urlExpiresAt: Date | null;

  // Flexible bag for action-specific context (file size, quality flags, etc.)
  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const DocumentAuditSchema = SchemaFactory.createForClass(DocumentAudit);

// Immutability enforcement: application-level (service always uses insertOne,
// never update). For full immutability, apply a MongoDB collection-level
// validator or Atlas trigger that rejects any update/delete on this collection.
DocumentAuditSchema.index({ verificationId: 1, timestamp: -1 });
DocumentAuditSchema.index({ userId: 1, action: 1, timestamp: -1 });