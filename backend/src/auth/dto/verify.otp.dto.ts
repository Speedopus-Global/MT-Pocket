import { IsPhoneNumber, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsPhoneNumber(undefined, { message: 'Enter a valid phone number, including country code' })
  phone: string;

  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;
}