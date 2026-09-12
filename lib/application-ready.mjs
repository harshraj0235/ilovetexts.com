// Versioned preparation guidance, not an admission/eligibility decision engine.
export const APPLICATION_LIMITS = Object.freeze({ files: 20, fileBytes: 10 * 1024 * 1024, totalBytes: 40 * 1024 * 1024, pages: 100, custom: 10 });
export const APPLICATION_RECIPE = Object.freeze({
  id: 'india-university-uni-assist', version: '2026-09-12.1', checked: '2026-09-12',
  title: 'Indian university graduates · uni-assist preparation',
  source: 'https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/in/',
  generalSource: 'https://www.uni-assist.de/en/how-to-apply/assemble-your-documents/',
  scope: 'General document organisation for completed university studies in India. Not a complete programme checklist, APS application, visa service or official assessment.',
});
export const BASE_REQUIREMENTS = Object.freeze([
  { id: 'transcript', title: 'Subjects and grades', note: 'Include relevant reverse-side information. Check completeness against your own academic records.', source: APPLICATION_RECIPE.source },
  { id: 'degree', title: 'Degree certificate', note: 'For completed studies. Consult the official guidance on provisional certificates and any additional evidence.', source: APPLICATION_RECIPE.source },
  { id: 'grading', title: 'Degree grading system', note: 'Check the degree-award minimum and maximum for your programme and batch, not only individual subject pass marks.', source: APPLICATION_RECIPE.source },
  { id: 'aps', title: 'APS certificate', note: 'Keep the digitally sealed original unchanged. This tool does not authenticate the certificate or decide exceptions.', source: APPLICATION_RECIPE.source },
]);
export const FILE_KINDS = ['Unassigned', 'Transcript', 'Degree', 'Grading system', 'APS certificate', 'Language certificate', 'Other'];

export function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.') || url.href.length > 1500) return '';
    return url.href;
  } catch { return ''; }
}

export function sourcesAreStale(now = new Date()) {
  return now.getTime() > Date.parse(`${APPLICATION_RECIPE.checked}T00:00:00Z`) + 30 * 86400000;
}

export function checkBatch(existing, incoming) {
  if (existing.length + incoming.length > APPLICATION_LIMITS.files) throw new Error('Limit: 20 files per workspace.');
  if ([...existing, ...incoming].reduce((sum, file) => sum + file.size, 0) > APPLICATION_LIMITS.totalBytes) throw new Error('Limit: 40 MB total. Choose a smaller batch.');
}

