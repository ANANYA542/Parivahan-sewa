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
  UserProfile
} from '@parivahan/shared';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/v1').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

let authToken: string | null = null;

/** Called once on load (from a saved session) and on every login/logout. */
export function setAuthToken(token: string | null): void {
  authToken = token;
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
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? Array.isArray((payload as { message: unknown }).message)
          ? (payload as { message: string[] }).message.join(', ')
          : String((payload as { message: unknown }).message)
        : 'The service could not complete this request.';
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
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload ? String((payload as { message: unknown }).message) : 'The document could not be generated.';
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

export function resolveIntent(query: string) {
  return request<{ intent: IntentResolution }>('/intents/resolve', {
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

export function askStandingAgent(userId: string, message: string, history: AgentMessage[]) {
  return request<AgentResponse>(`/users/${encodeURIComponent(userId)}/standing-agent`, {
    method: 'POST',
    body: JSON.stringify({ message, history })
  });
}

export function getComplianceSnapshot(userId: string) {
  return request<ComplianceSnapshot>(`/users/${encodeURIComponent(userId)}/compliance`);
}

export function transcribeVoice(audioBase64: string, mimeType: string, language?: string) {
  return request<{ text: string; language?: string }>('/voice/transcribe', {
    method: 'POST',
    body: JSON.stringify({ audioBase64, mimeType, ...(language ? { language } : {}) })
  });
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
