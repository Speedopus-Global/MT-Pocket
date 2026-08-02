import { Body, Controller, Get, Put, Req, UseGuards, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAccessGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const userId = (req.user as any).sub;
    const user = await this.usersService.findById(userId);
    return user;
  }

  @UseGuards(JwtAccessGuard)
  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req.user as any).sub;
    const updateData: any = {};

    if (dto.fullName !== undefined) {
      updateData.fullName = dto.fullName;
    }

    if (dto.address !== undefined) {
      updateData.address = dto.address;
    }

    if (dto.email !== undefined) {
      const user = await this.usersService.findById(userId);
      if (user && user.email !== dto.email) {
        updateData.email = dto.email;
        updateData.emailVerified = false; // Reset verification if email changes
      }
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude], // GeoJSON standard: [longitude, latitude]
      };
    }

    if (dto.avatar !== undefined) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

      if (cloudName && uploadPreset) {
        try {
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: dto.avatar,
              upload_preset: uploadPreset,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            updateData.avatarUrl = result.secure_url;
            this.logger.log(`Avatar uploaded to Cloudinary: ${result.secure_url}`);
          } else {
            const err = await response.text();
            this.logger.error(`Cloudinary upload failed: ${err}`);
            // Fallback to storing base64
            updateData.avatarUrl = dto.avatar;
          }
        } catch (error) {
          this.logger.error('Error uploading to Cloudinary, falling back to base64', error);
          updateData.avatarUrl = dto.avatar;
        }
      } else {
        // Cloudinary not configured, store base64 data-URI directly
        updateData.avatarUrl = dto.avatar;
      }
    }

    const updatedUser = await this.usersService.updateById(userId, updateData);
    return updatedUser;
  }
}
