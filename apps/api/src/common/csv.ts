// Spreadsheet programs run text that starts with one of these as a formula (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

const UTF8_BOM = String.fromCharCode(0xfeff);

export function csvField(value: string | number): string {
  let text = String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// UTF-8 BOM first so Excel reads the file as UTF-8; CRLF line ends as in RFC 4180.
export function toCsv(header: string[], rows: Array<Array<string | number>>): string {
  const lines = [header, ...rows].map((row) => row.map(csvField).join(','));
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`;
}
