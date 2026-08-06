import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class FileReportDto {
  @IsNotEmpty()
  @IsString()
  reportedUserId: string;

  @IsNotEmpty()
  @IsIn(['fake_identity', 'harassment', 'fraud_attempt', 'spam', 'impersonation', 'abusive_behaviour', 'other'])
  reason: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  details?: string;

  // Where in the app was the report triggered (optional, for context)
  @IsString()
  @IsOptional()
  @MaxLength(50)
  reportContext?: string;
}