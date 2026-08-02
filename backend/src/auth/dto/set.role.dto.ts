import { IsIn } from 'class-validator';

export class SetRoleDto {
  @IsIn(['borrower', 'lender', 'both'], { message: 'Role must be borrower, lender, or both' })
  role: 'borrower' | 'lender' | 'both';
}