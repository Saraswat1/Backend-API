import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UpdateScheduleTypeDto } from './dto/update-schedule-type.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateManualSlotDto } from './dto/create-manual-slot.dto';

@Controller('api/v1/doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.doctorService.findAllDoctors(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.findDoctorById(id);
  }

  @Post(':id/availability')
  @UseGuards(AuthGuard('jwt'))
  createAvailability(
    @Param('id', ParseIntPipe) doctorId: number,
    @Body() dto: CreateAvailabilityDto,
    @Req() req: Request,
  ) {
    return this.doctorService.createAvailability(doctorId, dto);
  }

  @Get(':id/availability')
  @UseGuards(AuthGuard('jwt'))
  getAvailability(
    @Param('id', ParseIntPipe) doctorId: number,
    @Query('date') date?: string,
    @Query('session') session?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.doctorService.getAvailability(doctorId, {
      date,
      session,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Patch(':id/schedule-type')
  @UseGuards(AuthGuard('jwt'))
  updateScheduleType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleTypeDto,
  ) {
    return this.doctorService.updateScheduleType(id, dto.stream_type);
  }

  @Patch(':doctorId/availability/:availabilityId')
@UseGuards(AuthGuard('jwt'))
async updateAvailability(
  @Param('doctorId', ParseIntPipe) doctorId: number,
  @Param('availabilityId', ParseIntPipe) availabilityId: number,
  @Body() dto: CreateAvailabilityDto,
  @Req() req: Request
) {
  return this.doctorService.updateAvailability(doctorId, availabilityId, dto);
}


 @Delete(':doctorId/availability/:availabilityId')
@UseGuards(AuthGuard('jwt'))
deleteAvailability(
  @Param('doctorId', ParseIntPipe) doctorId: number,
  @Param('availabilityId', ParseIntPipe) availabilityId: number,
  @Req() req: Request
) {
  return this.doctorService.deleteAvailability(doctorId, availabilityId);
}
@Post(':id/manual-slot')
@UseGuards(AuthGuard('jwt'))
createManualSlot(
  @Param('id', ParseIntPipe) doctorId: number,
  @Body() dto: CreateManualSlotDto
) {
  return this.doctorService.addManualSlot(doctorId, dto); // ✅ Pass both arguments
}
@Patch(':doctorId/availability/:availabilityId/slots/:slotId')
@UseGuards(AuthGuard('jwt'))
updateSlot(
  @Param('doctorId', ParseIntPipe) doctorId: number,
  @Param('availabilityId', ParseIntPipe) availabilityId: number,
  @Param('slotId', ParseIntPipe) slotId: number,
  @Body() dto: CreateManualSlotDto,
  @Req() req: Request
) {
  return this.doctorService.updateSlot(doctorId, availabilityId, slotId, dto);
}

@Delete(':doctorId/availability/:availabilityId/slots/:slotId')
@UseGuards(AuthGuard('jwt'))
deleteSlot(
  @Param('doctorId', ParseIntPipe) doctorId: number,
  @Param('availabilityId', ParseIntPipe) availabilityId: number,
  @Param('slotId', ParseIntPipe) slotId: number,
  @Req() req: Request
) {
  return this.doctorService.deleteSlot(doctorId, availabilityId, slotId);
}



}
