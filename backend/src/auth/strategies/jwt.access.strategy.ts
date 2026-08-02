import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type AccessTokenPayload = { sub: string; phone: string; role: string };

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    });
  }

  // Whatever this returns becomes `req.user` in controllers guarded by JwtAccessGuard.
  async validate(payload: AccessTokenPayload) {
    return payload;
  }
}