import { apiGet, toArray } from './client';
import { apiLang } from '../i18n/strings';
import type {
  AddressHistoryRow,
  ApiRecord,
  BirthDeathPoint,
  Lang,
  NameHistoryRow,
  Option,
  PartnerRow,
  PersonRow,
  SearchForm,
  SearchResponse,
  Subject,
  SubjectDetail,
} from '../types';

const str = (value: unknown): string => (value == null ? '' : String(value));
const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/* ── Lookups (picker option lists) ─────────────────────────────────────────── */

export async function fetchLegalForms(lang: Lang): Promise<Option[]> {
  const data = toArray(await apiGet('/legal-forms', { lang: apiLang(lang) }));
  return data
    .map((form) => ({
      value: str(form.ID ?? form.id),
      label: str(
        form.Name ||
          (form.Abbreviation ? `${form.Abbreviation} - ${form.Legal_Form}` : form.Legal_Form),
      ),
    }))
    .filter((o) => o.value && o.label);
}

export async function fetchRegions(lang: Lang): Promise<Option[]> {
  const data = toArray(await apiGet('/locations', { lang: apiLang(lang) }));
  return data
    .filter((l) => !l.Inactive)
    .map((l) => ({ value: str(l.ID), label: str(l.Location_Name), code: str(l.Location_Code) }))
    .filter((o) => o.label);
}

export async function fetchMunicipalities(lang: Lang, regionId?: string): Promise<Option[]> {
  const data = toArray(await apiGet('/locations/regions', { lang: apiLang(lang) }));
  return data
    .filter((l) => !l.Inactive && (!regionId || str(l.Parent_ID) === regionId))
    .map((l) => ({ value: str(l.ID), label: str(l.Location_Name), code: str(l.Location_Code) }))
    .filter((o) => o.label);
}

export async function fetchActivities(lang: Lang): Promise<{ codes: Option[]; names: Option[] }> {
  const data = toArray(await apiGet('/activities', { lang: apiLang(lang) }));
  return {
    codes: data.map((a) => ({ value: str(a.Activity_Code), label: str(a.Activity_Code) })),
    names: data.map((a) => ({
      value: str(a.Activity_Code),
      label: `${str(a.Activity_Code)} - ${str(a.Activity_Name)}`,
    })),
  };
}

export async function fetchOwnershipTypes(lang: Lang): Promise<Option[]> {
  const data = toArray(await apiGet('/ownership-types', { lang: apiLang(lang) }));
  return data
    .map((t) => ({ value: str(t.ID), label: str(t.Ownership_Type) }))
    .filter((o) => o.label);
}

export async function fetchSizes(lang: Lang): Promise<Option[]> {
  const data = toArray(await apiGet('/sizes', { lang: apiLang(lang) }));
  return data.map((s) => ({ value: str(s.id), label: str(s.zoma) })).filter((o) => o.label);
}

/* ── Subject search ────────────────────────────────────────────────────────── */

/** Maps a `/api/documents` row onto the shape the UI screens consume. */
function normaliseSubject(item: ApiRecord): Subject {
  return {
    statId: (item.Stat_ID as number | string | null) ?? null,
    id: str(item.Stat_ID),
    code: str(item.Legal_Code || item.Personal_no),
    name: str(item.Full_Name),
    abbreviation: str(item.Abbreviation),
    form: str(item.Abbreviation || item.Legal_Form),
    formFull: str(item.Legal_Form || item.Abbreviation),
    legalFormId: (item.Legal_Form_ID as number | null) ?? null,
    region: str(item.Region_name),
    muni: str(item.City_name || item.Community_name || item.Village_name),
    addr: str(item.Address),
    factualRegion: str(item.Region_name2),
    factualMuni: str(item.City_name2 || item.Community_name2 || item.Village_name2),
    factualAddr: str(item.Address2),
    nace: str(item.Activity_2_Code),
    naceName: str(item.Activity_2_Name),
    head: str(item.Head),
    partner: str(item.Partner),
    phone: str(item.mob),
    email: str(item.Email),
    web: str(item.web),
    ownership: str(item.Ownership_Type),
    size: str(item.Zoma),
    regDate: str(item.Registration_Date || item.Reg_Date),
    active: item.ISActive === 1 || item.ISActive === true,
    x: item.X != null ? Number(item.X) : null,
    y: item.Y != null ? Number(item.Y) : null,
  };
}

