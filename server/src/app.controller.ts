import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'Parivahan Track API',
      status: 'online',
      version: 'v1',
      health: '/v1/health',
      timestamp: new Date().toISOString()
    };
  }
}
