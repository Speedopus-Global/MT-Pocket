import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notifModel: Model<NotificationDocument>,
  ) {}

  async create(userId: string, type: NotificationType, message: string) {
    return this.notifModel.create({
      userId: new Types.ObjectId(userId),
      type,
      message,
    });
  }

  async findForUser(userId: string) {
    return this.notifModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async markRead(notifId: string, userId: string) {
    return this.notifModel.findOneAndUpdate(
      { _id: notifId, userId: new Types.ObjectId(userId) },
      { read: true },
      { new: true },
    );
  }

  async markAllRead(userId: string) {
    return this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true },
    );
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notifModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });
  }
}
