import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../users/schemas/user.schema';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,


    private readonly notifService: NotificationsService,
  ) {}

  // ───────────────────────────────────────────────────────────
  // Users
  // ───────────────────────────────────────────────────────────

  async getAllUsers(page = 1, limit = 20, search = '') {
    const query = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select(
          '-passwordHash -refreshTokenHash -otpHash -emailOtpHash -passwordResetOtpHash',
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select(
        '-passwordHash -refreshTokenHash -otpHash -emailOtpHash -passwordResetOtpHash',
      )
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async suspendUser(userId: string, reason: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        accountStatus: 'suspended',
        suspensionReason: reason,
      },
      {
        returnDocument: 'after',
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.notifService.create(
      userId,
      'account_suspended',
      `Your account has been suspended. Reason: ${reason}`,
    );

    return {
      message: 'User suspended',
    };
  }

  async unsuspendUser(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        accountStatus: 'active',
        suspensionReason: null,
      },
      {
        returnDocument: 'after',
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.notifService.create(
      userId,
      'account_unsuspended',
      'Your account suspension has been lifted. You can now use MT Pocket again.',
    );

    return {
      message: 'User unsuspended',
    };
  }

  async banUser(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        accountStatus: 'banned',
      },
      {
        returnDocument: 'after',
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.notifService.create(
      userId,
      'account_banned',
      'Your account has been permanently banned from MT Pocket.',
    );

    return {
      message: 'User banned',
    };
  }
 
}