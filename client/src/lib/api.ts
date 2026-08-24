import type {
  CaseDetail,
  CaseRecord,
  CaseSubmissionRequest,
  IdentityBundle,
  IntentResolution,
  MobilityIntelligenceSnapshot,
  ServiceDefinition
} from '@parivahan/shared';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/v1').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers }
    });
  } catch {
    throw new ApiRequestError('Unable to reach the service. Check that the server is running.');
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(', ')
          : String(payload.message)
        : 'The service could not complete this request.';
    throw new ApiRequestError(message, response.status);
  }

  return payload as T;
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

export function createCase(input: CaseSubmissionRequest) {
  return request<CaseRecord>('/cases', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}
