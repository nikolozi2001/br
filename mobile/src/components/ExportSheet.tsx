import React from 'react';
import { Share } from 'react-native';
import * as Print from 'expo-print';

import BottomSheet, { SheetRow } from './BottomSheet';
import { getStrings } from '../i18n/strings';
import { groupDigits } from '../api/registry';
import {
  saveDownloadToDevice,
  saveMessage,
  saveToDevice,
  saveUriToDevice,
  type SaveResult,
} from '../utils/save';
import { writeXlsx, XLSX_MIME, type Cell } from '../utils/xlsx';
import { useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import type { Strings } from '../i18n/strings';
import type { Subject } from '../types';

type ColumnKey = keyof Subject;
type LabelKey = keyof Strings;

const COLUMNS: [ColumnKey, LabelKey][] = [
  ['id', 'idLabel'],
  ['code', 'legalCode'],
  ['name', 'orgName'],
  ['formFull', 'legalFormFull'],
  ['region', 'region'],
  ['muni', 'municipality'],
  ['addr', 'address'],
  ['nace', 'activityCode'],
  ['naceName', 'activityName'],
  ['head', 'head'],
];

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeCsv = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;

/**
 * Rough download size for the server CSV. Measured at ~780 bytes per row on a
 * 43 811-row export, and the whole register is over a million rows — worth
 * saying out loud before someone taps it on mobile data.
 */
function csvSize(rows: number): string {
  const mb = (rows * 780) / (1024 * 1024);
  return mb >= 1024 ? `~${(mb / 1024).toFixed(1)} GB` : `~${Math.max(1, Math.round(mb))} MB`;
}

function buildCsv(rows: Subject[], t: Strings): string {
  const header = COLUMNS.map(([, key]) => escapeCsv(t[key] as string)).join(',');
  const body = rows.map((row) => COLUMNS.map(([field]) => escapeCsv(row[field])).join(',')).join('\n');
  // BOM so Excel detects UTF-8 and renders Georgian correctly.
  return `﻿${header}\n${body}`;
}

function xlsxHeader(t: Strings): Cell[] {
  return COLUMNS.map(([, key]) => t[key] as string);
}

function xlsxRows(rows: Subject[]): Cell[][] {
  return rows.map((row) => COLUMNS.map(([field]) => String(row[field] ?? '')));
}

function buildHtmlTable(rows: Subject[], t: Strings, title: string): string {
  const header = COLUMNS.map(([, key]) => `<th>${escapeHtml(t[key] as string)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${COLUMNS.map(([field]) => `<td>${escapeHtml(row[field])}</td>`).join('')}</tr>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,system-ui,sans-serif;padding:16px;color:#1a1a2e}
    h1{font-size:16px;color:#0080be;margin:0 0 12px}
    table{border-collapse:collapse;width:100%;font-size:10px}
    th{background:#0080be;color:#fff;text-align:left}
    th,td{border:1px solid #e2e8f0;padding:5px 6px}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

/**
 * Export sheet for a result set. Every format is written as a real file and
 * saved onto the device — the photo library, the folder the user picks on
 * Android, or the app's folder in Files on iOS. Sharing is still offered, as its
 * own row, for sending a copy somewhere.
 */
export interface ExportSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Total matching records — what the CSV covers. */
  count: number;
  /** The rows loaded so far — what the spreadsheet and PDF cover. */
  rows: Subject[];
  title: string;
  /** `/documents/export` for the current filter: every matching row, streamed. */
  csvUrl: string;
}

export default function ExportSheet({ visible, onClose, count, rows, title, csvUrl }: ExportSheetProps) {
  const { colors, lang } = useTheme();
  const t = getStrings(lang);
  const { showToast } = useAppStore();

  const guard = (message: string, action: () => Promise<unknown>) => async () => {
    onClose();
    showToast(message);
    try {
      await action();
    } catch (err) {
      showToast((err as Error)?.message || t.networkError);
    }
  };

  /** Same as `guard`, but reports where the file ended up. */
  const save = (message: string, action: () => Promise<SaveResult>) =>
    guard(message, async () => showToast(saveMessage(await action(), t)));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t.exportShareTitle}
      subtitle={t.exportShareSubtitle(groupDigits(count))}
      cancelLabel={t.cancel}
    >
      <SheetRow
        badge="XLSX"
        badgeColor="#fff"
        badgeBg="#1d7044"
        title={t.excelTable}
        subtitle={`.xlsx · ${t.loadedRecords(groupDigits(rows.length))}`}
        onPress={save(t.preparingXls, () =>
          saveToDevice(writeXlsx('business-register.xlsx', title, xlsxHeader(t), xlsxRows(rows)), XLSX_MIME),
        )}
      />
      <SheetRow
        badge="CSV"
        badgeColor="#fff"
        badgeBg={colors.brand}
        title={t.csvData}
        subtitle={`.csv · ${t.allRecords(groupDigits(count))} · ${csvSize(count)}`}
        onPress={save(t.downloadingCsv, () =>
          saveDownloadToDevice(csvUrl, 'business-register.csv', 'text/csv'),
        )}
      />
      <SheetRow
        badge="PDF"
        badgeColor="#fff"
        badgeBg={colors.redDark}
        title={t.pdfDocument}
        subtitle={`.pdf · ${t.loadedRecords(groupDigits(rows.length))}`}
        onPress={save(t.preparingPdf, async () => {
          const { uri } = await Print.printToFileAsync({ html: buildHtmlTable(rows, t, title) });
          return saveUriToDevice(uri, 'business-register.pdf', 'application/pdf');
        })}
      />
      <SheetRow
        icon="printer"
        badgeColor="#475569"
        badgeBg={colors.line}
        title={t.print}
        subtitle={t.airPrint}
        onPress={guard(t.openingPrint, () => Print.printAsync({ html: buildHtmlTable(rows, t, title) }))}
      />
      <SheetRow
        icon="share"
        badgeColor={colors.brand}
        badgeBg={colors.tint.blue10}
        title={t.shareEllipsis}
        subtitle={t.shareTargets}
        divider={false}
        onPress={guard(t.openingShare, () =>
          Share.share({
            title,
            message: rows
              .slice(0, 50)
              .map((r) => `${r.id} — ${r.name}`)
              .join('\n'),
          }),
        )}
      />
    </BottomSheet>
  );
}
