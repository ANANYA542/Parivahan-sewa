import { Module } from '@nestjs/common';
import { MobilityIntelligenceModule } from '../mobility-intelligence/mobility-intelligence.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [MobilityIntelligenceModule],
  controllers: [NotificationsController],
  providers: [NotificationsService]
})
export class NotificationsModule {}
