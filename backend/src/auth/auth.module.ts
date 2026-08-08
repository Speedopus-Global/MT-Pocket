import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAccessStrategy } from './strategies/jwt.access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt.refresh.strategy';
import { UsersModule } from '../users/user.module';
import { SmsService } from '../common/sms/sms.service';
import { EmailService } from '../common/email/email.service';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}), // secrets are passed per sign()/verify() call, not globally
    // Registered directly here (not just relying on UsersModule) so
    // JwtAccessStrategy's @InjectModel(User.name) always resolves,
    // regardless of what UsersModule does or doesn't export.
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, SmsService, EmailService, JwtAccessStrategy, JwtRefreshStrategy],
})
export class AuthModule {}