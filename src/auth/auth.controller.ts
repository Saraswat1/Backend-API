import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  DoctorSignupDto,
  PatientSignupDto,
  SigninDto,
} from './auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

interface JwtPayload {
  sub: number;
  email: string;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: any) {
    if (!dto.role) {
      throw new BadRequestException('Role is required');
    }

    if (dto.role === 'doctor') {
      const doctorDto = plainToInstance(DoctorSignupDto, dto);
      await validateOrReject(doctorDto); // ✅ validate doctor fields
      return this.authService.signupDoctor(doctorDto);
    } else if (dto.role === 'patient') {
      const patientDto = plainToInstance(PatientSignupDto, dto);
      await validateOrReject(patientDto); // ✅ validate patient fields
      return this.authService.signupPatient(patientDto);
    } else {
      throw new UnauthorizedException('Invalid role');
    }
  }

  @Post('signin')
  async signin(@Body() dto: SigninDto) {
    const { role } = dto;
    if (!role) {
      throw new BadRequestException('Role is required');
    }

    if (role === 'doctor') {
      return this.authService.signinDoctor(dto);
    } else if (role === 'patient') {
      return this.authService.signinPatient(dto);
    } else {
      throw new UnauthorizedException('Invalid role');
    }
  }

  @Post('signout')
  @UseGuards(AuthGuard('jwt'))
  async signout(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const role = req.headers['user-role'];
    if (!user?.sub || !role) {
      throw new UnauthorizedException('Invalid signout request');
    }

    if (role === 'doctor') {
      return this.authService.signoutDoctor(user.sub);
    } else if (role === 'patient') {
      return this.authService.signoutPatient(user.sub);
    } else {
      throw new UnauthorizedException('Invalid user role');
    }
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const role = req.headers['user-role'];
    if (!user?.sub || !user?.email || !role) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    return this.authService.refreshTokens(user.sub, user.email, role as string);
  }
}
