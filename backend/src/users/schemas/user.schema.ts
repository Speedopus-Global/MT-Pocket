import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserRole = 'borrower' | 'lender' | 'both' | 'unset';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  phone: string;

  @Prop({
    type: String,
    default: null,
  })
  email: string | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  emailVerified: boolean;

  @Prop({
    type: String,
    enum: ['borrower', 'lender', 'both', 'unset'],
    default: 'unset',
  })
  role: UserRole;

  @Prop({
    type: String,
    default: null,
  })
  fullName: string | null;

  // ─────────────────────────────────────────────────────────────
  // Identity Verification
  // VerificationService is the source of truth for these fields.
  // Do not update identityVerified directly elsewhere.
  // ─────────────────────────────────────────────────────────────

  @Prop({
    type: Boolean,
    default: false,
  })
  identityVerified: boolean;

  @Prop({
    type: String,
    enum: [
      'none',
      'pending',
      'under_review',
      'approved',
      'rejected',
      'reupload_required',
    ],
    default: 'none',
    index: true,
  })
  verificationStatus:
    | 'none'
    | 'pending'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'reupload_required';

  @Prop({
    type: Types.ObjectId,
    ref: 'VerificationDocument',
    default: null,
  })
  currentVerificationId: Types.ObjectId | null;

  // Denormalized from the current VerificationDocument — kept in sync by
  // VerificationService alongside verificationStatus. Do not update
  // directly elsewhere (same rule as identityVerified above).
  @Prop({
    type: String,
    default: null,
  })
  idDocumentType: string | null;

  @Prop({
    type: String,
    default: null,
  })
  idDocumentRejectionReason: string | null;

  // ─────────────────────────────────────────────────────────────
  // Authentication
  // ─────────────────────────────────────────────────────────────

  @Prop({
    type: String,
    default: null,
  })
  otpHash: string | null;

  @Prop({
    type: Date,
    default: null,
  })
  otpExpiresAt: Date | null;

  @Prop({
    type: Number,
    default: 0,
  })
  otpAttempts: number;

  @Prop({
    type: String,
    default: null,
  })
  refreshTokenHash: string | null;

  @Prop({
    type: String,
    default: null,
  })
  passwordHash: string | null;

  @Prop({
    type: String,
    default: null,
  })
  emailOtpHash: string | null;

  @Prop({
    type: Date,
    default: null,
  })
  emailOtpExpiresAt: Date | null;

  @Prop({
    type: Number,
    default: 0,
  })
  emailOtpAttempts: number;

  @Prop({
    type: String,
    default: null,
  })
  passwordResetOtpHash: string | null;

  @Prop({
    type: Date,
    default: null,
  })
  passwordResetOtpExpiresAt: Date | null;

  @Prop({
    type: Number,
    default: 0,
  })
  passwordResetOtpAttempts: number;

  // ─────────────────────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────────────────────

  @Prop({
    type: String,
    default: null,
  })
  avatarUrl: string | null;

  @Prop({
    type: String,
    default: null,
  })
  address: string | null;

  // Public-safe location — shown on profile/loan cards instead of `address`
  // (full string) or `location` (exact GPS). Set alongside address/location
  // in updateProfile, same pattern LoanRequest already uses.
  @Prop({
    type: String,
    default: null,
  })
  city: string | null;

  @Prop({
    type: String,
    default: null,
  })
  state: string | null;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: [Number],
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  // ─────────────────────────────────────────────────────────────
  // Chat presence
  // Written by ChatService.touchLastActive() on socket disconnect — used
  // for "last seen HH:mm" when a user isn't currently online. "Online now"
  // itself is NOT stored here — that's ChatGateway's in-memory
  // onlineUsers map, since it only matters for the lifetime of a
  // connection and shouldn't survive a server restart.
  // ─────────────────────────────────────────────────────────────

  @Prop({
    type: Date,
    default: null,
  })
  lastActiveAt: Date | null;

  // ─────────────────────────────────────────────────────────────
  // System Role
  // ─────────────────────────────────────────────────────────────

  @Prop({
    type: String,
    enum: ['user', 'reviewer', 'super_admin'],
    default: 'user',
  })
  systemRole: 'user' | 'reviewer' | 'super_admin';

  // ─────────────────────────────────────────────────────────────
  // Account Status
  // ─────────────────────────────────────────────────────────────

  @Prop({
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active',
  })
  accountStatus: 'active' | 'suspended' | 'banned';

  @Prop({
    type: String,
    default: null,
  })
  suspensionReason: string | null;

  @Prop({
    type: Number,
    default: 0,
  })
  reportCount: number;

  // ─────────────────────────────────────────────────────────────
  // Legal Consent Checkpoint Record
  // ─────────────────────────────────────────────────────────────

  @Prop({
    type: Date,
    default: null,
  })
  termsAcceptedAt: Date | null;

  @Prop({
    type: String,
    default: null,
  })
  termsAcceptedIp: string | null;

  @Prop({
    type: String,
    default: null,
  })
  termsVersionHash: string | null;

  @Prop({
    type: String,
    default: null,
  })
  privacyVersionHash: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ location: '2dsphere' });