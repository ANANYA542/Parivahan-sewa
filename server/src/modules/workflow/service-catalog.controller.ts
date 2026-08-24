import { Controller, Get, Inject } from '@nestjs/common';
import { CoreDataService } from '../../common/core-data.service.js';

@Controller('services')
export class ServiceCatalogController {
  constructor(@Inject(CoreDataService) private readonly coreData: CoreDataService) {}

  @Get()
  listServices() {
    return this.coreData.listServices();
  }
}
