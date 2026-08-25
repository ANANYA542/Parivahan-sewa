import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { CaseDetail } from '@parivahan/shared';

const PAGE_WIDTH = 595.28; // A4 in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const INK = rgb(0.11, 0.14, 0.13);
const MUTED = rgb(0.35, 0.38, 0.36);
const ACCENT = rgb(0.72, 0.44, 0.11);
const LINE = rgb(0.84, 0.85, 0.81);

function formatFieldName(field: string) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

/**
 * Generates a plain acknowledgement receipt for a case this app created.
 * This is explicitly NOT a copy of an official Parivahan/RTO form — those
 * vary by state and document requirement, which is exactly why the PRD
 * routes `official_portal` services out to the real portal instead of
 * fabricating one. This is only a dated summary of what was submitted, for
 * the citizen's own records.
 */
@Injectable()
export class DocumentsService {
  async generateCaseAcknowledgement(caseDetail: CaseDetail): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = PAGE_HEIGHT - MARGIN;

    const drawText = (text: string, options: { font?: typeof bodyFont; size?: number; color?: typeof INK; x?: number } = {}) => {
      page.drawText(text, {
        x: options.x ?? MARGIN,
        y,
        size: options.size ?? 10.5,
        font: options.font ?? bodyFont,
        color: options.color ?? INK
      });
    };

    const drawRule = () => {
      page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: LINE });
    };

    drawText('PARIVAHAN TRACK', { font: boldFont, size: 9, color: ACCENT });
    y -= 22;
    drawText('Submission Acknowledgement', { font: boldFont, size: 20 });
    y -= 26;
    drawRule();
    y -= 24;

    const summaryRows: Array<[string, string]> = [
      ['Case ID', caseDetail.caseId],
      ['Service', caseDetail.service.name],
      ['Category', formatFieldName(caseDetail.service.category)],
      ['Stage', formatFieldName(caseDetail.stage)],
      ['Status', formatFieldName(caseDetail.status)],
      ['Submitted', new Date(caseDetail.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })]
    ];
    if (caseDetail.vehicle) {
      summaryRows.push(['Vehicle', `${caseDetail.vehicle.registrationNumber} · ${caseDetail.vehicle.vehicleType.replace(/-/g, ' ')}`]);
    }
    if (caseDetail.slaDeadline) {
      summaryRows.push(['SLA deadline', new Date(caseDetail.slaDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })]);
    }

    for (const [label, value] of summaryRows) {
      drawText(label.toUpperCase(), { font: boldFont, size: 8, color: MUTED });
      drawText(value, { size: 11, x: MARGIN + 140 });
      y -= 20;
    }

    y -= 8;
    drawRule();
    y -= 24;

    drawText('Submitted details', { font: boldFont, size: 12 });
    y -= 20;

    const entries = Object.entries(caseDetail.submissionData);
    if (!entries.length) {
      drawText('No additional details were collected for this submission.', { size: 10, color: MUTED });
      y -= 18;
    } else {
      for (const [field, value] of entries) {
        drawText(formatFieldName(field), { font: boldFont, size: 9.5, color: MUTED });
        drawText(formatValue(value), { size: 10.5, x: MARGIN + 160 });
        y -= 18;
        if (y < MARGIN + 90) break; // stay on one page; overflow is truncated rather than mis-laid-out
      }
    }

    y -= 16;
    drawRule();
    y -= 20;

    const disclaimerLines = [
      'This is an application-generated acknowledgement for your own records.',
      'It is not an official government document. Where this service links to',
      'an official Parivahan portal, that portal remains the authoritative source.'
    ];
    for (const line of disclaimerLines) {
      drawText(line, { size: 8.5, color: MUTED });
      y -= 13;
    }

    return pdfDoc.save();
  }
}
