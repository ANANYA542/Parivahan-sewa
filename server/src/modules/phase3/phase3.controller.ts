import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { AgentService } from './agent.service.js';
import { ComplianceService } from './compliance.service.js';
import { AgentQueryDto } from './dto/agent-query.dto.js';
import { VoiceTranscriptionDto } from './dto/voice-transcription.dto.js';
import { VoiceService } from './voice.service.js';

@Controller()
@UseGuards(AuthGuard)
export class Phase3Controller {
  constructor(
    @Inject(AgentService) private readonly agent: AgentService,
    @Inject(ComplianceService) private readonly compliance: ComplianceService,
    @Inject(VoiceService) private readonly voice: VoiceService
  ) {}

  @Post('users/:userId/standing-agent')
  chat(@Param('userId') userId: string, @Body() body: AgentQueryDto) {
    return this.agent.respond(userId, body.message, body.history ?? [], body.sessionId);
  }

  @Get('users/:userId/compliance')
  complianceSnapshot(@Param('userId') userId: string) {
    return this.compliance.getSnapshot(userId);
  }

  @Get('cases/:caseId/challan-verification')
  verifyChallan(@Param('caseId') caseId: string) {
    return this.compliance.verifyChallan(caseId);
  }

  @Post('voice/transcribe')
  transcribe(@Body() body: VoiceTranscriptionDto) {
    return this.voice.transcribe(body);
  }
}
