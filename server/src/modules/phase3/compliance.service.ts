import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ChallanVerification, ComplianceSnapshot, PointsLedger, ScamSignal } from '@parivahan/shared';
import { CoreDataService } from '../../common/core-data.service.js';

const ECHALLAN_URL = 'https://echallan.parivahan.gov.in/';

@Injectable()
export class ComplianceService {
  constructor(@Inject(CoreDataService) private readonly coreData: CoreDataService) {}

  getSnapshot(userId: string): ComplianceSnapshot {
    return {
      pointsLedger: this.getPointsLedger(userId),
      scamSignals: this.getScamSignals(),
      disclaimer: 'Demo intelligence only. Verify challans and payments on the official eChallan portal.'
    };
  }

  getPointsLedger(userId: string): PointsLedger {
    const cases = this.coreData.listCases(userId).filter((item) => item.type === 'challan');
    const entries = cases.map((item) => ({
      caseId: item.caseId,
      points: item.status === 'resolved' ? 0 : 2,
      reason: item.status === 'resolved' ? 'Challan resolved' : 'Open challan record',
      status: item.status === 'resolved' ? 'cleared' as const : 'active' as const
    }));
    return {
      userId,
      activePoints: entries.reduce((total, entry) => total + entry.points, 0),
      entries,
      disclaimer: 'Illustrative safety points, not an official demerit-point record.'
    };
  }

  verifyChallan(caseId: string): ChallanVerification {
    const caseRecord = this.coreData.getCase(caseId);
    if (caseRecord.type !== 'challan') {
      return { caseId, status: 'not_a_challan', message: 'This case is not a challan record.', officialUrl: ECHALLAN_URL, disclaimer: 'Demo check only.' };
    }
    return {
      caseId,
      status: 'unverified',
      message: `We found a local ${caseRecord.status === 'resolved' ? 'resolved' : 'open'} challan case. Confirm its authenticity and payment status on the official portal before acting.`,
      officialUrl: ECHALLAN_URL,
      disclaimer: 'Demo check only. This app does not query government enforcement records.'
    };
  }

  private getScamSignals(): ScamSignal[] {
    return [
      { signalId: 'official-domain', title: 'Use official payment pages only', guidance: 'Open eChallan yourself and verify the URL before entering payment details.', severity: 'warning' },
      { signalId: 'no-urgent-payment', title: 'Treat urgent payment messages with caution', guidance: 'Do not pay from links received by SMS, WhatsApp, or unknown callers.', severity: 'info' }
    ];
  }
}
