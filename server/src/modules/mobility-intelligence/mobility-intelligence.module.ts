import { Module } from '@nestjs/common';
import { MobilityIntelligenceController } from './mobility-intelligence.controller.js';
import { MobilityIntelligenceService } from './mobility-intelligence.service.js';

@Module({
  controllers: [MobilityIntelligenceController],
  providers: [MobilityIntelligenceService],
  exports: [MobilityIntelligenceService]
})
export class MobilityIntelligenceModule {}
