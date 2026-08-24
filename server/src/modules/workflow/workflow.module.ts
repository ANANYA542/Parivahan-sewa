import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller.js';
import { ServiceCatalogController } from './service-catalog.controller.js';

@Module({ controllers: [WorkflowController, ServiceCatalogController] })
export class WorkflowModule {}
