import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { DoctorTimeSlot } from '../users/doctor_time_slot.entity';
import { Patient } from '../users/patient.entity';
import { Doctor } from '../users/doctor.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, { eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => DoctorTimeSlot, { eager: true })
  @JoinColumn({ name: 'time_slot_id' })
  time_slot: DoctorTimeSlot;

  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column()
  date: string;

  @Column()
  reporting_time: string;

  @CreateDateColumn()
  created_at: Date;
}
