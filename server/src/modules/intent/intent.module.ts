import { Module } from '@nestjs/common';
import { IntentController } from './intent.controller.js';

@Module({ controllers: [IntentController] })
export class IntentModule {}
