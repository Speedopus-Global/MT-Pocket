import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;
export type MessageStatus = 'sent' | 'delivered' | 'read';

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: String, default: '', maxlength: 4000 })
  text: string;

  @Prop({ type: String, enum: ['sent', 'delivered', 'read'], default: 'sent', index: true })
  status: MessageStatus;

  @Prop({ type: Date, default: null })
  deliveredAt: Date | null;

  @Prop({ type: Date, default: null })
  readAt: Date | null;

  // Media attachments (stored in Cloudinary)
  @Prop({ type: String, default: undefined })
  mediaUrl?: string;

  @Prop({ type: String, enum: ['image', 'file'], default: undefined })
  mediaType?: 'image' | 'file';

  @Prop({ type: String, default: undefined })
  fileName?: string;

  @Prop({ type: Number, default: undefined })
  fileSize?: number;

  // Message Editing (only within 15 minutes)
  @Prop({ type: Boolean, default: false })
  isEdited?: boolean;

  @Prop({ type: Date, default: null })
  editedAt?: Date | null;

  // Delete for me (list of users for whom this message is hidden)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  deletedFor: Types.ObjectId[];

  // WhatsApp-style Reactions
  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: 'User' },
        emoji: { type: String },
      },
    ],
    default: [],
  })
  reactions: Array<{ userId: Types.ObjectId; emoji: string }>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
// Cursor pagination — newest-first, page backwards from a message _id.
MessageSchema.index({ conversationId: 1, _id: -1 });