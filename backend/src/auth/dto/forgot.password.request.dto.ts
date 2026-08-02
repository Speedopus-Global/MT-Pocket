import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Phone number or Email is required' })
  identifier: string;
}
