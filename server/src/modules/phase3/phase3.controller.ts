import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { validateBody } from '../../common/validate-body.pipe.js';
import { AgentService } from './agent.service.js';
import { ComplianceService } from './compliance.service.js';
import { AgentQueryDto } from './dto/agent-query.dto.js';

@Controller()
@UseGuards(AuthGuard)
export class Phase3Controller {
  constructor(
    @Inject(AgentService) private readonly agent: AgentService,
    @Inject(ComplianceService) private readonly compliance: ComplianceService
  ) {}

  @Post('users/:userId/standing-agent')
  chat(@Param('userId') userId: string, @Body(validateBody(AgentQueryDto)) body: AgentQueryDto) {
    return this.agent.respond(userId, body.message, body.history ?? [], body.sessionId);
  }

  @Get('users/:userId/compliance')
  complianceSnapshot(@Param('userId') userId: string) {
    return this.compliance.getSnapshot(userId);
  }
}
