import { useEffect, useState } from 'react';

export const appRoutes = ['dashboard', 'services', 'journey', 'cases', 'map', 'alerts', 'health', 'pollution', 'fuel'] as const;

export type AppRoute = (typeof appRoutes)[number];

const routes = new Set<string>(appRoutes);

export function routeFromPathname(pathname: string): AppRoute {
  const route = pathname.replace(/^\/+|\/+$/g, '') || 'dashboard';
  return routes.has(route) ? (route as AppRoute) : 'dashboard';
}

export function navigateTo(route: AppRoute): void {
  const nextPath = `/${route}`;
  if (window.location.pathname === nextPath) return;
  window.history.pushState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useAppRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => routeFromPathname(window.location.pathname));

  useEffect(() => {
    const handleRouteChange = () => setRoute(routeFromPathname(window.location.pathname));
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return route;
}
