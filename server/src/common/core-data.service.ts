import { Injectable, NotFoundException } from '@nestjs/common';
import {
  createCaseFromSubmission,
  getServiceById,
  seedData,
  type CaseDetail,
  type CaseRecord,
  type CaseSubmissionRequest,
  type IdentityBundle,
  type ServiceDefinition,
  type UserProfile,
  type VehicleRecord
} from '@parivahan/shared';

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

  private findUser(userId: string): UserProfile {
    const user = this.users.find((item) => item.userId === userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} was not found.`);
    }

    return user;
  }
}
