import type {
  AgentMessage,
  AgentResponse,
  AppNotification,
  AuthSession,
  CaseDetail,
  CaseRecord,
  CaseSubmissionInput,
  ComplianceSnapshot,
  IdentityBundle,
  IntentResolution,
  MobilityIntelligenceSnapshot,
  ServiceDefinition,
  UserProfile,
  VehicleRecord
} from '@parivahan/shared';

// In local development Vite proxies this path to Nest. Deployments can set
// VITE_API_URL to their public API URL without changing client code.
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '/v1').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Called once on load (from a saved session) and on every login/logout. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Registered once by App.tsx. A JWT is only valid for 12h (see server-side
 * AuthService) — without this, an expired/invalid token left the citizen
 * looking "still signed in" while every request silently 401'd, with no
 * path back to the login screen except manually finding "Sign out". This
 * fires at most the session-clearing logic once per 401, from wherever it
 * happens to be raised.
 */
export function setOnUnauthorized(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  return typeof payload === 'object' && payload !== null && 'message' in payload
    ? Array.isArray((payload as { message: unknown }).message)
      ? (payload as { message: string[] }).message.join(', ')
      : String((payload as { message: unknown }).message)
    : fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string> | undefined) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiRequestError('Unable to reach the service. Check that the server is running.');
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message = extractErrorMessage(payload, 'The service could not complete this request.');
    if (response.status === 401 && authToken) onUnauthorized?.();
    throw new ApiRequestError(message, response.status);
  }

  const payload: unknown = await response.json().catch(() => null);
  return payload as T;
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiRequestError('Unable to reach the service. Check that the server is running.');
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message = extractErrorMessage(payload, 'The document could not be generated.');
    if (response.status === 401 && authToken) onUnauthorized?.();
    throw new ApiRequestError(message, response.status);
  }

  return response.blob();
}

export function login(contact: string) {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ contact })
  });
}

export function signup(input: { name: string; contact: string; preferredLanguage?: string }) {
  return request<AuthSession>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

/** Demo-only "sign in as" directory — every identity here is synthetic seed data. */
export function getDemoUsers() {
  return request<UserProfile[]>('/auth/demo-users');
}

export function getIdentity(userId: string) {
  return request<IdentityBundle>(`/users/${encodeURIComponent(userId)}/identity`);
}

export function registerVehicle(userId: string, input: { registrationNumber: string; vehicleType: string }) {
  return request<VehicleRecord>(`/users/${encodeURIComponent(userId)}/vehicles`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function resolveIntent(query: string) {
  return request<{ intent: IntentResolution; service: ServiceDefinition | null }>('/intents/resolve', {
    method: 'POST',
    body: JSON.stringify({ query })
  });
}

export function getWorkflow(serviceId: string) {
  return request<ServiceDefinition>(`/workflows/${encodeURIComponent(serviceId)}`);
}

export function getServices() {
  return request<ServiceDefinition[]>('/services');
}

export function getMobilityIntelligence(userId: string) {
  return request<MobilityIntelligenceSnapshot>(`/users/${encodeURIComponent(userId)}/mobility-intelligence`);
}

export function getCase(caseId: string) {
  return request<CaseDetail>(`/cases/${encodeURIComponent(caseId)}`);
}

export function createCase(input: CaseSubmissionInput) {
  return request<CaseRecord>('/cases', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function askStandingAgent(userId: string, message: string, history: AgentMessage[], sessionId?: string) {
  return request<AgentResponse>(`/users/${encodeURIComponent(userId)}/standing-agent`, {
    method: 'POST',
    body: JSON.stringify({ message, history, sessionId })
  });
}

export function getComplianceSnapshot(userId: string) {
  return request<ComplianceSnapshot>(`/users/${encodeURIComponent(userId)}/compliance`);
}

export function escalateCase(caseId: string) {
  return request<CaseRecord>(`/cases/${encodeURIComponent(caseId)}/escalate`, { method: 'POST' });
}

export async function downloadCaseAcknowledgement(caseId: string): Promise<void> {
  const blob = await requestBlob(`/cases/${encodeURIComponent(caseId)}/document`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${caseId}-acknowledgement.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getNotifications(userId: string) {
  return request<AppNotification[]>(`/users/${encodeURIComponent(userId)}/notifications`);
}

export function markNotificationRead(userId: string, notificationId: string) {
  return request<AppNotification[]>(`/users/${encodeURIComponent(userId)}/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST'
  });
}
