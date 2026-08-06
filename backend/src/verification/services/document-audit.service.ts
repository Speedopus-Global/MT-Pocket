import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DocumentAudit,
  DocumentAuditDocument,
  AuditAction,
  ActorRole
} from '../schemas/document-audit.schema';

export interface AuditContext {
  ip?: string;
  userAgent?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ── Append-only. No update or delete methods — by design. ─────────────────
@Injectable()
export class DocumentAuditService {
  private readonly logger = new Logger(DocumentAuditService.name);

  constructor(
    @InjectModel(DocumentAudit.name)
    private auditModel: Model<DocumentAuditDocument>,
  ) { }

  async log(
    verificationId: string,
    userId: string,
    action: AuditAction,
    performedBy: string,
    performedByRole: ActorRole,
    ctx: AuditContext = {},
  ): Promise<void> {
    try {
      await this.auditModel.create({
        verificationId: new Types.ObjectId(verificationId),
        userId: new Types.ObjectId(userId),
        action,
        performedBy: new Types.ObjectId(performedBy),
        performedByRole,
        timestamp: new Date(),
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
        reason: ctx.reason ?? null,
        metadata: ctx.metadata ?? {},
      });
    } catch (err) {
      // Audit log failure must never break the main operation — log
      // it loudly but don't re-throw. We need an alert here in prod.
      this.logger.error(
        `AUDIT LOG FAILURE — action=${action} verificationId=${verificationId} ` +
        `userId=${userId} performedBy=${performedBy}`,
        err as any,
      );
    }
  }

  // ── Reads ─────────────────────────────────────────────────────────────
  async getTrailForDocument(verificationId: string) {
    return this.auditModel
      .find({ verificationId: new Types.ObjectId(verificationId) })
      .sort({ timestamp: 1 }) // chronological — oldest first
      .lean();
  }

  async getTrailForUser(userId: string, limit = 100) {
    return this.auditModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  async getActionsByType(action: AuditAction, since?: Date, limit = 200) {
    const query: Record<string, unknown> = { action };
    if (since) query.timestamp = { $gte: since };
    return this.auditModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }
}