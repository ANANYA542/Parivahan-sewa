import { randomUUID } from 'node:crypto';
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { AgentMessage, AgentResponse } from '@parivahan/shared';
import { CoreDataService } from '../../common/core-data.service.js';
import { MobilityIntelligenceService } from '../mobility-intelligence/mobility-intelligence.service.js';
import { ComplianceService } from './compliance.service.js';
import { RTO_KNOWLEDGE_BASE } from './rto-knowledge-base.js';

type ToolCall = { id: string; function: { name: string; arguments: string } };
type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string | null; tool_call_id?: string; tool_calls?: ToolCall[] };

const MODEL = 'openai/gpt-oss-120b';
const TOOL_DEFINITIONS = [
  { type: 'function', function: { name: 'getCase', description: 'Read one of the citizen’s cases.', parameters: { type: 'object', properties: { caseId: { type: 'string' } }, required: ['caseId'] } } },
  { type: 'function', function: { name: 'getPointsLedger', description: 'Read the illustrative safety-points ledger.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'getDocumentStatus', description: 'Read document statuses for the citizen’s vehicles.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'draftEscalation', description: 'Draft, but do not submit, a case escalation.', parameters: { type: 'object', properties: { caseId: { type: 'string' }, reason: { type: 'string' } }, required: ['caseId', 'reason'] } } },
  { type: 'function', function: { name: 'checkNOCEligibility', description: 'Check basic NOC readiness from existing vehicle data.', parameters: { type: 'object', properties: { vehicleId: { type: 'string' } }, required: ['vehicleId'] } } },
  { type: 'function', function: { name: 'generatePdf', description: 'Prepare a document-generation request; never claim an official document is issued.', parameters: { type: 'object', properties: { caseId: { type: 'string' } }, required: ['caseId'] } } },
  { type: 'function', function: { name: 'translate', description: 'Return a safe request to translate an answer for the citizen.', parameters: { type: 'object', properties: { text: { type: 'string' }, language: { type: 'string' } }, required: ['text', 'language'] } } },
  { type: 'function', function: { name: 'checkMobilityTriggers', description: 'Read rule-based mobility nudges for the citizen.', parameters: { type: 'object', properties: {} } } }
];

interface AgentSession {
  userId: string;
  history: AgentMessage[];
  lastActiveAt: number;
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const SESSION_HISTORY_LIMIT = 16;

@Injectable()
export class AgentService {
  /**
   * In-memory session store: the Standing Agent's own conversational memory,
   * keyed by a client-held sessionId, separate from — and not duplicating —
   * any Case data. Intentionally not backed by a database for this build.
   */
  private readonly sessions = new Map<string, AgentSession>();

  constructor(
    @Inject(CoreDataService) private readonly coreData: CoreDataService,
    @Inject(ComplianceService) private readonly compliance: ComplianceService,
    @Inject(MobilityIntelligenceService) private readonly mobility: MobilityIntelligenceService
  ) {}

  async respond(userId: string, message: string, clientHistory: AgentMessage[], requestedSessionId?: string): Promise<AgentResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException('Standing Agent is not configured. Add GROQ_API_KEY to the server environment.');
    await this.coreData.getIdentityBundle(userId);

