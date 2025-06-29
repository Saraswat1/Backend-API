import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { DoctorTimeSlot } from './doctor_time_slot.entity';

@Entity()
export class DoctorAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string;

  @Column()
  start_time: string;

  @Column()
  end_time: string;

  @Column()
  weekdays: string;

  @Column()
  session: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilities)
  doctor: Doctor;

  @OneToMany(() => DoctorTimeSlot, (slot) => slot.availability, {
    cascade: true,
  })
  slots: DoctorTimeSlot[];
}
