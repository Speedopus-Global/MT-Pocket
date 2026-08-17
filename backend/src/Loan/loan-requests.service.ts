import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoanRequest, LoanRequestDocument } from './schemas/loan-request.schema';
import { CreateLoanRequestDto, SearchLoanRequestsDto, SendOfferDto } from './dto/loan-request.dto';
import { BlocksService } from '../Block/Block.service';
import { NotificationsService } from '../notifications/notifications.service'; // adjust to your actual path

const DEFAULT_RADIUS_KM = 25;

@Injectable()
export class LoanRequestsService {
  constructor(
    @InjectModel(LoanRequest.name) private loanModel: Model<LoanRequestDocument>,
    private readonly blocksService: BlocksService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Borrower: create a request ────────────────────────────────────────────
  async create(borrowerId: string, dto: CreateLoanRequestDto) {
    const doc: Partial<LoanRequest> = {
      borrowerId:        new Types.ObjectId(borrowerId),
      amount:            dto.amount,
      category:          dto.category as any,
      description:       dto.description,
      interestRateHint:  dto.interestRateHint ?? null,
      durationDays:      dto.durationDays     ?? null,
      city:              dto.city             ?? null,
      state:             dto.state            ?? null,
      // First entry in the timeline — every request starts here.
      statusHistory: [
        {
          status:    'open',
          changedAt: new Date(),
          changedBy: new Types.ObjectId(borrowerId),
          note:      null,
        },
      ] as any,
    };

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      doc.location = { type: 'Point', coordinates: [dto.longitude, dto.latitude] };
    }

    return this.loanModel.create(doc);
  }

  // ── Borrower: edit own request ────────────────────────────────────────────
  async update(requestId: string, borrowerId: string, dto: Partial<CreateLoanRequestDto>) {
    const req = await this.loanModel.findById(requestId);
    if (!req) throw new NotFoundException('Loan request not found');
    if (req.borrowerId.toString() !== borrowerId) throw new ForbiddenException('Not your request');
    if (req.status !== 'open') throw new BadRequestException('Only open requests can be edited');

    if (dto.amount)      req.amount      = dto.amount;
    if (dto.category)    req.category    = dto.category as any;
    if (dto.description) req.description = dto.description;
    if (dto.city)        req.city        = dto.city;
    if (dto.state)       req.state       = dto.state;
    if (dto.interestRateHint !== undefined) req.interestRateHint = dto.interestRateHint;
    if (dto.durationDays     !== undefined) req.durationDays     = dto.durationDays;
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      req.location = { type: 'Point', coordinates: [dto.longitude!, dto.latitude!] };
    }

