import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule }          from './auth/auth.module';
import { UsersModule }         from './users/user.module';
import { AdminModule }         from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule }       from './reports/report.module';
import { LoanRequestsModule }  from './Loan/loan-requests.module';
import { VerificationModule } from './verification/modules/verification-module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    AuthModule,
    UsersModule,
    AdminModule,
    NotificationsModule,
    ReportsModule,
    LoanRequestsModule,
    VerificationModule
  ],
})
export class AppModule {}