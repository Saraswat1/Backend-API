import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
imports: [
// Load environment variables globally
ConfigModule.forRoot({ isGlobal: true }),
  // Connect to SQLite (or switch to Postgres for production on Render)
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: process.env.DB_NAME || 'database.sqlite',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true, // Disable this in production and use migrations
}),

// Custom modules
AuthModule,
UsersModule,
AppointmentsModule,
],
})
export class AppModule {}
