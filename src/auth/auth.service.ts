import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DoctorSignupDto, PatientSignupDto, SigninDto } from './auth.dto';
import { Doctor } from '../users/doctor.entity';
import { Patient } from '../users/patient.entity';

@Injectable()
export class AuthService {
constructor(
@InjectRepository(Doctor)
private doctorRepo: Repository<Doctor>,
@InjectRepository(Patient)
private patientRepo: Repository<Patient>,
private jwtService: JwtService,
private config: ConfigService,
) {}

// Doctor Signup
async signupDoctor(dto: DoctorSignupDto) {
const existing = await this.doctorRepo.findOne({ where: { email: dto.email } });
if (existing) throw new UnauthorizedException('Email already registered');
const hashed = await bcrypt.hash(dto.password, 10);
const doctor = this.doctorRepo.create({ ...dto, password: hashed });
await this.doctorRepo.save(doctor);

return this.getTokens(doctor.id, doctor.email);
}

// Patient Signup
async signupPatient(dto: PatientSignupDto) {
const existing = await this.patientRepo.findOne({ where: { email: dto.email } });
if (existing) throw new UnauthorizedException('Email already registered');
const hashed = await bcrypt.hash(dto.password, 10);
const patient = this.patientRepo.create({ ...dto, password: hashed });
await this.patientRepo.save(patient);

return this.getTokens(patient.id, patient.email);
}

// Doctor Signin
async signinDoctor(dto: SigninDto) {
const doctor = await this.doctorRepo.findOne({ where: { email: dto.email } });
if (!doctor || !(await bcrypt.compare(dto.password, doctor.password))) {
throw new UnauthorizedException('Invalid credentials');
}
return this.getTokens(doctor.id, doctor.email);
}

// Patient Signin
async signinPatient(dto: SigninDto) {
const patient = await this.patientRepo.findOne({ where: { email: dto.email } });
if (!patient || !(await bcrypt.compare(dto.password, patient.password))) {
throw new UnauthorizedException('Invalid credentials');
}
return this.getTokens(patient.id, patient.email);
}

// Doctor Signout
async signoutDoctor(doctorId: number) {
await this.doctorRepo.update(doctorId, { refreshToken: null });
return { message: 'Doctor signed out successfully' };
}

// Patient Signout
async signoutPatient(patientId: number) {
await this.patientRepo.update(patientId, { refreshToken: null });
return { message: 'Patient signed out successfully' };
}

// Refresh Tokens (common)
async refreshTokens(userId: number, email: string, role: string) {
if (role === 'doctor') {
return this.getTokens(userId, email, 'doctor');
} else if (role === 'patient') {
return this.getTokens(userId, email, 'patient');
} else {
throw new UnauthorizedException('Invalid role for refresh');
}
}

// Token generator
private async getTokens(userId: number, email: string, role: 'doctor' | 'patient' = 'doctor') {
const accessToken = await this.jwtService.signAsync(
{ sub: userId, email },
{
secret: this.config.get<string>('JWT_ACCESS_SECRET'),
expiresIn: this.config.get<string>('ACCESS_TOKEN_EXPIRY', '3600s'),
},
);
const refreshToken = await this.jwtService.signAsync(
  { sub: userId, email },
  {
    secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    expiresIn: this.config.get<string>('REFRESH_TOKEN_EXPIRY', '7d'),
  },
);

if (role === 'doctor') {
  await this.doctorRepo.update(userId, { refreshToken });
} else {
  await this.patientRepo.update(userId, { refreshToken });
}

return {
  accessToken,
  refreshToken,
  message: `${role} tokens generated`,
};
}}