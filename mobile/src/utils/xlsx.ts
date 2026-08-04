import * as XLSX from 'xlsx';
import { File, Paths } from 'expo-file-system';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const XLSX_UTI = 'org.openxmlformats.spreadsheetml.sheet';

export type Cell = string | number;

/**
 * Builds a real .xlsx workbook (SheetJS) from a header row + data rows and
 * writes it to the cache as binary. What happens next — saving it to the device
 * or handing it to the share sheet — is the caller's decision.
 */
export function writeXlsx(filename: string, sheetName: string, header: Cell[], rows: Cell[][]): File {
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  // Sheet names are capped at 31 chars and can't contain []:*?/\.
  const safeName = sheetName.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31) || 'Sheet1';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeName);

  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(new Uint8Array(output));
  return file;
}