    const sessionId = this.resolveSessionId(userId, requestedSessionId);
    const session = this.sessions.get(sessionId)!;
    // Server-held history is authoritative once a session exists; fall back to
    // whatever the client sent only the first time this session is seen.
    const priorHistory = session.history.length ? session.history : clientHistory;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are the Parivahan Track assistant. Give concise, practical, plain-language guidance — the citizen you're talking to may not be familiar with government or technical terms, so avoid jargon and explain any you must use. Use tools for citizen-specific facts (their own cases, documents). Use the reference knowledge below for general RTO/Parivahan domain facts — treat every figure in it as illustrative and tell the citizen to confirm current fees/SLAs on the official portal, never state them as guaranteed-current. Never imply an official registry check, payment, submission, or document issuance occurred. Compliance results are demo-only unless stated otherwise. You have no database access beyond the tools.\n\nREFERENCE KNOWLEDGE:\n${RTO_KNOWLEDGE_BASE}`
      },
      ...priorHistory.slice(-8).map((item) => ({ role: item.role, content: item.content })),
      { role: 'user', content: message }
    ];
    const toolsUsed: string[] = [];

    for (let round = 0; round < 4; round += 1) {
      let response: Response;
      try {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: MODEL, messages, tools: TOOL_DEFINITIONS, tool_choice: 'auto', temperature: 0.2, max_tokens: 700 }),
          signal: AbortSignal.timeout(20_000)
        });
      } catch {
        throw new ServiceUnavailableException('Standing Agent did not respond in time. Please try again.');
      }
      const payload = await response.json().catch(() => null) as { choices?: Array<{ message?: { content?: string | null; tool_calls?: ToolCall[] } }>; error?: { message?: string } } | null;
      const choice = payload?.choices?.[0]?.message;
      if (!response.ok || !choice) throw new ServiceUnavailableException(payload?.error?.message ?? 'Standing Agent could not respond.');
      if (!choice.tool_calls?.length) {
        const reply = choice.content?.trim() || 'I could not prepare a response.';
        this.appendToSession(sessionId, [{ role: 'user', content: message }, { role: 'assistant', content: reply }]);
        return { message: reply, toolsUsed, model: MODEL, sessionId };
      }

      messages.push({ role: 'assistant', content: choice.content ?? null, tool_calls: choice.tool_calls });
      for (const call of choice.tool_calls) {
        toolsUsed.push(call.function.name);
        // Tool results must never throw here — a hallucinated/stale id from the
        // model (e.g. a caseId that doesn't exist) would otherwise escape this
        // loop as an uncaught NotFoundException and abort the whole reply with
        // a bare 404 instead of letting the assistant say so in plain language.
        let result: unknown;
        try {
          result = await this.executeTool(userId, call.function.name, call.function.arguments);
        } catch (reason) {
          result = { error: reason instanceof Error ? reason.message : 'That request could not be completed.' };
        }
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }
    throw new ServiceUnavailableException('Standing Agent reached its tool-call limit. Please try a more specific request.');
  }

  private resolveSessionId(userId: string, requestedSessionId?: string): string {
    this.evictExpiredSessions();
    if (requestedSessionId && this.sessions.get(requestedSessionId)?.userId === userId) {
      return requestedSessionId;
    }
    const sessionId = requestedSessionId && requestedSessionId.trim() ? requestedSessionId : randomUUID();
    this.sessions.set(sessionId, { userId, history: [], lastActiveAt: Date.now() });
    return sessionId;
  }

  private appendToSession(sessionId: string, additions: AgentMessage[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.history = [...session.history, ...additions].slice(-SESSION_HISTORY_LIMIT);
    session.lastActiveAt = Date.now();
  }

  private evictExpiredSessions(): void {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [sessionId, session] of this.sessions) {
      if (session.lastActiveAt < cutoff) this.sessions.delete(sessionId);
    }
  }

  private async executeTool(userId: string, name: string, rawArguments: string): Promise<unknown> {
    const args = this.parseArguments(rawArguments);
    switch (name) {
      case 'getCase': {
        // coreData.getCase() returns a case by id alone with no ownership check
        // (unlike the guarded /cases/:caseId route, which checks it in the
        // controller) — this tool must enforce that check itself, or a
        // hallucinated or guessed caseId could leak another citizen's case
        // details (including their submissionData) into this chat.
        const caseDetail = await this.coreData.getCase(String(args.caseId));
        if (caseDetail.userId !== userId) return { error: 'That case does not belong to this citizen.' };
        return caseDetail;
      }
      case 'getPointsLedger': return this.compliance.getPointsLedger(userId);
      case 'getDocumentStatus': return (await this.coreData.getIdentityBundle(userId)).vehicles.map((vehicle) => ({ registrationNumber: vehicle.registrationNumber, documentStatus: vehicle.documentStatus }));
      case 'draftEscalation': return { status: 'draft_only', caseId: String(args.caseId), draft: `Escalation draft for ${String(args.caseId)}: ${String(args.reason)}. Review and submit through the case workflow.` };
      case 'checkNOCEligibility': {
        const vehicle = (await this.coreData.getIdentityBundle(userId)).vehicles.find((item) => item.vehicleId === args.vehicleId);
        return vehicle ? { vehicleId: vehicle.vehicleId, eligibleToStart: vehicle.documentStatus.rc === 'active' && vehicle.documentStatus.puc === 'active', note: 'Basic demo readiness only; RTO rules and pending liabilities must be verified officially.' } : { error: 'Vehicle not found for this citizen.' };
      }
      case 'generatePdf': return { status: 'draft_request_only', caseId: String(args.caseId), note: 'A document draft can be generated from collected case data; this is not an issued government document.' };
      case 'translate': return { text: String(args.text), targetLanguage: String(args.language), note: 'Translate this response clearly and preserve official-service disclaimers.' };
      case 'checkMobilityTriggers': return this.mobility.getNudges(userId);
      default: return { error: `Tool ${name} is not available.` };
    }
  }

  private parseArguments(value: string): Record<string, unknown> {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
  }
}
