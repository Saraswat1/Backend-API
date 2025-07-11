import {
Injectable,
ConflictException,
NotFoundException,
ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { Appointment } from './appointment.entity';
import { DoctorTimeSlot } from '../users/doctor_time_slot.entity';
import { CreateAppointmentDto } from '../users/dto/create-appointment.dto';
import { Patient } from '../users/patient.entity';
import { Doctor } from '../users/doctor.entity';
import { In } from 'typeorm';


@Injectable()
export class AppointmentsService {
constructor(
@InjectRepository(Appointment)
private appointmentRepo: Repository<Appointment>,
@InjectRepository(DoctorTimeSlot)
private timeSlotRepo: Repository<DoctorTimeSlot>,
@InjectRepository(Patient)
private patientRepo: Repository<Patient>,
@InjectRepository(Doctor)
private doctorRepo: Repository<Doctor>,
) {}

async bookAppointment(patientId: number, dto: CreateAppointmentDto) {
const doctor = await this.doctorRepo.findOne({
where: { id: dto.doctor_id },
});
if (!doctor) throw new NotFoundException('Doctor not found');
const slot = await this.timeSlotRepo.findOne({
  where: {
    id: dto.slot_id,
    availability: {
      doctor: { id: dto.doctor_id },
    },
  },
  relations: ['availability', 'availability.doctor'],
});

if (!slot) throw new NotFoundException('Slot not found');

const existingAppointments = await this.appointmentRepo.find({
  where: {
    patient: { id: patientId },
    doctor: { id: dto.doctor_id },
    date: dto.date,
  },
  relations: [
    'time_slot',
    'time_slot.availability',
    'time_slot.availability.doctor',
    'doctor',
    'patient',
  ],
});

const hasSameSessionBooked = existingAppointments.some(
  app =>
    app.status === 'booked' &&
    app.time_slot?.availability?.session === slot.availability.session &&
    app.time_slot?.availability?.date === slot.availability.date,
);

if (hasSameSessionBooked) {
  throw new ConflictException(
    'You can only book one slot per session per day with this doctor.',
  );
}

const patient = await this.patientRepo.findOne({ where: { id: patientId } });
if (!patient) throw new NotFoundException('Patient not found');

let reportingTime: string;

if (doctor.schedule_type === 'stream') {
  if (!slot.is_available) {
    throw new ConflictException('Slot already booked');
  }

  slot.is_available = false;
  await this.timeSlotRepo.save(slot);
  reportingTime = slot.start_time;
} else {
  const [startH, startM] = slot.start_time.split(':').map(Number);
  const [endH, endM] = slot.end_time.split(':').map(Number);
  const totalMinutes = (endH - startH) * 60 + (endM - startM);

  const maxPatients = slot.patients_per_slot || 3;
  const durationPerPatient = totalMinutes / maxPatients;

  const existingAppointments = await this.appointmentRepo.find({
    where: { time_slot: { id: slot.id } },
    order: { created_at: 'ASC' },
  });

  if (existingAppointments.length >= maxPatients) {
    throw new ConflictException('Wave slot limit reached');
  }

  const reportingOffset = durationPerPatient * existingAppointments.length;
  const reportMinutes = startH * 60 + startM + reportingOffset;
  const reportingHour = Math.floor(reportMinutes / 60);
  const reportingMinute = Math.floor(reportMinutes % 60);

  reportingTime = `${String(reportingHour).padStart(2, '0')}:${String(reportingMinute).padStart(2, '0')}`;
}

const appointment = this.appointmentRepo.create({
  time_slot: slot,
  patient,
  date: dto.date,
  reporting_time: reportingTime,
  doctor,
  status: 'booked',
});

const savedAppointment = await this.appointmentRepo.save(appointment);

return {
  message: 'Appointment booked successfully',
  appointmentDetails: {
    date: savedAppointment.date,
    time: `${slot.start_time} - ${slot.end_time}`,
    reporting_time: reportingTime,
    doctorName: slot.availability.doctor.name,
    specialization: slot.availability.doctor.specialization,
    session: slot.availability.session,
  },
};
}

async cancelAppointment(
appointmentId: number,
userId: number,
role: 'doctor' | 'patient',
) {
const appointment = await this.appointmentRepo.findOne({
where: { id: appointmentId },
relations: ['doctor', 'patient'],
});
if (!appointment) throw new NotFoundException('Appointment not found');
if (
  (role === 'doctor' && appointment.doctor.id !== userId) ||
  (role === 'patient' && appointment.patient.id !== userId)
) {
  throw new ForbiddenException('You are not authorized to cancel this appointment');
}

appointment.status = 'cancelled';
await this.appointmentRepo.save(appointment);

return { message: 'Appointment cancelled successfully' };
}

async getAppointmentsByUser(userId: number, role: 'doctor' | 'patient') {
if (role === 'doctor') {
return this.appointmentRepo
.createQueryBuilder('appointment')
.leftJoinAndSelect('appointment.time_slot', 'slot')
.leftJoinAndSelect('slot.availability', 'availability')
.leftJoinAndSelect('availability.doctor', 'doctor')
.leftJoinAndSelect('appointment.patient', 'patient')
.where('doctor.id = :userId', { userId })
.orderBy('appointment.date', 'ASC')
.getMany();
} else {
return this.appointmentRepo.find({
where: { patient: { id: userId } },
relations: [
'time_slot',
'time_slot.availability',
'time_slot.availability.doctor',
'patient',
],
order: { date: 'ASC' },
});
}
}

async getAppointmentsByStatus(
patientId: number,
status: 'booked' | 'cancelled' | 'past' | 'upcoming',
) {
const today = new Date().toISOString().split('T')[0];
if (status === 'upcoming') {
return this.appointmentRepo.find({
where: {
patient: { id: patientId },
status: 'booked',
date: MoreThanOrEqual(today),
},
relations: ['time_slot', 'time_slot.availability', 'doctor'],
order: { date: 'ASC' },
});
} else if (status === 'past') {
return this.appointmentRepo.find({
where: {
patient: { id: patientId },
status: 'booked',
date: LessThan(today),
},
relations: ['time_slot', 'time_slot.availability', 'doctor'],
order: { date: 'DESC' },
});
} else {
return this.appointmentRepo.find({
where: {
patient: { id: patientId },
status: 'cancelled',
},
relations: ['time_slot', 'time_slot.availability', 'doctor'],
order: { date: 'DESC' },
});
}
}

async rescheduleAllFutureAppointments(doctorId: number, shift_minutes: number) {
if (shift_minutes < 10 || shift_minutes > 180) {
throw new ConflictException('Shift must be between 10 and 180 minutes');
}
const today = new Date().toISOString().split('T')[0];

const appointments = await this.appointmentRepo.find({
  where: {
    doctor: { id: doctorId },
    date: MoreThanOrEqual(today),
    status: 'booked',
  },
});

for (const appt of appointments) {
  const [h, m] = appt.reporting_time.split(':').map(Number);
  const newMinutes = h * 60 + m + shift_minutes;
  const newH = Math.floor(newMinutes / 60);
  const newM = newMinutes % 60;
  appt.reporting_time = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

await this.appointmentRepo.save(appointments);

return { message: 'All future appointments rescheduled successfully' };
}

async rescheduleSelectedAppointments(
doctorId: number,
appointment_ids: number[],
shift_minutes: number,
) {
if (shift_minutes < 10 || shift_minutes > 180) {
throw new ConflictException('Shift must be between 10 and 180 minutes');
}
const appointments = await this.appointmentRepo.find({
  where: { id: In(appointment_ids) },
  relations: ['doctor'],
});

for (const appt of appointments) {
  if (appt.doctor.id !== doctorId || appt.status !== 'booked') continue;
  const [h, m] = appt.reporting_time.split(':').map(Number);
  const newMinutes = h * 60 + m + shift_minutes;
  const newH = Math.floor(newMinutes / 60);
  const newM = newMinutes % 60;
  appt.reporting_time = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

await this.appointmentRepo.save(appointments);

return { message: 'Selected appointments rescheduled successfully' };
}
}
