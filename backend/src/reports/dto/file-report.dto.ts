import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class FileReportDto {
  @IsMongoId({ message: 'Invalid user ID' })
  reportedUserId: string;

  @IsString()
  @IsNotEmpty({ message: 'Reason is required' })
  @MaxLength(200)
  reason: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  details?: string;
}