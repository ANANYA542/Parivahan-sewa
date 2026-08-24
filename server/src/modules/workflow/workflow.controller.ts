import { Controller, Get, Inject, Param } from '@nestjs/common';
import { CoreDataService } from '../../common/core-data.service.js';

@Controller('workflows')
export class WorkflowController {
  constructor(@Inject(CoreDataService) private readonly coreData: CoreDataService) {}

  @Get(':serviceId')
  getWorkflow(@Param('serviceId') serviceId: string) {
    return this.coreData.getWorkflow(serviceId);
  }
}
