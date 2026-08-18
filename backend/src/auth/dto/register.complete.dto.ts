import { IsString, IsNotEmpty, MinLength, IsIn, IsOptional } from 'class-validator';

export class RegisterCompleteDto {
  @IsString()
  @IsNotEmpty({ message: 'Enter your email address or phone number' })
  identifier: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @IsIn(['borrower', 'lender', 'both'], { message: 'Role must be borrower, lender, or both' })
  role: 'borrower' | 'lender' | 'both';

  @IsOptional()
  @IsString()
  termsVersionHash?: string;

  @IsOptional()
  @IsString()
  privacyVersionHash?: string;
}
