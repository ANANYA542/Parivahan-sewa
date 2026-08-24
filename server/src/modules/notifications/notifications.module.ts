import { Module } from '@nestjs/common';
import { MobilityIntelligenceModule } from '../mobility-intelligence/mobility-intelligence.module.js';
import { NotificationsController } from './notifications.controller.js';

@Module({
  imports: [MobilityIntelligenceModule],
  controllers: [NotificationsController]
})
export class NotificationsModule {}
