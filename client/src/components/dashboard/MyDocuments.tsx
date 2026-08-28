import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line import/no-unresolved
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { CaseRecord, ServiceDefinition } from '@parivahan/shared';
import { downloadCaseAcknowledgement, getCaseDocumentBlob } from '../../lib/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

interface MyDocumentsProps {
  cases: CaseRecord[];
  services: ServiceDefinition[];
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
}

/**
 * Rasterizes the PDF's real first page to a PNG data URL. Chromium's own
 * PDF plugin turned out not to be a safe bet here — this build has no PDF
 * viewer plugin at all (confirmed live: an <embed> reports "Couldn't load
 * plugin", and navigating a blob PDF URL triggers a download instead of
 * rendering), and a real user with "download PDFs" enabled in their own
 * browser would hit the same wall. pdf.js renders to a canvas directly, so
 * the preview is a plain <img> that works the same everywhere.
 */
async function renderFirstPageToDataUrl(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const targetWidth = 320;
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is not available in this browser.');

  await page.render({ canvasContext: context, viewport, canvas }).promise;
  return canvas.toDataURL('image/png');
}

function DocumentCard({ caseRecord, serviceName }: { caseRecord: CaseRecord; serviceName: string }) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    void getCaseDocumentBlob(caseRecord.caseId)
      .then((blob) => renderFirstPageToDataUrl(blob))
      .then((dataUrl) => {
        if (isCurrent) setPreviewSrc(dataUrl);
      })
      .catch((reason) => {
        if (isCurrent) setError(reason instanceof Error ? reason.message : 'Preview unavailable.');
      });
    return () => {
      isCurrent = false;
    };
  }, [caseRecord.caseId]);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadCaseAcknowledgement(caseRecord.caseId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to prepare your copy right now.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{serviceName}</p>
      <p className="mt-0.5 text-xs text-slate-500">Completed {displayDate(caseRecord.createdAt)} · {caseRecord.caseId}</p>
      <div className="mt-3 flex h-44 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {previewSrc ? (
          <img src={previewSrc} alt={`First page preview of the ${serviceName} document`} className="h-full w-full object-contain" />
        ) : error ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-rose-600">{error}</div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">Loading preview…</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={isDownloading}
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors duration-200 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDownloading ? 'Preparing…' : 'Download again'}
      </button>
    </div>
  );
}

/**
 * Every service the signed-in citizen has completed to a real submitted
 * case, each with a live preview of its generated copy and a one-click
 * re-download. `cases` always comes from this user's own identity bundle
 * (GET /users/:userId/identity, guarded server-side), so this is
 * structurally scoped to the signed-in user — never a cross-user list.
 */
export function MyDocuments({ cases, services }: MyDocumentsProps) {
  const documents = cases
    .filter((caseRecord) => caseRecord.status !== 'draft')
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
      <p className="font-mono text-[10px] tracking-[0.16em] text-slate-500">YOUR RECORDS</p>
      <h2 className="font-display mt-2 text-3xl text-slate-900">My Documents</h2>
      <p className="mt-2 text-sm text-slate-500">Every service you've completed, with your generated copy ready to preview or download again.</p>
      {documents.length ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((caseRecord) => {
            const service = services.find((item) => item.serviceId === caseRecord.serviceId);
            return <DocumentCard key={caseRecord.caseId} caseRecord={caseRecord} serviceName={service?.name ?? caseRecord.serviceId} />;
          })}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-400">Complete a guided service to see your copy appear here.</p>
      )}
    </section>
  );
}
