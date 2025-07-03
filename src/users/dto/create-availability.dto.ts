import {
IsString,
IsNotEmpty,
IsDateString,
IsInt,
IsOptional,
IsIn,
} from 'class-validator';

export class CreateAvailabilityDto {
@IsDateString()
date: string;

@IsString()
start_time: string;

@IsString()
end_time: string;

@IsString()
weekdays: string;

@IsIn(['morning', 'evening'])
session: string;

@IsInt()
@IsOptional()
slot_duration?: number;

@IsInt()
@IsOptional()
patients_per_slot?: number;

@IsString()
@IsOptional()
booking_start_time?: string; // e.g., "09:00"

@IsString()
@IsOptional()
booking_end_time?: string; // e.g., "12:00"
}