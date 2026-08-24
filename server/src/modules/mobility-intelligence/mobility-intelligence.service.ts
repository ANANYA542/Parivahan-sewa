import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  buildComplianceAlerts,
  buildMobilityMapLayers,
  buildMobilityNudges,
  computeMobilityScore,
  type MobilityIntelligenceSnapshot,
  type MobilityNudge
} from '@parivahan/shared';
import { CoreDataService } from '../../common/core-data.service.js';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class MobilityIntelligenceService implements OnModuleInit, OnModuleDestroy {
  private readonly snapshots = new Map<string, MobilityIntelligenceSnapshot>();
  private refreshTimer?: NodeJS.Timeout;

  constructor(@Inject(CoreDataService) private readonly coreData: CoreDataService) {}

  onModuleInit() {
    void this.refreshAll();
    this.refreshTimer = setInterval(() => void this.refreshAll(), REFRESH_INTERVAL_MS);
    this.refreshTimer.unref();
  }

  onModuleDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  getSnapshot(userId: string): MobilityIntelligenceSnapshot {
    return this.refreshUser(userId);
  }

  getNudges(userId: string): MobilityNudge[] {
    return this.getSnapshot(userId).nudges;
  }

  refreshUser(userId: string): MobilityIntelligenceSnapshot {
    const bundle = this.coreData.getIdentityBundle(userId);
    const score = computeMobilityScore(bundle);
    const complianceAlerts = buildComplianceAlerts(bundle);
    const snapshot: MobilityIntelligenceSnapshot = {
      userId,
      computedAt: new Date().toISOString(),
      score,
      complianceAlerts,
      nudges: buildMobilityNudges(bundle, score, complianceAlerts),
      mapLayers: buildMobilityMapLayers(bundle)
    };

    this.snapshots.set(userId, snapshot);
    return structuredClone(snapshot);
  }

  private async refreshAll() {
    for (const userId of this.coreData.listUserIds()) {
      this.refreshUser(userId);
    }
  }
}
