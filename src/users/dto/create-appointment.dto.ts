import { IsString, IsInt, IsDateString, IsIn } from 'class-validator';

export class CreateAppointmentDto {
@IsInt()
doctor_id: number;

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