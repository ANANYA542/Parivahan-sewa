import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User as UserRow, Vehicle as VehicleRow, Case as CaseRow } from '@prisma/client';
import {
  buildEscalationStageHistoryItem,
  ESCALATION_NOTE,
  createCaseFromSubmission,
  seedData,
  type CaseDetail,
  type CaseRecord,
  type CaseSubmissionRequest,
  type CaseStatus,
  type CaseType,
  type ServiceDefinition,
  type StageHistoryItem,
  type SubmissionData,
  type UserProfile,
  type VehicleRecord
} from '@parivahan/shared';
import { PrismaService } from './prisma.service.js';

const CLOSED_CASE_STATUSES = new Set(['resolved', 'rejected']);
const SLA_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toUserProfile(row: UserRow): UserProfile {
  return { userId: row.userId, name: row.name, contact: row.contact, preferredLanguage: row.preferredLanguage };
}

function toVehicleRecord(row: VehicleRow): VehicleRecord {
  return {
    vehicleId: row.vehicleId,
    ownerId: row.ownerId,
    registrationNumber: row.registrationNumber,
    vehicleType: row.vehicleType,
    documentStatus: (row.documentStatus ?? {}) as VehicleRecord['documentStatus']
  };
}

function toCaseRecord(row: CaseRow): CaseRecord {
  return {
    caseId: row.caseId,
    type: row.type as CaseType,
    userId: row.userId,
    vehicleId: row.vehicleId,
    serviceId: row.serviceId,
    stage: row.stage,
    status: row.status as CaseStatus,
    slaDeadline: row.slaDeadline ? row.slaDeadline.toISOString() : null,
    submissionData: row.submissionData as SubmissionData,
    stageHistory: row.stageHistory as unknown as StageHistoryItem[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

/**
 * Users, vehicles, and cases are the only genuinely dynamic data in this
 * app, so they're the only things persisted to Postgres (see
 * prisma/schema.prisma) — everything else here (the service catalog) is
 * static reference data compiled into the app itself, kept in memory since
 * it's identical, deterministic content on every request regardless of
 * which server process handles it.
 *
 * This matters specifically because the server runs as a Vercel serverless
 * function: separate invocations can land on separate, memory-isolated
 * instances. A plain in-memory array (the previous implementation) meant a
 * case created in one invocation could 404 in the very next one, the moment
 * a fresh cold start happened to handle it — a citizen's own submitted case
 * silently disappearing. Persisting to a real database is what actually
 * fixes that, not just working around it in the UI.
 */
@Injectable()
export class CoreDataService {
  private readonly services: ServiceDefinition[] = structuredClone(seedData.services);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getIdentityBundle(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { vehicles: true, cases: true }
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} was not found.`);
    }

    return {
      user: toUserProfile(user),
      vehicles: user.vehicles.map(toVehicleRecord),
      cases: user.cases.map(toCaseRecord)
    };
  }

  getWorkflow(serviceId: string): ServiceDefinition {
    const service = this.services.find((item) => item.serviceId === serviceId);
    if (!service) {
      throw new NotFoundException(`Service ${serviceId} was not found.`);
    }
    return structuredClone(service);
  }

  listServices(): ServiceDefinition[] {
    return structuredClone([...this.services].sort((first, second) => first.name.localeCompare(second.name)));
  }

  async listUserIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({ select: { userId: true } });
    return users.map((user) => user.userId);
  }

  /** Demo-login directory only: the seed identities are entirely synthetic. */
  async listUsersPublic(): Promise<UserProfile[]> {
    const users = await this.prisma.user.findMany({ orderBy: { name: 'asc' } });
    return users.map(toUserProfile);
  }

  async findUserByContact(contact: string): Promise<UserProfile | undefined> {
    const normalized = contact.trim().toLowerCase();
    const users = await this.prisma.user.findMany();
    const match = users.find((user) => user.contact.trim().toLowerCase() === normalized);
    return match ? toUserProfile(match) : undefined;
  }

  async registerUser(input: { name: string; contact: string; preferredLanguage?: string }): Promise<UserProfile> {
    const normalizedContact = input.contact.trim();
    if (!normalizedContact) {
      throw new BadRequestException('Contact number is required.');
    }
    const existing = await this.findUserByContact(normalizedContact);
    if (existing) {
      throw new BadRequestException('An account with this contact number already exists. Please sign in.');
    }

    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Full name is required.');
    }

    const created = await this.prisma.user.create({
      data: {
        name: trimmedName,
        contact: normalizedContact,
        preferredLanguage: input.preferredLanguage?.trim() || 'en'
      }
    });
    return toUserProfile(created);
  }

  async getCase(caseId: string): Promise<CaseDetail> {
    const caseRow = await this.prisma.case.findUnique({ where: { caseId }, include: { vehicle: true } });
    if (!caseRow) {
      throw new NotFoundException(`Case ${caseId} was not found.`);
    }

    const service = this.services.find((item) => item.serviceId === caseRow.serviceId);
    if (!service) {
      throw new NotFoundException(`Service for case ${caseId} was not found.`);
    }

    return {
      ...toCaseRecord(caseRow),
      service: { serviceId: service.serviceId, name: service.name, category: service.category },
      vehicle: caseRow.vehicle
        ? { vehicleId: caseRow.vehicle.vehicleId, registrationNumber: caseRow.vehicle.registrationNumber, vehicleType: caseRow.vehicle.vehicleType }
        : null
    };
  }

  async listCases(userId: string): Promise<CaseRecord[]> {
    await this.requireUser(userId);
    const rows = await this.prisma.case.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return rows.map(toCaseRecord);
  }

  async createCase(input: CaseSubmissionRequest): Promise<CaseRecord> {
    await this.requireUser(input.userId);

    const service = this.services.find((item) => item.serviceId === input.serviceId);
    if (!service) {
      throw new NotFoundException(`Service ${input.serviceId} was not found.`);
    }
    if (service.delivery !== 'guided') {
      throw new BadRequestException(`${service.name} is an official-portal service; it cannot open a case in this app.`);
    }

    if (input.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { vehicleId: input.vehicleId } });
      if (!vehicle) {
        throw new NotFoundException(`Vehicle ${input.vehicleId} was not found.`);
      }
      if (vehicle.ownerId !== input.userId) {
        throw new NotFoundException('The selected vehicle is not available to this user.');
      }
    }

    const createdAt = new Date().toISOString();
    const draft = createCaseFromSubmission(input, {
      caseId: '', // assigned by the database below — Postgres, not an in-memory counter, is the single source of truth for case IDs now
      createdAt,
      slaDeadline: new Date(Date.now() + SLA_DURATION_MS).toISOString()
    });

    const created = await this.prisma.case.create({
      data: {
        type: draft.type,
        userId: draft.userId,
        vehicleId: draft.vehicleId ?? null,
        serviceId: draft.serviceId,
        stage: draft.stage,
        status: draft.status,
        slaDeadline: draft.slaDeadline ? new Date(draft.slaDeadline) : null,
        submissionData: toJson(draft.submissionData),
        stageHistory: toJson(draft.stageHistory),
        createdAt: new Date(draft.createdAt),
        updatedAt: new Date(draft.updatedAt)
      }
    });

    return toCaseRecord(created);
  }

  /** Minimal onboarding capability: lets a citizen add a vehicle to their own account. */
  async registerVehicle(input: { ownerId: string; registrationNumber: string; vehicleType: string }): Promise<VehicleRecord> {
    await this.requireUser(input.ownerId);

    const registrationNumber = input.registrationNumber.trim().toUpperCase();
    const existing = await this.prisma.vehicle.findUnique({ where: { registrationNumber } });
    if (existing) {
      throw new BadRequestException('A vehicle with this registration number is already on file.');
    }

    const created = await this.prisma.vehicle.create({
      data: {
        ownerId: input.ownerId,
        registrationNumber,
        vehicleType: input.vehicleType.trim(),
        documentStatus: toJson({})
      }
    });
    return toVehicleRecord(created);
  }

  async escalateCase(caseId: string, requestingUserId: string): Promise<CaseRecord> {
    const caseRow = await this.prisma.case.findUnique({ where: { caseId } });
    if (!caseRow) {
      throw new NotFoundException(`Case ${caseId} was not found.`);
    }
    if (caseRow.userId !== requestingUserId) {
      throw new ForbiddenException('This case does not belong to the requesting user.');
    }
    if (CLOSED_CASE_STATUSES.has(caseRow.status)) {
      throw new BadRequestException('This case is already closed and cannot be escalated.');
    }
    const stageHistory = caseRow.stageHistory as unknown as StageHistoryItem[];
    if (stageHistory.some((entry) => entry.note === ESCALATION_NOTE)) {
      throw new BadRequestException('This case has already been marked urgent.');
    }

    const at = new Date().toISOString();
    const updated = await this.prisma.case.update({
      where: { caseId },
      data: {
        stageHistory: toJson([...stageHistory, buildEscalationStageHistoryItem(caseRow.stage, at)]),
        updatedAt: new Date(at)
      }
    });

    return toCaseRecord(updated);
  }

  private async requireUser(userId: string): Promise<UserRow> {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} was not found.`);
    }
    return user;
  }
}
