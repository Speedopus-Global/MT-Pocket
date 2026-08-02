import { IsNotEmpty, IsString } from 'class-validator';

export class LoginPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Phone number or Email is required' })
  identifier: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
