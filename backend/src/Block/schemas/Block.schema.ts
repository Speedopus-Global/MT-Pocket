import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BlockDocument = HydratedDocument<Block>;

// One row per (blocker → blocked) direction. Blocking is one-way by design —
// if A blocks B, B can still technically message/offer... unless we also
// check the reverse direction, which sendOffer() does via isBlockedEitherWay().
@Schema({ timestamps: true })
export class Block {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  blockerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  blockedUserId: Types.ObjectId;
}

export const BlockSchema = SchemaFactory.createForClass(Block);
// A user can only block another user once — re-blocking is a no-op (see service).
BlockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });