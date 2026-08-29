import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
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

// In local development Vite proxies this path to Nest or uses VITE_API_URL.
// Deployments can set VITE_API_URL in .env to their public API URL (e.g., https://api-parivahan.vercel.app/v1)
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

// Axios instance configured with base URL
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header if token is present
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken) {
    config.headers.set('Authorization', `Bearer ${authToken}`);
  }
  return config;
});

// Intercept responses for unified error handling & 401 auto logout
apiClient.interceptors.response.use(
  (response) => {
    // If response is HTML (happens when SPA routing rewrites 404s/APIs to index.html)
    const contentType = String(response.headers['content-type'] ?? '');
    if (
      (typeof response.data === 'string' && (response.data.startsWith('<!doctype') || response.data.startsWith('<!DOCTYPE') || response.data.startsWith('<html'))) ||
      (contentType.includes('text/html') && response.config.responseType !== 'blob')
    ) {
      throw new ApiRequestError('Unable to reach the backend API. Please verify that your backend is deployed and VITE_API_URL is configured in Vercel.');
    }
    return response;
  },
  (error: AxiosError) => {
    if (!error.response) {
      throw new ApiRequestError('Unable to reach the service. Check that the server is running and CORS is enabled.');
    }

    const status = error.response.status;
    const payload = error.response.data;
    const message = extractErrorMessage(payload, 'The service could not complete this request.');

    if (status === 401 && authToken) {
      onUnauthorized?.();
    }

    throw new ApiRequestError(message, status);
  }
);

async function request<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const method = options?.method?.toLowerCase() ?? 'get';
  const response = await apiClient.request<T>({
    url: path,
    method,
    data: options?.body
  });
  return response.data;
}

export async function login(contact: string): Promise<AuthSession> {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: { contact }
  });
}

export async function signup(input: { name: string; contact: string; preferredLanguage?: string }): Promise<AuthSession> {
  return request<AuthSession>('/auth/signup', {
    method: 'POST',
    body: input
  });
}

/** Demo-only "sign in as" directory — every identity here is synthetic seed data. */
export async function getDemoUsers(): Promise<UserProfile[]> {
  try {
    const data = await request<UserProfile[]>('/auth/demo-users');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getIdentity(userId: string): Promise<IdentityBundle> {
  return request<IdentityBundle>(`/users/${encodeURIComponent(userId)}/identity`);
}

export async function registerVehicle(userId: string, input: { registrationNumber: string; vehicleType: string }): Promise<VehicleRecord> {
  return request<VehicleRecord>(`/users/${encodeURIComponent(userId)}/vehicles`, {
    method: 'POST',
    body: input
  });
}

export async function resolveIntent(query: string): Promise<{ intent: IntentResolution; service: ServiceDefinition | null }> {
  return request<{ intent: IntentResolution; service: ServiceDefinition | null }>('/intents/resolve', {
    method: 'POST',
    body: { query }
  });
}

export async function getWorkflow(serviceId: string): Promise<ServiceDefinition> {
  return request<ServiceDefinition>(`/workflows/${encodeURIComponent(serviceId)}`);
}

export async function getServices(): Promise<ServiceDefinition[]> {
  try {
    const data = await request<ServiceDefinition[]>('/services');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getMobilityIntelligence(userId: string): Promise<MobilityIntelligenceSnapshot> {
  return request<MobilityIntelligenceSnapshot>(`/users/${encodeURIComponent(userId)}/mobility-intelligence`);
}

export async function getCase(caseId: string): Promise<CaseDetail> {
  return request<CaseDetail>(`/cases/${encodeURIComponent(caseId)}`);
}

export async function createCase(input: CaseSubmissionInput): Promise<CaseRecord> {
  return request<CaseRecord>('/cases', {
    method: 'POST',
    body: input
  });
}

export async function askStandingAgent(userId: string, message: string, history: AgentMessage[], sessionId?: string): Promise<AgentResponse> {
  return request<AgentResponse>(`/users/${encodeURIComponent(userId)}/standing-agent`, {
    method: 'POST',
    body: { message, history, sessionId }
  });
}

export async function getComplianceSnapshot(userId: string): Promise<ComplianceSnapshot> {
  return request<ComplianceSnapshot>(`/users/${encodeURIComponent(userId)}/compliance`);
}

export async function escalateCase(caseId: string): Promise<CaseRecord> {
  return request<CaseRecord>(`/cases/${encodeURIComponent(caseId)}/escalate`, {
    method: 'POST'
  });
}

function filenameFromContentDisposition(headerValue: unknown, fallback: string): string {
  const match = typeof headerValue === 'string' ? headerValue.match(/filename="?([^"]+)"?/) : null;
  return match?.[1] ?? fallback;
}

/**
 * The server regenerates this PDF from the case's own stored data on every
 * request rather than caching a file. Its filename (via Content-Disposition)
 * distinguishes a real filled government form (e.g. "case-016-FORM-2.pdf")
 * from the generic acknowledgement — read it here rather than guessing
 * client-side, so a citizen downloading the real form never sees a
 * misleading "acknowledgement" filename.
 */
export async function getCaseDocument(caseId: string): Promise<{ blob: Blob; filename: string }> {
  try {
    const response = await apiClient.get(`/cases/${encodeURIComponent(caseId)}/document`, {
      responseType: 'blob'
    });
    return {
      blob: response.data as Blob,
      filename: filenameFromContentDisposition(response.headers['content-disposition'], `${caseId}-acknowledgement.pdf`)
    };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    throw new ApiRequestError('The document could not be generated.');
  }
}

/** Back-compat alias returning just the blob, for callers that only need the bytes (e.g. rendering a preview). */
export async function getCaseDocumentBlob(caseId: string): Promise<Blob> {
  return (await getCaseDocument(caseId)).blob;
}

export async function downloadCaseAcknowledgement(caseId: string): Promise<void> {
  const { blob, filename } = await getCaseDocument(caseId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const data = await request<AppNotification[]>(`/users/${encodeURIComponent(userId)}/notifications`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<AppNotification[]> {
  return request<AppNotification[]>(`/users/${encodeURIComponent(userId)}/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST'
  });
}
