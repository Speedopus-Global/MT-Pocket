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
}

export const UserSchema = SchemaFactory.createForClass(User);