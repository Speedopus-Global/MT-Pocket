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

  @Prop({ type: String, required: true, maxlength: 4000 })
  text: string;

  @Prop({ type: String, enum: ['sent', 'delivered', 'read'], default: 'sent', index: true })
  status: MessageStatus;

  @Prop({ type: Date, default: null })
  deliveredAt: Date | null;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
// Cursor pagination — newest-first, page backwards from a message _id.
MessageSchema.index({ conversationId: 1, _id: -1 });