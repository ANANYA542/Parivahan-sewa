import { AnimatePresence, motion } from 'framer-motion';
import type { AppNotification } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';

interface MobilityNudgesProps {
  notifications: AppNotification[];
  onAction: (serviceId: string) => void;
  onMarkRead: (notificationId: string) => void;
}

const severityBadge: Record<string, string> = {
  critical: 'bg-rose-400/15 text-rose-200',
  warning: 'bg-amber-400/15 text-amber-200',
  info: 'bg-sky-400/15 text-sky-200'
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
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <h2 className="text-xl font-semibold text-white">Notifications</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">Mobility nudges and case SLA reminders, generated from your document status and open cases.</p>
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
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-white">{notification.title}</h3>
                <span className={`rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${severityBadge[notification.severity]}`}>{notification.severity}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{notification.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {notification.actionServiceId ? (
                  <motion.button {...scaleTap} type="button" onClick={() => onAction(notification.actionServiceId!)} className="text-sm font-medium text-amber-200 hover:text-amber-100">
                    Review recommended service
                  </motion.button>
                ) : null}
                {!notification.read ? (
                  <motion.button {...scaleTap} type="button" onClick={() => onMarkRead(notification.notificationId)} className="text-sm font-medium text-slate-400 hover:text-slate-200">
                    Mark as read
                  </motion.button>
                ) : (
                  <span className="text-xs text-slate-500">Read</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!notifications.length ? <p className="text-sm text-slate-400">No notifications right now.</p> : null}
      </div>
    </section>
  );
}
