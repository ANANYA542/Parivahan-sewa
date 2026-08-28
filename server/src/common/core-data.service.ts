import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  buildEscalationStageHistoryItem,
  ESCALATION_NOTE,
  createCaseFromSubmission,
  seedData,
  type CaseDetail,
  type CaseRecord,
  type CaseSubmissionRequest,
  type IdentityBundle,
  type ServiceDefinition,
  type UserProfile,
  type VehicleRecord
} from '@parivahan/shared';

const CLOSED_CASE_STATUSES = new Set(['resolved', 'rejected']);

const SLA_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

function copy<T>(value: T): T {
  return structuredClone(value);
}

@Injectable()
export class CoreDataService {
  private readonly users: UserProfile[] = copy(seedData.users);
  private readonly vehicles: VehicleRecord[] = copy(seedData.vehicles);
  private readonly services: ServiceDefinition[] = copy(seedData.services);
  private readonly cases: CaseRecord[] = copy(seedData.cases);

  getIdentityBundle(userId: string): IdentityBundle {
    const user = this.findUser(userId);
    const vehicles = this.vehicles.filter((vehicle) => vehicle.ownerId === userId);
    const cases = this.cases.filter((item) => item.userId === userId);

    return copy({ user, vehicles, cases });
  }

  getWorkflow(serviceId: string): ServiceDefinition {
    const service = this.services.find((item) => item.serviceId === serviceId);
    if (!service) {
      throw new NotFoundException(`Service ${serviceId} was not found.`);
    }

    return copy(service);
  }

  listServices(): ServiceDefinition[] {
    return copy([...this.services].sort((first, second) => first.name.localeCompare(second.name)));
  }

  listUserIds(): string[] {
    return this.users.map((user) => user.userId);
  }

  /** Demo-login directory only: the seed identities are entirely synthetic. */
  listUsersPublic(): UserProfile[] {
    return copy([...this.users].sort((first, second) => first.name.localeCompare(second.name)));
  }

  findUserByContact(contact: string): UserProfile | undefined {
    const normalized = contact.trim().toLowerCase();
    const user = this.users.find((item) => item.contact.trim().toLowerCase() === normalized);
    return user ? copy(user) : undefined;
  }

  registerUser(input: { name: string; contact: string; preferredLanguage?: string }): UserProfile {
    const normalizedContact = input.contact.trim();
    if (!normalizedContact) {
      throw new BadRequestException('Contact number is required.');
    }
    const existing = this.users.find(
      (item) => item.contact.trim().toLowerCase() === normalizedContact.toLowerCase()
    );
    if (existing) {
      throw new BadRequestException('An account with this contact number already exists. Please sign in.');
    }

    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Full name is required.');
    }

    const userId = `user-${String(this.users.length + 1).padStart(3, '0')}`;
    const newUser: UserProfile = {
      userId,
      name: trimmedName,
      contact: normalizedContact,
      preferredLanguage: input.preferredLanguage?.trim() || 'en'
    };

    this.users.push(newUser);
    return copy(newUser);
  }

  getCase(caseId: string): CaseDetail {
    const caseRecord = this.cases.find((item) => item.caseId === caseId);
    if (!caseRecord) {
      throw new NotFoundException(`Case ${caseId} was not found.`);
    }

    const service = this.services.find((item) => item.serviceId === caseRecord.serviceId);
    if (!service) {
      throw new NotFoundException(`Service for case ${caseId} was not found.`);
    }

    const vehicle = caseRecord.vehicleId
      ? this.vehicles.find((item) => item.vehicleId === caseRecord.vehicleId) ?? null
      : null;

    return copy({
      ...caseRecord,
      service: {
        serviceId: service.serviceId,
        name: service.name,
        category: service.category
      },
      vehicle: vehicle
        ? {
            vehicleId: vehicle.vehicleId,
            registrationNumber: vehicle.registrationNumber,
            vehicleType: vehicle.vehicleType
          }
        : null
    });
  }

  listCases(userId: string): CaseRecord[] {
    this.findUser(userId);
    return copy(this.cases.filter((item) => item.userId === userId));
  }

  createCase(input: CaseSubmissionRequest): CaseRecord {
    this.findUser(input.userId);

    const service = this.services.find((item) => item.serviceId === input.serviceId);
    if (!service) {
      throw new NotFoundException(`Service ${input.serviceId} was not found.`);
    }
    if (service.delivery !== 'guided') {
      throw new BadRequestException(`${service.name} is an official-portal service; it cannot open a case in this app.`);
    }

    if (input.vehicleId) {
      const vehicle = this.vehicles.find((item) => item.vehicleId === input.vehicleId);
      if (!vehicle) {
        throw new NotFoundException(`Vehicle ${input.vehicleId} was not found.`);
      }
      if (vehicle.ownerId !== input.userId) {
        throw new NotFoundException('The selected vehicle is not available to this user.');
      }
    }

    const createdAt = new Date().toISOString();
    const caseRecord = createCaseFromSubmission(input, {
      caseId: `case-${String(this.cases.length + 1).padStart(3, '0')}`,
      createdAt,
      slaDeadline: new Date(Date.now() + SLA_DURATION_MS).toISOString()
    });

    this.cases.unshift(caseRecord);
    return copy(caseRecord);
  }

  /** Minimal onboarding capability: lets a citizen add a vehicle to their own account. */
  registerVehicle(input: { ownerId: string; registrationNumber: string; vehicleType: string }): VehicleRecord {
    this.findUser(input.ownerId);

    const registrationNumber = input.registrationNumber.trim().toUpperCase();
    const existing = this.vehicles.find((item) => item.registrationNumber.trim().toUpperCase() === registrationNumber);
    if (existing) {
      throw new BadRequestException('A vehicle with this registration number is already on file.');
    }

    const vehicle: VehicleRecord = {
      vehicleId: `veh-${String(this.vehicles.length + 1).padStart(3, '0')}`,
      ownerId: input.ownerId,
      registrationNumber,
      vehicleType: input.vehicleType.trim(),
      documentStatus: {}
    };

    this.vehicles.push(vehicle);
    return copy(vehicle);
  }

  escalateCase(caseId: string, requestingUserId: string): CaseRecord {
    const caseRecord = this.cases.find((item) => item.caseId === caseId);
    if (!caseRecord) {
      throw new NotFoundException(`Case ${caseId} was not found.`);
    }
    if (caseRecord.userId !== requestingUserId) {
      throw new ForbiddenException('This case does not belong to the requesting user.');
    }
    if (CLOSED_CASE_STATUSES.has(caseRecord.status)) {
      throw new BadRequestException('This case is already closed and cannot be escalated.');
    }
    if (caseRecord.stageHistory.some((entry) => entry.note === ESCALATION_NOTE)) {
      throw new BadRequestException('This case has already been marked urgent.');
    }

    const at = new Date().toISOString();
    caseRecord.stageHistory.push(buildEscalationStageHistoryItem(caseRecord.stage, at));
    caseRecord.updatedAt = at;

    return copy(caseRecord);
  }

  private findUser(userId: string): UserProfile {
    const user = this.users.find((item) => item.userId === userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} was not found.`);
    }

    return user;
  }
}
