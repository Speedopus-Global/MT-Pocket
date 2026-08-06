import {
  Controller, Post, Get, Req, UploadedFile, UseGuards,
  UseInterceptors, BadRequestException, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { VerificationService } from '../services/verification.service';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { UploadDocumentDto } from '../../users/dto/upload-document.dto';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

@Controller('verification')
@UseGuards(JwtAccessGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // POST /verification/document
  @Post('document')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  async uploadDocument(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, WEBP, or PDF files are accepted');
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('File must be under 8MB');
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