import type {
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
    requiredDocuments: ['Registration Certificate', 'Existing PUC']
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
      { id: 'challan', title: 'Enter challan details', fields: ['challanNumber'] },
      { id: 'evidence', title: 'Attach evidence', fields: ['attachments'] },
      { id: 'confirm', title: 'Submit dispute', fields: ['declaration'] }
    ],
    requiredDocuments: ['Challan Notice', 'Evidence Files']
  },
  {
    serviceId: 'svc-accident-report',
    name: 'Accident Report',
    category: 'case-management',
    description: 'Create a structured incident intake and retain its case history.',
    delivery: 'guided',
    steps: [
      { id: 'preview', title: 'Review incident intake', fields: [] },
      { id: 'incident', title: 'Capture incident details', fields: ['location', 'time'] },
      { id: 'people', title: 'Record people involved', fields: ['injuries', 'vehicles'] },
      { id: 'confirm', title: 'Submit report', fields: ['declaration'] }
    ],
    requiredDocuments: ['Incident details']
  },
  {
    serviceId: 'svc-grievance-report',
    name: 'Transport Grievance',
    category: 'case-management',
    description: 'Create a tracked grievance for a transport-service issue.',
    delivery: 'guided',
    steps: [
      { id: 'preview', title: 'Review grievance intake', fields: [] },
      { id: 'details', title: 'Describe the issue', fields: ['subject', 'description'] },
      { id: 'evidence', title: 'Attach supporting details', fields: ['attachments'] },
      { id: 'confirm', title: 'Submit grievance', fields: ['declaration'] }
    ],
    requiredDocuments: ['Supporting evidence, if available']
  },
  officialService('svc-learner-licence', 'Learner Licence', 'driving-licence', 'Apply for a learner licence through Sarathi.', SARATHI_SERVICE_URL),
  officialService('svc-driving-licence', 'Driving Licence', 'driving-licence', 'Apply for a new driving licence through Sarathi.', SARATHI_SERVICE_URL),
  officialService('svc-dl-online-test-appointment', 'DL Online Test and Appointment', 'driving-licence', 'Book or modify learner and driving licence test appointments.', SARATHI_SERVICE_URL),
  officialService('svc-application-status', 'Application Status', 'driving-licence', 'Check the status of a driving licence or learner licence application.', SARATHI_SERVICE_URL),
  officialService('svc-dl-renewal', 'Driving Licence Renewal', 'driving-licence', 'Renew an existing driving licence.', SARATHI_SERVICE_URL),
  officialService('svc-dl-duplicate', 'Duplicate Driving Licence', 'driving-licence', 'Apply for a duplicate driving licence.', SARATHI_SERVICE_URL),
  officialService('svc-dl-add-class', 'Addition of Vehicle Class to DL', 'driving-licence', 'Add an eligible class of vehicle to a driving licence.', SARATHI_SERVICE_URL),
  officialService('svc-dl-change-address', 'Change or Correction of DL Address', 'driving-licence', 'Update the address recorded on a driving licence.', SARATHI_SERVICE_URL),
  officialService('svc-dl-change-name', 'Change or Correction of DL Name', 'driving-licence', 'Request a name correction on a driving licence.', SARATHI_SERVICE_URL),
  officialService('svc-driving-school', 'Driving School Licence', 'driving-licence', 'Apply for and manage driving school licensing services.', SARATHI_SERVICE_URL),
  officialService('svc-vehicle-registration', 'Vehicle Registration', 'vehicle-registration', 'Access registration and registered-vehicle citizen services.', VAHAN_SERVICE_URL),
  officialService('svc-vehicle-noc', 'No Objection Certificate', 'vehicle-registration', 'Apply online for a vehicle no objection certificate.', VAHAN_SERVICE_URL),
  officialService('svc-hypothecation', 'Hypothecation Services', 'vehicle-registration', 'Manage hypothecation entry, continuation, and termination services.', VAHAN_SERVICE_URL),
  officialService('svc-rc-renewal', 'Renewal of Registration', 'vehicle-registration', 'Renew a vehicle registration certificate.', VAHAN_SERVICE_URL),
  officialService('svc-duplicate-rc', 'Duplicate RC', 'vehicle-registration', 'Apply for a duplicate registration certificate.', VAHAN_SERVICE_URL),
  officialService('svc-transfer-ownership', 'Transfer of Ownership', 'vehicle-registration', 'Apply to transfer vehicle ownership.', VAHAN_SERVICE_URL),
  officialService('svc-change-vehicle-address', 'Change of Vehicle Address', 'vehicle-registration', 'Update the address recorded on a vehicle registration.', VAHAN_SERVICE_URL),
  officialService('svc-vehicle-conversion', 'Conversion of Vehicle', 'vehicle-registration', 'Apply to change the vehicle type or class.', VAHAN_SERVICE_URL),
  officialService('svc-rc-cancellation', 'RC Cancellation', 'vehicle-registration', 'Apply to cancel a vehicle registration certificate.', VAHAN_SERVICE_URL),
  officialService('svc-fancy-number', 'Online Fancy Number', 'vehicle-registration', 'Bid for and purchase a choice registration number.', OTHER_SERVICES_URL),
  officialService('svc-national-permit', 'National Permit', 'permit-and-tax', 'Apply for a national permit, check status, and print receipts.', OTHER_SERVICES_URL),
  officialService('svc-aitp-authorization', 'AITP Authorization', 'permit-and-tax', 'Manage all-India tourist permit authorization.', VAHAN_SERVICE_URL),
  officialService('svc-fitness', 'Fitness', 'permit-and-tax', 'Book a fitness test appointment and make related payments.', OTHER_SERVICES_URL),
  officialService('svc-tax-and-fee', 'Tax and Fee', 'permit-and-tax', 'Access vehicle tax and fee payment services.', OTHER_SERVICES_URL),
  officialService('svc-online-checkpost-tax', 'Online CheckPost Tax', 'permit-and-tax', 'Use the common platform for checkpost tax services.', OTHER_SERVICES_URL),
  officialService('svc-dealer-registration', 'Dealer Registration', 'business-and-manufacturer', 'Register dealers and access vehicle-registration enquiries.', OTHER_SERVICES_URL),
  officialService('svc-trade-certificate', 'Trade Certificate', 'business-and-manufacturer', 'Apply for dealer trade certificate services and payments.', OTHER_SERVICES_URL),
  officialService('svc-vltd', 'Vehicle Location Tracking Device', 'business-and-manufacturer', 'Access VLTD maker and tracking ecosystem services.', OTHER_SERVICES_URL),
  officialService('svc-speed-limiting-device', 'Speed Limiting Device', 'business-and-manufacturer', 'Manage speed limiting device inventory and tracking.', OTHER_SERVICES_URL),
  officialService('svc-cng-maker', 'CNG Maker', 'business-and-manufacturer', 'Access CNG kit manufacturer services.', PARIVAHAN_HOME_URL),
  officialService('svc-homologation', 'Homologation', 'business-and-manufacturer', 'Manage manufacturer vehicle approval lifecycle services.', OTHER_SERVICES_URL),
  officialService('svc-vahan-green-sewa', 'Vahan Green Sewa', 'digital-services', 'Manage CNG and related green-device fitment processes.', OTHER_SERVICES_URL),
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

