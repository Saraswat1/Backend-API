import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { DoctorAvailability } from './doctor_availability.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class DoctorTimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  start_time: string;

  @Column()
  end_time: string;

  @Column()
  date: string;

  @Column()
  slot_duration: number;

  @Column()
  reporting_time: string;

  @Column()
  patients_per_slot: number;

  @Column({ default: true })
  is_available: boolean;

  @ManyToOne(() => DoctorAvailability, (availability) => availability.slots, {
    onDelete: 'CASCADE',
  })
  availability: DoctorAvailability;

  @OneToMany(() => Appointment, (appointment) => appointment.time_slot)
  appointments: Appointment[];
}
