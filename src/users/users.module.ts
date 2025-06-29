import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { DoctorAvailability } from './doctor_availability.entity';
import { DoctorTimeSlot } from './doctor_time_slot.entity';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { DoctorAvailabilityController } from './doctor_availability.controller';

@Module({
imports: [
TypeOrmModule.forFeature([
Doctor,
Patient,
DoctorAvailability,
DoctorTimeSlot,
]),
],
controllers: [
DoctorController,
DoctorAvailabilityController,
],
providers: [DoctorService],
exports: [DoctorService],
})
export class UsersModule {}