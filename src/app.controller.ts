import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
@Get()
getRoot(): string {
return '🚀 Welcome to the Doctor-Patient API! ✅';
}
}