import { IsInt, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  doctor_id: number;

  @IsInt()
  slot_id: number;

  @IsDateString()
  date: string;
}
