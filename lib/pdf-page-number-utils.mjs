export const MAX_PAGE_NUMBER_PDF_SIZE = 100 * 1024 * 1024;

export function mmToPoints(mm) {
  return mm * 72 / 25.4;
}

export function buildPageLabel(sequenceIndex, numberedPageCount, startNumber, format, prefix = '', suffix = '') {
  const number = startNumber + sequenceIndex;
  const finalNumber = startNumber + numberedPageCount - 1;
  const core = format === 'n/total' ? `${number} / ${finalNumber}`
    : format === 'Page n' ? `Page ${number}`
      : format === 'Page n of total' ? `Page ${number} of ${finalNumber}`
      : format === 'n of total' ? `${number} of ${finalNumber}`
        : String(number);
  return `${prefix}${core}${suffix}`;
}

export function isWinAnsiText(value) {
  // pdf-lib's standard Helvetica font uses Windows-1252/WinAnsi encoding.
  return /^[\u0009\u000A\u000D\u0020-\u007E\u00A0-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]*$/.test(value);
}

export function safeNumberedPdfName(name = 'document.pdf') {
  const base = name.replace(/\.pdf$/i, '').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/\.+$/g, '').trim();
  return `${(base || 'document').slice(0, 100)}-numbered.pdf`;
}
