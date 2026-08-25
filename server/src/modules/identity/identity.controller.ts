import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { CoreDataService } from '../../common/core-data.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('users')
@UseGuards(AuthGuard)
export class IdentityController {
  constructor(@Inject(CoreDataService) private readonly coreData: CoreDataService) {}

  @Get(':userId/identity')
  getIdentity(@Param('userId') userId: string) {
    return this.coreData.getIdentityBundle(userId);
  }
}
