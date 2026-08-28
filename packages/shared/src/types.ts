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

export type ServiceDelivery = 'guided' | 'official_portal';

export interface ServiceDefinition {
  serviceId: string;
  name: string;
  category: string;
  description: string;
  delivery: ServiceDelivery;
  officialUrl?: string;
  steps: ServiceStep[];
  requiredDocuments: string[];
  /** Plain-language duration estimate shown on the journey preview, e.g. "5-8 minutes". Only set for guided services. */
  estimatedTime?: string;
  /**
   * Tap-to-select choices for specific fields, keyed by field name. When a
   * field has an entry here, the guided flow renders it as chips instead of
   * free text — used for structured fields (severity, weather, collision
   * type, ...) modelled on real-world reporting vocabulary rather than
   * open-ended prose.
   */
  fieldOptions?: Record<string, string[]>;
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

/** What a signed-in client actually sends — the server derives `userId` from the session token, never from the request body. */
export interface CaseSubmissionInput {
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

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface ComplianceAlert {
  alertId: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  vehicleId?: string;
  recommendedServiceId?: string;
}

export interface MobilityNudge {
  nudgeId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionServiceId?: string;
}

export type MobilityMapLayerId = 'accidents' | 'high-risk-zones' | 'safe-routes' | 'pollution-hotspots' | 'challan-zones';

export interface MobilityMapFeature {
  featureId: string;
  geometry: {
    type: 'Point' | 'LineString';
    coordinates: number[] | number[][];
  };
  properties: {
    title: string;
    detail: string;
    source: 'case-history' | 'reference-dataset';
    severity?: AlertSeverity;
  };
}

export interface MobilityMapLayer {
  layerId: MobilityMapLayerId;
  label: string;
  color: string;
  description: string;
  features: MobilityMapFeature[];
}

export interface MobilityIntelligenceSnapshot {
  userId: string;
  computedAt: string;
  score: MobilityScoreResult;
  complianceAlerts: ComplianceAlert[];
  nudges: MobilityNudge[];
  mapLayers: MobilityMapLayer[];
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

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  message: string;
  toolsUsed: string[];
  model: string;
  sessionId: string;
}

export interface PointsLedgerEntry {
  caseId: string;
  points: number;
  reason: string;
  status: 'active' | 'cleared';
}

export interface PointsLedger {
  userId: string;
  activePoints: number;
  entries: PointsLedgerEntry[];
  disclaimer: string;
}

export interface ScamSignal {
  signalId: string;
  title: string;
  guidance: string;
  severity: AlertSeverity;
}

export interface ComplianceSnapshot {
  pointsLedger: PointsLedger;
  scamSignals: ScamSignal[];
  disclaimer: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}

export interface AppNotification {
  notificationId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionServiceId?: string;
  caseId?: string;
  createdAt: string;
  read: boolean;
}
