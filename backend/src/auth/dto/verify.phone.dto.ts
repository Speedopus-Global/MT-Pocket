import { Length, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyPhoneDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(6, 6, { message: 'Verification OTP must be 6 digits' })
  otp: string;
}
