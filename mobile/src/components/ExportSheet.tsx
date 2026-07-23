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

const COLUMNS = [
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

const escapeHtml = (value) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

function buildCsv(rows, t) {
  const header = COLUMNS.map(([, key]) => escapeCsv(t[key])).join(',');
  const body = rows.map((row) => COLUMNS.map(([field]) => escapeCsv(row[field])).join(',')).join('\n');
  // BOM so Excel detects UTF-8 and renders Georgian correctly.
  return `﻿${header}\n${body}`;
}

function buildHtmlTable(rows, t, title) {
  const header = COLUMNS.map(([, key]) => `<th>${escapeHtml(t[key])}</th>`).join('');
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

async function writeAndShare(filename, contents, mimeType) {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, UTI: mimeType });
  }
  return file.uri;
}

/**
 * Export / share sheet for a result set. Everything here produces a real file —
 * CSV and .xls (an HTML table, which Excel and Numbers both open) are written to
 * the cache directory, PDF goes through expo-print.
 */
export default function ExportSheet({ visible, onClose, count, rows, title }) {
  const { colors, lang } = useTheme();
  const t = getStrings(lang);
  const { showToast } = useAppStore();

  const guard = (message, action) => async () => {
    onClose();
    showToast(message);
    try {
      await action();
    } catch (err) {
      showToast(String(err?.message || t.networkError));
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t.exportShareTitle}
      subtitle={t.exportShareSubtitle(groupDigits(count))}
      cancelLabel={t.cancel}
    >
      <SheetRow
        badge="XLS"
        badgeColor="#fff"
        badgeBg="#1d7044"
        title={t.excelTable}
        subtitle=".xls"
        onPress={guard(t.preparingXls, () =>
          writeAndShare('business-register.xls', buildHtmlTable(rows, t, title), 'application/vnd.ms-excel'),
        )}
      />
      <SheetRow
        badge="CSV"
        badgeColor="#fff"
        badgeBg={colors.brand}
        title={t.csvData}
        subtitle=".csv"
        onPress={guard(t.preparingCsv, () => writeAndShare('business-register.csv', buildCsv(rows, t), 'text/csv'))}
      />
      <SheetRow
        badge="PDF"
        badgeColor="#fff"
        badgeBg={colors.redDark}
        title={t.pdfDocument}
        subtitle=".pdf"
        onPress={guard(t.preparingPdf, async () => {
          const { uri } = await Print.printToFileAsync({ html: buildHtmlTable(rows, t, title) });
          if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
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
