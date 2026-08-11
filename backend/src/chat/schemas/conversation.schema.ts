import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

// One thread per (loanRequest, lender) pair — this mirrors sendOffer()'s
// one-offer-per-lender-per-request rule, so if a request gets offers from
// three different lenders, the borrower gets three separate threads, one
// per lender, never one merged group chat.
@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: [Types.ObjectId], ref: 'User', required: true, index: true })
  participantIds: Types.ObjectId[]; // always [borrowerId, lenderId]

  @Prop({ type: Types.ObjectId, ref: 'LoanRequest', required: true, index: true })
  loanRequestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  lenderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  borrowerId: Types.ObjectId;

  // Denormalized for cheap conversation-list rendering — no need to
  // populate + sort the Message collection just to show a preview.
  @Prop({ type: String, default: null })
  lastMessagePreview: string | null;

  @Prop({ type: Date, default: null, index: true })
  lastMessageAt: Date | null;

  @Prop({ type: Types.ObjectId, default: null })
  lastMessageSenderId: Types.ObjectId | null;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ loanRequestId: 1, lenderId: 1 }, { unique: true });
ConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });