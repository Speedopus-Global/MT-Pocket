import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

// Predefined reasons — structured so admin filters work properly.
// 'other' requires details to be non-null.
export type ReportReason =
  | 'fake_identity'
  | 'harassment'
  | 'fraud_attempt'
  | 'spam'
  | 'impersonation'
  | 'abusive_behaviour'
  | 'other';

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reporterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reportedUserId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['fake_identity', 'harassment', 'fraud_attempt', 'spam', 'impersonation', 'abusive_behaviour', 'other'],
    required: true,
  })
  reason: ReportReason;

  @Prop({ type: String, default: null })
  details: string | null;

  @Prop({
    type: String,
    enum: ['open', 'under_review', 'reviewed', 'dismissed', 'escalated'],
    default: 'open',
    index: true,
  })
  status: 'open' | 'under_review' | 'reviewed' | 'dismissed' | 'escalated';

  @Prop({ type: String, default: null })
  adminNotes: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  // ── Security metadata — always captured for audit purposes ─────────────
  // Never displayed to the reported user; admin-only.

  @Prop({ type: String, default: null })
  reporterIp: string | null;

  @Prop({ type: String, default: null })
  reporterUserAgent: string | null;

  // Optional device fingerprint (from client header X-Device-Id if present)
  @Prop({ type: String, default: null })
  reporterDeviceId: string | null;

  // Context: where in the app the report was filed (e.g. 'user_profile', 'chat')
  @Prop({ type: String, default: null })
  reportContext: string | null;

  // Severity assessed by system rules (e.g. 'fraud_attempt' always = high)
  @Prop({
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  })
  severity: 'low' | 'medium' | 'high' | 'critical';

  // True if the reported user has been automatically flagged (e.g. 3+ reports)
  @Prop({ type: Boolean, default: false })
  autoFlagged: boolean;

  // ── Action log — immutable append-only array ────────────────────────────
  // Each entry: { action, by, at, note }
  // Simpler than a separate collection for reports — the volume is low.
  @Prop({
    type: [
      {
        action: { type: String, required: true },
        by: { type: Types.ObjectId, ref: 'User', required: true },
        byRole: { type: String, required: true },
        at: { type: Date, required: true },
        note: { type: String, default: null },
      },
    ],
    default: [],
  })
  actionLog: Array<{
    action: string;
    by: Types.ObjectId;
    byRole: string;
    at: Date;
    note: string | null;
  }>;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ severity: 1, status: 1, createdAt: -1 });
ReportSchema.index({ reportedUserId: 1, status: 1 });