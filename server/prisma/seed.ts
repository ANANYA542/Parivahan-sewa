import { PrismaClient, Prisma } from '@prisma/client';
import { seedData } from '@parivahan/shared';

const prisma = new PrismaClient();

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function main() {
  for (const user of seedData.users) {
    await prisma.user.upsert({
      where: { userId: user.userId },
      update: { name: user.name, contact: user.contact, preferredLanguage: user.preferredLanguage },
      create: user
    });
  }

  for (const vehicle of seedData.vehicles) {
    await prisma.vehicle.upsert({
      where: { vehicleId: vehicle.vehicleId },
      update: {
        ownerId: vehicle.ownerId,
        registrationNumber: vehicle.registrationNumber,
        vehicleType: vehicle.vehicleType,
        documentStatus: toJson(vehicle.documentStatus)
      },
      create: { ...vehicle, documentStatus: toJson(vehicle.documentStatus) }
    });
  }

  for (const caseRecord of seedData.cases) {
    const values = {
      type: caseRecord.type,
      userId: caseRecord.userId,
      vehicleId: caseRecord.vehicleId,
      serviceId: caseRecord.serviceId,
      stage: caseRecord.stage,
      status: caseRecord.status,
      slaDeadline: caseRecord.slaDeadline ? new Date(caseRecord.slaDeadline) : null,
      submissionData: toJson(caseRecord.submissionData),
      stageHistory: toJson(caseRecord.stageHistory),
      createdAt: new Date(caseRecord.createdAt),
      updatedAt: new Date(caseRecord.updatedAt)
    };

    await prisma.case.upsert({
      where: { caseId: caseRecord.caseId },
      update: values,
      create: { caseId: caseRecord.caseId, ...values }
    });
  }
}

main()
  .then(() => console.log('Phase 1 seed data applied.'))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
