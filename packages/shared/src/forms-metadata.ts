/**
 * Curated, manually-verified catalog of the real CMVR (Central Motor
 * Vehicle Rules) forms placed in docs/ and served to the client from
 * client/public/forms/. Every entry was populated by personally opening
 * and reading the PDF's own content — not guessed from its filename, and
 * never scraped or fetched from parivahan.gov.in at runtime. Each row
 * below states plainly whether it's actually wired into a guided service
 * in the app, or left unmatched because no current service corresponds to
 * it confidently.
 *
 * To add a new form: drop the PDF in client/public/forms/, add a row here,
 * and — only for a clean, confident match — set `wiredToServiceIds` and
 * add the corresponding `officialForm` entry on that service in engine.ts.
 *
 * Being "wired" here means the blank template is linked as a reference —
 * it does NOT by itself mean a citizen's answers get drawn onto it. Real
 * fill-in requires a matching entry in
 * server/src/modules/documents/official-form-filler.ts, which measures
 * exact coordinates off the form's own layout and requires the guided
 * service to actually collect the specific fields that form asks for (see
 * `detailFields` on the matching `guidedApplicationService(...)` call in
 * engine.ts). As of this catalog: FORM 2, FORM 12, and FORM 18 are real,
 * coordinate-mapped fill-ins — `officialForm.fillable: true` on those
 * services. FORM 59 (PUC) is wired only as a reference to what an issued
 * certificate looks like; it is never filled in, because a citizen doesn't
 * fill out a paper PUC application in the first place.
 */

export type OfficialFormCategory =
  | 'application' // a form a citizen actually fills in and submits
  | 'issued-document' // what the authority hands back (a licence, a certificate) — not something a citizen fills in to apply
  | 'internal-register' // government record-keeping, never citizen-facing
  | 'technical-spec'; // a design/print standard, not a fillable form

export interface OfficialFormMetadata {
  formNumber: string;
  title: string;
  /** What this form is actually for, based on reading its own content. */
  purpose: string;
  category: OfficialFormCategory;
  /** Path the client serves this file from. */
  path: string;
  /** Service IDs this form is wired into as the confirmed `officialForm`. Empty = not wired to anything. */
  wiredToServiceIds: string[];
  /** Set when this form is a relevant supporting reference for a service but not itself that service's primary official form. */
  relatedServiceIds?: string[];
  /** Filled in only when this form is NOT wired to any service — explains why. */
  unmatchedReason?: string;
}

