export type CaseStatus = 'draft' | 'submitted' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'rejected';

export type CaseType = 'application' | 'challan' | 'grievance' | 'accident' | 'incident';

export type IntentConfidence = 'high' | 'medium' | 'low';

export interface UserProfile {
  userId: string;
  name: string;
  contact: string;
  preferredLanguage: string;
}

export interface VehicleRecord {
  vehicleId: string;
  ownerId: string;
  registrationNumber: string;
  vehicleType: string;
  documentStatus: {
    rc?: string;
    puc?: string;
    insurance?: string;
    fitness?: string;
    fastag?: string;
  };
}

export interface ServiceStep {
  id: string;
  title: string;
  fields: string[];
}

export interface ServiceDefinition {
  serviceId: string;
  name: string;
  category: string;
  steps: ServiceStep[];
  requiredDocuments: string[];
}

export interface IntentResolution {
  query: string;
  serviceId: string | null;
  serviceName: string | null;
  confidence: IntentConfidence;
  clarificationNeeded: boolean;
}

export type SubmissionValue = string | boolean | string[];

export type SubmissionData = Record<string, SubmissionValue>;

export interface CaseSubmissionRequest {
  userId: string;
  serviceId: string;
  vehicleId?: string;
  submissionData: SubmissionData;
}

export interface CaseRecord {
  caseId: string;
  type: CaseType;
  userId: string;
  vehicleId?: string | null;
  serviceId: string;
  stage: string;
  status: CaseStatus;
  slaDeadline?: string | null;
  submissionData: SubmissionData;
  stageHistory: StageHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StageHistoryItem {
  stage: string;
  at: string;
  note: string;
}

export interface MobilityScoreResult {
  score: number;
  reasons: string[];
}

export interface IdentityBundle {
  user: UserProfile;
  vehicles: VehicleRecord[];
  cases: CaseRecord[];
}

export interface CaseDetail extends CaseRecord {
  service: Pick<ServiceDefinition, 'serviceId' | 'name' | 'category'>;
  vehicle: Pick<VehicleRecord, 'vehicleId' | 'registrationNumber' | 'vehicleType'> | null;
}

export interface SeedData {
  users: UserProfile[];
  vehicles: VehicleRecord[];
  services: ServiceDefinition[];
  cases: CaseRecord[];
}
