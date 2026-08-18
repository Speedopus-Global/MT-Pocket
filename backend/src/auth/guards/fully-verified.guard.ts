import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';

/**
 * FullyVerifiedGuard
 * ──────────────────
 * Must be applied AFTER JwtAccessGuard (which populates req.user).
 * Re-fetches the user from the DB on every request so that a
 * verification status change mid-session is always respected — never
 * trust the JWT alone for security-critical gates.
 *
 * Returns a structured 403 so the frontend can intercept it and
 * show a "complete your profile" banner instead of a generic crash.
 *
 * Usage:
 *   @UseGuards(JwtAccessGuard, FullyVerifiedGuard)
 */
@Injectable()
export class FullyVerifiedGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const sub = (req.user as { sub: string })?.sub;

    if (!sub) {
      throw new ForbiddenException({
        message: 'Authentication required',
        requiresFullVerification: false,
      });
    }

    const user = await this.userModel
      .findById(sub)
      .select('phone email phoneVerified emailVerified')
      .lean();

    const fullyVerified =
      !!user?.email &&
      !!user?.emailVerified;

    if (!fullyVerified) {
      throw new ForbiddenException({
        message:
          'Please verify your email address before performing loan-related actions.',
        requiresFullVerification: true,
        verificationStatus: {
          hasEmail: !!user?.email,
          emailVerified: !!user?.emailVerified,
          hasPhone: !!user?.phone,
          phoneVerified: !!user?.phoneVerified,
        },
      });
    }

    return true;
  }
}
