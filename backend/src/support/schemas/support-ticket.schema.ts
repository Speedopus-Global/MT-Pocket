import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document;

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ required: true, unique: true, index: true })
  ticketId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId?: Types.ObjectId | null;

  @Prop({ required: true })
  senderEmail: string;

  @Prop({ default: 'MT Pocket Member' })
  senderName: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: '' })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true,
  })
  status: 'open' | 'in_progress' | 'resolved' | 'closed';

  @Prop({
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  })
  priority: 'low' | 'normal' | 'high' | 'urgent';

  @Prop({ default: '' })
  adminNotes?: string;

  @Prop({ type: Date, default: null })
  resolvedAt?: Date | null;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ createdAt: -1 });
