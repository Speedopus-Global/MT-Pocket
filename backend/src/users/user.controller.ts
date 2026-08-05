import {
  Body, Controller, Get, Post, Put, Req, UseGuards,
  UploadedFile, UseInterceptors, BadRequestException, Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { UsersService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

// KYC uploads only make sense as an image or a PDF — reject anything else
// before it ever reaches Cloudinary.
const ALLOWED_DOC_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_DOC_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

@Controller('users')
@UseGuards(JwtAccessGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── GET /users/profile ───────────────────────────────────────────────────
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const userId = (req.user as any).sub;
    // findPublicProfileById, NOT findById — this response goes straight to
    // the browser, and findById() returns password/OTP hashes unfiltered.
    return this.usersService.findPublicProfileById(userId);
  }

  // ── PUT /users/profile ───────────────────────────────────────────────────
  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req.user as any).sub;
    const updateData: Record<string, any> = {};

    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.address !== undefined) updateData.address = dto.address;

    // ── EMAIL: only touch if the value is actually changing ──────────────
    // Root cause fix for the "always asks for email" bug: previously the
    // controller reset emailVerified any time the dto contained an email
    // field, even if it was the same value. Now we compare first — if
    // it's the same address, ignore it entirely.
    if (dto.email !== undefined) {
      const user = await this.usersService.findById(userId);
      if (user && dto.email !== user.email) {
        updateData.email = dto.email;
        updateData.emailVerified = false; // reset only on actual change
      }
      // if dto.email === user.email, we do nothing — verified status preserved
    }

    // ── LOCATION: only set when both coords are present ──────────────────
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude], // GeoJSON: [lng, lat]
      };
    }

    // ── AVATAR: upload to Cloudinary, fall back to base64 in dev ──────────
    if (dto.avatar !== undefined) {
      try {
        const result = await this.cloudinaryService.uploadAvatar(dto.avatar);
        updateData.avatarUrl = result.secure_url;
        this.logger.log(`Avatar uploaded successfully for user ${userId}`);
      } catch (e) {
        this.logger.error('Avatar upload failed. Falling back to base64.', e);
        // Development fallback only — remove before going to production.
        updateData.avatarUrl = dto.avatar;
      }
    }

    return this.usersService.updateById(userId, updateData);
  }

  // ── POST /users/document ─────────────────────────────────────────────────
  // Accepts multipart/form-data: field "file" (image/pdf) + field "documentType"
  // Uploads to Cloudinary as a private/authenticated asset and puts the
  // account into "pending" KYC status for an admin to review.
  @Post('document')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_DOC_SIZE_BYTES },
    }),
  )
  async uploadDocument(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_DOC_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, WEBP, or PDF files are accepted');
    }

    const userId = (req.user as any).sub;

    // Don't leave the previous document orphaned in Cloudinary on resubmit.
    const existing = await this.usersService.findById(userId);
    if (existing?.idDocumentPublicId) {
      try {
        await this.cloudinaryService.deleteDocument(
          existing.idDocumentPublicId,
          (existing.idDocumentResourceType as 'image' | 'raw' | 'video') ?? 'image',
        );
      } catch (e) {
        // Non-fatal — an orphaned old asset isn't worth failing the new
        // upload over, but it's worth knowing about.
        this.logger.warn(`Could not delete previous document for user ${userId}`, e as any);
      }
    }

    let documentUrl: string;
    let documentPublicId: string;
    let documentResourceType: 'image' | 'raw' | 'video';

    try {
      const result = await this.cloudinaryService.uploadDocument(file.buffer, file.mimetype, userId);
      documentUrl = result.secure_url;
      documentPublicId = result.public_id;
      documentResourceType = result.resource_type as 'image' | 'raw' | 'video';
      this.logger.log(`Secure identity document uploaded for user ${userId}`);
    } catch (e) {
      this.logger.error('Secure document upload failed', e as any);
      throw new BadRequestException('Document upload failed. Please try again.');
    }

    const updated = await this.usersService.updateById(userId, {
      idDocumentUrl: documentUrl,
      idDocumentPublicId: documentPublicId,
      idDocumentResourceType: documentResourceType,
      idDocumentType: dto.documentType,
      idDocumentStatus: 'pending',
      idDocumentSubmittedAt: new Date(),
      idDocumentRejectionReason: null,
      identityVerified: false,
    });

    return {
      message: 'Document submitted for review',
      idDocumentStatus: updated?.idDocumentStatus,
    };
  }
}