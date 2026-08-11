import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export type NotificationType =
  // ── User-facing ────────────────────────────────────────────────────
  | 'doc_submitted'        // user submitted a document — confirmation
  | 'doc_under_review'     // admin claimed it, user notified
  | 'doc_approved'
  | 'doc_rejected'
  | 'doc_reupload_required'
  | 'account_suspended'
  | 'account_unsuspended'
  | 'account_banned'
  | 'report_filed'
  | 'offer_received'       // borrower: a lender sent an offer on your request
  | 'offer_accepted'       // lender: borrower accepted your offer
  | 'offer_rejected'       // lender: borrower declined your offer
  | 'new_message'          // NEW — chat message received while recipient had no socket connected
  // ── Admin-facing ───────────────────────────────────────────────────
  | 'admin_doc_submitted'       // new doc in admin queue
  | 'admin_doc_resubmitted'     // user resubmitted after rejection
  | 'admin_report_filed'        // new report needs review
  | 'admin_duplicate_detected'  // same doc hash submitted by 2 users
  | 'admin_quality_flagged';    // image quality below threshold

const ALL_TYPES: NotificationType[] = [
  'doc_submitted', 'doc_under_review', 'doc_approved', 'doc_rejected',
  'doc_reupload_required', 'account_suspended', 'account_unsuspended',
  'account_banned', 'report_filed', 'offer_received', 'offer_accepted',
  'offer_rejected', 'new_message',
  'admin_doc_submitted', 'admin_doc_resubmitted', 'admin_report_filed',
  'admin_duplicate_detected', 'admin_quality_flagged',
];

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ALL_TYPES, required: true })
  type: NotificationType;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  // True for admin_* types — so admin dashboard can filter for its own feed
  @Prop({ type: Boolean, default: false, index: true })
  adminOnly: boolean;

  // Optional link to the related entity (verificationId, reportId, etc.)
  @Prop({ type: Types.ObjectId, default: null })
  relatedId: Types.ObjectId | null;

  // The collection the relatedId points to ('VerificationDocument', 'Report', 'LoanRequest', 'Conversation', etc.)
  @Prop({ type: String, default: null })
  relatedModel: string | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, adminOnly: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });