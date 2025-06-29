import { IsEmail, IsNotEmpty, MinLength, ValidateIf } from 'class-validator';

export class DoctorSignupDto {
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  specialization!: string;

  role: 'doctor';
}

export class PatientSignupDto {
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  role: 'patient';
}

export class SigninDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  role!: 'doctor' | 'patient';
}
