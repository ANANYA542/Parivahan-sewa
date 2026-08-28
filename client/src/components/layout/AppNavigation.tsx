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
  { route: 'journey', label: 'Start a request' },
  { route: 'cases', label: 'Cases' },
  { route: 'map', label: 'Map' },
  { route: 'alerts', label: 'Alerts' }
];

export function AppNavigation({ activeRoute, userName, unreadCount, onNavigate, onSignOut }: AppNavigationProps) {
  return (
    <header className="sticky top-3 z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-[3px] w-full" aria-hidden="true">
        <span className="flex-1 bg-orange-500" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-green-500" />
      </div>
      <div className="px-3 py-3 md:px-4">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => onNavigate('dashboard')} className="flex shrink-0 items-center gap-2.5 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm font-black text-white">P</span>
          <span className="font-display text-lg font-semibold leading-none text-slate-900">Parivahan Journey</span>
        </button>
        <div className="hidden items-center gap-3 sm:flex">
          {userName ? (
            <>
              <span className="max-w-40 truncate text-sm text-slate-500">{userName}</span>
              <motion.button {...scaleTap} type="button" onClick={onSignOut} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition-colors duration-150 hover:border-slate-400 hover:text-slate-900">Sign out</motion.button>
            </>
          ) : (
            <motion.button {...scaleTap} type="button" onClick={() => onNavigate('dashboard')} className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white transition-colors duration-150 hover:bg-orange-600">Sign in</motion.button>
          )}
        </div>
      </div>
      <nav
        aria-label="Primary navigation"
        className="mt-3 flex gap-1 overflow-x-auto border-t border-slate-200 pt-3"
        style={{ WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)', maskImage: 'linear-gradient(to right, black 90%, transparent 100%)' }}
      >
        {navigationItems.map((item) => {
          const isActive = item.route === activeRoute;
          const hasUnread = item.route === 'alerts' && unreadCount > 0;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onNavigate(item.route)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? 'text-orange-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {isActive ? <motion.span layoutId="active-route" className="absolute inset-0 rounded-lg bg-orange-50" transition={{ duration: DURATION.fast, ease: EASE_OUT }} /> : null}
              <span className="relative inline-flex items-center gap-1.5">
                {item.label}
                {hasUnread ? <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-label={`${unreadCount} unread alerts`} /> : null}
              </span>
            </button>
          );
        })}
        {userName ? (
          <motion.button {...scaleTap} type="button" onClick={onSignOut} className="ml-auto rounded-lg px-3 py-2 text-sm text-slate-500 sm:hidden">Sign out</motion.button>
        ) : (
          <motion.button {...scaleTap} type="button" onClick={() => onNavigate('dashboard')} className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-orange-600 sm:hidden">Sign in</motion.button>
        )}
      </nav>
      </div>
    </header>
  );
}
