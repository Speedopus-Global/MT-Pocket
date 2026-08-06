import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';

interface CreateNotifOptions {
  adminOnly?: boolean;
  relatedId?: string;        // ObjectId as string
  relatedModel?: string;     // 'VerificationDocument' | 'Report' | etc.
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
  ) {}

  // ── Create a single notification ──────────────────────────────────────
  async create(
    userId: string,
    type: NotificationType,
    message: string,
    opts: CreateNotifOptions = {},
  ) {
    return this.notifModel.create({
      userId: new Types.ObjectId(userId),
      type,
      message,
      adminOnly: opts.adminOnly ?? false,
      relatedId: opts.relatedId ? new Types.ObjectId(opts.relatedId) : null,
      relatedModel: opts.relatedModel ?? null,
    });
  }

  // ── Notify all admins (super_admin + reviewer roles) ─────────────────
  // Caller passes the list of admin userIds — VerificationService looks
  // them up from the User model so NotificationsService stays decoupled.
  async notifyAdmins(
    adminUserIds: string[],
    type: NotificationType,
    message: string,
    opts: CreateNotifOptions = {},
  ) {
    if (!adminUserIds.length) return;
    const docs = adminUserIds.map((id) => ({
      userId: new Types.ObjectId(id),
      type,
      message,
      adminOnly: true,
      relatedId: opts.relatedId ? new Types.ObjectId(opts.relatedId) : null,
      relatedModel: opts.relatedModel ?? null,
    }));
    return this.notifModel.insertMany(docs);
  }

  // ── Reads ─────────────────────────────────────────────────────────────
  async findForUser(userId: string, adminOnly = false) {
    return this.notifModel
      .find({
        userId: new Types.ObjectId(userId),
        adminOnly,
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async unreadCount(userId: string, adminOnly = false): Promise<number> {
    return this.notifModel.countDocuments({
      userId: new Types.ObjectId(userId),
      adminOnly,
      read: false,
    });
  }

  async markRead(notifId: string, userId: string) {
    return this.notifModel.findOneAndUpdate(
      { _id: notifId, userId: new Types.ObjectId(userId) },
      { read: true },
      { new: true },
    );
  }

  async markAllRead(userId: string, adminOnly = false) {
    return this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), adminOnly, read: false },
      { read: true },
    );
  }
}