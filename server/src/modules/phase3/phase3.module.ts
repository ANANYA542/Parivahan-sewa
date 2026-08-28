import { Module } from '@nestjs/common';
import { CoreDataModule } from '../../common/core-data.module.js';
import { MobilityIntelligenceModule } from '../mobility-intelligence/mobility-intelligence.module.js';
import { AgentService } from './agent.service.js';
import { ComplianceService } from './compliance.service.js';
import { Phase3Controller } from './phase3.controller.js';

@Module({
  imports: [CoreDataModule, MobilityIntelligenceModule],
  controllers: [Phase3Controller],
  providers: [AgentService, ComplianceService]
})
export class Phase3Module {}
