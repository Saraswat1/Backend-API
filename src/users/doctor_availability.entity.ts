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

@Column({ nullable: true })
booking_start_time: string;

@Column({ nullable: true })
booking_end_time: string;

@ManyToOne(() => Doctor, (doctor) => doctor.availabilities)
doctor: Doctor;

@OneToMany(() => DoctorTimeSlot, (slot) => slot.availability, {
cascade: true,
})
slots: DoctorTimeSlot[];

@Column({ nullable: true })
patients_per_slot: number;

@Column({ nullable: true })
slot_duration: number;

}

