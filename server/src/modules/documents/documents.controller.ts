import { Controller, ForbiddenException, Get, Inject, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { CoreDataService } from '../../common/core-data.service.js';
import { DocumentsService } from './documents.service.js';

@Controller('cases/:caseId/document')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(
    @Inject(CoreDataService) private readonly coreData: CoreDataService,
    @Inject(DocumentsService) private readonly documentsService: DocumentsService
  ) {}

  @Get()
  async downloadAcknowledgement(@Param('caseId') caseId: string, @CurrentUserId() userId: string, @Res() res: Response) {
    const caseDetail = this.coreData.getCase(caseId);
    if (caseDetail.userId !== userId) {
      throw new ForbiddenException('This case does not belong to the requesting user.');
    }

    const { bytes, filename } = await this.documentsService.generateCaseDocument(caseDetail);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(bytes));
  }
}
