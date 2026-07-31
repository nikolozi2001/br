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

/** One decimal, matching the web report tables (`34.1%`, `0.0%`). */
const pct = (value: number): string => `${value.toFixed(1)}%`;

const codeOf = (row: ApiRecord, report: ReportMeta): string =>
  String(row[report.codeColumn ?? 'ID'] ?? row.ID ?? '').trim();

/**
 * A grand-total line rather than a category. Report 2's envelope totals arrive
 * tagged `data_type: 'totals'` (see `fetchReport`), while report 1 ships its
 * "სულ" / "TOTAL" line inside the recordset with no code and 100% — matching on
 * the numbers rather than the label keeps this language-independent.
 */
function isTotalsRow(row: ApiRecord, report: ReportMeta): boolean {
  if (row.data_type === 'totals') return true;
  const percent = row.Registered_Percent ?? row.pct;
  return !codeOf(row, report) && percent != null && num(percent) === 100;
}

/**
 * Normalises a `counts`-shaped recordset. Reports that carry a grand total pull
 * it out for the header banner rather than rendering it as a category — leaving
 * it in would double the totals and duplicate the row in the list.
 */
export function parseCountsReport(rows: ApiRecord[], report: ReportMeta): CountsReport {
  const detail = rows.filter((r) => !isTotalsRow(r, report));
  const totalsRow = rows.find((r) => isTotalsRow(r, report));

  const items = detail.map((r) => ({
    code: codeOf(r, report),
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
      regP: item.regP != null ? pct(num(item.regP)) : totalReg ? pct((item.reg / totalReg) * 100) : '',
      actP: item.actP != null ? pct(num(item.actP)) : totalAct ? pct((item.act / totalAct) * 100) : '',
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
