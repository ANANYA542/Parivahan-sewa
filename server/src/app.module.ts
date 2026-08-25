import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { IntentModule } from './modules/intent/intent.module.js';
import { WorkflowModule } from './modules/workflow/workflow.module.js';
import { CasesModule } from './modules/cases/cases.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { MobilityIntelligenceModule } from './modules/mobility-intelligence/mobility-intelligence.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CoreDataModule } from './common/core-data.module.js';
import { Phase3Module } from './modules/phase3/phase3.module.js';

@Module({
  imports: [
    CoreDataModule,
    AuthModule,
    HealthModule,
    IdentityModule,
    IntentModule,
    WorkflowModule,
    CasesModule,
    NotificationsModule,
    MobilityIntelligenceModule,
    DocumentsModule,
    Phase3Module
  ]
})
export class AppModule {}
