import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from '../users/doctor.entity';
import { Patient } from '../users/patient.entity'; // ✅ ADD THIS
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt.refresh.strategy';
import { UsersModule } from '../users/users.module';

@Module({
imports: [
TypeOrmModule.forFeature([Doctor, Patient]), // ✅ Include Patient here
JwtModule.register({}), // Config can be empty if using jwtService.signAsync directly
UsersModule
],
providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
controllers: [AuthController],
})
export class AuthModule {}