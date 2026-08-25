import { Global, Module } from '@nestjs/common';
import { CoreDataService } from './core-data.service.js';

@Global()
@Module({
  providers: [CoreDataService],
  exports: [CoreDataService]
})
export class CoreDataModule {}
