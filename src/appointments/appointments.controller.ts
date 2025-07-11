import {
Controller,
Post,
Body,
UseGuards,
Req,
Get,
UnauthorizedException,
Param,
Patch,
ParseIntPipe,
Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from '../users/dto/create-appointment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1/appointments')
export class AppointmentsController {
constructor(private readonly appointmentsService: AppointmentsService) {}

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
return this.appointmentsService.getAppointmentsByUser(userId, role);
}

@UseGuards(AuthGuard('jwt'))
@Patch('cancel/:id')
async cancelAppointment(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
const userId = req.user.userId;
const role = req.user.role;
return this.appointmentsService.cancelAppointment(id, userId, role);
}

@UseGuards(AuthGuard('jwt'))
@Get('filter')
async filterAppointments(
@Query('type') type: 'upcoming' | 'past' | 'cancelled',
@Req() req: any,
) {
const userId = req.user.userId;
const role = req.user.role;
if (role !== 'patient') {
  throw new UnauthorizedException('Only patients can filter by appointment status');
}

return this.appointmentsService.getAppointmentsByStatus(userId, type);
}

@UseGuards(AuthGuard('jwt'))
@Patch('reschedule-all')
async rescheduleAll(@Body('shift_minutes') shift_minutes: number, @Req() req: any) {
if (req.user.role !== 'doctor') {
throw new UnauthorizedException('Only doctors can reschedule appointments');
}
return this.appointmentsService.rescheduleAllFutureAppointments(req.user.userId, shift_minutes);
}

@UseGuards(AuthGuard('jwt'))
@Patch('reschedule-selected')
async rescheduleSelected(
@Body() body: { appointment_ids: number[]; shift_minutes: number },
@Req() req: any,
) {
if (req.user.role !== 'doctor') {
throw new UnauthorizedException('Only doctors can reschedule appointments');
}
return this.appointmentsService.rescheduleSelectedAppointments(
  req.user.userId,
  body.appointment_ids,
  body.shift_minutes,
);
}
}
