import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { CoreDataService } from '../../common/core-data.service.js';
import { validateBody } from '../../common/validate-body.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RegisterVehicleDto } from './dto/register-vehicle.dto.js';

@Controller('users')
@UseGuards(AuthGuard)
export class IdentityController {
  constructor(@Inject(CoreDataService) private readonly coreData: CoreDataService) {}

  @Get(':userId/identity')
  getIdentity(@Param('userId') userId: string) {
    return this.coreData.getIdentityBundle(userId);
  }

  @Post(':userId/vehicles')
  registerVehicle(@Param('userId') userId: string, @Body(validateBody(RegisterVehicleDto)) body: RegisterVehicleDto) {
    return this.coreData.registerVehicle({ ownerId: userId, ...body });
  }
}
