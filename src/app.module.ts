import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AppController } from './app.controller';

@Module({
imports: [
ConfigModule.forRoot({ isGlobal: true }),
TypeOrmModule.forRoot({
type: 'sqlite',
database: process.env.DB_NAME || 'database.sqlite',
entities: [__dirname + '/**/*.entity{.ts,.js}'],
synchronize: true,
}),
AuthModule,
UsersModule,
AppointmentsModule,
],
controllers: [AppController], // 👈 Add this line
})
export class AppModule {}