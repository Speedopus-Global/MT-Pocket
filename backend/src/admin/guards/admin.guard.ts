import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// Kept in sync with RequireAdmin.jsx's frontend check and Login.jsx's
// post-login redirect — all three used to hardcode a nonexistent
// 'admin' value against the real systemRole enum ('user' | 'reviewer' |
// 'super_admin'), which meant this check failed for every account,
// including genuine super_admins.
const ADMIN_SYSTEM_ROLES = ['reviewer', 'super_admin'];

@Injectable()
export class AdminGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    const user = request.user;


    if (!user || !ADMIN_SYSTEM_ROLES.includes(user.systemRole)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}