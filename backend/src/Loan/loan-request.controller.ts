import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { LoanRequestsService } from './loan-requests.service';
import { CreateLoanRequestDto, SearchLoanRequestsDto, SendOfferDto } from './dto/loan-request.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('loan-requests')
export class LoanRequestsController {
  constructor(private readonly loanService: LoanRequestsService) {}

  // ── Public: search / browse ──────────────────────────────────────────────
  // No auth required — anyone can browse (they can't see personal details)
  @Get('search')
  search(@Query() query: SearchLoanRequestsDto) {
    return this.loanService.search(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.loanService.getById(id);
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