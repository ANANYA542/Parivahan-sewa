import { Controller, Get, Param } from '@nestjs/common';
import { CoreDataService } from '../../common/core-data.service.js';

@Controller('users')
export class IdentityController {
  constructor(private readonly coreData: CoreDataService) {}

  @Get(':userId/identity')
  getIdentity(@Param('userId') userId: string) {
    return this.coreData.getIdentityBundle(userId);
  }
}
