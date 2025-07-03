import {
Controller,
Post,
Body,
UseGuards,
Req,
Get,
UnauthorizedException
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from '../users/dto/create-appointment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1/appointments')
export class AppointmentsController {
constructor(
private readonly appointmentsService: AppointmentsService
) {}

@UseGuards(AuthGuard('jwt'))
@Post()
async book(@Body() dto: CreateAppointmentDto, @Req() req: any) {
const patientId = req.user.userId;
return this.appointmentsService.bookAppointment(patientId, dto);
}

@UseGuards(AuthGuard('jwt'))
@Get('view-appointments')
async viewAppointments(@Req() req: any) {
const userId = req.user.userId;
const role = req.user.role;
if (role !== 'patient' && role !== 'doctor') {
  throw new UnauthorizedException('Invalid user role');
}

return this.appointmentsService.getAppointmentsByUser(
  userId,
  role
);
}}