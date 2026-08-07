import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoanRequest, LoanRequestDocument } from './schemas/loan-request.schema';
import { CreateLoanRequestDto, SearchLoanRequestsDto, SendOfferDto } from './dto/loan-request.dto';
import { BlocksService } from '../Block/Block.service';

const DEFAULT_RADIUS_KM = 25;

@Injectable()
export class LoanRequestsService {
  constructor(
    @InjectModel(LoanRequest.name) private loanModel: Model<LoanRequestDocument>,
    private readonly blocksService: BlocksService,
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

    return req.save();
  }

  // ── Borrower: close / cancel own request ──────────────────────────────────
  async changeStatus(requestId: string, borrowerId: string, status: 'closed' | 'cancelled') {
    const req = await this.loanModel.findById(requestId);
    if (!req) throw new NotFoundException('Loan request not found');
    if (req.borrowerId.toString() !== borrowerId) throw new ForbiddenException('Not your request');
    req.status = status;
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
      createdAt:   new Date(),
    });

    return req.save();
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