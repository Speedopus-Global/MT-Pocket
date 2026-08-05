import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

// Fields that must never reach the browser. findById() below is used
// internally by auth flows (password/OTP comparisons, token rotation) and
// needs these — anything user-facing should go through
// findPublicProfileById() instead.
const SENSITIVE_FIELDS =
  '-passwordHash -refreshTokenHash ' +
  '-otpHash -otpExpiresAt -otpAttempts ' +
  '-emailOtpHash -emailOtpExpiresAt -emailOtpAttempts ' +
  '-passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetOtpAttempts ' +
  '-idDocumentPublicId'; // internal Cloudinary handle, no reason to expose it

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findByPhone(phone: string) {
    return this.userModel.findOne({ phone }).exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  findByIdentifier(identifier: string) {
    if (identifier.includes('@')) return this.findByEmail(identifier);
    return this.findByPhone(identifier);
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  // Use this — not findById() — for anything whose result gets sent back
  // to the client (profile screens, "me" endpoints, etc).
  findPublicProfileById(id: string) {
    return this.userModel.findById(id).select(SENSITIVE_FIELDS).exec();
  }

  async findOrCreateByPhone(phone: string): Promise<UserDocument> {
    const existing = await this.findByPhone(phone);
    if (existing) return existing;
    return this.userModel.create({ phone });
  }

  updateById(id: string, update: Partial<User>) {
    return this.userModel
      .findByIdAndUpdate(id, update, { returnDocument: 'after' })
      .exec();
  }
}