import { motion } from 'framer-motion';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';
import type { AppRoute } from '../../lib/appRoutes';

interface AppNavigationProps {
  activeRoute: AppRoute;
  userName: string | null;
  unreadCount: number;
  onNavigate: (route: AppRoute) => void;
  onSignOut: () => void;
}

const navigationItems: Array<{ route: AppRoute; label: string }> = [
  { route: 'dashboard', label: 'Dashboard' },
  { route: 'services', label: 'Services' },
  { route: 'journey', label: 'Guided journey' },
  { route: 'cases', label: 'Cases' },
  { route: 'map', label: 'Map' },
  { route: 'alerts', label: 'Alerts' }
];

export function AppNavigation({ activeRoute, userName, unreadCount, onNavigate, onSignOut }: AppNavigationProps) {
  return (
    <header className="sticky top-3 z-20 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/85 shadow-xl shadow-slate-950/25 backdrop-blur-xl">
      <div className="flex h-[3px] w-full" aria-hidden="true">
        <span className="flex-1 bg-amber-400" />
        <span className="flex-1 bg-slate-50" />
        <span className="flex-1 bg-green-500" />
      </div>
      <div className="px-3 py-3 md:px-4">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => onNavigate('dashboard')} className="flex shrink-0 items-center gap-2.5 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300 text-sm font-black text-slate-950">P</span>
          <span className="font-display text-lg font-semibold leading-none text-white">Parivahan Journey</span>
        </button>
        <div className="hidden items-center gap-3 sm:flex">
          {userName ? (
            <>
              <span className="max-w-40 truncate text-sm text-slate-400">{userName}</span>
              <motion.button {...scaleTap} type="button" onClick={onSignOut} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition-colors duration-150 hover:border-white/25 hover:text-white">Sign out</motion.button>
            </>
          ) : (
            <motion.button {...scaleTap} type="button" onClick={() => onNavigate('dashboard')} className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 transition-colors duration-150 hover:bg-amber-300">Sign in</motion.button>
          )}
        </div>
      </div>
      <nav aria-label="Primary navigation" className="mt-3 flex gap-1 overflow-x-auto border-t border-white/10 pt-3">
        {navigationItems.map((item) => {
          const isActive = item.route === activeRoute;
          const hasUnread = item.route === 'alerts' && unreadCount > 0;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onNavigate(item.route)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {isActive ? <motion.span layoutId="active-route" className="absolute inset-0 rounded-lg bg-white/10" transition={{ duration: DURATION.fast, ease: EASE_OUT }} /> : null}
              <span className="relative inline-flex items-center gap-1.5">
                {item.label}
                {hasUnread ? <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-label={`${unreadCount} unread alerts`} /> : null}
              </span>
            </button>
          );
        })}
        {userName ? (
          <motion.button {...scaleTap} type="button" onClick={onSignOut} className="ml-auto rounded-lg px-3 py-2 text-sm text-slate-400 sm:hidden">Sign out</motion.button>
        ) : (
          <motion.button {...scaleTap} type="button" onClick={() => onNavigate('dashboard')} className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-amber-300 sm:hidden">Sign in</motion.button>
        )}
      </nav>
      </div>
    </header>
  );
}
