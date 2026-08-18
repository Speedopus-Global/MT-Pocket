import { IsString, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Enter your email address or phone number (with country code)' })
  identifier: string;
}