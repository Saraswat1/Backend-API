import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { DoctorTimeSlot } from '../users/doctor_time_slot.entity';
import { CreateAppointmentDto } from '../users/dto/create-appointment.dto';
import { Patient } from '../users/patient.entity';
import { Doctor } from '../users/doctor.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(DoctorTimeSlot)
    private timeSlotRepo: Repository<DoctorTimeSlot>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  async bookAppointment(patientId: number, dto: CreateAppointmentDto) {
    const doctor = await this.doctorRepo.findOne({ where: { id: dto.doctor_id } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const slot = await this.timeSlotRepo.findOne({
      where: {
        start_time: dto.start_time,
        end_time: dto.end_time,
        availability: { date: dto.date, doctor: { id: dto.doctor_id } },
      },
      relations: ['availability', 'availability.doctor'],
    });

    if (!slot) throw new NotFoundException('Slot not found');

    if (doctor.schedule_type === 'stream') {
      if (!slot.is_available) throw new ConflictException('Slot already booked');
      slot.is_available = false;
      await this.timeSlotRepo.save(slot);
    } else {
      const count = await this.appointmentRepo.count({ where: { time_slot: slot } });
      if (count >= 3) throw new ConflictException('Wave slot limit reached');
    }

    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const appointment = this.appointmentRepo.create({
      time_slot: slot,
      patient,
      date: dto.date,
    });

    return this.appointmentRepo.save(appointment);
  }
}
