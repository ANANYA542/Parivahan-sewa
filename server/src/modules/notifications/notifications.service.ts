import { Inject, Injectable } from '@nestjs/common';
import { buildSlaReminders, type AppNotification } from '@parivahan/shared';
import { CoreDataService } from '../../common/core-data.service.js';
import { MobilityIntelligenceService } from '../mobility-intelligence/mobility-intelligence.service.js';

/**
 * The Notification Service the implementation plan calls for: a read/react
 * layer over data the core loop and the mobility intelligence layer already
 * produce — mobility nudges plus SLA-deadline reminders derived straight
 * from the user's own cases. It adds only one thing of its own: read state.
 */
@Injectable()
export class NotificationsService {
  private readonly readIds = new Map<string, Set<string>>();

  constructor(
    @Inject(CoreDataService) private readonly coreData: CoreDataService,
    @Inject(MobilityIntelligenceService) private readonly mobilityIntelligence: MobilityIntelligenceService
  ) {}

  list(userId: string): AppNotification[] {
    const bundle = this.coreData.getIdentityBundle(userId);
    const nudges = this.mobilityIntelligence.getNudges(userId);
    const read = this.readIds.get(userId) ?? new Set<string>();

    const computedAt = new Date().toISOString();
    const fromNudges: AppNotification[] = nudges.map((nudge) => {
      const notificationId = `nudge-${nudge.nudgeId}`;
      const notification: AppNotification = {
        notificationId,
        severity: nudge.severity,
        title: nudge.title,
        message: nudge.message,
        createdAt: computedAt,
        read: read.has(notificationId)
      };
      if (nudge.actionServiceId) notification.actionServiceId = nudge.actionServiceId;
      return notification;
    });

    const slaReminders = buildSlaReminders(bundle).map((reminder) => ({
      ...reminder,
      read: read.has(reminder.notificationId)
    }));

    return [...slaReminders, ...fromNudges].sort((first, second) => {
      if (first.read !== second.read) return first.read ? 1 : -1;
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    });
  }

  markRead(userId: string, notificationId: string): AppNotification[] {
    const current = this.readIds.get(userId) ?? new Set<string>();
    current.add(notificationId);
    this.readIds.set(userId, current);
    return this.list(userId);
  }
}