export interface SearchOptions {
  lang: Lang;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  signal?: AbortSignal;
}

export async function searchSubjects(form: SearchForm, opts: SearchOptions): Promise<SearchResponse> {
  const params: Record<string, string | number | string[] | undefined> = {
    lang: apiLang(opts.lang),
    identificationNumber: form.id || undefined,
    organizationName: form.name || undefined,
    head: form.head || undefined,
    partner: form.partner || undefined,
    isActive: form.activeOnly ? 'true' : undefined,
    legalForm: form.legalForm?.value ? [form.legalForm.value] : undefined,
    ownershipType: form.ownership?.value || undefined,
    size: form.size?.value ? [form.size.value] : undefined,
    activityCode: form.naceCode?.value ? [form.naceCode.value] : undefined,
    page: opts.page,
    limit: opts.limit,
    sortBy: opts.sortBy,
    sortDir: opts.sortDir,
  };

  if (form.addrType === 'fakt') {
    params.factualAddressRegion = form.region?.label || undefined;
    params.factualAddressCity = form.muni?.label || undefined;
    params.factualAddress = form.address || undefined;
  } else {
    params.legalAddressRegion = form.region?.label || undefined;
    params.legalAddressCity = form.muni?.label || undefined;
    params.legalAddress = form.address || undefined;
  }

  const payload = await apiGet<ApiRecord[] | { data?: ApiRecord[]; pagination?: SearchResponse['pagination'] }>(
    '/documents',
    params,
    { signal: opts.signal, timeout: 60000 },
  );
  const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
  return {
    results: rows.map(normaliseSubject),
    pagination: Array.isArray(payload) ? null : payload?.pagination ?? null,
  };
}

/* ── Subject detail ────────────────────────────────────────────────────────── */

/** Runs the four detail endpoints in parallel; any failure degrades to []. */
export async function fetchSubjectDetail(
  statId: number | string,
  lang: Lang,
): Promise<SubjectDetail> {
  const settle = (p: Promise<unknown>): Promise<ApiRecord[]> =>
    p.then((v) => toArray(v)).catch(() => [] as ApiRecord[]);

  const [representatives, partners, addressHistory, nameHistory] = await Promise.all([
    settle(apiGet('/representatives', { statId, lang: apiLang(lang) })),
    settle(apiGet('/partners', { statId, lang: apiLang(lang) })),
    settle(apiGet('/address-web', { statId })),
    settle(apiGet('/full-name-web', { statId })),
  ]);

  return {
    representatives: representatives.map(
      (r): PersonRow => ({
        person: str(r.Full_Name || r.Person || r.Name),
        role: str(r.Role || r.Position || r.Representative_Type),
        date: formatDate(r.Reg_Date || r.Start_Date || r.Date),
      }),
    ),
    partners: partners.map(
      (p): PartnerRow => ({
        person: str(p.Full_Name || p.Partner || p.Name),
        share: p.Share != null ? `${p.Share}%` : str(p.Share_Percent),
        date: formatDate(p.Reg_Date || p.Start_Date || p.Date),
      }),
    ),
    addressHistory: addressHistory.map(
      (a): AddressHistoryRow => ({
        addr: str(a.Address),
        region: [a.Region_name, a.City_name].filter(Boolean).map(str).join(' · '),
        date: formatDate(a.Reg_Date || a.Date),
      }),
    ),
    nameHistory: nameHistory.map(
      (n): NameHistoryRow => ({
        name: str(n.Full_Name),
        form: str(n.Legal_Form),
        ownership: str(n.Ownership_Type),
        date: formatDate(n.Reg_Date || n.Date),
      }),
    ),
  };
}

