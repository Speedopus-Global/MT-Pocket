import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanRequest, LoanRequestSchema } from './schemas/loan-request.schema';
import { LoanRequestsService } from './loan-requests.service';
import { LoanRequestsController } from './loan-request.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: LoanRequest.name, schema: LoanRequestSchema }])],
  controllers: [LoanRequestsController],
  providers:   [LoanRequestsService],
  exports:     [LoanRequestsService],
})
export class LoanRequestsModule {}