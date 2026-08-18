import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanRequest, LoanRequestSchema } from './schemas/loan-request.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { LoanRequestsService } from './loan-requests.service';
import { LoanRequestsController } from './loan-request.controller';
import { BlocksModule } from 'src/Block/block.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FullyVerifiedGuard } from '../auth/guards/fully-verified.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoanRequest.name, schema: LoanRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
    BlocksModule,
    NotificationsModule,
  ],
  controllers: [LoanRequestsController],
  providers:   [LoanRequestsService, FullyVerifiedGuard],
  exports:     [LoanRequestsService],
})
export class LoanRequestsModule {}