export const MAX_TEXT_BYTES = 128 * 1024;
export const MAX_ENCODED_LENGTH = 2 * 1024 * 1024;

export const BYTE_FORMATS = {
  binary: { label: 'Binary', base: 2, width: 8, pattern: /^[01]+$/, prefix: '0b', digits: '0 and 1' },
  hex: { label: 'Hex', base: 16, width: 2, pattern: /^[0-9a-f]+$/i, prefix: '0x', digits: '0–9 and A–F' },
  octal: { label: 'Octal', base: 8, width: 3, pattern: /^[0-7]+$/, prefix: '0o', digits: '0–7' },
  decimal: { label: 'Decimal', base: 10, width: 3, pattern: /^\d+$/, prefix: '', digits: '0–9' },
};

export class ByteConversionError extends Error {
  constructor(message, start, end) {
    super(message);
    this.name = 'ByteConversionError';
    this.start = start;
    this.end = end;
  }
}

export function encodeText(text, encoding = 'utf8') {
  if (text.length > MAX_TEXT_BYTES) throw new ByteConversionError('Use up to 128 KiB of text bytes per conversion. Split larger text into smaller sections.');
  // TextEncoder replaces lone surrogates. Reject them so a round trip never
  // silently changes the user's input.
  let offset = 0;
  for (const character of text) {
    const point = character.codePointAt(0);
    if (point >= 0xd800 && point <= 0xdfff) {
      throw new ByteConversionError('This text contains an unpaired Unicode surrogate. Replace it before converting.', offset, offset + 1);
    }
    if (encoding === 'ascii' && point > 127) {
      throw new ByteConversionError(`ASCII cannot represent ${JSON.stringify(character)}. Choose UTF-8 to keep this character.`, offset, offset + character.length);
    }
    offset += character.length;
  }
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > MAX_TEXT_BYTES) throw new ByteConversionError('Use up to 128 KiB of text bytes per conversion. Split larger text into smaller sections.');
  return bytes;
}

export function parseBytes(input, format = 'hex') {
  if (input.length > MAX_ENCODED_LENGTH) throw new ByteConversionError('Use up to 2 MiB of encoded input per conversion.');
  const spec = BYTE_FORMATS[format];
  if (!spec) throw new ByteConversionError('Choose a supported byte format.');
  if (!input.trim()) return new Uint8Array();

  // Accept an exact stream of escaped hexadecimal bytes, but do not remove
  // arbitrary characters from malformed input (e.g. 4G must never become 04).
  const escaped = format === 'hex' && /^\s*(?:\\x[\da-f]{2}[\s,;]*)+$/i.test(input);
  const matches = escaped
    ? [...input.matchAll(/\\x([\da-f]{2})/gi)].map(m => ({ value: m[1], start: m.index, end: m.index + m[0].length }))
    : [...input.matchAll(/[^\s,;]+/g)].map(m => ({ value: m[0], start: m.index, end: m.index + m[0].length }));
  if (!matches.length) throw new ByteConversionError('Enter at least one byte, using the selected number format.');

  const values = [];
  for (const [index, token] of matches.entries()) {
    let digits = token.value;
    if (spec.prefix && digits.toLowerCase().startsWith(spec.prefix)) digits = digits.slice(2);
    if (!spec.pattern.test(digits)) {
      throw new ByteConversionError(`Group ${index + 1} is not valid ${spec.label.toLowerCase()}. Use only ${spec.digits}${spec.prefix ? `, with optional ${spec.prefix} prefixes` : ''}.`, token.start, token.end);
    }

    let groups = [digits];
    // Compact streams use fixed byte widths. Decimal streams are ambiguous,
    // so they always require explicit separators.
    if (matches.length === 1 && !escaped && format !== 'decimal' && digits.length > spec.width) {
      if (digits.length % spec.width !== 0) {
        throw new ByteConversionError(`Compact ${spec.label.toLowerCase()} needs a multiple of ${spec.width} digits. Add the missing digits or separate each byte with a space.`, token.start, token.end);
      }
      groups = digits.match(new RegExp(`.{${spec.width}}`, 'g'));
    } else if (digits.length > spec.width) {
      throw new ByteConversionError(`Group ${index + 1} is too long. Separate each byte with a space (up to ${spec.width} digits per byte).`, token.start, token.end);
    }
    for (const group of groups) {
      const value = Number.parseInt(group, spec.base);
      if (value > 255) throw new ByteConversionError(`Group ${index + 1} exceeds one byte (255 decimal). ${format === 'octal' ? 'The largest octal byte is 377.' : 'Use values from 0 to 255.'}`, token.start, token.end);
      values.push(value);
      if (values.length > MAX_TEXT_BYTES) throw new ByteConversionError('Use up to 128 KiB of decoded bytes per conversion.');
    }
  }
  return Uint8Array.from(values);
}

