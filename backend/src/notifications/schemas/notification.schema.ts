import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export type NotificationType =
  | 'doc_approved'
  | 'doc_rejected'
  | 'account_suspended'
  | 'account_unsuspended'
  | 'account_banned'
  | 'report_filed';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['doc_approved', 'doc_rejected', 'account_suspended', 'account_unsuspended', 'account_banned', 'report_filed'],
    required: true,
  })
  type: NotificationType;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Boolean, default: false })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
