import {
  IsDateString,
  IsString,
  IsInt,
  Min,
  IsNotEmpty
} from 'class-validator';

export class CreateManualSlotDto {
  @IsDateString({}, { message: 'Date must be a valid ISO date string (YYYY-MM-DD)' })
  date: string;

  @IsString({ message: 'Start time must be a string in HH:mm format' })
  @IsNotEmpty({ message: 'Start time is required' })
  start_time: string;

  @IsString({ message: 'End time must be a string in HH:mm format' })
  @IsNotEmpty({ message: 'End time is required' })
  end_time: string;

  @IsInt({ message: 'Patients per slot must be an integer' })
  @Min(1, { message: 'At least one patient per slot is required' })
  patients_per_slot: number;

  @IsInt({ message: 'Availability ID must be an integer' })
  @Min(1, { message: 'Availability ID must be greater than 0' })
  availability_id: number;
}
