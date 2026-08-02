import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestEmailDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;
}
