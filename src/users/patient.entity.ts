import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Patient {
@PrimaryGeneratedColumn()
id: number;

@Column()
name: string;

@Column({ unique: true })
email: string;

@Column()
password: string;

@Column({ type: 'text', nullable: true })
refreshToken: string | null; // ✅ allow null here
}