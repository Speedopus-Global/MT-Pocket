import { IsIn, IsNotEmpty } from 'class-validator';

export type IdDocumentType = 'aadhaar' | 'pan' | 'passport' | 'driving_license';

export class UploadDocumentDto {
  @IsNotEmpty()
  @IsIn(['aadhaar', 'pan', 'passport', 'driving_license'])
  documentType: IdDocumentType;
}