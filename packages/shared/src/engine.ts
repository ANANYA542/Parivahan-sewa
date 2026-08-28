import type {
  AppNotification,
  CaseRecord,
  CaseType,
  CaseSubmissionRequest,
  ComplianceAlert,
  IdentityBundle,
  IntentResolution,
  MobilityScoreResult,
  MobilityMapLayer,
  MobilityNudge,
  SeedData,
  ServiceDefinition,
  StageHistoryItem,
  UserProfile,
  VehicleRecord
} from './types.js';

const CLOSED_CASE_STATUSES = new Set(['resolved', 'rejected']);
const SLA_REMINDER_WINDOW_MS = 48 * 60 * 60 * 1000;

const PARIVAHAN_HOME_URL = 'https://parivahan.gov.in/parivahan/en';
const VAHAN_SERVICE_URL = 'https://vahan.parivahan.gov.in/vahanservice/vahan/';
const SARATHI_SERVICE_URL = 'https://sarathi.parivahan.gov.in/sarathiservice/stateSelectBean.do';
const ECHALLAN_URL = 'https://echallan.parivahan.gov.in/';
const PUCC_URL = 'https://pucc.parivahan.gov.in/';
const OTHER_SERVICES_URL = 'https://parivahan.gov.in/parivahan/en/content/other-services-page';

function officialService(
  serviceId: string,
  name: string,
  category: string,
  description: string,
  officialUrl: string
): ServiceDefinition {
  return {
    serviceId,
    name,
    category,
    description,
    delivery: 'official_portal',
    officialUrl,
    steps: [],
    requiredDocuments: []
  };
}

const CATEGORY_DEFAULT_DOCUMENTS: Record<string, string[]> = {
  'driving-licence': ['Existing licence or learner licence, if any', 'Identity proof'],
  'vehicle-registration': ['Registration Certificate', 'Identity proof'],
  'permit-and-tax': ['Registration Certificate', 'Proof of payment, if applicable'],
  'business-and-manufacturer': ['Business registration documents', 'Identity proof'],
  'digital-services': ['Registration Certificate']
};

/**
 * A generic, honest guided intake for real government processes this
 * prototype hasn't modelled bespoke fields for — same preview -> guided
 * form -> submit -> tracked case -> downloadable-copy pipeline as the four
 * flagship services, just without service-specific field vocabulary. The
 * official URL is kept as a companion reference (surfaced in the journey
 * preview and the official-portal step patterns elsewhere), not replaced —
 * this in-app copy is framed the same way the accident-report PDF already
 * is: a citizen's own record, not an official government submission.
 */
function guidedApplicationService(
  serviceId: string,
  name: string,
  category: string,
  description: string,
  officialUrl: string,
  options: { requiresVehicle?: boolean; requiredDocuments?: string[]; officialForm?: ServiceDefinition['officialForm'] } = {}
): ServiceDefinition {
  const vehicleStep = options.requiresVehicle ? [{ id: 'vehicle', title: 'Select vehicle', fields: ['vehicleId'] }] : [];
  return {
    serviceId,
    name,
    category,
    description,
    delivery: 'guided',
    officialUrl,
    steps: [
      { id: 'preview', title: 'Preview journey', fields: [] },
      ...vehicleStep,
      { id: 'details', title: 'Provide request details', fields: ['requestDetails'] },
      { id: 'attachments', title: 'Attach supporting documents', fields: ['attachments'] },
      { id: 'confirm', title: 'Confirm and submit', fields: ['acknowledgement'] }
    ],
    requiredDocuments: options.requiredDocuments ?? CATEGORY_DEFAULT_DOCUMENTS[category] ?? ['Identity proof'],
    estimatedTime: '5-10 minutes',
    ...(options.officialForm ? { officialForm: options.officialForm } : {})
  };
}

/** The real, manually-verified Form 2 covers seven distinct licence services via its own tick-box list — see forms-metadata.ts. */
const FORM_2: ServiceDefinition['officialForm'] = { formNumber: 'Form 2', title: "Application for Learner's/Driving Licence, Renewal, Duplicate, or Change of Address/Name", path: '/forms/FORM-2.pdf' };

