import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
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
}
