import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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
    const doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctor_id },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const slot = await this.timeSlotRepo.findOne({
      where: {
        start_time: dto.start_time,
        end_time: dto.end_time,
        availability: {
          date: dto.date,
          doctor: { id: dto.doctor_id },
        },
      },
      relations: ['availability', 'availability.doctor'],
    });

    if (!slot) throw new NotFoundException('Slot not found');

    const existing = await this.appointmentRepo.findOne({
      where: {
        patient: { id: patientId },
        date: dto.date,
        time_slot: {
          availability: {
            doctor: { id: dto.doctor_id },
            session: dto.session,
          },
        },
      },
      relations: [
        'time_slot',
        'time_slot.availability',
        'time_slot.availability.doctor',
        'patient',
      ],
    });

    if (existing) {
      throw new ConflictException(
        'You can only book one slot per session per day with this doctor.',
      );
    }

    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    let reportingTime: string;

    if (doctor.schedule_type === 'stream') {
      if (!slot.is_available)
        throw new ConflictException('Slot already booked');

      slot.is_available = false;
      await this.timeSlotRepo.save(slot);
      reportingTime = slot.start_time;
    } else {
      // WAVE SCHEDULING LOGIC
      const start = slot.start_time;
      const end = slot.end_time;

      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const totalMinutes = (endH - startH) * 60 + (endM - startM);

      const maxPatients = 3;
      const durationPerPatient = totalMinutes / maxPatients;

      const existingAppointments = await this.appointmentRepo.find({
        where: { time_slot: { id: slot.id } },
        order: { created_at: 'ASC' },
      });

      if (existingAppointments.length >= maxPatients)
        throw new ConflictException('Wave slot limit reached');

      const reportingOffset = durationPerPatient * existingAppointments.length;
      const reportMinutes = startH * 60 + startM + reportingOffset;
      const reportingHour = Math.floor(reportMinutes / 60);
      const reportingMinute = Math.floor(reportMinutes % 60);

      reportingTime = `${String(reportingHour).padStart(2, '0')}:${String(
        reportingMinute,
      ).padStart(2, '0')}`;
    }

    const appointment = this.appointmentRepo.create({
      time_slot: slot,
      patient,
      date: dto.date,
      reporting_time: reportingTime,
      doctor: doctor,
    });

    const savedAppointment = await this.appointmentRepo.save(appointment);

    return {
      message: 'Appointment booked successfully',
      appointmentDetails: {
        date: savedAppointment.date,
        time: `${slot.start_time} - ${slot.end_time}`,
        reporting_time: reportingTime,
        doctorName: slot.availability.doctor.name,
        specialization: slot.availability.doctor.specialization,
        session: slot.availability.session,
      },
    };
  }

  async getAppointmentsByUser(userId: number, role: 'doctor' | 'patient') {
    if (role === 'doctor') {
      return this.appointmentRepo
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.time_slot', 'slot')
        .leftJoinAndSelect('slot.availability', 'availability')
        .leftJoinAndSelect('availability.doctor', 'doctor')
        .leftJoinAndSelect('appointment.patient', 'patient')
        .where('doctor.id = :userId', { userId })
        .orderBy('appointment.date', 'ASC')
        .getMany();
    } else {
      return this.appointmentRepo.find({
        where: { patient: { id: userId } },
        relations: [
          'time_slot',
          'time_slot.availability',
          'time_slot.availability.doctor',
          'patient',
        ],
        order: { date: 'ASC' },
      });
    }
  }
}