export const OFFICIAL_FORMS: OfficialFormMetadata[] = [
  {
    formNumber: 'FORM 1A',
    title: 'Medical Certificate',
    purpose: 'Medical fitness certificate a registered medical practitioner completes for a driving-licence applicant (required for renewal past 40, or for a transport licence).',
    category: 'application',
    path: '/forms/FORM-1A.pdf',
    wiredToServiceIds: [],
    relatedServiceIds: ['svc-dl-renewal', 'svc-driving-licence']
  },
  {
    formNumber: 'FORM 2',
    title: "Application for Learner's Licence / Driving Licence / Addition of Vehicle Class / Renewal / Duplicate / Change of Address or Name",
    purpose: 'The single master application form covering seven distinct driving-licence services via tick-boxes — confirmed directly from the form\'s own "Services applying for" checklist.',
    category: 'application',
    path: '/forms/FORM-2.pdf',
    wiredToServiceIds: [
      'svc-learner-licence',
      'svc-driving-licence',
      'svc-dl-add-class',
      'svc-dl-renewal',
      'svc-dl-duplicate',
      'svc-dl-change-address',
      'svc-dl-change-name'
    ]
  },
  {
    formNumber: 'FORM 3',
    title: "Learner's Licence",
    purpose: "The issued learner's licence document itself — not an application form. Kept as a reference for what svc-learner-licence's applicant will receive.",
    category: 'issued-document',
    path: '/forms/FORM-3.pdf',
    wiredToServiceIds: [],
    relatedServiceIds: ['svc-learner-licence']
  },
  {
    formNumber: 'FORM 4A',
    title: 'Application for International Driving Permit',
    purpose: 'Application to obtain an International Driving Permit for driving in other countries.',
    category: 'application',
    path: '/forms/FORM-4A.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'No "International Driving Permit" service exists in the current catalog — would need a new service added to wire this in confidently.'
  },
  {
    formNumber: 'FORM 5',
    title: 'Driving Certificate Issued by Driving School or Establishments',
    purpose: 'Certificate a driving school issues confirming a trainee completed their course — a supporting document for a licence application, not itself an application.',
    category: 'issued-document',
    path: '/forms/FORM-5.pdf',
    wiredToServiceIds: [],
    relatedServiceIds: ['svc-learner-licence', 'svc-driving-licence']
  },
  {
    formNumber: 'FORM 5A',
    title: 'Certificate of Fuel Efficient Driving Training',
    purpose: 'Certificate for completing fuel-efficient driving training for heavy vehicles — a niche supporting document.',
    category: 'issued-document',
    path: '/forms/FORM-5A.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'Supporting document only, no dedicated service for this training category exists.'
  },
  {
    formNumber: 'FORM 5B',
    title: 'Driving Certificate Issued by Accredited Driving Training Center',
    purpose: 'Same purpose as Form 5, issued by an accredited training center specifically.',
    category: 'issued-document',
    path: '/forms/FORM-5B.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'Supporting document only; the accredited-training-center track has no dedicated service (see Form 11A/12A/13A).'
  },
  {
    formNumber: 'FORM 6A',
    title: 'International Driving Permit',
    purpose: 'The issued International Driving Permit document itself.',
    category: 'issued-document',
    path: '/forms/FORM-6A.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'No International Driving Permit service exists in the current catalog.'
  },
  {
    formNumber: 'FORM 7',
    title: 'Driving Licence Card — Visual Inspection Zone Specification',
    purpose: 'A government print/design standard specifying the physical driving-licence card layout — not something a citizen ever fills in or submits.',
    category: 'technical-spec',
    path: '/forms/FORM-7.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'Technical/print specification, not a citizen-facing form.'
  },
  {
    formNumber: 'FORM 8',
    title: 'Application for Permanent Surrender of a Vehicle Class from a Driving Licence',
    purpose: 'Application to permanently remove a class of vehicle from an existing driving licence.',
    category: 'application',
    path: '/forms/FORM-8.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'No "surrender a vehicle class" service exists — the catalog only has "Addition of Vehicle Class to DL" (the opposite direction).'
  },
  {
    formNumber: 'FORM 10',
    title: 'State Register of Driving Licences',
    purpose: 'Internal state government register format for tracking issued driving licences.',
    category: 'internal-register',
    path: '/forms/FORM-10.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'Internal government record-keeping format, never filled in or submitted by a citizen.'
  },
  {
    formNumber: 'FORM 10A',
    title: 'National Register of Driving Licences',
    purpose: 'Internal national-level register format for driving licences.',
    category: 'internal-register',
    path: '/forms/FORM-10A.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'Internal government record-keeping format, never filled in or submitted by a citizen.'
  },
  {
    formNumber: 'FORM 11',
    title: 'Licence for Establishment of a Motor Driving School',
    purpose: "The issued licence document authorizing a driving school to operate — output of Form 12's application, not itself something a citizen applies with.",
    category: 'issued-document',
    path: '/forms/FORM-11.pdf',
    wiredToServiceIds: [],
    relatedServiceIds: ['svc-driving-school']
  },
  {
    formNumber: 'FORM 11A',
    title: 'Accreditation for Driver Training Center',
    purpose: 'Accreditation document for a driver training center — a separate regulatory track from ordinary driving schools.',
    category: 'issued-document',
    path: '/forms/FORM-11A.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'The catalog\'s "Driving School Licence" service maps to the Form 11/12/13 track specifically, not this separate accredited-training-center track — no service exists for the latter.'
  },
  {
    formNumber: 'FORM 12',
    title: 'Application for Licence to Engage in the Business of Imparting Instructions in Driving of Motor Vehicles',
    purpose: 'The actual application a citizen/business files to open a driving school — confirmed as the real application counterpart to the Form 11 licence.',
    category: 'application',
    path: '/forms/FORM-12.pdf',
    wiredToServiceIds: ['svc-driving-school']
  },
  {
    formNumber: 'FORM 12A',
    title: 'Application for Accreditation of Driver Training Center',
    purpose: 'Application for the separate accredited-driver-training-center track (Form 11A\'s application counterpart).',
    category: 'application',
    path: '/forms/FORM-12A.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'No dedicated "Driver Training Center Accreditation" service exists — distinct from svc-driving-school.'
  },
  {
    formNumber: 'FORM 13',
    title: 'Application for Renewing Licence to Engage in the Business of Imparting Instructions in Driving of Motor Vehicles',
    purpose: 'Renewal counterpart of Form 12, for an existing driving school\'s licence.',
    category: 'application',
    path: '/forms/FORM-13.pdf',
    wiredToServiceIds: [],
    relatedServiceIds: ['svc-driving-school']
  },
  {
    formNumber: 'FORM 13A',
    title: 'Application to Renew Accreditation of Driver Training Center',
    purpose: 'Renewal counterpart of Form 12A.',
    category: 'application',
    path: '/forms/FORM-13A.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'Same accredited-training-center track as Form 11A/12A — no matching service.'
  },
  {
    formNumber: 'FORM 14',
    title: 'Register Showing Enrolment of Trainees in Driving School Establishments',
    purpose: 'Internal register a driving school keeps of its enrolled trainees.',
    category: 'internal-register',
    path: '/forms/FORM-14.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'Internal driving-school record-keeping, never citizen-facing.'
  },
  {
    formNumber: 'FORM 15',
    title: 'Register Showing Driving Hours Spent by a Trainee',
    purpose: 'Internal driving-school register of practice hours logged per trainee.',
    category: 'internal-register',
    path: '/forms/FORM-15.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'Internal driving-school record-keeping, never citizen-facing.'
  },
  {
    formNumber: 'FORM 17',
    title: 'Form of Trade Certificate',
    purpose: 'The issued trade certificate itself (a dealer\'s in-transit vehicle trade plate certificate) — output of an application, not an application form.',
    category: 'issued-document',
    path: '/forms/FORM-17.pdf',
    wiredToServiceIds: [],
    relatedServiceIds: ['svc-trade-certificate']
  },
  {
    formNumber: 'FORM 18',
    title: 'Intimation of Loss or Destruction of a Trade Certificate and Application for Duplicate',
    purpose: 'The real, fillable application a trade-certificate holder submits to report a lost/destroyed certificate and request a duplicate.',
    category: 'application',
    path: '/forms/FORM-18.pdf',
    wiredToServiceIds: ['svc-trade-certificate']
  },
  {
    formNumber: 'FORM 27',
    title: 'Application for Assignment of New Registration Mark to a Motor Vehicle',
    purpose: 'Application filed when a vehicle is permanently moved to a different state and needs a new registration mark assigned there.',
    category: 'application',
    path: '/forms/FORM-27.pdf',
    wiredToServiceIds: [],
    unmatchedReason: 'This is a distinct process (re-registering after an inter-state move) from every existing vehicle-registration service (address change, RC renewal, ownership transfer, etc.) — no clean match, not forced.'
  },
  {
    formNumber: 'FORM 59',
    title: 'Pollution Under Control Certificate',
    purpose: 'The actual system-generated PUC certificate a citizen receives after a passing emissions test — there is no separate standardized "PUC application form" since PUC is obtained in person at a testing center, not filed on paper. Wired in as a reference for what the certificate looks like, not as something to fill in.',
    category: 'issued-document',
    path: '/forms/FORM-59.pdf',
    wiredToServiceIds: ['svc-renew-puc']
  },
  {
    formNumber: 'FORM 59-A',
    title: 'Pollution Under Control — Rejection Slip',
    purpose: 'The slip issued when a vehicle fails its PUC emissions test.',
    category: 'issued-document',
    path: '/forms/FORM-59A.pdf',
    wiredToServiceIds: [],
    relatedServiceIds: ['svc-renew-puc']
  }
];

/**
 * Services with a confirmed local form wired in (see `officialForm` on the
 * matching ServiceDefinition in engine.ts). Every other guided service —
 * including all three flagship case-management services (challan dispute,
 * accident report, grievance) and every vehicle-registration/permit/tax/
 * business service — has no form in this set that confidently matches it,
 * and keeps relying on its existing verified `officialUrl` fallback.
 */
export const SERVICES_WITH_LOCAL_FORM = OFFICIAL_FORMS.flatMap((form) => form.wiredToServiceIds);
