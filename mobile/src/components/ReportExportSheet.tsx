import React from 'react';
import { Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import BottomSheet, { SheetRow } from './BottomSheet';
import { getStrings } from '../i18n/strings';
import { groupDigits } from '../api/registry';
import { useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import type { Strings } from '../i18n/strings';
import { isCountsReport, type ParsedReport, type ReportMeta } from '../types';

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeCsv = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;

/** Flattens either report shape into a plain header + rows table. */
interface Table {
  header: string[];
  rows: string[][];
}

function toTable(report: ReportMeta, parsed: ParsedReport | null, t: Strings): Table {
  if (!parsed) return { header: [], rows: [] };
  if (isCountsReport(parsed)) {
    return {
      header: ['#', t.orgName, t.registered, '%', t.activeCount, '%'],
      rows: parsed.items.map((r) => [r.code, r.name, groupDigits(r.reg), r.regP, groupDigits(r.act), r.actP]),
    };
  }
  return {
    header: ['', ...parsed.columns],
    rows: parsed.items.map((r) => [r.label, ...r.values.map((v) => (v == null ? '' : String(v)))]),
  };
}

function buildHtml(title: string, table: Table): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,system-ui,sans-serif;padding:18px;color:#1a1a2e}
    h1{font-size:14px;color:#0080be;margin:0 0 12px;line-height:1.4}
    table{border-collapse:collapse;width:100%;font-size:10px}
    th{background:#0080be;color:#fff;text-align:left}
    th,td{border:1px solid #e2e8f0;padding:5px 6px}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body><h1>${escapeHtml(title)}</h1><table>
    <thead><tr>${table.header.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${table.rows
      .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody>
  </table></body></html>`;
}

async function writeAndShare(filename: string, contents: string, mimeType: string) {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType, UTI: mimeType });
}

export interface ReportExportSheetProps {
  visible: boolean;
  onClose: () => void;
  report: ReportMeta;
  parsed: ParsedReport | null;
}

export default function ReportExportSheet({ visible, onClose, report, parsed }: ReportExportSheetProps) {
  const { colors, lang } = useTheme();
  const t = getStrings(lang);
  const { showToast } = useAppStore();

  const title = report.title[lang] ?? report.title.ka;
  const table = toTable(report, parsed, t);
  const html = buildHtml(title, table);
  const csv = `﻿${[table.header, ...table.rows].map((r) => r.map(escapeCsv).join(',')).join('\n')}`;

  const guard = (message: string, action: () => Promise<unknown>) => async () => {
    onClose();
    showToast(message);
    try {
      await action();
    } catch (err) {
      showToast((err as Error)?.message || t.networkError);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t.exportShareTitle}
      subtitle={t.exportShareSubtitle(groupDigits(table.rows.length))}
      cancelLabel={t.cancel}
    >
      <SheetRow
        badge="XLS"
        badgeColor="#fff"
        badgeBg="#1d7044"
        title={t.excelTable}
        subtitle=".xls"
        onPress={guard(t.preparingXls, () => writeAndShare(`report-${report.id}.xls`, html, 'application/vnd.ms-excel'))}
      />
      <SheetRow
        badge="CSV"
        badgeColor="#fff"
        badgeBg={colors.brand}
        title={t.csvData}
        subtitle=".csv"
        onPress={guard(t.preparingCsv, () => writeAndShare(`report-${report.id}.csv`, csv, 'text/csv'))}
      />
      <SheetRow
        badge="PDF"
        badgeColor="#fff"
        badgeBg={colors.redDark}
        title={t.pdfDocument}
        subtitle=".pdf"
        onPress={guard(t.preparingPdf, async () => {
          const { uri } = await Print.printToFileAsync({ html });
          if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
        })}
      />
      <SheetRow
        icon="printer"
        badgeColor="#475569"
        badgeBg={colors.line}
        title={t.print}
        subtitle={t.airPrint}
        onPress={guard(t.openingPrint, () => Print.printAsync({ html }))}
      />
      <SheetRow
        icon="share"
        badgeColor={colors.brand}
        badgeBg={colors.tint.blue10}
        title={t.shareEllipsis}
        subtitle={t.shareTargets}
        divider={false}
        onPress={guard(t.openingShare, () => Share.share({ title, message: title }))}
      />
    </BottomSheet>
  );
}
