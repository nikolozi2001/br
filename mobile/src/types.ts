/** Shared domain types for the Business Register app. */

export type Lang = 'ka' | 'en';
export type FontSize = 'small' | 'normal' | 'large';
export type AddressType = 'jur' | 'fakt';
export type SortKey = 'name' | 'id' | 'date';

/** A selectable value in a picker sheet (legal form, region, NACE code…). */
export interface Option {
  value: string;
  label: string;
  code?: string;
}

/** A `/api/documents` row, normalised for the UI. */
export interface Subject {
  statId: number | string | null;
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  form: string;
  formFull: string;
  legalFormId: number | null;
  region: string;
  muni: string;
  addr: string;
  factualRegion: string;
  factualMuni: string;
  factualAddr: string;
  nace: string;
  naceName: string;
  head: string;
  partner: string;
  phone: string;
  email: string;
  web: string;
  ownership: string;
  size: string;
  regDate: string;
  active: boolean;
  x: number | null;
  y: number | null;
}

export interface PersonRow {
  person: string;
  role: string;
  date: string;
}

export interface PartnerRow {
  person: string;
  share: string;
  date: string;
}

export interface AddressHistoryRow {
  addr: string;
  region: string;
  date: string;
}

export interface NameHistoryRow {
  name: string;
  form: string;
  ownership: string;
  date: string;
}

export interface SubjectDetail {
  representatives: PersonRow[];
  partners: PartnerRow[];
  addressHistory: AddressHistoryRow[];
  nameHistory: NameHistoryRow[];
}

/** The search form backing SearchScreen and SearchStore. */
export interface SearchForm {
  id: string;
  name: string;
  head: string;
  partner: string;
  legalForm: Option | null;
  region: Option | null;
  muni: Option | null;
  address: string;
  naceCode: Option | null;
  naceName: Option | null;
  ownership: Option | null;
  size: Option | null;
  addrType: AddressType;
  activeOnly: boolean;
  /** Set once the user edits anything, so settings changes stop overriding it. */
  dirty?: boolean;
}

/** Keys of SearchForm that a PickerSheet can fill. */
export type PickerKey = 'legalForm' | 'region' | 'muni' | 'naceCode' | 'naceName' | 'ownership' | 'size';

export interface Pagination {
  total?: number;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: Subject[];
  pagination: Pagination | null;
}

/** A single search-history entry. */
export interface RecentSearch {
  id: string;
  name: string;
}

export interface ToastState {
  message: string;
  action: (() => void) | null;
  actionLabel: string;
}

/* ── Reports ──────────────────────────────────────────────────────────────── */

export type ReportShape = 'counts' | 'matrix';

export interface ReportMeta {
  id: number;
  shape: ReportShape;
  title: Record<Lang, string>;
  nameColumn?: string;
  codeColumn?: string;
}

export interface CountsRow {
  code: string;
  name: string;
  reg: number;
  act: number;
  regP: string;
  actP: string;
}

export interface CountsReport {
  items: CountsRow[];
  totalReg: number;
  totalAct: number;
}

export interface MatrixReport {
  columns: string[];
  items: { label: string; values: unknown[] }[];
}

export type ParsedReport = CountsReport | MatrixReport;

export function isCountsReport(report: ParsedReport | null): report is CountsReport {
  return Boolean(report && 'totalReg' in report);
}

/* ── Charts ───────────────────────────────────────────────────────────────── */

export interface BirthDeathPoint {
  year: string;
  birth: number;
  death: number;
}

export interface LegendItem {
  label: string;
  color: string;
}

export interface Series extends LegendItem {
  values: number[];
}

export interface PieSlice extends LegendItem {
  value: number;
  percent: string;
}

export interface BarRow extends LegendItem {
  value: number;
  display: string;
}

/** A row from any `/api/*` endpoint before normalisation. */
export type ApiRecord = Record<string, unknown>;
