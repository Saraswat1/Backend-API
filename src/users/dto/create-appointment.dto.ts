import { IsInt, IsString, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  doctor_id: number;

  @IsInt()
  slot_id: number;  // ✅ add this if you want to use slot_id

  @IsDateString()
  date: string;

  @IsString()
  weekday: string;

  @IsString()
  session: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;
}
