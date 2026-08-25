import { Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
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

  @Post('mobility-intelligence/refresh')
  refreshSnapshot(@Param('userId') userId: string) {
    return this.mobilityIntelligence.refreshUser(userId);
  }

  @Get('mobility-map')
  getMap(@Param('userId') userId: string) {
    const snapshot = this.mobilityIntelligence.getSnapshot(userId);
    return { userId: snapshot.userId, computedAt: snapshot.computedAt, layers: snapshot.mapLayers };
  }
}
