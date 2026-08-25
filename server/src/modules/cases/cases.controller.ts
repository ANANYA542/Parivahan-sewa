import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CoreDataService } from '../../common/core-data.service.js';
import { CreateCaseDto } from './dto/create-case.dto.js';

@Controller()
export class CasesController {
  constructor(private readonly coreData: CoreDataService) {}

  @Get('users/:userId/cases')
  listCases(@Param('userId') userId: string) {
    return this.coreData.listCases(userId);
  }

  @Get('cases/:caseId')
  getCase(@Param('caseId') caseId: string) {
    return this.coreData.getCase(caseId);
  }

  @Post('cases')
  createCase(@Body() body: CreateCaseDto) {
    return this.coreData.createCase(body);
  }
}
