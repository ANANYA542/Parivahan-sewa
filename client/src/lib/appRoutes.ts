import { useEffect, useState } from 'react';

export const appRoutes = ['dashboard', 'services', 'journey', 'cases', 'map', 'alerts', 'health', 'pollution', 'fuel'] as const;

export type AppRoute = (typeof appRoutes)[number];

const routes = new Set<string>(appRoutes);

function pathSegments(pathname: string): string[] {
  return pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
}

export function routeFromPathname(pathname: string): AppRoute {
  const route = pathSegments(pathname)[0] ?? 'dashboard';
  return routes.has(route) ? (route as AppRoute) : 'dashboard';
}

/**
 * The guided journey for a specific service lives at its own URL,
 * `/journey/:serviceId` — a real, separate, reloadable/bookmarkable page,
 * not just in-memory state layered on the bare `/journey` AI-guide page.
 */
export function journeyServiceIdFromPathname(pathname: string): string | null {
  const segments = pathSegments(pathname);
  return segments[0] === 'journey' && segments[1] ? decodeURIComponent(segments[1]) : null;
}

export function navigateTo(route: AppRoute): void {
  const nextPath = `/${route}`;
  if (window.location.pathname === nextPath) return;
  window.history.pushState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function navigateToJourney(serviceId: string): void {
  const nextPath = `/journey/${encodeURIComponent(serviceId)}`;
  if (window.location.pathname === nextPath) return;
  window.history.pushState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useAppRoute(): { route: AppRoute; journeyServiceId: string | null } {
  const [state, setState] = useState(() => ({
    route: routeFromPathname(window.location.pathname),
    journeyServiceId: journeyServiceIdFromPathname(window.location.pathname)
  }));

  useEffect(() => {
    const handleRouteChange = () =>
      setState({
        route: routeFromPathname(window.location.pathname),
        journeyServiceId: journeyServiceIdFromPathname(window.location.pathname)
      });
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return state;
}
