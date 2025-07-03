// src/users/dto/update-availability.dto.ts
import { IsOptional, IsString, IsInt, IsMilitaryTime } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsMilitaryTime()
  start_time?: string;

  @IsOptional()
  @IsMilitaryTime()
  end_time?: string;

  @IsOptional()
  @IsMilitaryTime()
  booking_start_time?: string;

  @IsOptional()
  @IsMilitaryTime()
  booking_end_time?: string;

  @IsOptional()
  @IsInt()
  slot_duration?: number;

  @IsOptional()
  @IsInt()
  patients_per_slot?: number;
}
