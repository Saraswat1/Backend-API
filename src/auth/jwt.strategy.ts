import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Define the correct shape of your JWT payload
interface JwtPayload {
sub: number;
email: string;
role: 'doctor' | 'patient';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
constructor(configService: ConfigService) {
super({
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'fallbackSecret', // fallback ensures it's always a string
});
}

async validate(payload: JwtPayload): Promise<{ userId: number; email: string; role: string }> {
return {
userId: payload.sub,
email: payload.email,
role: payload.role,
};
}
}