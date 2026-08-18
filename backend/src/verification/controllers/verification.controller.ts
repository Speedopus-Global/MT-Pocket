import {
  Controller, Post, Get, Req, UploadedFiles, UseGuards,
  UseInterceptors, BadRequestException, Body,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { VerificationService } from '../services/verification.service';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { UploadDocumentDto } from '../../users/dto/upload-document.dto';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

// Selfie is always a live photo — no PDFs, and a tighter size cap since it's
// just a face crop, not a scanned document.
const SELFIE_ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SELFIE_BYTES = 5 * 1024 * 1024; // 5MB

@Controller('verification')
@UseGuards(JwtAccessGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // POST /verification/document — multipart fields: file (required), selfie (required)
  @Post('document')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ], { limits: { fileSize: MAX_FILE_BYTES } }))
  async uploadDocument(
    @Req() req: Request,
    @UploadedFiles() files: { file?: Express.Multer.File[]; selfie?: Express.Multer.File[] },
    @Body() dto: UploadDocumentDto,
  ) {
    const file = files?.file?.[0];
    const selfie = files?.selfie?.[0];

    if (!file) throw new BadRequestException('No document file uploaded');
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, WEBP, or PDF files are accepted');
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('Document file must be under 8MB');
    }

    if (!selfie) throw new BadRequestException('A selfie is required alongside your document');
    if (!SELFIE_ALLOWED_MIMETYPES.includes(selfie.mimetype)) {
      throw new BadRequestException('Selfie must be a JPG, PNG, or WEBP image');
    }
    if (selfie.size > MAX_SELFIE_BYTES) {
      throw new BadRequestException('Selfie must be under 5MB');
    }

    const user = req.user as any;
    return this.verificationService.uploadDocument(
      user.sub,
      file,
      dto.documentType,
      {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
      selfie,
    );
  }

  // GET /verification/status — current user's KYC status
  @Get('status')
  async getStatus(@Req() req: Request) {
    const user = req.user as any;
    return this.verificationService.getMyStatus(user.sub);
  }

  // GET /verification/history — all versions submitted by this user
  @Get('history')
  async getHistory(@Req() req: Request) {
    const user = req.user as any;
    return this.verificationService.getVersionHistory(user.sub);
  }
}