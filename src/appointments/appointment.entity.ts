import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { DoctorTimeSlot } from '../users/doctor_time_slot.entity';
import { Patient } from '../users/patient.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DoctorTimeSlot, { eager: true })
  time_slot: DoctorTimeSlot;

  @ManyToOne(() => Patient, { eager: true })
  patient: Patient;

  @Column()
  date: string;
}
