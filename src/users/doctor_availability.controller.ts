import {
Controller,
Get,
Post,
Param,
Body,
UseGuards,
Query,
ParseIntPipe,
Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorService } from './doctor.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto'; 
@Controller('api/v1/doctors')
export class DoctorAvailabilityController {
constructor(private readonly doctorService: DoctorService) {}

@UseGuards(AuthGuard('jwt'))
@Post(':id/availability')
async createAvailability(
@Param('id', ParseIntPipe) doctorId: number,
@Body() dto: CreateAvailabilityDto,
) {
return this.doctorService.createAvailability(doctorId, dto);
}

@UseGuards(AuthGuard('jwt'))
@Get(':id/availability')
async getAvailability(
@Param('id', ParseIntPipe) doctorId: number,
@Query('date') date?: string,
@Query('session') session?: string,
@Query('page') page = 1,
@Query('limit') limit = 10,
) {
return this.doctorService.getAvailability(doctorId, {
date,
session,
page: Number(page),
limit: Number(limit),
});
}
}
