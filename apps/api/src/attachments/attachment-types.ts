import { extname } from 'node:path';

// Allowed extensions and the MIME types a browser may send for them.
const ALLOWED_TYPES: Record<string, string[]> = {
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain'],
  // Windows browsers often label CSV as an Excel type.
  '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_TYPES);

export function isAllowedFile(originalName: string, mimeType: string): boolean {
  const mimes = ALLOWED_TYPES[extname(originalName).toLowerCase()];
  return mimes !== undefined && mimes.includes(mimeType.toLowerCase());
}
