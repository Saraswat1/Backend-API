import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Doctor } from './doctor.entity';
import { DoctorAvailability } from './doctor_availability.entity';
import { DoctorTimeSlot } from './doctor_time_slot.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { Appointment } from '../appointments/appointment.entity';
import { CreateManualSlotDto } from './dto/create-manual-slot.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    @InjectRepository(DoctorAvailability)
    private readonly availabilityRepo: Repository<DoctorAvailability>,

    @InjectRepository(DoctorTimeSlot)
    private readonly slotRepo: Repository<DoctorTimeSlot>,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async createAvailability(doctorId: number, dto: CreateAvailabilityDto) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const existing = await this.availabilityRepo.findOne({
      where: { doctor: { id: doctorId }, date: dto.date },
    });

    if (existing) {
      throw new ConflictException('Availability for this date already exists.');
    }

    const availability = this.availabilityRepo.create({
      doctor,
      date: dto.date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      weekdays: dto.weekdays,
      session: dto.session,
      booking_start_time: dto.booking_start_time,
      booking_end_time: dto.booking_end_time,
      patients_per_slot: dto.patients_per_slot,
      slot_duration: dto.slot_duration,
    });

    await this.availabilityRepo.save(availability);

    const start = new Date(`2000-01-01T${dto.start_time}`);
    const end = new Date(`2000-01-01T${dto.end_time}`);
    const duration = dto.slot_duration || 30;

    const slots: DoctorTimeSlot[] = [];

    while (start < end) {
      const slotEnd = new Date(start.getTime() + duration * 60000);
      const slot = this.slotRepo.create({
        availability,
        start_time: start.toTimeString().substring(0, 5),
        end_time: slotEnd.toTimeString().substring(0, 5),
        is_available: true,
      });
      slots.push(slot);
      start.setTime(slotEnd.getTime());
    }

    await this.slotRepo.save(slots);
    return { message: 'Availability and slots created', slots };
  }

  async getAvailability(
    doctorId: number,
    filters: { date?: string; session?: string; page?: number; limit?: number },
  ) {
    const { date, session, page = 1, limit = 10 } = filters;

    const query = this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.availability', 'availability')
      .where('availability.doctorId = :doctorId', { doctorId })
      .andWhere('slot.is_available = :isAvailable', { isAvailable: true });

    if (date) {
      query.andWhere('availability.date = :date', { date });
    }

    if (session) {
      query.andWhere('availability.session = :session', { session });
    }

    query
      .orderBy('availability.date', 'ASC')
      .addOrderBy('slot.start_time', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [slots, total] = await query.getManyAndCount();

    return {
      total,
      page,
      limit,
      data: slots,
    };
  }

  async updateAvailability(
    doctorId: number,
    availabilityId: number,
    dto: UpdateAvailabilityDto,
  ) {
    const availability = await this.availabilityRepo.findOne({
      where: { id: availabilityId },
      relations: ['doctor', 'slots'],
    });

    if (!availability || availability.doctor.id !== doctorId) {
      throw new NotFoundException('Availability not found');
    }

    const appointmentCount = await this.slotRepo
      .createQueryBuilder('slot')
      .leftJoin('slot.availability', 'availability')
      .leftJoin('slot.appointments', 'appointment')
      .where('availability.id = :id', { id: availabilityId })
      .andWhere('appointment.id IS NOT NULL')
      .getCount();

    if (appointmentCount > 0) {
      throw new ConflictException(
        'You cannot modify this slot because an appointment is already booked in this session.',
      );
    }

    Object.assign(availability, dto);
    return this.availabilityRepo.save(availability);
  }

  async deleteAvailability(doctorId: number, availabilityId: number) {
    const availability = await this.availabilityRepo.findOne({
      where: { id: availabilityId },
      relations: ['doctor', 'slots'],
    });

    if (!availability || availability.doctor.id !== doctorId) {
      throw new NotFoundException('Availability not found');
    }

    const appointmentCount = await this.slotRepo
      .createQueryBuilder('slot')
      .leftJoin('slot.availability', 'availability')
      .leftJoin('slot.appointments', 'appointment')
      .where('availability.id = :id', { id: availabilityId })
      .andWhere('appointment.id IS NOT NULL')
      .getCount();

    if (appointmentCount > 0) {
      throw new ConflictException(
        'You cannot delete this slot because an appointment is already booked in this session.',
      );
    }

    await this.availabilityRepo.remove(availability);
    return { message: 'Availability deleted successfully' };
  }

  async updateScheduleType(doctorId: number, stream_type: 'stream' | 'wave') {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    doctor.schedule_type = stream_type;
    return this.doctorRepo.save(doctor);
  }

  async findDoctorById(id: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { id },
      relations: ['availabilities', 'availabilities.slots'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async findAllDoctors(query: { name?: string; specialization?: string }) {
    const where: any = {};
    if (query.name) {
      where.name = Like(`%${query.name}%`);
    }

    if (query.specialization) {
      where.specialization = Like(`%${query.specialization}%`);
    }

    return this.doctorRepo.find({ where });
  }

  async addManualSlot(doctorId: number, dto: CreateManualSlotDto) {
    const { date, start_time, end_time, patients_per_slot, availability_id } = dto;

    const availability = await this.availabilityRepo.findOne({
      where: { id: availability_id },
      relations: ['doctor'],
    });

    if (!availability || availability.doctor.id !== doctorId) {
      throw new NotFoundException('Availability not found or unauthorized');
    }

    const appointmentExists = await this.appointmentRepo.count({
      where: {
        date,
        time_slot: {
          availability: { id: availability_id },
        },
      },
      relations: ['time_slot', 'time_slot.availability'],
    });

    if (appointmentExists > 0) {
      throw new ConflictException('Cannot add slot, appointment exists in session');
    }

    const slotDuration = this.calculateDurationInMinutes(start_time, end_time);
    const reportingTime = this.calculateReportingTime(start_time, slotDuration / patients_per_slot);

    const slot = this.slotRepo.create({
      availability,
      date,
      start_time,
      end_time,
      is_available: true,
      slot_duration: slotDuration,
      patients_per_slot,
      reporting_time: reportingTime,
    });

    await this.slotRepo.save(slot);
    return { message: 'Slot created', slot };
  }

  async updateSlot(
    doctorId: number,
    availabilityId: number,
    slotId: number,
    dto: CreateManualSlotDto,
  ) {
    const slot = await this.slotRepo.findOne({
      where: { id: slotId },
      relations: ['availability', 'availability.doctor'],
    });

    if (!slot || slot.availability.id !== availabilityId || slot.availability.doctor.id !== doctorId) {
      throw new NotFoundException('Slot not found or unauthorized');
    }

    const appointmentExists = await this.appointmentRepo.count({
      where: { time_slot: { id: slotId } },
      relations: ['time_slot'],
    });

    if (appointmentExists > 0) {
      throw new ConflictException(
        'You cannot modify this slot because an appointment is already booked in this session.',
      );
    }

    const slotDuration = this.calculateDurationInMinutes(dto.start_time, dto.end_time);
    const reportingTime = this.calculateReportingTime(dto.start_time, slotDuration / dto.patients_per_slot);

    Object.assign(slot, {
      start_time: dto.start_time,
      end_time: dto.end_time,
      date: dto.date,
      patients_per_slot: dto.patients_per_slot,
      slot_duration: slotDuration,
      reporting_time: reportingTime,
    });

    await this.slotRepo.save(slot);
    return { message: 'Slot updated successfully', slot };
  }

  async deleteSlot(doctorId: number, availabilityId: number, slotId: number) {
    const slot = await this.slotRepo.findOne({
      where: { id: slotId },
      relations: ['availability', 'availability.doctor'],
    });

    if (!slot || slot.availability.id !== availabilityId || slot.availability.doctor.id !== doctorId) {
      throw new NotFoundException('Slot not found or unauthorized');
    }

    const appointmentExists = await this.appointmentRepo.count({
      where: { time_slot: { id: slotId } },
      relations: ['time_slot'],
    });

    if (appointmentExists > 0) {
      throw new ConflictException(
        'You cannot delete this slot because an appointment is already booked in this session.',
      );
    }

    await this.slotRepo.remove(slot);
    return { message: 'Slot deleted successfully' };
  }

  private calculateDurationInMinutes(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  }

  private calculateReportingTime(start: string, interval: number): string {
    const [h, m] = start.split(':').map(Number);
    const totalMin = h * 60 + m + interval;
    const hr = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
}
