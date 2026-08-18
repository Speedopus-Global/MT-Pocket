import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestPhoneDto {
  @IsString()
  @IsNotEmpty({ message: 'Enter a valid phone number' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;
}
