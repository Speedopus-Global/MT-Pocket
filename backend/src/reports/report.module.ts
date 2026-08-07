import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Report, ReportSchema } from './schemas/report.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './report.controller';

import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminReportsController } from './admin-reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule, // <-- REQUIRED
  ],
  controllers: [ReportsController,AdminReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}