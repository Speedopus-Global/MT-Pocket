import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    // memory storage — we forward the buffer to Cloudinary, never write to disk
    MulterModule.register({ storage: memoryStorage() }),
    CloudinaryModule,
  ],
  controllers: [UserController],
  providers:   [UsersService],
  exports:     [UsersService],
  
})
export class UsersModule {}