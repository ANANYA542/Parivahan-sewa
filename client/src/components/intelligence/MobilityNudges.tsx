import { AnimatePresence, motion } from 'framer-motion';
import type { AppNotification } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';

interface MobilityNudgesProps {
  notifications: AppNotification[];
  onAction: (serviceId: string) => void;
  onMarkRead: (notificationId: string) => void;
}

const severityBadge: Record<string, string> = {
  critical: 'bg-rose-50 text-rose-600',
  warning: 'bg-orange-50 text-orange-700',
  info: 'bg-slate-100 text-slate-600'
};

/**
 * Reads from the Notification Service (`GET /users/:userId/notifications`),
 * which merges mobility nudges with case SLA reminders and tracks read
 * state — a genuine read/react layer over more than one input, not just a
 * re-export of the mobility snapshot. Component name kept as-is to avoid
 * churn elsewhere in the tree; only its data source and interactivity changed.
 */
export function MobilityNudges({ notifications, onAction, onMarkRead }: MobilityNudgesProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Mobility nudges and case SLA reminders, generated from your document status and open cases.</p>
      <div className="mt-5 space-y-3">
        <AnimatePresence initial={false}>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.notificationId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: notification.read ? 0.55 : 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT, delay: index * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-slate-900">{notification.title}</h3>
                <span className={`rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${severityBadge[notification.severity]}`}>{notification.severity}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{notification.message}</p>
              {/* Plain buttons here, not motion.button — these cards live inside a
                  `layout`-animated AnimatePresence list, so a tap gesture on a
                  child while the parent card is mid-reflow (another card being
                  added/removed elsewhere in the list) was observed, under
                  instrumented testing, to occasionally miss its target. These
                  are real actions, not decorative, so reliability wins here —
                  same reasoning already applied to the critical-path buttons
                  in GuidedNavigator. */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {notification.actionServiceId ? (
                  <button type="button" onClick={() => onAction(notification.actionServiceId!)} className="min-h-[1.75rem] text-sm font-medium text-orange-600 hover:text-orange-700">
                    Review recommended service
                  </button>
                ) : null}
                {!notification.read ? (
                  <button type="button" onClick={() => onMarkRead(notification.notificationId)} className="min-h-[1.75rem] text-sm font-medium text-slate-500 hover:text-slate-700">
                    Mark as read
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">Read</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!notifications.length ? <p className="text-sm text-slate-500">No notifications right now.</p> : null}
      </div>
    </section>
  );
}
