import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { CaseDetail } from '@parivahan/shared';

/**
 * None of the 25 real CMVR forms in server/assets/forms have fillable
 * AcroForm fields (checked directly with pdf-lib — every one reports 0
 * fields), so "filling them in" means overlaying answer text at the real
 * coordinates of each form's own printed answer lines and checkboxes,
 * measured directly off the actual PDF (via `pdftotext -bbox`, cross-checked
 * against a rendered page image) — not estimated from a screenshot alone.
 * Ink is a distinct color from the form's own printed black text so it
 * reads clearly as "filled in", the way a pen would on a paper copy.
 */
const INK = rgb(0.09, 0.16, 0.45);
const ASSETS_DIR = path.join(process.cwd(), 'assets', 'forms');

function s(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function fitToWidth(font: PDFFont, text: string, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && font.widthOfTextAtSize(`${truncated}…`, size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length < text.length ? `${truncated}…` : truncated;
}

function drawFitted(page: PDFPage, font: PDFFont, text: string, x: number, y: number, maxWidth: number, size = 7.5) {
  const value = s(text);
  if (!value) return;
  page.drawText(fitToWidth(font, value, size, maxWidth), { x, y, size, font, color: INK });
}

/** Word-wraps into at most `maxLines`, each within `maxWidth`, truncating the last line with an ellipsis if there's more. */
function drawWrapped(page: PDFPage, font: PDFFont, text: string, x: number, topY: number, maxWidth: number, lineHeight: number, maxLines: number, size = 7.5) {
  const value = s(text);
  if (!value) return;
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  const truncated = lines.length === maxLines && words.join(' ').length > lines.join(' ').length;
  lines.forEach((line, index) => {
    const text2 = truncated && index === lines.length - 1 ? fitToWidth(font, `${line}…`, size, maxWidth) : line;
    page.drawText(text2, { x, y: topY - index * lineHeight, size, font, color: INK });
  });
}

function todayIndian(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${now.getFullYear()}`;
}

async function loadTemplate(filename: string): Promise<PDFDocument> {
  const bytes = await readFile(path.join(ASSETS_DIR, filename));
  return PDFDocument.load(bytes);
}

/** Row order matches Form 2's own "Services applying for" tick-box list, top to bottom. */
const FORM_2_SERVICE_ROW: Record<string, number> = {
  'svc-learner-licence': 0,
  'svc-driving-licence': 1,
  'svc-dl-add-class': 2,
  'svc-dl-renewal': 3,
  'svc-dl-duplicate': 4,
  'svc-dl-change-address': 5,
  'svc-dl-change-name': 6
};
const FORM_2_ROW_TICK_Y = [483.53, 466.25, 448.97, 431.69, 414.41, 397.13, 379.85];
const FORM_2_TICK_X = 442;

async function fillForm2(caseDetail: CaseDetail): Promise<Uint8Array | null> {
  const rowIndex = FORM_2_SERVICE_ROW[caseDetail.serviceId];
  if (rowIndex === undefined) return null;

  const pdfDoc = await loadTemplate('FORM-2.pdf');
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page1 = pdfDoc.getPage(0);
  const page2 = pdfDoc.getPage(1);
  const page3 = pdfDoc.getPage(2);
  const data = caseDetail.submissionData as Record<string, unknown>;

  // Tick the one "services applying for" row matching this specific service — derived from serviceId, never asked of the citizen twice.
  page1.drawText('X', { x: FORM_2_TICK_X, y: FORM_2_ROW_TICK_Y[rowIndex] ?? 483.53, size: 10, font: boldFont, color: INK });

  // Personal details (page 2)
  drawFitted(page2, font, s(data.applicantFullName), 220.6, 449.61, 355);
  drawFitted(page2, font, s(data.fatherOrGuardianName), 224.9, 435.39, 355);
  drawFitted(page2, font, s(data.dateOfBirth), 422.4, 398.91, 158);
  drawFitted(page2, font, s(data.mobileNumber), 428.8, 343.71, 150);

  const gender = s(data.gender).toLowerCase();
  const genderTickX: Record<string, number> = { male: 223.8, female: 265.8, transgender: 329.3 };
  if (genderTickX[gender] !== undefined) {
    page2.drawText('X', { x: genderTickX[gender], y: 398.91, size: 9, font: boldFont, color: INK });
  }

  const guardianRelation = s(data.guardianRelation).toLowerCase();
  const relationTickX: Record<string, number> = { father: 267.6, mother: 317.3, husband: 375.0, guardian: 440.0 };
  if (relationTickX[guardianRelation] !== undefined) {
    page2.drawText('X', { x: relationTickX[guardianRelation], y: 309.25, size: 9, font: boldFont, color: INK });
  }

  // Present Address — wrapped across the 7 printed address rows (House/Door/Flat through State).
  const address = s(data.presentAddress);
  if (address) {
    drawWrapped(page2, font, address, 240, 218.19, 122, 17.28, 7);
    const pinMatch = address.match(/\b\d{6}\b/);
    if (pinMatch) {
      page3.drawText(pinMatch[0], { x: 240, y: 650.91, size: 7.5, font, color: INK });
    }
  }

  return pdfDoc.save();
}

async function fillForm12(caseDetail: CaseDetail): Promise<Uint8Array | null> {
  if (caseDetail.serviceId !== 'svc-driving-school') return null;
  const pdfDoc = await loadTemplate('FORM-12.pdf');
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPage(0);
  const data = caseDetail.submissionData as Record<string, unknown>;

  const rows: Array<[unknown, number]> = [
    [data.applicantFullName, 603.22],
    [data.fatherOrGuardianName, 587.05],
    [data.applicantAddress, 571.18],
    [data.businessPlace, 555.01],
    [data.facilitiesAvailable, 538.83],
    [data.staffQualifications, 522.96],
    [data.trainingVehicleModels, 506.79],
    [data.vehicleRegistrationMarks, 476.3],
    [data.feeAmount, 461.94]
  ];
  for (const [value, y] of rows) {
    drawFitted(page, font, s(value), 460, y, 120);
  }
  drawFitted(page, font, todayIndian(), 107.4, 428.38, 80);

  return pdfDoc.save();
}

async function fillForm18(caseDetail: CaseDetail): Promise<Uint8Array | null> {
  if (caseDetail.serviceId !== 'svc-trade-certificate') return null;
  const pdfDoc = await loadTemplate('FORM-18.pdf');
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPage(0);
  const data = caseDetail.submissionData as Record<string, unknown>;

  drawFitted(page, font, s(data.certificateNumber), 392, 569.35, 83, 6.5);
  drawFitted(page, font, s(data.certificateValidUpto), 84, 555.0, 38, 6);
  // The paragraph between "...specified below:—" (y=303 top-down) and "I/We
  // hereby deposit..." (y=398) is fully printed legal text with no blank
  // line of its own for this — confirmed by reading every word in that
  // range, not assumed. The one genuinely blank gap on this page is between
  // "Dated ..." and the "*Strike out..." footnote; that's used instead so
  // the citizen's own words never print on top of the form's own text.
  if (s(data.lossCircumstances)) {
    drawFitted(page, font, 'Circumstances of loss/damage (as declared by the applicant):', 68, 331.46, 459, 6.5);
    drawWrapped(page, font, s(data.lossCircumstances), 68, 323.46, 459, 8, 3, 6.5);
  }
  drawFitted(page, font, s(data.feeAmount), 276, 433.57, 36, 6.5);
  drawFitted(page, font, s(data.applicantAddress), 318, 371.03, 208, 7.5);
  drawFitted(page, font, todayIndian(), 107.4, 337.46, 150);

  return pdfDoc.save();
}

const FILLERS: Record<string, (caseDetail: CaseDetail) => Promise<Uint8Array | null>> = {
  'svc-learner-licence': fillForm2,
  'svc-driving-licence': fillForm2,
  'svc-dl-add-class': fillForm2,
  'svc-dl-renewal': fillForm2,
  'svc-dl-duplicate': fillForm2,
  'svc-dl-change-address': fillForm2,
  'svc-dl-change-name': fillForm2,
  'svc-driving-school': fillForm12,
  'svc-trade-certificate': fillForm18
};

const FORM_NUMBER_BY_SERVICE: Record<string, string> = {
  'svc-learner-licence': 'FORM-2',
  'svc-driving-licence': 'FORM-2',
  'svc-dl-add-class': 'FORM-2',
  'svc-dl-renewal': 'FORM-2',
  'svc-dl-duplicate': 'FORM-2',
  'svc-dl-change-address': 'FORM-2',
  'svc-dl-change-name': 'FORM-2',
  'svc-driving-school': 'FORM-12',
  'svc-trade-certificate': 'FORM-18'
};

/**
 * Returns the real government form, filled with this case's own collected
 * answers, when this service has a confirmed local form AND this module has
 * a coordinate-mapped filler for it. Returns null for every other
 * service (including svc-renew-puc, whose "form" is an issued certificate
 * reference, not something a citizen fills in) so the caller falls back to
 * the generic acknowledgement PDF.
 */
export async function fillOfficialForm(caseDetail: CaseDetail): Promise<{ bytes: Uint8Array; formNumber: string } | null> {
  const filler = FILLERS[caseDetail.serviceId];
  if (!filler) return null;
  const bytes = await filler(caseDetail);
  if (!bytes) return null;
  return { bytes, formNumber: FORM_NUMBER_BY_SERVICE[caseDetail.serviceId] ?? 'official-form' };
}
