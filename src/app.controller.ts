import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'NestJS Boilerplate is running!',
      users: ['Ali', 'Ahmed']
    };
  }
}