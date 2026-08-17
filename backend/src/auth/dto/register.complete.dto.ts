import { IsPhoneNumber, IsString, IsNotEmpty, MinLength, IsIn, IsOptional } from 'class-validator';

export class RegisterCompleteDto {
  @IsPhoneNumber(undefined, { message: 'Enter a valid phone number, including country code' })
  phone: string;

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
