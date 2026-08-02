import { IsNotEmpty, IsString } from 'class-validator';

export class LoginOtpRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Phone number or Email is required' })
  identifier: string;
}
