import { Body, Controller, Post } from '@nestjs/common';
import { getServiceById, resolveIntent } from '@parivahan/shared';
import { ResolveIntentDto } from './dto/resolve-intent.dto.js';

@Controller('intents')
export class IntentController {
  @Post('resolve')
  resolve(@Body() body: ResolveIntentDto) {
    const intent = resolveIntent(body.query.trim());
    const service = intent.serviceId ? getServiceById(intent.serviceId) : null;

    return { intent, service };
  }
}
