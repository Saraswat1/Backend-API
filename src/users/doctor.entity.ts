import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { DoctorAvailability } from './doctor_availability.entity';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  specialization!: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string | null;
  @Column({ type: 'text', default: 'stream' })
  schedule_type: 'stream' | 'wave';


  @OneToMany(() => DoctorAvailability, (availability) => availability.doctor)
  availabilities!: DoctorAvailability[];
}
