import { Global, Module } from '@nestjs/common';
import { CoreDataService } from './core-data.service.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService, CoreDataService],
  exports: [PrismaService, CoreDataService]
})
export class CoreDataModule {}
