import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { CaseDetail } from '@parivahan/shared';

const PAGE_WIDTH = 595.28; // A4 in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const INK = rgb(0.11, 0.14, 0.13);
const MUTED = rgb(0.35, 0.38, 0.36);
const ACCENT = rgb(0.72, 0.44, 0.11);
const ACCENT_GREEN = rgb(0.13, 0.42, 0.26);
const LINE = rgb(0.84, 0.85, 0.81);
const BAND = rgb(0.97, 0.95, 0.9);

function formatFieldName(field: string) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

interface DocumentSection {
  title: string;
  rows: Array<[string, string]>;
}

/**
 * Groups an accident report's submissionData into sections that mirror the
 * real MoRTH Road Accident Recording Form's categories (Accident
 * Identification / Road & Conditions / People & Vehicles) — the format
 * India's police use at the scene — so the citizen's copy reads in a
 * familiar shape rather than a flat field dump.
 */
function accidentSections(data: Record<string, unknown>): DocumentSection[] {
  const pick = (...fields: string[]): Array<[string, string]> =>
    fields.filter((field) => field in data).map((field) => [formatFieldName(field), formatValue(data[field])]);

  return [
    { title: 'When & where', rows: pick('location', 'time') },
    { title: 'Conditions', rows: pick('areaType', 'weather', 'collisionType', 'hitAndRun') },
    { title: 'People & vehicles', rows: pick('injurySeverity', 'vehiclesInvolved') }
  ].filter((section) => section.rows.length);
}

function genericSection(data: Record<string, unknown>, skip: string[]): DocumentSection[] {
  const rows = Object.entries(data)
    .filter(([field]) => !skip.includes(field))
    .map(([field, value]) => [formatFieldName(field), formatValue(value)] as [string, string]);
  return rows.length ? [{ title: 'Submitted details', rows }] : [];
}

function documentTitleFor(caseDetail: CaseDetail): string {
  switch (caseDetail.type) {
    case 'accident':
      return 'Road Incident Intimation Record';
    case 'grievance':
      return 'Transport Grievance Record';
    case 'challan':
      return 'Challan Dispute Record';
    default:
      return 'Submission Acknowledgement';
  }
}

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

    const drawRule = (color: typeof LINE = LINE) => {
      page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color });
    };

    // Header band — a visual anchor distinguishing this from a plain text dump.
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 96, width: PAGE_WIDTH, height: 96, color: BAND });
    y = PAGE_HEIGHT - 40;
    drawText('PARIVAHAN TRACK', { font: boldFont, size: 9, color: ACCENT });
    y -= 24;
    drawText(documentTitleFor(caseDetail), { font: boldFont, size: 19 });
    y -= 20;
    drawText(`Case ${caseDetail.caseId} · ${caseDetail.service.name}`, { size: 10, color: MUTED });
    y = PAGE_HEIGHT - 96 - 28;

    const summaryRows: Array<[string, string]> = [
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
      y -= 19;
    }

    y -= 6;
    drawRule();
    y -= 24;

    const skipFromGeneric = ['declaration', 'acknowledgement'];
    const sections =
      caseDetail.type === 'accident'
        ? accidentSections(caseDetail.submissionData)
        : genericSection(caseDetail.submissionData, skipFromGeneric);

    if (!sections.length) {
      drawText('No additional details were collected for this submission.', { size: 10, color: MUTED });
      y -= 18;
    }

    for (const section of sections) {
      drawText(section.title, { font: boldFont, size: 11.5, color: ACCENT_GREEN });
      y -= 18;
      for (const [label, value] of section.rows) {
        drawText(label, { font: boldFont, size: 9.5, color: MUTED });
        drawText(value, { size: 10.5, x: MARGIN + 160 });
        y -= 17;
        if (y < MARGIN + 110) break; // stay on one page; overflow is truncated rather than mis-laid-out
      }
      y -= 8;
      if (y < MARGIN + 110) break;
    }

    y -= 8;
    drawRule();
    y -= 20;

    const disclaimerLines =
      caseDetail.type === 'accident'
        ? [
            'This is a citizen-generated record for your own use, not an official police FIR or',
            'government-issued document. Its categories follow the structure India’s official',
            'road-accident reporting format uses, so you can bring a printed copy when filing an',
            'FIR at your local police station or attaching it to an insurance claim.'
          ]
        : [
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
