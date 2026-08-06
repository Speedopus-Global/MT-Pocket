import {
  CanActivate, ExecutionContext, Injectable,
  ForbiddenException, SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// ── Roles & Permissions ────────────────────────────────────────────────────
//
//   user         Upload own doc, view own status
//   reviewer     View queue, view/download docs, approve/reject, request re-upload
//                Cannot: suspend users, ban users, view other users' sensitive data
//   super_admin  Everything reviewers can do + user lifecycle (suspend/ban/unsuspend)
//                + view all users + dismiss reports
//
// Principle: least privilege. A reviewer cannot suspend. A support role
// (future) cannot see documents. Elevating systemRole requires direct
// MongoDB access — no API endpoint for it.
// ─────────────────────────────────────────────────────────────────────────

export type SystemRole = 'user' | 'reviewer' | 'super_admin';

export const ROLES_KEY = 'required_roles';
export const RequireRoles = (...roles: SystemRole[]) =>
  SetMetadata(ROLES_KEY, roles);

// Permissions matrix — what each role can do
export const PERMISSIONS: Record<SystemRole, Set<string>> = {
  user: new Set([
    'kyc:upload',
    'kyc:view_own_status',
    'notification:read_own',
  ]),
  reviewer: new Set([
    'kyc:upload',
    'kyc:view_own_status',
    'kyc:view_queue',
    'kyc:view_document',       // view doc metadata
    'kyc:download_document',   // generate signed URL
    'kyc:approve',
    'kyc:reject',
    'kyc:request_reupload',
    'kyc:claim_for_review',
    'kyc:view_audit_trail',
    'notification:read_own',
    'notification:read_admin',
    'report:view',
  ]),
  super_admin: new Set([
    'kyc:upload',
    'kyc:view_own_status',
    'kyc:view_queue',
    'kyc:view_document',
    'kyc:download_document',
    'kyc:approve',
    'kyc:reject',
    'kyc:request_reupload',
    'kyc:claim_for_review',
    'kyc:view_audit_trail',
    'user:view_all',
    'user:suspend',
    'user:unsuspend',
    'user:ban',
    'notification:read_own',
    'notification:read_admin',
    'report:view',
    'report:dismiss',
    'report:review',
  ]),
};

export function hasPermission(role: SystemRole, permission: string): boolean {
  return PERMISSIONS[role]?.has(permission) ?? false;
}

// ── Guard: enforces @RequireRoles(...) on routes ──────────────────────────
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @RequireRoles decorator — route is open to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.systemRole) {
      throw new ForbiddenException('Access denied');
    }

    const hasRole = requiredRoles.includes(user.systemRole as SystemRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `This action requires one of: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

// ── Guard: enforces a specific permission string ──────────────────────────
export const PERMISSION_KEY = 'required_permission';
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.systemRole || !hasPermission(user.systemRole, permission)) {
      throw new ForbiddenException(`Permission denied: ${permission}`);
    }

    return true;
  }
}