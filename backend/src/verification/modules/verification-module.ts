import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VerificationDocument,
  VerificationDocumentSchema,
} from '../schemas/verification-document.schema';
import {
  DocumentAudit,
  DocumentAuditSchema,
} from '../schemas/document-audit.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';
import { VerificationService } from '../services/verification.service';
import { VerificationController } from '../controllers/verification.controller';
import { AdminVerificationController } from '../controllers/admin-verification.controller';
import { DocumentAuditService } from '../services/document-audit.service';
import { CloudinaryModule } from '../../cloudinary/cloudinary.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { EmailModule } from '../../common/email/email-module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VerificationDocument.name, schema: VerificationDocumentSchema },
      { name: DocumentAudit.name, schema: DocumentAuditSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CloudinaryModule,
    NotificationsModule,
    EmailModule,
  ],
  controllers: [VerificationController, AdminVerificationController],
  providers: [VerificationService, DocumentAuditService],
  exports: [VerificationService, DocumentAuditService],
})
export class VerificationModule {}