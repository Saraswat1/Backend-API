import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Doctor } from './doctor.entity';
import { DoctorAvailability } from './doctor_availability.entity';
import { DoctorTimeSlot } from './doctor_time_slot.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    @InjectRepository(DoctorAvailability)
    private readonly availabilityRepo: Repository<DoctorAvailability>,

    @InjectRepository(DoctorTimeSlot)
    private readonly slotRepo: Repository<DoctorTimeSlot>,
  ) {}

  async createAvailability(doctorId: number, dto: CreateAvailabilityDto) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const existing = await this.availabilityRepo.findOne({
      where: { doctor: { id: doctorId }, date: dto.date },
    });

    if (existing) {
      throw new Error('Availability for this date already exists.');
    }

    const availability = this.availabilityRepo.create({
      doctor,
      date: dto.date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      weekdays: dto.weekdays,
      session: dto.session,
    });
    await this.availabilityRepo.save(availability);

    // Generate 30-minute time slots
    const start = new Date(`2000-01-01T${dto.start_time}`);
    const end = new Date(`2000-01-01T${dto.end_time}`);
    const slots: DoctorTimeSlot[] = [];

    while (start < end) {
      const slotEnd = new Date(start.getTime() + 30 * 60000); // 30 min
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

    if (date) query.andWhere('availability.date = :date', { date });
    if (session) query.andWhere('availability.session = :session', { session });

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
    if (query.name) where.name = Like(`%${query.name}%`);
    if (query.specialization) where.specialization = Like(`%${query.specialization}%`);

    return this.doctorRepo.find({ where });
  }
}
