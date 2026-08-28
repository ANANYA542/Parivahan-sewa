import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'Parivahan Track API',
      status: 'online',
      version: 'v1',
      endpoints: {
        health: '/v1/health',
        services: '/v1/services',
        demoUsers: '/v1/auth/demo-users'
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}
