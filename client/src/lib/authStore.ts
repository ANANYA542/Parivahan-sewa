import type { AuthSession } from '@parivahan/shared';

const STORAGE_KEY = 'parivahan-track:session';

/**
 * The session is a JWT issued by `POST /auth/login` plus the user profile it
 * resolved to. Persisted to localStorage so a refresh doesn't sign the
 * citizen out; read defensively since this runs in the browser and storage
 * can be unavailable (private browsing) or hold stale/corrupt data from an
 * older build.
 */
export function loadSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed || typeof parsed.token !== 'string' || !parsed.user) return null;
    return parsed as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable — the session still works for this tab via in-memory state.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage was never usable.
  }
}
