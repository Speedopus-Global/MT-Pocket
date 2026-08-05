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
    },
    coordinates: [Number],
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

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
  // idDocumentUrl is kept only as a raw record of the upload for audit
  // purposes. It is a Cloudinary "authenticated" (private) asset and is
  // NOT directly viewable — never render it as an <img src> or <a href>
  // on the frontend. To let an admin actually view the document, generate
  // a short-lived signed URL from idDocumentPublicId at request time
  // (see CloudinaryService.getSignedDocumentUrl / AdminService.getDocumentViewUrl).
  @Prop({ type: String, default: null })
  idDocumentUrl: string | null;

  // Cloudinary public_id — required to (re)generate a signed view URL,
  // to overwrite/replace the asset on resubmission, and to delete it later.
  @Prop({ type: String, default: null })
  idDocumentPublicId: string | null;

  // Cloudinary resource_type the asset was stored under (image vs raw for
  // PDFs) — required to build a correct signed URL later.
  @Prop({
    type: String,
    enum: ['image', 'raw', 'video', null],
    default: null,
  })
  idDocumentResourceType: 'image' | 'raw' | 'video' | null;

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