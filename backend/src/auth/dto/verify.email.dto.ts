import { Length } from 'class-validator';

export class VerifyEmailDto {
  @Length(6, 6, { message: 'Verification OTP must be 6 digits' })
  otp: string;
}
