import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { DoctorAvailability } from './doctor_availability.entity';

@Entity()
export class DoctorTimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  start_time: string;

  @Column()
  end_time: string;

  @Column({ default: true })
  is_available: boolean;

  @ManyToOne(() => DoctorAvailability, (availability) => availability.slots)
  availability: DoctorAvailability;
}