export function validatePdfFile(file, bytes) {
  if (!/\.pdf$/i.test(file.name)) throw new Error('This release accepts PDF files only.');
  if (!file.size || file.size > APPLICATION_LIMITS.fileBytes) throw new Error('Each PDF must be non-empty and at most 10 MB.');
  if (new TextDecoder('ascii').decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error('This file does not have a PDF header. Renaming another file to .pdf does not convert it.');
}

export async function fingerprint(bytes) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure file checks require HTTPS or localhost and a supported browser.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

export function safeArchiveName(name, index) {
  // Prefix prevents reserved device names and collisions; remove path/bidi controls.
  const clean = String(name).normalize('NFKC').replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069<>:"/\\|?*]/g, '_').replace(/[. ]+$/g, '').slice(0, 100).replace(/\.pdf$/i, '');
  return `originals/${String(index + 1).padStart(2, '0')}-${clean || 'document'}.pdf`;
}

export function documentAlerts(doc, docs) {
  const alerts = [...doc.warnings];
  if (docs.some(other => other.id !== doc.id && other.hash === doc.hash)) alerts.push('Identical file bytes found elsewhere in this workspace. Nothing was removed automatically.');
  if (doc.kind === 'Unassigned') alerts.push('Choose a document category. File names are not reliable classifications.');
  if (doc.kind === 'APS certificate') alerts.push('Preserve the original. File integrity is not proof that its seal is authentic.');
  return alerts;
}

export function requirementStatus(requirement, review, docs) {
  const selected = (review?.fileIds || []).filter(id => docs.some(doc => doc.id === id));
  if (!selected.length) return 'No file linked';
  return review?.confirmed ? 'User checked' : 'Needs your check';
}

export function buildApplicationReport({ plan, docs, requirements, reviews, now = new Date() }) {
  return {
    format: 'ilovetexts-application-ready', version: 1,
    createdAt: now.toISOString(), recipe: APPLICATION_RECIPE,
    sourceRefreshRecommended: sourcesAreStale(now),
    status: 'Preparation record only — not official approval or a complete application assessment',
    plan: { university: plan.university, programme: plan.programme, sourceUrl: safeSourceUrl(plan.sourceUrl), programmeChecklistConfirmedByUser: Boolean(plan.confirmed) },
    documents: docs.map((doc, index) => ({
      id: doc.id, originalName: doc.name, exportPath: safeArchiveName(doc.name, index),
      sizeBytes: doc.size, sha256: doc.hash, pages: doc.pages, category: doc.kind,
      lowTextPages: doc.lowTextPages, alerts: documentAlerts(doc, docs), bytesModified: false,
    })),
    checklist: requirements.map(requirement => ({
      title: requirement.title, guidance: requirement.note, source: requirement.source,
      origin: requirement.custom ? 'User-entered requirement; not independently verified' : 'Source-linked general guidance',
      status: requirementStatus(requirement, reviews[requirement.id], docs),
      fileIds: (reviews[requirement.id]?.fileIds || []).filter(id => docs.some(doc => doc.id === id)),
    })),
    limitations: [
      'No admission, visa, eligibility, authenticity, translation or signature validation.',
      'Readable text does not establish legibility, missing-page detection or document completeness.',
      'No documents were submitted to an institution. The user must check the current official requirements.',
      'Files are copied unchanged into this archive. The archive is for organisation, not a prescribed portal upload format.',
      'SHA-256 identifies file bytes, not the issuer, creation time or legal validity. Treat original PDFs as untrusted files.',
    ],
  };
}

export function reportText(report) {
  return [
    'APPLICATIONREADY — PREPARATION RECORD', report.status, `Created: ${report.createdAt}`,
    `University: ${report.plan.university}`, `Programme: ${report.plan.programme}`,
    `User-provided programme source: ${report.plan.sourceUrl}`,
    `General source: ${report.recipe.source}`, `Source checked: ${report.recipe.checked}; version ${report.recipe.version}`,
    report.sourceRefreshRecommended ? 'RECHECK SOURCES: guidance is more than 30 days old.' : 'Always recheck current official sources before submitting.',
    `Programme checklist checked by user: ${report.plan.programmeChecklistConfirmedByUser ? 'Yes' : 'No'}`,
    '', 'CHECKLIST', ...report.checklist.map(item => `${item.status}: ${item.title}\n  ${item.origin}\n  ${item.guidance}\n  Source: ${item.source}\n  File IDs: ${item.fileIds.join(', ') || 'none'}`),
    '', 'FILES — ORIGINAL BYTES PRESERVED', ...report.documents.map(doc => `${doc.id}: ${doc.originalName}\n  Path: ${doc.exportPath}\n  Pages: ${doc.pages}; SHA-256: ${doc.sha256}\n  Alerts: ${doc.alerts.join(' | ') || 'No automatic alert; manual inspection still needed.'}`),
    '', 'LIMITATIONS', ...report.limitations,
    '', 'PRIVACY: this download includes your files and metadata. Store and share it carefully. No recovery service or cloud backup is provided.',
  ].join('\n');
}

export async function buildApplicationArchive(input) {
  if (!input.docs.length) throw new Error('Add at least one readable PDF before exporting a file pack.');
  const { default: JSZip } = await import('jszip');
  const report = buildApplicationReport(input);
  const zip = new JSZip();
  for (const [index, doc] of input.docs.entries()) {
    if (await fingerprint(doc.bytes) !== doc.hash) throw new Error('File integrity check failed. Re-import the original before exporting.');
    zip.file(report.documents[index].exportPath, doc.bytes);
  }
  zip.file('PREPARATION-REPORT.txt', reportText(report));
  zip.file('manifest.json', JSON.stringify(report, null, 2));
  return zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
}