export function resolveIntent(query: string): IntentResolution {
  const normalized = query.toLowerCase();
  const matches = [
    { serviceId: 'svc-renew-puc', terms: ['puc', 'pollution certificate'] },
    { serviceId: 'svc-challan-dispute', terms: ['challan dispute', 'dispute fine', 'contest challan'] },
    { serviceId: 'svc-echallan', terms: ['challan', 'traffic fine', 'traffic ticket'] },
    { serviceId: 'svc-accident-report', terms: ['accident', 'incident', 'crash'] },
    { serviceId: 'svc-grievance-report', terms: ['grievance', 'complaint', 'service issue'] },
    { serviceId: 'svc-learner-licence', terms: ['learner licence', 'learner license', 'll application'] },
    { serviceId: 'svc-driving-licence', terms: ['new driving licence', 'new driving license', 'driving licence application'] },
    { serviceId: 'svc-dl-renewal', terms: ['renew driving licence', 'renew driving license', 'dl renewal'] },
    { serviceId: 'svc-dl-duplicate', terms: ['duplicate driving licence', 'duplicate driving license', 'lost licence', 'lost license'] },
    { serviceId: 'svc-dl-online-test-appointment', terms: ['driving test appointment', 'learner test appointment', 'online test'] },
    { serviceId: 'svc-transfer-ownership', terms: ['transfer ownership', 'sell my car', 'sold my vehicle'] },
    { serviceId: 'svc-duplicate-rc', terms: ['duplicate rc', 'lost rc', 'registration certificate duplicate'] },
    { serviceId: 'svc-rc-renewal', terms: ['renew registration', 'renew rc'] },
    { serviceId: 'svc-vehicle-noc', terms: ['vehicle noc', 'no objection certificate'] },
    { serviceId: 'svc-hypothecation', terms: ['hypothecation', 'car loan removal'] },
    { serviceId: 'svc-change-vehicle-address', terms: ['change vehicle address', 'rc address change'] },
    { serviceId: 'svc-fancy-number', terms: ['fancy number', 'choice number'] },
    { serviceId: 'svc-national-permit', terms: ['national permit', 'vehicle permit'] },
    { serviceId: 'svc-fitness', terms: ['fitness certificate', 'fitness test'] },
    { serviceId: 'svc-tax-and-fee', terms: ['road tax', 'vehicle tax', 'vehicle fee'] }
  ];

  const matchedService = matches.find((item) => item.terms.some((term) => normalized.includes(term)));
  if (matchedService) {
    const service = getServiceById(matchedService.serviceId);
    if (service) {
      return {
        query,
        serviceId: service.serviceId,
        serviceName: service.name,
        confidence: 'high',
        clarificationNeeded: false
      };
    }
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

export function buildMobilityNudges(
  bundle: IdentityBundle,
  score: MobilityScoreResult,
  alerts: ComplianceAlert[]
): MobilityNudge[] {
  const nudges: MobilityNudge[] = alerts.slice(0, 3).map((alert) => {
    const nudge: MobilityNudge = {
      nudgeId: `nudge-${alert.alertId}`,
      severity: alert.severity,
      title: alert.title,
      message: `${alert.detail}. Take action before this affects your mobility score further.`
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

export function buildStageHistory(caseRecord: CaseRecord): StageHistoryItem[] {
  return caseRecord.stageHistory;
}
