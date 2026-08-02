import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginOtpVerifyDto {
  @IsString()
  @IsNotEmpty({ message: 'Phone number or Email is required' })
  identifier: string;

  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;
}
