import {
  IsIn, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional,
  IsString, Max, MaxLength, Min,
} from 'class-validator';

export class CreateLoanRequestDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsIn(['medical', 'education', 'business', 'personal', 'other'])
  category: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  interestRateHint?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationDays?: number;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsNumber()
  @Min(-90) @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180) @Max(180)
  @IsOptional()
  longitude?: number;
}

export class SendOfferDto {
  @IsMongoId()
  loanRequestId: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;

  @IsNumber()
  @Min(0) @Max(100)
  @IsOptional()
  offeredRate?: number;
}

export class SearchLoanRequestsDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsIn(['medical', 'education', 'business', 'personal', 'other', ''])
  @IsOptional()
  category?: string;

  @IsNumber() @Min(-90) @Max(90)   @IsOptional() latitude?: number;
  @IsNumber() @Min(-180) @Max(180) @IsOptional() longitude?: number;

  @IsNumber() @Min(1) @IsOptional()
  radiusKm?: number; // default 25 km

  @IsInt() @Min(1) @IsOptional() page?: number;
  @IsInt() @Min(1) @Max(50) @IsOptional() limit?: number;
}