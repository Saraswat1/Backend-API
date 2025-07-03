import { IsOptional, IsEnum } from 'class-validator';

export class FilterAppointmentsDto {
  @IsOptional()
  @IsEnum(['doctor', 'patient'])
  role?: 'doctor' | 'patient';
}
