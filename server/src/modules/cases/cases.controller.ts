import { Body, Controller, ForbiddenException, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { CoreDataService } from '../../common/core-data.service.js';
import { validateBody } from '../../common/validate-body.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { CreateCaseDto } from './dto/create-case.dto.js';

@Controller()
@UseGuards(AuthGuard)
export class CasesController {
  constructor(@Inject(CoreDataService) private readonly coreData: CoreDataService) {}

  @Get('users/:userId/cases')
  listCases(@Param('userId') userId: string) {
    return this.coreData.listCases(userId);
  }

  @Get('cases/:caseId')
  async getCase(@Param('caseId') caseId: string, @CurrentUserId() userId: string) {
    const caseDetail = await this.coreData.getCase(caseId);
    if (caseDetail.userId !== userId) {
      throw new ForbiddenException('This case does not belong to the requesting user.');
    }
    return caseDetail;
  }

  @Post('cases')
  createCase(@Body(validateBody(CreateCaseDto)) body: CreateCaseDto, @CurrentUserId() userId: string) {
    // The authenticated session owns every case it creates — a client-supplied
    // userId in the body is never trusted, even if it matches by coincidence.
    return this.coreData.createCase({ ...body, userId });
  }

  @Post('cases/:caseId/escalate')
  async escalate(@Param('caseId') caseId: string, @CurrentUserId() userId: string) {
    await this.coreData.escalateCase(caseId, userId);
    return this.coreData.getCase(caseId);
  }
}
