import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';

export type AccessTokenPayload = { sub: string; phone: string; role: string };

// Shape of req.user after this strategy runs — note this is now the LIVE
// DB record's relevant fields, not whatever was baked into the token at
// sign-time. Downstream guards (RequireAdmin, etc.) should read from here.
export type AuthenticatedUser = {
  sub: string;
  phone: string;
  role: string;
  systemRole: 'user' | 'reviewer' | 'super_admin';
  accountStatus: 'active' | 'suspended' | 'banned';
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    });
  }

  // Whatever this returns becomes `req.user` in controllers guarded by
  // JwtAccessGuard / OptionalJwtAccessGuard.
  //
  // Re-fetches the user on every authenticated request instead of trusting
  // the token's baked-in claims. This is what makes "set systemRole in
  // MongoDB directly" work immediately — no re-login, no token re-signing.
  // It also means a suspend/ban takes effect on the person's very next
  // request, not just at their next login.
  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const user = await this.userModel
      .findById(payload.sub)
      .select('phone role systemRole accountStatus')
      .lean();

    if (!user) {
      // Account was deleted after this token was issued.
      throw new UnauthorizedException('Account no longer exists');
    }
    if (user.accountStatus !== 'active') {
      // Suspended/banned since the token was issued — reject immediately
      // rather than letting a still-valid token through.
      throw new UnauthorizedException('Account is not active');
    }

    return {
      sub: payload.sub,
      phone: user.phone,
      role: user.role,
      systemRole: user.systemRole,
      accountStatus: user.accountStatus,
    };
  }
}