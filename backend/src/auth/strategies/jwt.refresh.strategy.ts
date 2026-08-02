import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

export type RefreshTokenPayload = { sub: string };

function extractFromCookie(req: Request): string | null {
  return req?.cookies?.['mtp_refresh'] ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
      passReqToCallback: true,
    } as any);
  }

  async validate(req: Request, payload: RefreshTokenPayload) {
    // Attach the raw token too — AuthService needs it to check against the
    // stored hash (rotation check), not just the decoded payload.
    const token = extractFromCookie(req);
    return { ...payload, token };
  }
}