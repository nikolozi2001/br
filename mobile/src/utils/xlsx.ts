import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type Cell = string | number;

/**
 * Builds a real .xlsx workbook (SheetJS) from a header row + data rows, writes
 * it to the cache directory as binary, and opens the share sheet.
 */
export async function writeXlsxAndShare(
  filename: string,
  sheetName: string,
  header: Cell[],
  rows: Cell[][],
): Promise<string> {
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

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: XLSX_MIME, UTI: 'org.openxmlformats.spreadsheetml.sheet' });
  }
  return file.uri;
}
