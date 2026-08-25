import type {
  CaseRecord,
  CaseType,
  CaseSubmissionRequest,
  IdentityBundle,
  IntentResolution,
  MobilityScoreResult,
  SeedData,
  ServiceDefinition,
  StageHistoryItem,
  UserProfile,
  VehicleRecord
} from './types.js';

export const seedData: SeedData = {
  users: [
    {
      userId: 'user-001',
      name: 'Ananya Sharma',
      contact: '+91-90000-00001',
      preferredLanguage: 'en'
    }
  ],
  vehicles: [
    {
      vehicleId: 'veh-001',
      ownerId: 'user-001',
      registrationNumber: 'MH12AB1234',
      vehicleType: 'private-car',
      documentStatus: {
        rc: 'active',
        puc: 'expired',
        insurance: 'active',
        fitness: 'active',
        fastag: 'active'
      }
    }
  ],
  services: [
    {
      serviceId: 'svc-renew-puc',
      name: 'PUC Renewal',
      category: 'compliance',
      steps: [
        { id: 'preview', title: 'Preview journey', fields: [] },
        { id: 'vehicle', title: 'Select vehicle', fields: ['vehicleId'] },
        { id: 'test-center', title: 'Choose test center', fields: ['testCenter'] },
        { id: 'confirm', title: 'Confirm and submit', fields: ['acknowledgement'] }
      ],
      requiredDocuments: ['Registration Certificate', 'Existing PUC']
    },
    {
      serviceId: 'svc-challan-dispute',
      name: 'Challan Dispute',
      category: 'grievance',
      steps: [
        { id: 'preview', title: 'Review dispute summary', fields: [] },
        { id: 'challan', title: 'Enter challan details', fields: ['challanNumber'] },
        { id: 'evidence', title: 'Attach evidence', fields: ['attachments'] },
        { id: 'confirm', title: 'Submit dispute', fields: ['declaration'] }
      ],
      requiredDocuments: ['Challan Notice', 'Evidence Files']
    },
    {
      serviceId: 'svc-accident-report',
      name: 'Accident Report',
      category: 'incident',
      steps: [
        { id: 'preview', title: 'Review incident intake', fields: [] },
        { id: 'incident', title: 'Capture incident details', fields: ['location', 'time'] },
        { id: 'people', title: 'Record people involved', fields: ['injuries', 'vehicles'] },
        { id: 'confirm', title: 'Submit report', fields: ['declaration'] }
      ],
      requiredDocuments: ['Incident details']
    }
  ],
  cases: [
    {
      caseId: 'case-001',
      type: 'application',
      userId: 'user-001',
      vehicleId: 'veh-001',
      serviceId: 'svc-renew-puc',
      stage: 'submitted',
      status: 'in_progress',
      slaDeadline: '2026-08-28T10:00:00.000Z',
      submissionData: { testCenter: 'Pune Central Testing Centre', acknowledgement: true },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-22T09:30:00.000Z', note: 'Application submitted' },
        { stage: 'under_review', at: '2026-08-22T10:00:00.000Z', note: 'Assigned to the reviewing authority' }
      ],
      createdAt: '2026-08-22T09:30:00.000Z',
      updatedAt: '2026-08-22T10:00:00.000Z'
    },
    {
      caseId: 'case-002',
      type: 'challan',
      userId: 'user-001',
      vehicleId: 'veh-001',
      serviceId: 'svc-challan-dispute',
      stage: 'waiting_for_user',
      status: 'waiting_for_user',
      slaDeadline: '2026-08-26T10:00:00.000Z',
      submissionData: { challanNumber: 'MH-PN-2026-1148', attachments: ['dashcam-summary.pdf'], declaration: true },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-20T11:00:00.000Z', note: 'Dispute submitted' },
        { stage: 'waiting_for_user', at: '2026-08-21T08:00:00.000Z', note: 'Evidence clarification requested' }
      ],
      createdAt: '2026-08-20T11:00:00.000Z',
      updatedAt: '2026-08-21T08:00:00.000Z'
    },
    {
      caseId: 'case-003',
      type: 'accident',
      userId: 'user-001',
      vehicleId: 'veh-001',
      serviceId: 'svc-accident-report',
      stage: 'resolved',
      status: 'resolved',
      slaDeadline: '2026-08-24T10:00:00.000Z',
      submissionData: { location: 'Pune, Maharashtra', time: '2026-08-15 18:30', injuries: 'None', vehicles: '1', declaration: true },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-15T13:00:00.000Z', note: 'Incident report submitted' },
        { stage: 'resolved', at: '2026-08-17T09:00:00.000Z', note: 'Report acknowledged and closed' }
      ],
      createdAt: '2026-08-15T13:00:00.000Z',
      updatedAt: '2026-08-17T09:00:00.000Z'
    }
  ]
};

