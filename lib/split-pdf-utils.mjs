export const MAX_SPLIT_PDF_SIZE = 100 * 1024 * 1024;

export function safePdfBaseName(name = 'document.pdf') {
  const base = name.replace(/\.pdf$/i, '').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/\.+$/g, '').trim();
  return (base || 'document').slice(0, 100);
}

function parseToken(token, totalPages) {
  const value = token.trim();
  if (!value) throw new Error('Remove the empty page range.');
  const match = value.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) throw new Error(`“${value}” is not a valid page or range.`);
  const start = Number(match[1]);
  const end = Number(match[2] || match[1]);
  if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
    throw new Error(`“${value}” is outside this PDF's 1–${totalPages} page range.`);
  }
  if (start > end) throw new Error(`“${value}” is reversed. Use ${end}-${start} instead.`);
  return { label: start === end ? String(start) : `${start}-${end}`, indices: Array.from({ length: end - start + 1 }, (_, index) => start + index - 1) };
}

export function parseSplitRanges(input, totalPages) {
  if (!input.trim()) throw new Error('Enter at least one page range.');
  return input.split(',').map((token) => parseToken(token, totalPages));
}

export function parsePageSelection(input, totalPages) {
  const ranges = parseSplitRanges(input, totalPages);
  const seen = new Set();
  return ranges.flatMap(({ indices }) => indices.filter((index) => {
    if (seen.has(index)) return false;
    seen.add(index);
    return true;
  }));
}
