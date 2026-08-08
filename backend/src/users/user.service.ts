import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { BlocksService } from '../Block/Block.service';

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

// What a STRANGER is allowed to see (GET /users/:id/public). Much narrower
// than SENSITIVE_FIELDS above — that list only strips auth secrets and still
// exposes phone/email/address/exact location/reportCount/accountStatus,
// which is correct for the owner's own profile screen but not for a public one.
const PUBLIC_PROFILE_FIELDS =
  'fullName avatarUrl identityVerified city state role createdAt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly blocksService: BlocksService,
  ) {}

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

  // GET /users/:id/public — a STRANGER viewing someone else's profile.
  // viewerId is optional (route uses OptionalJwtAccessGuard) — when present,
  // hides the profile with the same 404-not-block-specific response the
  // loan-request block check uses, so a block relationship is never
  // distinguishable from "user doesn't exist" or "account not active".
  async findPublicById(id: string, viewerId?: string) {
    const user = await this.userModel
      .findById(id)
      .select(`${PUBLIC_PROFILE_FIELDS} accountStatus`)
      .lean();
    if (!user) throw new NotFoundException('User not found');

    // Suspended/banned accounts don't get a public profile page — same
    // reasoning as the block-hiding pattern: don't leak moderation state
    // by showing a differently-shaped response for it.
    if (user.accountStatus !== 'active') {
      throw new NotFoundException('User not found');
    }

    if (viewerId && viewerId !== id) {
      const blocked = await this.blocksService.isBlockedEitherWay(viewerId, id);
      if (blocked) throw new NotFoundException('User not found');
    }

    const { accountStatus, ...publicUser } = user;
    return publicUser;
  }

  async findOrCreateByPhone(phone: string): Promise<UserDocument> {
    const existing = await this.findByPhone(phone);
    if (existing) return existing;
    return this.userModel.create({ phone });
  }

  updateById(id: string, update: Partial<User>) {
    return this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }
}