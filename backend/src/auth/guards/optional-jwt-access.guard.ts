import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Same JWT verification as JwtAccessGuard, but never rejects the request.
 * Use on PUBLIC routes where you still want to know who's asking, when
 * they happen to be logged in — e.g. so search() / getOne() can filter
 * out results between users who've blocked each other, without forcing
 * a login just to browse.
 *
 * - No token / expired / invalid token → req.user stays undefined, request proceeds.
 * - Valid token → req.user is populated exactly like JwtAccessGuard.
 *
 * ⚠️ Replace 'jwt-access' below with whatever strategy name your existing
 * JwtAccessGuard passes to AuthGuard(...) in jwt-access.guard.ts — they
 * must match or this won't decode the same tokens.
 */
@Injectable()
export class OptionalJwtAccessGuard extends AuthGuard('jwt-access') {
  canActivate(context: ExecutionContext) {
    // Always allow the route to proceed; errors during auth() below are
    // swallowed in handleRequest rather than thrown here.
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any) {
    // Deliberately ignore err/info (expired token, no token, bad signature,
    // etc.) instead of throwing — that's the whole point of "optional".
    return user || undefined;
  }
}