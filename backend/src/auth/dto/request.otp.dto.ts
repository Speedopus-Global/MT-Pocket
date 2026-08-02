import { IsPhoneNumber } from 'class-validator';

export class RequestOtpDto {
  @IsPhoneNumber(undefined, { message: 'Enter a valid phone number, including country code' })
  phone: string;
}