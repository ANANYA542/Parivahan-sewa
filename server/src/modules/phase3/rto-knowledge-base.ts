/**
 * Curated RTO/Parivahan domain knowledge for the Standing Agent's system
 * prompt — a deliberate substitute for a real vector-DB RAG pipeline (see
 * README.md for why: same-day reliability risk of an untested embedding
 * index outweighs the benefit for a knowledge base this size).
 *
 * This is NOT retrieval-augmented generation. There is no retrieval step —
 * this entire block is concatenated into the system prompt on every call,
 * unconditionally (see agent.service.ts). That's a deliberate, disclosed
 * simplification, viable only because the corpus is small enough to always
 * fit in context. It stops being viable once the corpus grows — the real
 * next step is a vector-DB RAG layer over a larger, regularly-refreshed
 * corpus (state-specific fee schedules, live SLAs, official notifications).
 *
 * Sourced from Parivahan Sewa's own public FAQ pages (parivahan.gov.in/en/
 * faq/services-on-driver-license, /en/content/renewal-of-rc) plus verified
 * third-party summaries of the same official figures, cross-checked against
 * each other — not invented. Fees marked "reported" vary meaningfully by
 * state/RTO and should always be confirmed on the live portal; that
 * instruction is baked into the system prompt itself, not just this file.
 */
export const RTO_KNOWLEDGE_BASE = `
DRIVING LICENCE (source: parivahan.gov.in/en/faq/services-on-driver-license)
- Learner's Licence (LL): valid 6 months. Government fee: reported as ₹200 (paid online via Sarathi at booking).
- Permanent private/non-transport DL: valid 20 years from issue, or till the holder turns 40, whichever comes first, if issued when under 30. If issued between 30–50 years of age, valid for 10 years. After 40, DL is reissued for 10 years, then 5-year renewals thereafter.
- Commercial/transport DL: valid 5 years from date of issue, regardless of age.
- Renewal window: an application "shall not be entertained more than one month before the date of expiry" — i.e. renewal opens exactly one month before the licence expires, not earlier.
- International Driving Permit (IDP): valid 1 year, requires an existing DL, passport, and visa copy — a real Sarathi service this app's catalog does not yet list as its own guided flow (handled as a general DL-services link-out today).

PUC (POLLUTION UNDER CONTROL) CERTIFICATE
- New vehicles: first PUC certificate is valid 1 year from purchase.
- After that: renewed every 6 months in most states — Delhi is a known exception at 3 months, illustrating that this genuinely varies by state/city, not just a formality.
- A short grace period (commonly reported as ~7 days) exists after expiry before enforcement, but do not treat this as guaranteed — advise the citizen to renew before expiry regardless.
- PUC **cannot be renewed online** — the vehicle must physically visit an authorised PUC testing centre. The certificate itself *can* be downloaded afterward at pucc.parivahan.gov.in using the vehicle and chassis number. Never tell a citizen they can renew PUC purely online — only the post-test download is online.

VEHICLE REGISTRATION CERTIFICATE (RC) (source: parivahan.gov.in/en/content/renewal-of-rc)
- Private/non-transport vehicle RC: valid 15 years from initial registration, renewed every 5 years thereafter (Rule 52, Central Motor Vehicles Rules 1989) — each renewal requires a fitness inspection.
- Renewal application: filed on **Form 25**, not more than 60 days before the RC's expiry date, along with any pending road tax.
- Renewal fee: reported base fee is roughly ₹5,000 for private cars (LMV) and ₹1,000 for motorcycles, plus a ₹200 smart-card charge, Green Tax (reported 10–50% of road tax, vehicle-age-dependent), a fitness-test fee (reported ₹200–600), and any late-renewal penalty or outstanding road tax. These figures vary by state — always point the citizen to the live portal for their exact total.

FITNESS CERTIFICATE (commercial/transport vehicles only)
- Valid 2 years for vehicles up to 8 years old.
- Vehicles older than 8 years must renew **every year** thereafter — a real, meaningful cadence a citizen with an ageing commercial vehicle needs to know, not just "renew when reminded."

ECHALLAN GRIEVANCE / DISPUTE PROCESS (source: echallan.parivahan.gov.in/gsticket) — the real 8-step process this app's Challan Dispute flow is modelled on:
1. Open the Grievance section on the eChallan portal.
2. Enter the challan number and select "raise grievance."
3. Verify identity via mobile-number or Aadhaar OTP.
4. Provide personal details, the challan number, and driving licence number.
5. Select the issue type from a fixed list (e.g. incorrect vehicle number, wrong violation).
6. Describe the complaint in free text.
7. Upload supporting evidence (photos, dashcam stills, FASTag records, RC copy, or similar).
8. Receive a ticket/complaint number, used for all further tracking and communication.
- Typical resolution window: reported as 7–15 working days.
- This app's guided Challan Dispute flow mirrors steps 2, 4 (challan + licence number), 5 (declaration), 6 (reason), and 7 (attachments) — it does not perform live OTP verification against the real government system, since that would mean touching a live registry, which this prototype deliberately never does.

ACCIDENT REPORTING — the gap this app's Accident Report feature exists to fill
- There is **no citizen-facing accident-reporting service anywhere in the Parivahan/Vahan/Sarathi/eChallan ecosystem** — confirmed by direct research, not assumed. Reporting an accident is a police-station, FIR-first process, entirely separate from Parivahan.
- Digital access to FIRs themselves is fragmented **at the state police level**, not through Parivahan: independent research found roughly 15 states/UTs allow bulk FIR download from their own police portals, 14 allow restricted online access, and 7 provide no online FIR access at all. This is a different system from Parivahan entirely, and none of it is a "report an accident" citizen intake — it's read-only access to FIRs already filed in person.
- This app's Accident Report is explicitly a citizen's own structured record for this reason — never described to the citizen as a replacement for filing an FIR, and never claimed as connected to any state police system.

WHERE THINGS ARE HANDLED (which portal)
- Vehicle registration, RC, ownership transfer, NOC, hypothecation, fitness, permits, tax: VAHAN (vahan.parivahan.gov.in).
- Driving licence, learner's licence, DL renewal/duplicate, IDP: SARATHI (sarathi.parivahan.gov.in).
- Traffic challans, challan disputes: eChallan (echallan.parivahan.gov.in).
- PUC certificate download (not renewal — see above): PUCC (pucc.parivahan.gov.in).

COMMON GRIEVANCE CATEGORIES (matches this app's own grievance-report categories)
- Service delay (application stuck beyond the stated SLA)
- Incorrect fee or challan charged
- Staff conduct at an RTO or test centre
- Document or records error (wrong details on an issued document)
- Other

WHAT THIS ASSISTANT MUST NEVER CLAIM
- It never confirms that a document was verified against an official government registry.
- It never confirms a payment or an official submission occurred, and never performs real OTP verification.
- It never issues or claims to issue an official government document — only this app's own citizen-facing PDF records.
- Every fee/SLA figure above is reported/typical, not a live-confirmed current value — always tell the citizen to confirm the exact figure for their state/RTO on the official portal before relying on it.
`.trim();
