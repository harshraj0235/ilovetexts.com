export const MAX_PDF_SIZE = 100 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 300 * 1024 * 1024;

export function isPdfFile(file) {
  if (!file) return false;
  return file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
}

export function validatePdfFiles(files, currentFiles = []) {
  const accepted = [];
  const rejected = [];
  const existingSize = currentFiles.reduce((total, item) => total + (item.file?.size || item.size || 0), 0);
  let nextTotal = existingSize;

  for (const file of Array.from(files || [])) {
    if (!isPdfFile(file)) {
      rejected.push(`${file.name || 'This file'} is not a PDF.`);
      continue;
    }
    if (!file.size) {
      rejected.push(`${file.name} is empty.`);
      continue;
    }
    if (file.size > MAX_PDF_SIZE) {
      rejected.push(`${file.name} is larger than 100 MB.`);
      continue;
    }
    if (nextTotal + file.size > MAX_TOTAL_SIZE) {
      rejected.push('The combined selection is larger than 300 MB.');
      continue;
    }
    accepted.push(file);
    nextTotal += file.size;
  }

  return { accepted, rejected };
}

export function moveItem(items, from, to) {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
