import {
  Body, Controller, Get, Param, Put, Req, UseGuards, Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

// NOTE: profile viewing (GET /:id/public) is intentionally behind
// JwtAccessGuard, not OptionalJwtAccessGuard. Loan-request browsing stays
// public per the roadmap ("no login required to browse"), but *viewing a
// specific user's profile* and every safety action (offer/block/report)
// require an account — enforced here, not just hidden in the frontend UI,
// since hiding a button doesn't stop someone from calling the API directly.
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── GET /users/profile ───────────────────────────────────────────────────
  @UseGuards(JwtAccessGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const userId = (req.user as any).sub;
    // findPublicProfileById, NOT findById — this response goes straight to
    // the browser, and findById() returns password/OTP hashes unfiltered.
    return this.usersService.findPublicProfileById(userId);
  }

  // ── GET /users/:id/public — someone else's profile, login required ───────
  @UseGuards(JwtAccessGuard)
  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string, @Req() req: Request) {
    const viewerId = (req.user as any).sub;
    return this.usersService.findPublicById(id, viewerId);
  }

  // ── PUT /users/profile ───────────────────────────────────────────────────
  @UseGuards(JwtAccessGuard)
  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req.user as any).sub;
    const updateData: Record<string, any> = {};

    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;

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

    // ── PHONE: only touch if the value is actually changing ──────────────
    if (dto.phone !== undefined) {
      const user = await this.usersService.findById(userId);
      if (user && dto.phone !== user.phone) {
        updateData.phone = dto.phone;
        updateData.phoneVerified = false; // reset only on actual change
      }
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
}