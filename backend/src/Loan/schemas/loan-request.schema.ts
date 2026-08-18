import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoanRequestDocument = HydratedDocument<LoanRequest>;

export type LoanCategory = 'medical' | 'education' | 'business' | 'personal' | 'other';
export type LoanRequestStatus = 'open' | 'in_progress' | 'closed' | 'cancelled';
export type ListingType = 'borrow' | 'lend';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

@Schema({ timestamps: true })
export class LoanRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  borrowerId: Types.ObjectId; // Creator of the listing (borrower for 'borrow', lender for 'lend')

  @Prop({
    type: String,
    enum: ['borrow', 'lend'],
    default: 'borrow',
    index: true,
  })
  listingType: ListingType;

  @Prop({ type: Number, required: true, min: 1 })
  amount: number; // in INR

  @Prop({
    type: String,
    enum: ['medical', 'education', 'business', 'personal', 'other'],
    required: true,
    index: true,
  })
  category: LoanCategory;

  @Prop({ type: String, required: true, maxlength: 2000 })
  description: string;

  @Prop({ type: Number, default: null })
  interestRateHint: number | null; // borrower's suggested rate; never enforced

  @Prop({ type: Number, default: null })
  durationDays: number | null; // preferred repayment duration

  @Prop({
    type: String,
    enum: ['open', 'in_progress', 'closed', 'cancelled'],
    default: 'open',
    index: true,
  })
  status: LoanRequestStatus;

  // City-level location — never exact GPS on the public listing
  @Prop({ type: String, default: null })
  city: string | null;

  @Prop({ type: String, default: null })
  state: string | null;

  // GeoJSON point — used for radius search, not shown to other users
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: [Number],
  })
  location?: { type: 'Point'; coordinates: [number, number] };

  // Offers made by lenders on this request
  @Prop({
    type: [
      {
        lenderId:    { type: Types.ObjectId, ref: 'User', required: true },
        message:     { type: String, default: null },
        offeredRate: { type: Number, default: null },
        status:      { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending' },
        createdAt:   { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  offers: {
    _id:         Types.ObjectId;
    lenderId:    Types.ObjectId;
    message:     string | null;
    offeredRate: number | null;
    status:      OfferStatus;
    createdAt:   Date;
  }[];

  // ── Status timeline ─────────────────────────────────────────────────────
  // NEW — `status` above only ever holds the CURRENT state; every write to
  // it overwrites the previous value with no record of when or why it
  // changed. This array is the append-only log that lets the frontend
  // render an actual timeline (posted → offer accepted → in progress →
  // closed), and lets support/admin see what happened to a request without
  // cross-referencing offer timestamps by hand.
  //
  // Written by LoanRequestsService at every transition — never edited or
  // removed after the fact, same append-only spirit as DocumentAudit.
  @Prop({
    type: [
      {
        status:    { type: String, enum: ['open', 'in_progress', 'closed', 'cancelled'], required: true },
        changedAt: { type: Date, required: true, default: Date.now },
        // Who caused the transition — the borrower for create/close/cancel,
        // the borrower again for accept (since accepting an offer is what
        // flips the parent request to in_progress). Null only if a future
        // system-initiated transition needs one (e.g. an auto-expiry job).
        changedBy: { type: Types.ObjectId, ref: 'User', default: null },
        note:      { type: String, default: null },
      },
    ],
    default: [],
  })
  statusHistory: {
    status:    LoanRequestStatus;
    changedAt: Date;
    changedBy: Types.ObjectId | null;
    note:      string | null;
  }[];
}

export const LoanRequestSchema = SchemaFactory.createForClass(LoanRequest);
LoanRequestSchema.index({ location: '2dsphere' });
LoanRequestSchema.index({ status: 1, listingType: 1, category: 1, createdAt: -1 });

// Needed for `search()`'s $text query on `keyword`. `description` is
// weighted highest since that's usually what a keyword search is after;
// city/state let "Patna" or "Bihar" match too.
LoanRequestSchema.index(
  { description: 'text', city: 'text', state: 'text' },
  { weights: { description: 5, city: 2, state: 1 }, name: 'loan_request_text_idx' },
);