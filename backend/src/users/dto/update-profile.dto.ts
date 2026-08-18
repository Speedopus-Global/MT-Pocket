import { Transform } from 'class-transformer';
import {
  IsEmail, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min,
} from 'class-validator';

// ~8MB binary image, base64-encoded (base64 runs ~1.37x the raw size) —
// matches the 8MB cap already enforced on KYC document uploads.
const MAX_AVATAR_BASE64_LENGTH = 11 * 1024 * 1024;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName?: string;

  // The frontend always includes `email` in the save payload, even when
  // the user is only updating their address/location and has never set
  // an email. Without this transform, an empty string reaches @IsEmail()
  // and fails validation on EVERY save, not just ones that touch email —
  // that was the root cause of the "please update email" bug. Empty/blank
  // now normalizes to undefined, which @IsOptional() correctly skips.
  // Non-empty values are trimmed + lowercased so "User@Example.com" and
  // "user@example.com" can't end up as two different lookups/accounts.
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed.toLowerCase();
  })
  @IsEmail({}, { message: 'Enter a valid email address' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address?: string;

  // Public-safe location shown on profile/loan cards. Kept separate from
  // `address` (full string, private) and `latitude`/`longitude` (exact GPS,
  // private) per the roadmap's PII-minimization rule.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  state?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  // Was previously an unvalidated free-form string — anything of any size
  // or content could reach the controller and, on Cloudinary failure, get
  // written straight into MongoDB (see user.controller.ts fallback fix).
  // Now it must actually look like a base64 image data URI and stay under
  // a sane size ceiling before it's accepted at all.
  @IsOptional()
  @IsString()
  @MaxLength(MAX_AVATAR_BASE64_LENGTH, { message: 'Avatar image is too large' })
  @Matches(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/, {
    message: 'Avatar must be a base64-encoded PNG, JPEG, WEBP, or GIF image',
  })
  avatar?: string;
}