import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupportTicketDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty()
  @IsEmail()
  senderEmail: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
