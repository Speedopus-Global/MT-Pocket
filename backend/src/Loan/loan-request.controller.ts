import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { LoanRequestsService } from './loan-requests.service';
import { CreateLoanRequestDto, SearchLoanRequestsDto, SendOfferDto } from './dto/loan-request.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { OptionalJwtAccessGuard } from '../auth/guards/optional-jwt-access.guard';

@Controller('loan-requests')
export class LoanRequestsController {
  constructor(private readonly loanService: LoanRequestsService) {}

  // ── Public: search / browse ──────────────────────────────────────────────
  // Still no login required — OptionalJwtAccessGuard just populates req.user
  // when a valid token IS present, so we can exclude blocked users from the
  // results server-side instead of relying on the frontend to hide them.
  @UseGuards(OptionalJwtAccessGuard)
  @Get('search')
  search(@Req() req: Request, @Query() query: SearchLoanRequestsDto) {
    const requesterId = (req.user as any)?.sub;
    return this.loanService.search(query, requesterId);
  }

  @UseGuards(OptionalJwtAccessGuard)
  @Get(':id')
  getOne(@Req() req: Request, @Param('id') id: string) {
    const requesterId = (req.user as any)?.sub;
    return this.loanService.getById(id, requesterId);
  }

  // ── Borrower: manage own requests ────────────────────────────────────────
  @UseGuards(JwtAccessGuard)
  @Post()
  create(@Req() req: Request, @Body() dto: CreateLoanRequestDto) {
    const borrowerId = (req.user as any).sub;
    return this.loanService.create(borrowerId, dto);
  }

  @UseGuards(JwtAccessGuard)
  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateLoanRequestDto,
  ) {
    const borrowerId = (req.user as any).sub;
    return this.loanService.update(id, borrowerId, dto);
  }

  @UseGuards(JwtAccessGuard)
  @Patch(':id/close')
  close(@Req() req: Request, @Param('id') id: string) {
    return this.loanService.changeStatus(id, (req.user as any).sub, 'closed');
  }

  @UseGuards(JwtAccessGuard)
  @Patch(':id/cancel')
  cancel(@Req() req: Request, @Param('id') id: string) {
    return this.loanService.changeStatus(id, (req.user as any).sub, 'cancelled');
  }

  @UseGuards(JwtAccessGuard)
  @Get('mine/list')
  myRequests(@Req() req: Request) {
    return this.loanService.getMyRequests((req.user as any).sub);
  }

  // ── Lender: send offer ───────────────────────────────────────────────────
  @UseGuards(JwtAccessGuard)
  @Post('offer')
  sendOffer(@Req() req: Request, @Body() dto: SendOfferDto) {
    const lenderId = (req.user as any).sub;
    return this.loanService.sendOffer(lenderId, dto);
  }
}