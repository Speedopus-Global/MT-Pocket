import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VerificationDocumentDocument = HydratedDocument<VerificationDocument>;

export type DocStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'reupload_required'
  | 'archived';

export type IdDocumentType =
  | 'aadhaar'
  | 'pan'
  | 'passport'
  | 'driving_license';

// ── Image quality signals populated during upload validation ──────────────
// These are checked at upload time and stored so admins can see them and so
// we can flag low-quality docs before they enter the review queue.
export interface ImageQualityMetadata {
  width?: number;
  height?: number;
  format?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  blurScore?: number;     // 0–100, lower = blurrier
  qualityPassed: boolean; // true if all checks passed at upload time
  qualityFlags: string[]; // e.g. ['low_resolution', 'possible_blur']
}

@Schema({ timestamps: true })
export class VerificationDocument {
  // ── Owner ────────────────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['aadhaar', 'pan', 'passport', 'driving_license'],
    required: true,
  })
  documentType: IdDocumentType;

  // ── Lifecycle ────────────────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'reupload_required', 'archived'],
    default: 'pending',
    index: true,
  })
  status: DocStatus;

  // ── Versioning ───────────────────────────────────────────────────────────
  // Version starts at 1 for a user's first upload of a given type.
  // Each resubmission increments this; old versions are archived, never deleted.
  @Prop({ type: Number, required: true, min: 1 })
  version: number;

  // True for the single current (non-archived) doc for this user.
  // The admin queue and user status checks filter by isCurrent: true.
  @Prop({ type: Boolean, default: true, index: true })
  isCurrent: boolean;

  // ── Cloudinary asset metadata ────────────────────────────────────────────
  // NEVER expose publicId, secureUrl, or assetId to the browser directly.
  // Use the audit-logged signed URL flow in verification.service.ts instead.
  @Prop({ type: String, required: true })
  publicId: string;

  @Prop({ type: String, required: true })
  assetId: string;

  // The Cloudinary version number (used to build cache-busted signed URLs).
  @Prop({ type: Number, required: true })
  cloudinaryVersion: number;

  // Stored for audit/reference only — it is an authenticated Cloudinary URL
  // and will 403 if accessed directly. Admin access goes through signed URLs.
  @Prop({ type: String, required: true })
  secureUrl: string;

  @Prop({
    type: String,
    enum: ['image', 'raw', 'video'],
    required: true,
  })
  resourceType: 'image' | 'raw' | 'video';

  // ── File metadata ────────────────────────────────────────────────────────
  @Prop({ type: String, required: true })
  originalFilename: string;

  @Prop({ type: String, required: true })
  mimeType: string;

  @Prop({ type: Number, required: true })
  fileSize: number;

  // SHA-256 of the raw buffer — used for duplicate-document detection across
  // different users. Never expose externally.
  @Prop({ type: String, required: true, index: true })
  fileHash: string;

  @Prop({ type: Date, required: true })
  uploadedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  // ── Image quality signals (flat, for fast querying) ──────────────────────
  // Stored flat here (not nested inside imageQuality) so the admin queue can
  // sort/filter on blurScore directly without $unwind.
  // The imageQuality object below is the full structured version for display.
  @Prop({ type: Number, default: null })
  blurScore: number | null;

  @Prop({ type: Number, default: null })
  imageWidth: number | null;

  @Prop({ type: Number, default: null })
  imageHeight: number | null;

  // Full structured quality report (written by CloudinaryService)
  @Prop({ type: Object, default: null })
  imageQuality: ImageQualityMetadata | null;

  // ── Review ───────────────────────────────────────────────────────────────
  @Prop({ type: Date, default: null })
  reviewStartedAt: Date | null;

  // Date the final decision (approve/reject/reupload_request) was made.
  // Separate from reviewStartedAt so queue time is measurable.
  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy: Types.ObjectId | null;

  // The systemRole of the reviewer at the time of the decision.
  // Stored denormalized because admin roles can change after the fact.
  @Prop({ type: String, default: null })
  reviewerRole: string | null;

  @Prop({ type: String, default: null })
  rejectionReason: string | null;

  // Why the admin requested a reupload — shown to the user so they know
  // exactly what to fix. Separate field from rejectionReason.
  @Prop({ type: String, default: null })
  reuploadReason: string | null;

  // ── Extracted data (OCR / manual admin entry) ────────────────────────────
  // We store document numbers ONLY when operationally required and with user
  // consent (e.g. KYC regulations mandate it). Never store unencrypted Aadhaar
  // or PAN numbers here — use a dedicated encrypted field or skip entirely.
  // This field holds non-sensitive extracted data like name-on-document,
  // expiry date, DOB for age verification (without the ID number itself).
  @Prop({ type: Object, default: null })
  extractedData: Record<string, string> | null;

  // True when extracted name/DOB roughly matches the user's profile.
  // null = not yet checked, true = passed, false = mismatch (admin decides).
  @Prop({ type: Boolean, default: null })
  profileMatchPassed: boolean | null;

  // ── Misc ─────────────────────────────────────────────────────────────────
  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const VerificationDocumentSchema = SchemaFactory.createForClass(VerificationDocument);

// Compound indexes for common admin queue and user status queries
VerificationDocumentSchema.index({ userId: 1, isCurrent: 1 });
VerificationDocumentSchema.index({ status: 1, isCurrent: 1, uploadedAt: 1 });
VerificationDocumentSchema.index({ userId: 1, documentType: 1, version: 1 });
// Duplicate-detection query: fileHash + userId exclusion
VerificationDocumentSchema.index({ fileHash: 1, userId: 1 });