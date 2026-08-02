import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reporterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reportedUserId: Types.ObjectId;

  @Prop({ type: String, required: true })
  reason: string;

  @Prop({ type: String, default: null })
  details: string | null;

  @Prop({
    type: String,
    enum: ['open', 'reviewed', 'dismissed'],
    default: 'open',
    index: true,
  })
  status: 'open' | 'reviewed' | 'dismissed';

  @Prop({ type: String, default: null })
  adminNotes: string | null;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
