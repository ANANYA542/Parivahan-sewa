import { Controller, Get, Inject, Param } from '@nestjs/common';
import { MobilityIntelligenceService } from '../mobility-intelligence/mobility-intelligence.service.js';

@Controller('users/:userId/notifications')
export class NotificationsController {
  constructor(@Inject(MobilityIntelligenceService) private readonly mobilityIntelligence: MobilityIntelligenceService) {}

  @Get()
  listNudges(@Param('userId') userId: string) {
    return this.mobilityIntelligence.getNudges(userId);
  }
}
