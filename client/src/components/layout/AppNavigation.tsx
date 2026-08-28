import { useEffect, useRef, useState } from 'react';
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

// Kept out of the primary scroll row (rather than a 7th-9th item) so it
// doesn't add to the mobile overflow problem the chevron/fade below exists
// to solve — these three are real, if illustrative-only, pages that were
// previously unreachable from anywhere in the UI.
const moreItems: Array<{ route: AppRoute; label: string }> = [
  { route: 'health', label: 'Vehicle health' },
  { route: 'pollution', label: 'Pollution' },
  { route: 'fuel', label: 'Fuel' }
];

export function AppNavigation({ activeRoute, userName, unreadCount, onNavigate, onSignOut }: AppNavigationProps) {
  const scrollRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    if (!isMoreOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreOpen]);

  // The nav row's own fade-mask was too subtle for anyone to actually notice
  // there was more to scroll to (confirmed by live testing on mobile widths).
  // This tracks real overflow so a visible chevron only appears when there's
  // something to scroll to, rather than being a permanent, potentially
  // misleading fixture.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    function updateOverflow() {
      if (!node) return;
      setCanScrollMore(node.scrollWidth - node.scrollLeft - node.clientWidth > 8);
    }

    updateOverflow();
    node.addEventListener('scroll', updateOverflow, { passive: true });
    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(node);
    return () => {
      node.removeEventListener('scroll', updateOverflow);
      resizeObserver.disconnect();
    };
  }, [userName]);

  function scrollNavForward() {
    scrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' });
  }

  return (
    <header className="sticky top-0 z-20 rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
      {/* Clipped to just this stripe (not the whole header, which used to have
          overflow-hidden) — that was silently clipping the "More" dropdown
          panel below, since overflow-hidden on the header clips everything
          inside it, not just this bar. */}
      <div className="flex h-[3px] w-full overflow-hidden rounded-t-2xl" aria-hidden="true">
        <span className="flex-1 bg-amber-400" />
        <span className="flex-1 bg-slate-800" />
        <span className="flex-1 bg-emerald-400" />
      </div>
      <div className="px-3 py-3 md:px-4">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => onNavigate('dashboard')} className="flex shrink-0 items-center gap-2.5 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-sm font-black text-slate-950">P</span>
            <span className="font-display text-lg font-semibold leading-none text-slate-50">Parivahan Journey</span>
          </button>
          {/* Signed out: this is now the ONLY header/sign-in entry point (LoginScreen's
              own duplicate logo+header block was removed) — visible on every width, not
              just sm+, since there's no longer a second mobile-only sign-in affordance
              in the scroll row below. Signed in: unchanged, desktop-only identity strip. */}
          <div className={userName ? 'hidden items-center gap-3 sm:flex' : 'flex items-center gap-3'}>
            {userName ? (
              <>
                <span className="max-w-40 truncate text-sm text-slate-400">{userName}</span>
                <motion.button {...scaleTap} type="button" onClick={onSignOut} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors duration-150 hover:border-slate-600 hover:text-slate-50">Sign out</motion.button>
              </>
            ) : (
              <motion.button {...scaleTap} type="button" onClick={() => onNavigate('dashboard')} className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 transition-colors duration-150 hover:bg-amber-300">Sign in</motion.button>
            )}
          </div>
        </div>
        {/* The 6 route links only make sense once signed in — showing them alongside
            LoginScreen was a redundant, confusing second header on the very first
            screen a visitor sees. */}
        {userName ? (
          <div className="mt-3 flex items-center gap-1 border-t border-slate-800 pt-3">
            {/* The scrollable region is its own positioning context, separate from
                "More" below — an earlier version nested the "More" dropdown inside
                this overflow-x-auto row, which silently clipped the open panel
                (an overflow-x:auto ancestor forces overflow-y to clip too, even
                though only the x-axis needed scrolling). Keeping "More" as a
                persistent sibling also means it never needs to be scrolled to. */}
            <div className="relative min-w-0 flex-1">
              <nav ref={scrollRef} aria-label="Primary navigation" className="flex gap-1 overflow-x-auto">
                {navigationItems.map((item) => {
                  const isActive = item.route === activeRoute;
                  const hasUnread = item.route === 'alerts' && unreadCount > 0;
                  return (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => onNavigate(item.route)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? 'text-amber-300' : 'text-slate-400 hover:text-slate-100'}`}
                    >
                      {isActive ? <motion.span layoutId="active-route" className="absolute inset-0 rounded-lg bg-amber-500/15" transition={{ duration: DURATION.fast, ease: EASE_OUT }} /> : null}
                      <span className="relative inline-flex items-center gap-1.5">
                        {item.label}
                        {hasUnread ? <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label={`${unreadCount} unread alerts`} /> : null}
                      </span>
                    </button>
                  );
                })}
                <motion.button {...scaleTap} type="button" onClick={onSignOut} className="ml-auto shrink-0 rounded-lg px-3 py-2 text-sm text-slate-400 sm:hidden">Sign out</motion.button>
              </nav>
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-900 to-transparent transition-opacity duration-150 ${canScrollMore ? 'opacity-100' : 'opacity-0'}`}
              />
              {canScrollMore ? (
                <button
                  type="button"
                  onClick={scrollNavForward}
                  aria-label="Show more navigation items"
                  className="absolute right-1 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 shadow-sm"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              ) : null}
            </div>
            <div ref={moreRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsMoreOpen((open) => !open)}
                aria-expanded={isMoreOpen}
                aria-haspopup="menu"
                className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${moreItems.some((item) => item.route === activeRoute) ? 'text-amber-300' : 'text-slate-400 hover:text-slate-100'}`}
              >
                More
              </button>
              {isMoreOpen ? (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DURATION.fast, ease: EASE_OUT }}
                  className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-lg"
                >
                  {moreItems.map((item) => (
                    <button
                      key={item.route}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onNavigate(item.route);
                        setIsMoreOpen(false);
                      }}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${item.route === activeRoute ? 'text-amber-300' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-50'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