export interface Coordinates {
  lat: number;
  lng: number;
  region: string;
}

export async function fetchCoordinates(taxId: string, lang: Lang): Promise<Coordinates | null> {
  const data = toArray(await apiGet('/coordinates', { taxId, lang: apiLang(lang) }));
  const c = data[0];
  if (!c) return null;
  return { lat: Number(c.X), lng: Number(c.Y), region: str(c.Region) };
}

/* ── Reports ───────────────────────────────────────────────────────────────── */

export async function fetchReport(n: number, lang: Lang): Promise<ApiRecord[]> {
  const payload = await apiGet(`/report${n}`, { lang: apiLang(lang) }, { timeout: 60000 });
  return toArray(payload);
}

/* ── Charts ────────────────────────────────────────────────────────────────── */

/** `[{hints:'birth',2014:…},{hints:'death',…}]` → `[{year,birth,death}]`. */
export async function fetchBirthDeath(lang: Lang): Promise<BirthDeathPoint[]> {
  const data = toArray(await apiGet('/enterprise-birth-death', { lang: apiLang(lang) }));
  const birth = data.find((d) => d.hints === 'birth');
  const death = data.find((d) => d.hints === 'death');
  if (!birth || !death) return [];
  return Object.keys(birth)
    .filter((key) => key !== 'hints')
    .map((year) => ({ year, birth: num(birth[year]), death: num(death[year]) }));
}

/** One row per year, remaining keys are region names. */
export async function fetchBirthRegion(lang: Lang): Promise<ApiRecord[]> {
  const data = toArray(await apiGet('/enterprise-birth-region', { lang: apiLang(lang) }));
  return data.map((item) => {
    const copy = { ...item };
    delete copy.Unknown;
    return copy;
  });
}

/** One row per sector with a column per year; the `სულ` total row is dropped. */
export async function fetchBirthSector(lang: Lang): Promise<ApiRecord[]> {
  const data = toArray(await apiGet('/enterprise-birth-sector', { lang: apiLang(lang) }));
  return data.filter((item) => item.legend_title !== 'სულ');
}

/** `[{name, name_en, share}]` — the region distribution pie. */
export async function fetchBirthDistribution(lang: Lang): Promise<ApiRecord[]> {
  const data = toArray(await apiGet('/enterprise-birth-distribution', { lang: apiLang(lang) }));
  return data.map((item) => ({
    ...item,
    name: lang === 'en' ? item.name_en || item.name : item.name,
  }));
}

/** One row per NACE section with a column per year; the grand-total row (no
 * section name) is dropped so it doesn't dominate the chart. */
export async function fetchBirthNace(lang: Lang): Promise<ApiRecord[]> {
  const data = toArray(await apiGet('/enterprise-nace', { lang: apiLang(lang) }));
  return data.filter((r) => r.NACE_Rev_2_Code != null && r.NACE_Rev_2_Code !== '');
}

/** Same shape as {@link fetchBirthNace}, for enterprise deaths by NACE section. */
export async function fetchDeathNace(lang: Lang): Promise<ApiRecord[]> {
  const data = toArray(await apiGet('/enterprise-death-nace', { lang: apiLang(lang) }));
  return data.filter((r) => r.NACE_Rev_2_Code != null && r.NACE_Rev_2_Code !== '');
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

/** `2012-06-08T00:00:00.000Z` → `06/2012`; passes through anything unparseable. */
export function formatDate(value: unknown): string {
  if (!value) return '';
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const MONTHS_KA = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** `2012-06-08` → `8 ივნისი 2012` (or the English equivalent). */
export function formatLongDate(value: unknown, lang: Lang): string {
  if (!value) return '';
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return String(value);
  const months = lang === 'en' ? MONTHS_EN : MONTHS_KA;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Thin-space digit grouping, as in the prototype's `grp()`. */
export function groupDigits(n: unknown): string {
  const value = Number(n);
  if (n == null || Number.isNaN(value)) return '0';
  return value.toLocaleString('en-US').replace(/,/g, ' ');
}