export function getUserById(userId: string): UserProfile | undefined {
  return seedData.users.find((user) => user.userId === userId);
}

export function getVehicleById(vehicleId: string): VehicleRecord | undefined {
  return seedData.vehicles.find((vehicle) => vehicle.vehicleId === vehicleId);
}

export function getServiceById(serviceId: string): ServiceDefinition | undefined {
  return seedData.services.find((service) => service.serviceId === serviceId);
}

export function getCasesByUser(userId: string): CaseRecord[] {
  return seedData.cases.filter((item) => item.userId === userId);
}

export function getIdentityBundle(userId: string): IdentityBundle {
  const user = getUserById(userId);
  if (!user) {
    throw new Error(`Unknown user: ${userId}`);
  }

  const vehicles = seedData.vehicles.filter((vehicle) => vehicle.ownerId === userId);
  const cases = getCasesByUser(userId);

  return { user, vehicles, cases };
}

export function resolveIntent(query: string): IntentResolution {
  const normalized = query.toLowerCase();
  if (normalized.includes('puc') || normalized.includes('pollution')) {
    return {
      query,
      serviceId: 'svc-renew-puc',
      serviceName: 'PUC Renewal',
      confidence: 'high',
      clarificationNeeded: false
    };
  }

  if (normalized.includes('challan') || normalized.includes('fine') || normalized.includes('ticket')) {
    return {
      query,
      serviceId: 'svc-challan-dispute',
      serviceName: 'Challan Dispute',
      confidence: 'high',
      clarificationNeeded: false
    };
  }

  if (normalized.includes('accident') || normalized.includes('incident') || normalized.includes('crash')) {
    return {
      query,
      serviceId: 'svc-accident-report',
      serviceName: 'Accident Report',
      confidence: 'high',
      clarificationNeeded: false
    };
  }

  return {
    query,
    serviceId: null,
    serviceName: null,
    confidence: 'low',
    clarificationNeeded: true
  };
}

export function buildJourney(serviceId: string): ServiceDefinition {
  const service = getServiceById(serviceId);
  if (!service) {
    throw new Error(`Unknown service: ${serviceId}`);
  }

  return service;
}

export function inferCaseType(serviceId: string): CaseType {
  if (serviceId === 'svc-challan-dispute') return 'challan';
  if (serviceId === 'svc-accident-report') return 'accident';
  return 'application';
}

export function createCaseFromSubmission(
  input: CaseSubmissionRequest,
  options: { caseId: string; createdAt: string; slaDeadline: string }
): CaseRecord {
  return {
    caseId: options.caseId,
    type: inferCaseType(input.serviceId),
    userId: input.userId,
    vehicleId: input.vehicleId ?? null,
    serviceId: input.serviceId,
    stage: 'submitted',
    status: 'submitted',
    slaDeadline: options.slaDeadline,
    submissionData: input.submissionData,
    stageHistory: [{ stage: 'submitted', at: options.createdAt, note: 'Submission received' }],
    createdAt: options.createdAt,
    updatedAt: options.createdAt
  };
}

export function computeMobilityScore(bundle: IdentityBundle): MobilityScoreResult {
  const vehicle = bundle.vehicles[0];
  const cases = bundle.cases;
  let score = 92;
  const reasons: string[] = [];

  if (vehicle?.documentStatus.puc === 'expired') {
    score -= 18;
    reasons.push('Expired PUC');
  }

  if (cases.some((item) => item.type === 'challan' && item.status !== 'resolved')) {
    score -= 10;
    reasons.push('Pending challan matter');
  }

  if (cases.some((item) => item.type === 'accident')) {
    score -= 8;
    reasons.push('Recent accident history');
  }

  if (score < 0) score = 0;

  return { score, reasons: reasons.length > 0 ? reasons : ['All core documents active'] };
}

export function buildStageHistory(caseRecord: CaseRecord): StageHistoryItem[] {
  return caseRecord.stageHistory;
}
