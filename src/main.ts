import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
const app = await NestFactory.create(AppModule);
app.useGlobalPipes(
new ValidationPipe({
whitelist: true, // removes properties not in DTO
forbidNonWhitelisted: true, // throws if unknown properties present
transform: true, // transforms payload to DTO class instances
}),
);
await app.listen(3000);
}
bootstrap();