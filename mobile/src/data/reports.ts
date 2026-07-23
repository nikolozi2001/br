import type { ApiRecord, CountsReport, MatrixReport, ReportMeta } from '../types';

/**
 * Report catalogue. Titles are the prototype's; `shape` tells ReportDetailScreen
 * how to read the recordset the matching /api/report{n} endpoint returns.
 *
 *  - `counts` : one row per category with registered/active totals
 *  - `matrix` : year columns (report 6–10 select the whole pivot table)
 */
export const REPORTS: ReportMeta[] = [
  {
    id: 1,
    shape: 'counts',
    nameColumn: 'Activity_Name',
    codeColumn: 'Activity_Code',
    title: {
      ka: 'რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ეკონომიკური საქმიანობის სახეების მიხედვით (NACE Rev. 2)',
      en: 'Registered and active organizations by type of economic activity (NACE Rev. 2)',
    },
  },
  {
    id: 2,
    shape: 'counts',
    nameColumn: 'Legal_Form',
    codeColumn: 'ID',
    title: {
      ka: 'რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ორგანიზაციულ-სამართლებრივი ფორმების მიხედვით',
      en: 'Registered and active organizations by legal form',
    },
  },
  {
    id: 3,
    shape: 'counts',
    nameColumn: 'Ownership_Type',
    codeColumn: 'ID',
    title: {
      ka: 'რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა საკუთრების ფორმების მიხედვით',
      en: 'Registered and active organizations by ownership type',
    },
  },
  {
    id: 4,
    shape: 'counts',
    nameColumn: 'Location_Name',
    codeColumn: 'Location_Code',
    title: {
      ka: 'რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა რეგიონების მიხედვით',
      en: 'Registered and active organizations by region',
    },
  },
  {
    id: 5,
    shape: 'counts',
    nameColumn: 'Location_Name',
    codeColumn: 'Location_Code',
    title: {
      ka: 'რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა მუნიციპალიტეტების მიხედვით',
      en: 'Registered and active organizations by municipality',
    },
  },
  {
    id: 6,
    shape: 'matrix',
    title: {
      ka: 'რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმის ჭრილში – ნაზარდი ჯამი',
      en: 'Registered organizations by year and legal form — cumulative',
    },
  },
  {
    id: 7,
    shape: 'matrix',
    title: {
      ka: 'რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმების ჭრილში – კონკრეტულ წელს რეგისტრირებული',
      en: 'Registered organizations by year and legal form — registered in a given year',
    },
  },
  {
    id: 8,
    shape: 'matrix',
    title: {
      ka: 'რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (NACE Rev.2) – ნაზარდი ჯამი',
      en: 'Registered organizations by year and economic activity (NACE Rev.2) — cumulative',
    },
  },
  {
    id: 9,
    shape: 'matrix',
    title: {
      ka: 'რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (NACE Rev.2) – კონკრეტულ წელს რეგისტრირებული',
      en: 'Registered organizations by year and economic activity (NACE Rev.2) — registered in a given year',
    },
  },
  {
    id: 10,
    shape: 'matrix',
    title: {
      ka: 'რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების და რეგიონების მიხედვით',
      en: 'Registered organizations by year and region',
    },
  },
];

export function getReport(id: number | string): ReportMeta | undefined {
  return REPORTS.find((r) => r.id === Number(id));
}

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Normalises a `counts`-shaped recordset. Report 2 mixes a `totals` row into the
 * result set; it is pulled out rather than rendered as a category.
 */
export function parseCountsReport(rows: ApiRecord[], report: ReportMeta): CountsReport {
  const detail = rows.filter((r) => r.data_type !== 'totals');
  const totalsRow = rows.find((r) => r.data_type === 'totals');

  const items = detail.map((r) => ({
    code: String(r[report.codeColumn ?? 'ID'] ?? r.ID ?? ''),
    name: String(r[report.nameColumn ?? ''] ?? ''),
    reg: num(r.Registered_Qty),
    act: num(r.Active_Qty),
    regP: (r.Registered_Percent ?? r.pct ?? null) as number | null,
    actP: (r.Active_Percent ?? r.pct_act ?? null) as number | null,
  }));

  const totalReg = totalsRow ? num(totalsRow.Registered_Qty) : items.reduce((s, i) => s + i.reg, 0);
  const totalAct = totalsRow ? num(totalsRow.Active_Qty) : items.reduce((s, i) => s + i.act, 0);

  return {
    items: items.map((item) => ({
      ...item,
      regP: item.regP != null ? `${item.regP}%` : totalReg ? `${((item.reg / totalReg) * 100).toFixed(1)}%` : '',
      actP: item.actP != null ? `${item.actP}%` : totalAct ? `${((item.act / totalAct) * 100).toFixed(1)}%` : '',
    })),
    totalReg,
    totalAct,
  };
}

/**
 * Normalises a `matrix`-shaped recordset into { columns, rows } where the first
 * non-numeric column becomes the row label.
 */
export function parseMatrixReport(rows: ApiRecord[]): MatrixReport {
  if (!rows.length) return { columns: [], items: [] };
  const keys = Object.keys(rows[0]);
  const labelKey =
    keys.find((k) => typeof rows[0][k] === 'string' && !/^\d{4}$/.test(k)) ?? keys[0]!;
  const columns = keys.filter((k) => k !== labelKey);

  return {
    columns,
    items: rows.map((row) => ({
      label: String(row[labelKey] ?? ''),
      values: columns.map((c) => row[c]),
    })),
  };
}