export function decodeBytes(bytes, encoding = 'utf8') {
  if (encoding === 'ascii') {
    const invalid = bytes.findIndex(byte => byte > 127);
    if (invalid !== -1) throw new ByteConversionError(`Byte ${invalid + 1} is ${bytes[invalid]}. ASCII only allows 0–127; choose UTF-8 if these are UTF-8 bytes.`);
  }
  try {
    // Preserve a leading BOM (U+FEFF) and stop on malformed UTF-8 instead of
    // inserting replacement characters that look like a successful result.
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new ByteConversionError('These bytes are not a complete, valid UTF-8 sequence. Check for missing bytes or a different source encoding. No text has been substituted.');
  }
}

export function formatBytes(bytes, format = 'hex', options = {}) {
  const spec = BYTE_FORMATS[format];
  const { separator = 'space', prefix = false, uppercase = true, columns = 0 } = options;
  const separators = { space: ' ', comma: ', ', newline: '\n', compact: '' };
  // Decimal bytes have variable width; compact output would not round-trip.
  const joiner = format === 'decimal' && separator === 'compact' ? ' ' : (separators[separator] ?? ' ');
  const groups = Array.from(bytes, byte => {
    let value = byte.toString(spec.base);
    if (format !== 'decimal') value = value.padStart(spec.width, '0');
    if (uppercase) value = value.toUpperCase();
    return (prefix && separator !== 'compact' ? spec.prefix : '') + value;
  });
  if (columns > 0 && separator !== 'newline' && separator !== 'compact') {
    const lines = [];
    for (let i = 0; i < groups.length; i += columns) lines.push(groups.slice(i, i + columns).join(joiner));
    return lines.join('\n');
  }
  return groups.join(joiner);
}

export function inspectCharacters(text, limit = 120) {
  const rows = [];
  let byteOffset = 0;
  const controls = { 0: 'NUL', 9: 'TAB', 10: 'LF', 13: 'CR', 32: 'SPACE', 127: 'DEL', 0xfeff: 'BOM' };
  for (const character of text) {
    if (rows.length === limit) break;
    const codePoint = character.codePointAt(0);
    const bytes = new TextEncoder().encode(character);
    rows.push({
      label: controls[codePoint] || (codePoint < 32 ? `CTRL ${codePoint}` : character),
      codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
      offset: byteOffset,
      length: bytes.length,
      binary: formatBytes(bytes, 'binary'),
      hex: formatBytes(bytes, 'hex'),
      decimal: formatBytes(bytes, 'decimal'),
      octal: formatBytes(bytes, 'octal'),
    });
    byteOffset += bytes.length;
  }
  return rows;
}

export function byteReportCsv(bytes) {
  const rows = ['byte_offset,decimal,hex,binary,octal'];
  bytes.forEach((byte, index) => rows.push(`${index},${byte},${byte.toString(16).toUpperCase().padStart(2, '0')},${byte.toString(2).padStart(8, '0')},${byte.toString(8).padStart(3, '0')}`));
  return rows.join('\r\n');
}
