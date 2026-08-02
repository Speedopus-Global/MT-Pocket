import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';


export type UserRole = 'borrower' | 'lender' | 'both' | 'unset';

import { HydratedDocument } from 'mongoose';

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

  @Prop({
    type: Boolean,
    default: false,
  })
  identityVerified: boolean;

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

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: undefined,
    },
  })
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  } | null;

  // ── System Role (set manually in MongoDB — 'user' | 'admin') ──────────
  @Prop({
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  })
  systemRole: 'user' | 'admin';

  // ── Account Lifecycle ──────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active',
  })
  accountStatus: 'active' | 'suspended' | 'banned';

  @Prop({ type: String, default: null })
  suspensionReason: string | null;

  @Prop({ type: Number, default: 0 })
  reportCount: number;

  // ── Identity Document Verification ─────────────────────────────────────
  @Prop({ type: String, default: null })
  idDocumentUrl: string | null;

  @Prop({
    type: String,
    enum: ['aadhaar', 'pan', 'passport', 'driving_license', null],
    default: null,
  })
  idDocumentType: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | null;

  @Prop({
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  })
  idDocumentStatus: 'none' | 'pending' | 'approved' | 'rejected';

  @Prop({ type: String, default: null })
  idDocumentRejectionReason: string | null;

  @Prop({ type: Date, default: null })
  idDocumentSubmittedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ location: '2dsphere' });