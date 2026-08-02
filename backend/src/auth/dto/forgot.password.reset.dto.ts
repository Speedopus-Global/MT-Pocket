import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class ForgotPasswordResetDto {
  @IsString()
  @IsNotEmpty({ message: 'Phone number or Email is required' })
  identifier: string;

  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