export const serviceCatalog: ServiceDefinition[] = [
  {
    serviceId: 'svc-renew-puc',
    name: 'PUC Renewal',
    category: 'compliance',
    description: 'Prepare a PUC renewal request and keep the linked vehicle record ready.',
    delivery: 'guided',
    officialUrl: PUCC_URL,
    steps: [
      { id: 'preview', title: 'Preview journey', fields: [] },
      { id: 'vehicle', title: 'Select vehicle', fields: ['vehicleId'] },
      { id: 'test-center', title: 'Choose test center', fields: ['testCenter'] },
      { id: 'confirm', title: 'Confirm and submit', fields: ['acknowledgement'] }
    ],
    requiredDocuments: ['Registration Certificate', 'Existing PUC'],
    estimatedTime: '5-8 minutes',
    officialForm: { formNumber: 'Form 59', title: 'Pollution Under Control Certificate (reference format — issued after testing, not a form you fill in)', path: '/forms/FORM-59.pdf' }
  },
  {
    serviceId: 'svc-challan-dispute',
    name: 'Challan Dispute',
    category: 'case-management',
    description: 'Create a tracked dispute intake for a traffic enforcement matter.',
    delivery: 'guided',
    officialUrl: ECHALLAN_URL,
    steps: [
      { id: 'preview', title: 'Review dispute summary', fields: [] },
      { id: 'challan', title: 'Enter challan details', fields: ['challanNumber', 'licenceNumber'] },
      { id: 'reason', title: 'Explain the dispute', fields: ['issueType', 'reason'] },
      { id: 'evidence', title: 'Attach evidence', fields: ['attachments'] },
      { id: 'confirm', title: 'Submit dispute', fields: ['declaration'] }
    ],
    requiredDocuments: ['Challan Notice', 'Evidence Files'],
    estimatedTime: '8-12 minutes',
    fieldOptions: {
      issueType: ['Incorrect vehicle number', 'Wrong violation recorded', 'Vehicle not at that location/time', 'Already paid', 'Other']
    }
  },
  {
    // Field vocabulary (area type, weather, collision type, hit & run,
    // injury severity) follows MoRTH's Road Accident Recording Form —
    // the format India's police actually use at the scene — curated down
    // from its ~30 fields to what a citizen can complete in under a
    // minute. There is no citizen-facing official equivalent of this
    // service anywhere in Parivahan/Vahan/Sarathi today; accident
    // reporting is otherwise a police-station, paper-only process.
    serviceId: 'svc-accident-report',
    name: 'Accident Report',
    category: 'case-management',
    description: 'Create a structured incident intake and retain its case history.',
    delivery: 'guided',
    steps: [
      { id: 'preview', title: 'Review incident intake', fields: [] },
      { id: 'incident', title: 'Capture incident details', fields: ['location', 'time'] },
      { id: 'context', title: 'Describe the conditions', fields: ['areaType', 'weather', 'collisionType', 'hitAndRun'] },
      { id: 'people', title: 'Record people and vehicles involved', fields: ['injurySeverity', 'vehiclesInvolved'] },
      { id: 'confirm', title: 'Submit report', fields: ['declaration'] }
    ],
    requiredDocuments: ['Incident details'],
    estimatedTime: '6-10 minutes',
    fieldOptions: {
      areaType: ['Urban', 'Rural'],
      weather: ['Sunny / clear', 'Rainy', 'Foggy / misty', 'Other'],
      collisionType: ['Vehicle to vehicle', 'Vehicle to pedestrian', 'Vehicle to two-wheeler / bicycle', 'Hit parked vehicle or object', 'Vehicle overturned', 'Other'],
      hitAndRun: ['No', 'Yes'],
      injurySeverity: ['No injury', 'Minor injury', 'Grievous injury (hospitalised)', 'Fatal']
    }
  },
  {
    serviceId: 'svc-grievance-report',
    name: 'Transport Grievance',
    category: 'case-management',
    description: 'Create a tracked grievance for a transport-service issue.',
    delivery: 'guided',
    steps: [
      { id: 'preview', title: 'Review grievance intake', fields: [] },
      { id: 'details', title: 'Describe the issue', fields: ['category', 'subject', 'description'] },
      { id: 'evidence', title: 'Attach supporting details', fields: ['attachments'] },
      { id: 'confirm', title: 'Submit grievance', fields: ['declaration'] }
    ],
    requiredDocuments: ['Supporting evidence, if available'],
    estimatedTime: '5-8 minutes',
    fieldOptions: {
      category: ['Service delay', 'Incorrect fee or challan', 'Staff conduct', 'Document or records error', 'Other']
    }
  },
  guidedApplicationService('svc-learner-licence', 'Learner Licence', 'driving-licence', 'Apply for a learner licence through Sarathi.', SARATHI_SERVICE_URL, { officialForm: FORM_2 }),
  guidedApplicationService('svc-driving-licence', 'Driving Licence', 'driving-licence', 'Apply for a new driving licence through Sarathi.', SARATHI_SERVICE_URL, { officialForm: FORM_2 }),
  guidedApplicationService('svc-dl-online-test-appointment', 'DL Online Test and Appointment', 'driving-licence', 'Book or modify learner and driving licence test appointments.', SARATHI_SERVICE_URL),
  guidedApplicationService('svc-application-status', 'Application Status', 'driving-licence', 'Check the status of a driving licence or learner licence application.', SARATHI_SERVICE_URL),
  guidedApplicationService('svc-dl-renewal', 'Driving Licence Renewal', 'driving-licence', 'Renew an existing driving licence.', SARATHI_SERVICE_URL, { officialForm: FORM_2 }),
  guidedApplicationService('svc-dl-duplicate', 'Duplicate Driving Licence', 'driving-licence', 'Apply for a duplicate driving licence.', SARATHI_SERVICE_URL, { officialForm: FORM_2 }),
  guidedApplicationService('svc-dl-add-class', 'Addition of Vehicle Class to DL', 'driving-licence', 'Add an eligible class of vehicle to a driving licence.', SARATHI_SERVICE_URL, { officialForm: FORM_2 }),
  guidedApplicationService('svc-dl-change-address', 'Change or Correction of DL Address', 'driving-licence', 'Update the address recorded on a driving licence.', SARATHI_SERVICE_URL, { officialForm: FORM_2 }),
  guidedApplicationService('svc-dl-change-name', 'Change or Correction of DL Name', 'driving-licence', 'Request a name correction on a driving licence.', SARATHI_SERVICE_URL, { officialForm: FORM_2 }),
  guidedApplicationService('svc-driving-school', 'Driving School Licence', 'driving-licence', 'Apply for and manage driving school licensing services.', SARATHI_SERVICE_URL, { officialForm: { formNumber: 'Form 12', title: 'Application for Licence to Engage in the Business of Imparting Driving Instructions', path: '/forms/FORM-12.pdf' } }),
  guidedApplicationService('svc-vehicle-registration', 'Vehicle Registration', 'vehicle-registration', 'Access registration and registered-vehicle citizen services.', VAHAN_SERVICE_URL),
  guidedApplicationService('svc-vehicle-noc', 'No Objection Certificate', 'vehicle-registration', 'Apply online for a vehicle no objection certificate.', VAHAN_SERVICE_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-hypothecation', 'Hypothecation Services', 'vehicle-registration', 'Manage hypothecation entry, continuation, and termination services.', VAHAN_SERVICE_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-rc-renewal', 'Renewal of Registration', 'vehicle-registration', 'Renew a vehicle registration certificate.', VAHAN_SERVICE_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-duplicate-rc', 'Duplicate RC', 'vehicle-registration', 'Apply for a duplicate registration certificate.', VAHAN_SERVICE_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-transfer-ownership', 'Transfer of Ownership', 'vehicle-registration', 'Apply to transfer vehicle ownership.', VAHAN_SERVICE_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-change-vehicle-address', 'Change of Vehicle Address', 'vehicle-registration', 'Update the address recorded on a vehicle registration.', VAHAN_SERVICE_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-vehicle-conversion', 'Conversion of Vehicle', 'vehicle-registration', 'Apply to change the vehicle type or class.', VAHAN_SERVICE_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-rc-cancellation', 'RC Cancellation', 'vehicle-registration', 'Apply to cancel a vehicle registration certificate.', VAHAN_SERVICE_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-fancy-number', 'Online Fancy Number', 'vehicle-registration', 'Bid for and purchase a choice registration number.', OTHER_SERVICES_URL),
  guidedApplicationService('svc-national-permit', 'National Permit', 'permit-and-tax', 'Apply for a national permit, check status, and print receipts.', OTHER_SERVICES_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-aitp-authorization', 'AITP Authorization', 'permit-and-tax', 'Manage all-India tourist permit authorization.', VAHAN_SERVICE_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-fitness', 'Fitness', 'permit-and-tax', 'Book a fitness test appointment and make related payments.', OTHER_SERVICES_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-tax-and-fee', 'Tax and Fee', 'permit-and-tax', 'Access vehicle tax and fee payment services.', OTHER_SERVICES_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-online-checkpost-tax', 'Online CheckPost Tax', 'permit-and-tax', 'Use the common platform for checkpost tax services.', OTHER_SERVICES_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-dealer-registration', 'Dealer Registration', 'business-and-manufacturer', 'Register dealers and access vehicle-registration enquiries.', OTHER_SERVICES_URL),
  guidedApplicationService('svc-trade-certificate', 'Trade Certificate', 'business-and-manufacturer', 'Apply for dealer trade certificate services and payments.', OTHER_SERVICES_URL, { officialForm: { formNumber: 'Form 18', title: 'Intimation of Loss/Destruction of a Trade Certificate and Application for Duplicate', path: '/forms/FORM-18.pdf' } }),
  guidedApplicationService('svc-vltd', 'Vehicle Location Tracking Device', 'business-and-manufacturer', 'Access VLTD maker and tracking ecosystem services.', OTHER_SERVICES_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-speed-limiting-device', 'Speed Limiting Device', 'business-and-manufacturer', 'Manage speed limiting device inventory and tracking.', OTHER_SERVICES_URL, { requiresVehicle: true }),
  guidedApplicationService('svc-cng-maker', 'CNG Maker', 'business-and-manufacturer', 'Access CNG kit manufacturer services.', PARIVAHAN_HOME_URL),
  guidedApplicationService('svc-homologation', 'Homologation', 'business-and-manufacturer', 'Manage manufacturer vehicle approval lifecycle services.', OTHER_SERVICES_URL),
  guidedApplicationService('svc-vahan-green-sewa', 'Vahan Green Sewa', 'digital-services', 'Manage CNG and related green-device fitment processes.', OTHER_SERVICES_URL, { requiresVehicle: true }),
  officialService('svc-mparivahan', 'mParivahan', 'digital-services', 'Access virtual document wallet and mobility information services.', PARIVAHAN_HOME_URL),
  officialService('svc-echallan', 'eChallan', 'digital-services', 'Check and manage traffic enforcement challans.', ECHALLAN_URL),
  officialService('svc-license-registration-details', 'Licence and Registration Details', 'information', 'Look up basic licence and vehicle registration details.', PARIVAHAN_HOME_URL),
  officialService('svc-citizen-guide', 'Citizen Guide', 'information', 'Read the official guide to commonly used transport services.', PARIVAHAN_HOME_URL),
  officialService('svc-notifications-advisories', 'Notifications and Advisories', 'information', 'Review transport notifications and advisories.', PARIVAHAN_HOME_URL),
  officialService('svc-faq', 'Frequently Asked Questions', 'information', 'Find official answers to common service questions.', PARIVAHAN_HOME_URL),
  officialService('svc-vahan-dashboard', 'VAHAN Dashboard', 'dashboards', 'View national vehicle registration and related-service dashboards.', PARIVAHAN_HOME_URL),
  officialService('svc-sarathi-dashboard', 'Sarathi Dashboard', 'dashboards', 'View licence issuance and permit dashboards.', PARIVAHAN_HOME_URL),
  officialService('svc-homologation-dashboard', 'Homologation Dashboard', 'dashboards', 'View homologation dashboard data.', PARIVAHAN_HOME_URL),
  officialService('svc-vltd-dashboard', 'VLTD Dashboard', 'dashboards', 'View national VLTD ecosystem dashboards.', PARIVAHAN_HOME_URL)
];

export const seedData: SeedData = {
  users: [
    {
      userId: 'user-001',
      name: 'Ananya Sharma',
      contact: '+91-90000-00001',
      preferredLanguage: 'en'
    },
    { userId: 'user-002', name: 'Rohan Mehta', contact: '+91-90000-00002', preferredLanguage: 'hi' },
    { userId: 'user-003', name: 'Fatima Khan', contact: '+91-90000-00003', preferredLanguage: 'en' },
    { userId: 'user-004', name: 'Arjun Iyer', contact: '+91-90000-00004', preferredLanguage: 'ta' },
    { userId: 'user-005', name: 'Neha Verma', contact: '+91-90000-00005', preferredLanguage: 'hi' },
    { userId: 'user-006', name: 'Karan Singh', contact: '+91-90000-00006', preferredLanguage: 'en' }
  ],
  vehicles: [
    {
      vehicleId: 'veh-001',
      ownerId: 'user-001',
      registrationNumber: 'MH12AB1234',
      vehicleType: 'private-car',
      documentStatus: { rc: 'active', puc: 'expired', insurance: 'active', fitness: 'active', fastag: 'active' }
    },
    {
      vehicleId: 'veh-002',
      ownerId: 'user-001',
      registrationNumber: 'MH14CD5678',
      vehicleType: 'two-wheeler',
      documentStatus: { rc: 'active', puc: 'active', insurance: 'expiring-soon', fitness: 'not-applicable', fastag: 'not-applicable' }
    },
    {
      vehicleId: 'veh-003',
      ownerId: 'user-002',
      registrationNumber: 'DL01EF9087',
      vehicleType: 'private-car',
      documentStatus: { rc: 'active', puc: 'active', insurance: 'active', fitness: 'active', fastag: 'active' }
    },
    {
      vehicleId: 'veh-004',
      ownerId: 'user-003',
      registrationNumber: 'KA03GH2468',
      vehicleType: 'transport-goods-carrier',
      documentStatus: { rc: 'active', puc: 'active', insurance: 'active', fitness: 'due-soon', fastag: 'active' }
    },
    {
      vehicleId: 'veh-005',
      ownerId: 'user-004',
      registrationNumber: 'TN09JK1357',
      vehicleType: 'electric-car',
      documentStatus: { rc: 'active', puc: 'not-applicable', insurance: 'active', fitness: 'active', fastag: 'active' }
    },
    {
      vehicleId: 'veh-006',
      ownerId: 'user-005',
      registrationNumber: 'UP32LM8642',
      vehicleType: 'private-car',
      documentStatus: { rc: 'renewal-due', puc: 'expired', insurance: 'expired', fitness: 'active', fastag: 'active' }
    },
    {
      vehicleId: 'veh-007',
      ownerId: 'user-006',
      registrationNumber: 'RJ14NP9753',
      vehicleType: 'passenger-bus',
      documentStatus: { rc: 'active', puc: 'active', insurance: 'active', fitness: 'expired', fastag: 'active' }
    },
    {
      vehicleId: 'veh-008',
      ownerId: 'user-003',
      registrationNumber: 'KA05QR4321',
      vehicleType: 'three-wheeler',
      documentStatus: { rc: 'active', puc: 'active', insurance: 'active', fitness: 'active', fastag: 'not-applicable' }
    }
  ],
  services: serviceCatalog,
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
    },
    {
      caseId: 'case-004', type: 'application', userId: 'user-001', vehicleId: 'veh-002', serviceId: 'svc-transfer-ownership',
      stage: 'draft', status: 'draft', slaDeadline: null,
      submissionData: { buyerName: 'Sample Buyer', acknowledgement: false },
      stageHistory: [{ stage: 'draft', at: '2026-08-23T12:00:00.000Z', note: 'Ownership transfer draft saved' }],
      createdAt: '2026-08-23T12:00:00.000Z', updatedAt: '2026-08-23T12:00:00.000Z'
    },
    {
      caseId: 'case-005', type: 'application', userId: 'user-002', vehicleId: 'veh-003', serviceId: 'svc-change-vehicle-address',
      stage: 'under_review', status: 'in_progress', slaDeadline: '2026-08-29T10:00:00.000Z',
      submissionData: { newAddress: 'Sample address, New Delhi', acknowledgement: true },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-23T10:30:00.000Z', note: 'Address-change application submitted' },
        { stage: 'under_review', at: '2026-08-24T08:15:00.000Z', note: 'Application queued for review' }
      ],
      createdAt: '2026-08-23T10:30:00.000Z', updatedAt: '2026-08-24T08:15:00.000Z'
    },
    {
      caseId: 'case-006', type: 'application', userId: 'user-003', vehicleId: 'veh-004', serviceId: 'svc-fitness',
      stage: 'waiting_for_user', status: 'waiting_for_user', slaDeadline: '2026-08-27T09:00:00.000Z',
      submissionData: { testStation: 'Sample Fitness Centre', appointmentDate: '2026-08-26', declaration: true },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-21T09:00:00.000Z', note: 'Fitness application submitted' },
        { stage: 'waiting_for_user', at: '2026-08-22T11:30:00.000Z', note: 'Fitness appointment confirmation required' }
      ],
      createdAt: '2026-08-21T09:00:00.000Z', updatedAt: '2026-08-22T11:30:00.000Z'
    },
    {
      caseId: 'case-007', type: 'application', userId: 'user-003', vehicleId: 'veh-008', serviceId: 'svc-tax-and-fee',
      stage: 'resolved', status: 'resolved', slaDeadline: '2026-08-20T10:00:00.000Z',
      submissionData: { taxPeriod: 'FY 2026-27', paymentReference: 'SAMPLE-TAX-001' },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-18T10:00:00.000Z', note: 'Tax payment request initiated' },
        { stage: 'resolved', at: '2026-08-18T10:05:00.000Z', note: 'Payment receipt generated' }
      ],
      createdAt: '2026-08-18T10:00:00.000Z', updatedAt: '2026-08-18T10:05:00.000Z'
    },
    {
      caseId: 'case-008', type: 'application', userId: 'user-004', vehicleId: 'veh-005', serviceId: 'svc-vahan-green-sewa',
      stage: 'submitted', status: 'in_progress', slaDeadline: '2026-08-31T10:00:00.000Z',
      submissionData: { fitmentType: 'Electric retrofit enquiry', acknowledgement: true },
      stageHistory: [{ stage: 'submitted', at: '2026-08-24T10:00:00.000Z', note: 'Green mobility service enquiry submitted' }],
      createdAt: '2026-08-24T10:00:00.000Z', updatedAt: '2026-08-24T10:00:00.000Z'
    },
    {
      caseId: 'case-009', type: 'application', userId: 'user-005', vehicleId: 'veh-006', serviceId: 'svc-rc-renewal',
      stage: 'under_review', status: 'in_progress', slaDeadline: '2026-08-30T10:00:00.000Z',
      submissionData: { inspectionRequired: true, declaration: true },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-20T13:00:00.000Z', note: 'Registration renewal submitted' },
        { stage: 'under_review', at: '2026-08-21T09:30:00.000Z', note: 'Vehicle inspection review started' }
      ],
      createdAt: '2026-08-20T13:00:00.000Z', updatedAt: '2026-08-21T09:30:00.000Z'
    },
    {
      caseId: 'case-010', type: 'challan', userId: 'user-005', vehicleId: 'veh-006', serviceId: 'svc-echallan',
      stage: 'payment_pending', status: 'waiting_for_user', slaDeadline: '2026-08-26T17:00:00.000Z',
      submissionData: { challanNumber: 'SAMPLE-UP-2026-009', amount: '1500' },
      stageHistory: [{ stage: 'payment_pending', at: '2026-08-24T11:00:00.000Z', note: 'Challan payment is pending' }],
      createdAt: '2026-08-24T11:00:00.000Z', updatedAt: '2026-08-24T11:00:00.000Z'
    },
    {
      caseId: 'case-011', type: 'application', userId: 'user-006', vehicleId: 'veh-007', serviceId: 'svc-national-permit',
      stage: 'submitted', status: 'in_progress', slaDeadline: '2026-09-02T10:00:00.000Z',
      submissionData: { permitClass: 'Goods and passenger movement', declaration: true },
      stageHistory: [{ stage: 'submitted', at: '2026-08-24T09:00:00.000Z', note: 'National permit request submitted' }],
      createdAt: '2026-08-24T09:00:00.000Z', updatedAt: '2026-08-24T09:00:00.000Z'
    },
    {
      caseId: 'case-012', type: 'application', userId: 'user-002', vehicleId: null, serviceId: 'svc-dl-renewal',
      stage: 'resolved', status: 'resolved', slaDeadline: '2026-08-19T10:00:00.000Z',
      submissionData: { licenceNumber: 'SAMPLE-DL-001', medicalCertificate: 'not-required' },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-16T09:00:00.000Z', note: 'Driving licence renewal submitted' },
        { stage: 'resolved', at: '2026-08-17T12:00:00.000Z', note: 'Driving licence renewal completed' }
      ],
      createdAt: '2026-08-16T09:00:00.000Z', updatedAt: '2026-08-17T12:00:00.000Z'
    },
    {
      caseId: 'case-013', type: 'application', userId: 'user-004', vehicleId: null, serviceId: 'svc-learner-licence',
      stage: 'appointment_booked', status: 'submitted', slaDeadline: '2026-08-27T08:00:00.000Z',
      submissionData: { classOfVehicle: 'LMV', appointmentDate: '2026-08-26' },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-23T08:00:00.000Z', note: 'Learner licence application submitted' },
        { stage: 'appointment_booked', at: '2026-08-23T08:05:00.000Z', note: 'Learner test appointment booked' }
      ],
      createdAt: '2026-08-23T08:00:00.000Z', updatedAt: '2026-08-23T08:05:00.000Z'
    },
    {
      caseId: 'case-014', type: 'application', userId: 'user-006', vehicleId: 'veh-007', serviceId: 'svc-online-checkpost-tax',
      stage: 'rejected', status: 'rejected', slaDeadline: '2026-08-22T10:00:00.000Z',
      submissionData: { route: 'Sample interstate route', reason: 'Incomplete declaration' },
      stageHistory: [
        { stage: 'submitted', at: '2026-08-20T10:00:00.000Z', note: 'Checkpost tax request submitted' },
        { stage: 'rejected', at: '2026-08-21T15:00:00.000Z', note: 'Request rejected because declaration was incomplete' }
      ],
      createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-21T15:00:00.000Z'
    },
    {
      caseId: 'case-015', type: 'grievance', userId: 'user-003', vehicleId: null, serviceId: 'svc-grievance-report',
      stage: 'submitted', status: 'in_progress', slaDeadline: '2026-08-30T12:00:00.000Z',
      submissionData: { subject: 'Service centre delay', description: 'Synthetic complaint fixture', attachments: ['sample-receipt.pdf'], declaration: true },
      stageHistory: [{ stage: 'submitted', at: '2026-08-24T12:00:00.000Z', note: 'Transport grievance submitted' }],
      createdAt: '2026-08-24T12:00:00.000Z', updatedAt: '2026-08-24T12:00:00.000Z'
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

const INTENT_KEYWORD_MATCHES = [
  { serviceId: 'svc-renew-puc', terms: ['puc', 'pollution certificate'] },
  { serviceId: 'svc-challan-dispute', terms: ['challan dispute', 'dispute fine', 'dispute a challan', 'contest challan', 'fight a challan'] },
  { serviceId: 'svc-echallan', terms: ['challan', 'traffic fine', 'traffic ticket'] },
  { serviceId: 'svc-accident-report', terms: ['accident', 'incident', 'crash'] },
  { serviceId: 'svc-grievance-report', terms: ['grievance', 'complaint', 'service issue'] },
  { serviceId: 'svc-learner-licence', terms: ['learner licence', 'learner license', 'll application', 'learners permit'] },
  { serviceId: 'svc-driving-licence', terms: ['new driving licence', 'new driving license', 'driving licence application', 'apply for a licence', 'apply for a license', 'apply for driving licence', 'get a driving licence', 'get a license'] },
  { serviceId: 'svc-dl-renewal', terms: ['renew driving licence', 'renew driving license', 'dl renewal', 'licence renewal', 'license renewal', 'renew my licence', 'renew my license'] },
  { serviceId: 'svc-dl-duplicate', terms: ['duplicate driving licence', 'duplicate driving license', 'lost licence', 'lost license', 'lost my licence', 'lost my license'] },
  { serviceId: 'svc-dl-add-class', terms: ['add vehicle class', 'add a class to my licence', 'add class to license'] },
  { serviceId: 'svc-dl-change-address', terms: ['change address on licence', 'change address on license', 'update licence address'] },
  { serviceId: 'svc-dl-change-name', terms: ['change name on licence', 'change name on license', 'correct my name on licence'] },
  { serviceId: 'svc-driving-school', terms: ['driving school licence', 'driving school license'] },
  { serviceId: 'svc-dl-online-test-appointment', terms: ['driving test appointment', 'learner test appointment', 'online test', 'book a driving test'] },
  { serviceId: 'svc-application-status', terms: ['check my application status', 'application status', 'check my licence status'] },
  { serviceId: 'svc-transfer-ownership', terms: ['transfer ownership', 'sell my car', 'sold my vehicle', 'transfer my vehicle'] },
  { serviceId: 'svc-duplicate-rc', terms: ['duplicate rc', 'lost rc', 'registration certificate duplicate', 'lost my registration certificate'] },
  { serviceId: 'svc-rc-renewal', terms: ['renew registration', 'renew rc', 'renew my registration'] },
  { serviceId: 'svc-vehicle-noc', terms: ['vehicle noc', 'no objection certificate'] },
  { serviceId: 'svc-hypothecation', terms: ['hypothecation', 'car loan removal', 'remove hypothecation'] },
  { serviceId: 'svc-change-vehicle-address', terms: ['change vehicle address', 'rc address change', 'update vehicle address'] },
  { serviceId: 'svc-vehicle-conversion', terms: ['convert my vehicle', 'change vehicle type', 'vehicle conversion'] },
  { serviceId: 'svc-rc-cancellation', terms: ['cancel my registration', 'rc cancellation', 'cancel rc'] },
  { serviceId: 'svc-fancy-number', terms: ['fancy number', 'choice number', 'vip number'] },
  { serviceId: 'svc-national-permit', terms: ['national permit', 'vehicle permit'] },
  { serviceId: 'svc-aitp-authorization', terms: ['tourist permit', 'aitp'] },
  { serviceId: 'svc-fitness', terms: ['fitness certificate', 'fitness test'] },
  { serviceId: 'svc-tax-and-fee', terms: ['road tax', 'vehicle tax', 'vehicle fee', 'pay my tax'] },
  { serviceId: 'svc-online-checkpost-tax', terms: ['checkpost tax'] },
  { serviceId: 'svc-dealer-registration', terms: ['dealer registration', 'register as a dealer'] },
  { serviceId: 'svc-trade-certificate', terms: ['trade certificate'] },
  { serviceId: 'svc-vltd', terms: ['vehicle tracking device', 'vltd'] },
  { serviceId: 'svc-speed-limiting-device', terms: ['speed limiting device', 'speed governor'] },
  { serviceId: 'svc-cng-maker', terms: ['cng kit', 'cng maker'] },
  { serviceId: 'svc-homologation', terms: ['homologation'] },
  { serviceId: 'svc-vahan-green-sewa', terms: ['green sewa', 'cng fitment'] }
];

const STOPWORDS = new Set(['a', 'an', 'the', 'my', 'i', 'to', 'for', 'of', 'and', 'or', 'on', 'in', 'is', 'me', 'please', 'want', 'need']);

/**
 * Short domain abbreviations (RC, DL, PUC, ...) are exactly the words the
 * significant-word filter throws out for being too short to be reliably
 * meaningful on their own — so "I lost my rc" tokenized to just ['lost']
 * and matched nothing. Expanding them to their full phrase first lets them
 * flow through matching normally instead of needing a special case.
 */
const ABBREVIATION_EXPANSIONS: Record<string, string> = {
  rc: 'registration certificate',
  dl: 'driving licence',
  ll: 'learner licence',
  puc: 'pollution under control certificate',
  noc: 'no objection certificate',
  vltd: 'vehicle location tracking device'
};

function expandAbbreviations(text: string): string {
  return text.replace(/\b[a-z]{2,4}\b/g, (word) => ABBREVIATION_EXPANSIONS[word] ?? word);
}

function significantWords(text: string): string[] {
  return expandAbbreviations(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Falls back to matching the query's significant words against each guided
 * service's own name/description when nothing in the curated keyword list
 * hits — otherwise a phrase like "apply for a licence" that isn't an exact
 * fixture of the keyword list would clarification-need out even though a
 * guided journey for it plainly exists in the catalog.
 */
/**
 * Classic edit distance — used so a misspelling like "liscence" still counts
 * as the word "licence" instead of matching nothing at all. A fixed list of
 * known typos doesn't scale to the ones nobody thought to add; comparing by
 * distance does, at the cost of nothing more than a small DP table per
 * word pair (these are short domain words, never long strings).
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previousRow = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 0; i < a.length; i++) {
    let previousDiagonal = previousRow[0]!;
    previousRow[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const temp = previousRow[j + 1]!;
      previousRow[j + 1] = a[i] === b[j] ? previousDiagonal : 1 + Math.min(previousDiagonal, previousRow[j]!, previousRow[j + 1]!);
      previousDiagonal = temp;
    }
  }
  return previousRow[b.length]!;
}

/** How many typo'd characters still count as "the same word," scaled so short words (more sensitive to any change) stay strict. */
function maxAllowedTypoDistance(wordLength: number): number {
  if (wordLength >= 8) return 2;
  if (wordLength >= 4) return 1;
  return 0;
}

function wordsMatch(queryWord: string, candidateWord: string): boolean {
  if (queryWord === candidateWord) return true;
  const allowed = Math.min(maxAllowedTypoDistance(queryWord.length), maxAllowedTypoDistance(candidateWord.length));
  return allowed > 0 && levenshteinDistance(queryWord, candidateWord) <= allowed;
}

function fuzzyServiceMatch(normalizedQuery: string): ServiceDefinition | undefined {
  const queryWords = significantWords(normalizedQuery);
  if (queryWords.length === 0) return undefined;

  let best: { service: ServiceDefinition; overlap: number } | undefined;
  for (const service of seedData.services) {
    if (service.delivery !== 'guided') continue;
    const candidateWords = significantWords(`${service.name} ${service.description}`);
    const overlap = candidateWords.filter((candidateWord) => queryWords.some((queryWord) => wordsMatch(queryWord, candidateWord))).length;
    if (overlap > 0 && (!best || overlap > best.overlap)) {
      best = { service, overlap };
    }
  }
  // Require at least two shared significant words so a single generic word
  // (e.g. "vehicle") doesn't confidently misroute an unrelated query.
  return best && best.overlap >= 2 ? best.service : undefined;
}

export function resolveIntent(query: string): IntentResolution {
  const normalized = query.toLowerCase();
  const matchedService = INTENT_KEYWORD_MATCHES.find((item) => item.terms.some((term) => normalized.includes(term)));
  const service = matchedService ? getServiceById(matchedService.serviceId) : fuzzyServiceMatch(normalized);

  if (service) {
    return {
      query,
      serviceId: service.serviceId,
      serviceName: service.name,
      confidence: matchedService ? 'high' : 'medium',
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
  if (serviceId === 'svc-grievance-report') return 'grievance';
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
  let score = 92;
  const reasons: string[] = [];

  for (const vehicle of bundle.vehicles) {
    if (vehicle.documentStatus.puc === 'expired') {
      score -= 18;
      reasons.push(`${vehicle.registrationNumber}: PUC expired`);
    }
    if (vehicle.documentStatus.insurance === 'expired') {
      score -= 15;
      reasons.push(`${vehicle.registrationNumber}: insurance expired`);
    }
    if (vehicle.documentStatus.rc === 'renewal-due') {
      score -= 12;
      reasons.push(`${vehicle.registrationNumber}: registration renewal due`);
    }
    if (vehicle.documentStatus.fitness === 'expired') {
      score -= 15;
      reasons.push(`${vehicle.registrationNumber}: fitness expired`);
    }
    if (vehicle.documentStatus.fitness === 'due-soon') {
      score -= 6;
      reasons.push(`${vehicle.registrationNumber}: fitness due soon`);
    }
  }

  if (bundle.cases.some((item) => item.type === 'challan' && item.status !== 'resolved')) {
    score -= 10;
    reasons.push('Pending challan matter');
  }

  if (bundle.cases.some((item) => item.type === 'accident' && item.status !== 'resolved')) {
    score -= 8;
    reasons.push('Open accident case');
  }

  score = Math.max(0, score);

  return { score, reasons: reasons.length > 0 ? reasons : ['All core documents active'] };
}

export function buildComplianceAlerts(bundle: IdentityBundle): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = [];

  for (const vehicle of bundle.vehicles) {
    const statuses = vehicle.documentStatus;
    const documentAlerts = [
      { key: 'puc', value: statuses.puc, title: 'PUC renewal is due', serviceId: 'svc-renew-puc' },
      { key: 'insurance', value: statuses.insurance, title: 'Insurance requires attention', serviceId: 'svc-license-registration-details' },
      { key: 'rc', value: statuses.rc, title: 'Registration renewal is due', serviceId: 'svc-rc-renewal' },
      { key: 'fitness', value: statuses.fitness, title: 'Fitness certificate requires attention', serviceId: 'svc-fitness' }
    ];

    for (const document of documentAlerts) {
      if (!document.value || document.value === 'active' || document.value === 'not-applicable') continue;
      const severity = document.value === 'expired' ? 'critical' : document.value === 'due-soon' || document.value === 'expiring-soon' || document.value === 'renewal-due' ? 'warning' : 'info';
      alerts.push({
        alertId: `alert-${vehicle.vehicleId}-${document.key}`,
        severity,
        title: document.title,
        detail: `${vehicle.registrationNumber}: ${document.value.replace(/-/g, ' ')}`,
        vehicleId: vehicle.vehicleId,
        recommendedServiceId: document.serviceId
      });
    }
  }

  for (const caseRecord of bundle.cases) {
    if (caseRecord.status !== 'waiting_for_user') continue;
    const alert: ComplianceAlert = {
      alertId: `alert-${caseRecord.caseId}-action`,
      severity: 'warning',
      title: 'Case action is required',
      detail: `${caseRecord.caseId} is waiting for your response.`,
      recommendedServiceId: caseRecord.serviceId
    };
    if (caseRecord.vehicleId) alert.vehicleId = caseRecord.vehicleId;
    alerts.push(alert);
  }

  return alerts;
}

const NUDGE_CLOSING_BY_SEVERITY: Record<ComplianceAlert['severity'], string> = {
  critical: 'This is already affecting your mobility score — act now to start recovering it.',
  warning: 'Handle this soon to keep your mobility score from slipping further.',
  info: 'Worth a look next time you have a few minutes.'
};

export function buildMobilityNudges(
  score: MobilityScoreResult,
  alerts: ComplianceAlert[]
): MobilityNudge[] {
  const nudges: MobilityNudge[] = alerts.slice(0, 3).map((alert) => {
    const nudge: MobilityNudge = {
      nudgeId: `nudge-${alert.alertId}`,
      severity: alert.severity,
      title: alert.title,
      message: `${alert.detail}. ${NUDGE_CLOSING_BY_SEVERITY[alert.severity]}`
    };
    if (alert.recommendedServiceId) nudge.actionServiceId = alert.recommendedServiceId;
    return nudge;
  });

  if (score.score < 60) {
    const nudge: MobilityNudge = {
      nudgeId: 'nudge-score-recovery',
      severity: 'warning',
      title: 'Improve your mobility readiness',
      message: 'Resolve the highest-priority document and case alerts to improve your score.'
    };
    const recommendedServiceId = alerts[0]?.recommendedServiceId;
    if (recommendedServiceId) nudge.actionServiceId = recommendedServiceId;
    nudges.push(nudge);
  }

  if (!nudges.length) {
    nudges.push({
      nudgeId: 'nudge-all-clear',
      severity: 'info',
      title: 'Your core records look current',
      message: 'Continue checking document validity before longer trips.'
    });
  }

  return nudges;
}

export function buildMobilityMapLayers(bundle: IdentityBundle): MobilityMapLayer[] {
  const accidentCases = bundle.cases.filter((caseRecord) => caseRecord.type === 'accident');
  const challanCases = bundle.cases.filter((caseRecord) => caseRecord.type === 'challan' && caseRecord.status !== 'resolved');

  return [
    {
      layerId: 'accidents',
      label: 'Accidents',
      color: '#fb7185',
      description: 'Incident markers derived from this citizen’s recorded case history.',
      features: accidentCases.map((caseRecord, index) => ({
        featureId: `accident-${caseRecord.caseId}`,
        geometry: { type: 'Point', coordinates: [73.8567 + index * 0.012, 18.5204 + index * 0.008] },
        properties: { title: 'Recorded incident', detail: `${caseRecord.caseId} · ${caseRecord.stage.replace(/_/g, ' ')}`, source: 'case-history', severity: 'warning' }
      }))
    },
    {
      layerId: 'high-risk-zones',
      label: 'High-risk zones',
      color: '#f97316',
      description: 'Reference-risk locations used for decision support in the prototype.',
      features: [
        {
          featureId: 'risk-junction-demo',
          geometry: { type: 'Point', coordinates: [73.8478, 18.5356] },
          properties: { title: 'High-risk junction', detail: 'Reference dataset marker; not a live incident feed.', source: 'reference-dataset', severity: 'warning' }
        }
      ]
    },
    {
      layerId: 'safe-routes',
      label: 'Safe routes',
      color: '#34d399',
      description: 'Reference route suggestions for the prototype.',
      features: [
        {
          featureId: 'safe-route-demo',
          geometry: { type: 'LineString', coordinates: [[73.846, 18.51], [73.855, 18.518], [73.862, 18.529]] },
          properties: { title: 'Suggested lower-risk route', detail: 'Reference route, not turn-by-turn navigation.', source: 'reference-dataset' }
        }
      ]
    },
    {
      layerId: 'pollution-hotspots',
      label: 'Pollution hotspots',
      color: '#eab308',
      description: 'Reference pollution markers; replace with an official PUC dataset in production.',
      features: [
        {
          featureId: 'pollution-hotspot-demo',
          geometry: { type: 'Point', coordinates: [73.8723, 18.5074] },
          properties: { title: 'Emission-sensitive area', detail: 'Reference dataset marker; not a live air-quality reading.', source: 'reference-dataset', severity: 'info' }
        }
      ]
    },
    {
      layerId: 'challan-zones',
      label: 'Challan zones',
      color: '#a78bfa',
      description: 'Open challan markers derived from this citizen’s recorded case history.',
      features: challanCases.map((caseRecord, index) => ({
        featureId: `challan-${caseRecord.caseId}`,
        geometry: { type: 'Point', coordinates: [73.865 + index * 0.01, 18.526 + index * 0.006] },
        properties: { title: 'Open challan matter', detail: `${caseRecord.caseId} · action pending`, source: 'case-history', severity: 'warning' }
      }))
    }
  ];
}

/**
 * A second, independent notification source alongside mobility nudges: cases
 * with an approaching SLA deadline that are not yet closed. This is what
 * makes the Notification Service a genuine read/react layer over more than
 * one input, rather than a re-export of the mobility snapshot.
 */
const CASE_TYPE_LABEL: Record<CaseType, string> = {
  application: 'application',
  challan: 'challan dispute',
  grievance: 'grievance',
  accident: 'accident report',
  incident: 'incident report'
};

export function buildSlaReminders(bundle: IdentityBundle, now: Date = new Date()): AppNotification[] {
  const reminders: AppNotification[] = [];

  for (const caseRecord of bundle.cases) {
    if (CLOSED_CASE_STATUSES.has(caseRecord.status)) continue;
    if (!caseRecord.slaDeadline) continue;

    const deadline = new Date(caseRecord.slaDeadline).getTime();
    if (Number.isNaN(deadline)) continue;

    const msRemaining = deadline - now.getTime();
    if (msRemaining > SLA_REMINDER_WINDOW_MS) continue;

    const typeLabel = CASE_TYPE_LABEL[caseRecord.type] ?? 'case';
    const severity = msRemaining <= 0 ? 'critical' : msRemaining <= SLA_REMINDER_WINDOW_MS / 2 ? 'warning' : 'info';
    const message =
      msRemaining <= 0
        ? `${caseRecord.caseId} (${typeLabel}) is now overdue. Check the case for what is still needed.`
        : `${caseRecord.caseId} (${typeLabel}) is due within ${Math.max(1, Math.round(msRemaining / (60 * 60 * 1000)))}h. Review it soon.`;

    reminders.push({
      notificationId: `sla-${caseRecord.caseId}`,
      severity,
      title: msRemaining <= 0 ? `Your ${typeLabel} is now overdue` : `Your ${typeLabel} is coming due soon`,
      message,
      caseId: caseRecord.caseId,
      actionServiceId: caseRecord.serviceId,
      createdAt: now.toISOString(),
      read: false
    });
  }

  return reminders;
}

export const ESCALATION_NOTE = 'Escalated by citizen — flagged for priority review.';

export function buildEscalationStageHistoryItem(currentStage: string, at: string): StageHistoryItem {
  return {
    stage: currentStage,
    at,
    note: ESCALATION_NOTE
  };
}

export function buildStageHistory(caseRecord: CaseRecord): StageHistoryItem[] {
  return caseRecord.stageHistory;
}
