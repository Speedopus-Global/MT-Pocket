import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanRequest, LoanRequestSchema } from './schemas/loan-request.schema';
import { LoanRequestsService } from './loan-requests.service';
import { LoanRequestsController } from './loan-request.controller';
import { BlocksModule } from 'src/Block/block.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: LoanRequest.name, schema: LoanRequestSchema }]),BlocksModule],
  controllers: [LoanRequestsController],
  providers:   [LoanRequestsService],
  exports:     [LoanRequestsService],
})
export class LoanRequestsModule {}