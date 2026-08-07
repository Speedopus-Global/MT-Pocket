import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Block, BlockSchema } from './schemas/Block.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { BlocksService } from './Block.service';
import { BlocksController } from './block.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Block.name, schema: BlockSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService], // needed by LoanRequestsModule to gate sendOffer()
})
export class BlocksModule {}