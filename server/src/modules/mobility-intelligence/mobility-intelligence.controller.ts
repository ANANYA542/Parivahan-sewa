import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { MobilityIntelligenceService } from './mobility-intelligence.service.js';

@Controller('users/:userId')
@UseGuards(AuthGuard)
export class MobilityIntelligenceController {
  constructor(@Inject(MobilityIntelligenceService) private readonly mobilityIntelligence: MobilityIntelligenceService) {}

  @Get('mobility-intelligence')
  getSnapshot(@Param('userId') userId: string) {
    return this.mobilityIntelligence.getSnapshot(userId);
  }
}