    // Editing content doesn't change status, so no statusHistory entry here —
    // the timeline only logs state transitions, not content edits.
    return req.save();
  }

  // ── Borrower: close / cancel own request ──────────────────────────────────
  async changeStatus(requestId: string, borrowerId: string, status: 'closed' | 'cancelled') {
    const req = await this.loanModel.findById(requestId);
    if (!req) throw new NotFoundException('Loan request not found');
    if (req.borrowerId.toString() !== borrowerId) throw new ForbiddenException('Not your request');
    req.status = status;
    req.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: new Types.ObjectId(borrowerId),
      note: null,
    } as any);
    return req.save();
  }

  // ── Borrower: my requests ─────────────────────────────────────────────────
  async getMyRequests(borrowerId: string) {
    return this.loanModel
      .find({ borrowerId: new Types.ObjectId(borrowerId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  // ── Lender: send offer on a request ──────────────────────────────────────
  async sendOffer(lenderId: string, dto: SendOfferDto) {
    const req = await this.loanModel.findById(dto.loanRequestId);
    if (!req) throw new NotFoundException('Loan request not found');
    if (req.status !== 'open') throw new BadRequestException('This request is no longer open');
    if (req.borrowerId.toString() === lenderId) {
      throw new BadRequestException('You cannot send an offer on your own request');
    }

    // Block check — either direction. A blocked borrower shouldn't be
    // reachable by that lender, and a lender who blocked a borrower
    // shouldn't have that borrower's offers reach them either.
    const blocked = await this.blocksService.isBlockedEitherWay(lenderId, req.borrowerId.toString());
    if (blocked) {
      throw new ForbiddenException('You cannot send an offer to this user');
    }
    const alreadyOffered = req.offers.some((o) => o.lenderId.toString() === lenderId);
    if (alreadyOffered) throw new BadRequestException('You have already sent an offer on this request');

    req.offers.push({
      lenderId:    new Types.ObjectId(lenderId),
      message:     dto.message     ?? null,
      offeredRate: dto.offeredRate ?? null,
      status:      'pending',
      createdAt:   new Date(),
    } as any);

    const saved = await req.save();

    // Notify the borrower — this is what was missing before: an offer
    // could be sent with no signal anywhere that it had happened.
    await this.notificationsService.create(
      req.borrowerId.toString(),
      'offer_received',
      `You received a new offer on your ₹${req.amount.toLocaleString('en-IN')} ${req.category} request.`,
      { relatedId: req._id.toString(), relatedModel: 'LoanRequest' },
    );

    return saved;
  }

  // ── Borrower: accept a single offer ───────────────────────────────────────
  // IMPORTANT: only the target offer changes here. Other pending offers on
  // the same request are left alone — rejection is a separate, manual
  // action the borrower takes per-offer via rejectOffer() below. Do not
  // reintroduce a "reject everything else" loop here.
  async acceptOffer(requestId: string, borrowerId: string, offerId: string) {
    const req = await this.loanModel.findById(requestId);
    if (!req) throw new NotFoundException('Loan request not found');
    if (req.borrowerId.toString() !== borrowerId) throw new ForbiddenException('Not your request');
    if (req.status !== 'open') throw new BadRequestException('This request is no longer open');

    const offer = req.offers.find((o: any) => o._id.toString() === offerId);
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.status !== 'pending') throw new BadRequestException('This offer is no longer pending');

    offer.status = 'accepted';
    (offer as any).acceptedAt = new Date();
    req.status = 'in_progress';
    req.statusHistory.push({
      status: 'in_progress',
      changedAt: new Date(),
      changedBy: new Types.ObjectId(borrowerId),
      note: `Offer ${offerId} accepted from lender ${offer.lenderId}`,
    } as any);

    const saved = await req.save();

    await this.notificationsService.create(
      offer.lenderId.toString(),
      'offer_accepted',
      `Your offer on a ₹${req.amount.toLocaleString('en-IN')} ${req.category} request was accepted.`,
      { relatedId: req._id.toString(), relatedModel: 'LoanRequest' },
    );

    return saved;
  }

  // ── Borrower: manually reject a single pending offer ──────────────────────
  // Independent of the parent request's status — a borrower can keep
  // declining leftover pending offers even after another offer on the
  // same request has already been accepted and the request moved to
  // in_progress. Rejecting an offer never changes the PARENT request's
  // status, so no statusHistory entry belongs here — that log only tracks
  // the request's own lifecycle, not individual offer outcomes.
  async rejectOffer(requestId: string, borrowerId: string, offerId: string) {
    const req = await this.loanModel.findById(requestId);
    if (!req) throw new NotFoundException('Loan request not found');
    if (req.borrowerId.toString() !== borrowerId) throw new ForbiddenException('Not your request');

    const offer = req.offers.find((o: any) => o._id.toString() === offerId);
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.status !== 'pending') throw new BadRequestException('This offer is no longer pending');

    offer.status = 'rejected';

    const saved = await req.save();

    await this.notificationsService.create(
      offer.lenderId.toString(),
      'offer_rejected',
      `Your offer on a ₹${req.amount.toLocaleString('en-IN')} ${req.category} request was declined.`,
      { relatedId: req._id.toString(), relatedModel: 'LoanRequest' },
    );

    return saved;
  }

  // ── Lender: withdraw a pending offer ──────────────────────────────────────
  // Same as rejectOffer above — this changes the OFFER's status, not the
  // parent request's, so it doesn't touch statusHistory either.
  async withdrawOffer(requestId: string, lenderId: string, offerId: string) {
    const req = await this.loanModel.findById(requestId);
    if (!req) throw new NotFoundException('Loan request not found');

    const offer = req.offers.find((o: any) => o._id.toString() === offerId);
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.lenderId.toString() !== lenderId) throw new ForbiddenException('Not your offer');
    if (offer.status !== 'pending') throw new BadRequestException('Only pending offers can be withdrawn');

    offer.status = 'withdrawn';

    const saved = await req.save();

    await this.notificationsService.create(
      req.borrowerId.toString(),
      'offer_rejected',
      `An offer of ₹${req.amount.toLocaleString('en-IN')} on your ${req.category} request was withdrawn by the lender.`,
      { relatedId: req._id.toString(), relatedModel: 'LoanRequest' },
    );

    return saved;
  }

  // ── Lender: every offer they've ever sent, with parent request context ───
  async getMyOffers(lenderId: string) {
    const lenderObjId = new Types.ObjectId(lenderId);
    const requests = await this.loanModel
      .find({ 'offers.lenderId': lenderObjId })
      .populate('borrowerId', 'fullName avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    // Flatten to one row per offer this lender made, carrying the parent
    // request's context along so the frontend doesn't need a second call
    // per row.
    return requests.flatMap((req: any) =>
      req.offers
        .filter((o: any) => o.lenderId.toString() === lenderId)
        .map((o: any) => ({
          offerId:           o._id,
          status:            o.status,
          message:           o.message,
          offeredRate:       o.offeredRate,
          createdAt:         o.createdAt,
          loanRequestId:     req._id,
          loanRequestStatus: req.status,
          amount:            req.amount,
          category:          req.category,
          description:       req.description,
          borrower:          req.borrowerId,
        })),
    );
  }

  // ── Search: keyword + category + radius (2.6) ────────────────────────────
  // requesterId is optional — search() is a public route. When present
  // (the caller sent a valid access token), we exclude borrowers who are
  // blocked either way, so a logged-in-but-blocked relationship can't see
  // each other's listings even by hitting the API directly.
  async search(dto: SearchLoanRequestsDto, requesterId?: string) {
    const page    = dto.page    ?? 1;
    const limit   = Math.min(dto.limit ?? 20, 50);
    const radiusM = (dto.radiusKm ?? DEFAULT_RADIUS_KM) * 1000;

    const filter: Record<string, any> = { status: 'open' };

    if (dto.category) filter.category = dto.category;

    if (requesterId) {
      const blockedIds = await this.blocksService.getBlockedEitherWayUserIds(requesterId);
      if (blockedIds.length) {
        filter.borrowerId = { $nin: blockedIds.map((id) => new Types.ObjectId(id)) };
      }
    }

    if (dto.keyword) {
      filter.$text = { $search: dto.keyword };
    }

    // Radius filter — only when both coords are given
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      filter.location = {
        $near: {
          $geometry:    { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
          $maxDistance: radiusM,
        },
      };
    }

    const [results, total] = await Promise.all([
      this.loanModel
        .find(filter)
        .select('-offers') // don't leak offer details in list view
        .populate('borrowerId', 'fullName identityVerified avatarUrl city state')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.loanModel.countDocuments(filter),
    ]);

    return { results, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Get single request (public) ───────────────────────────────────────────
  async getById(requestId: string, requesterId?: string) {
    const req = await this.loanModel
      .findById(requestId)
      .populate('borrowerId', 'fullName identityVerified avatarUrl city state')
      .lean();
    if (!req) throw new NotFoundException('Loan request not found');

    if (requesterId) {
      const blocked = await this.blocksService.isBlockedEitherWay(
        requesterId,
        (req.borrowerId as any)._id.toString(),
      );
      // Same 404 as "doesn't exist" — don't leak that a block relationship
      // exists by returning a different error for this case.
      if (blocked) throw new NotFoundException('Loan request not found');
    }

    return req;
  }
}