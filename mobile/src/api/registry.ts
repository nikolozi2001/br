import { apiGet, toArray } from './client';
import { apiLang } from '../i18n/strings';

/* ── Lookups (picker option lists) ─────────────────────────────────────────── */

export async function fetchLegalForms(lang) {
  const data = toArray(await apiGet('/legal-forms', { lang: apiLang(lang) }));
  return data
    .map((form) => ({
      value: String(form.ID ?? form.id ?? ''),
      label:
        form.Name ||
        (form.Abbreviation ? `${form.Abbreviation} - ${form.Legal_Form}` : form.Legal_Form),
    }))
    .filter((o) => o.value && o.label);
}

export async function fetchRegions(lang) {
  const data = toArray(await apiGet('/locations', { lang: apiLang(lang) }));
  return data
    .filter((l) => !l.Inactive)
    .map((l) => ({ value: String(l.ID), label: l.Location_Name, code: l.Location_Code }))
    .filter((o) => o.label);
}

export async function fetchMunicipalities(lang, regionId) {
  const data = toArray(await apiGet('/locations/regions', { lang: apiLang(lang) }));
  return data
    .filter((l) => !l.Inactive && (!regionId || String(l.Parent_ID) === String(regionId)))
    .map((l) => ({ value: String(l.ID), label: l.Location_Name, code: l.Location_Code }))
    .filter((o) => o.label);
}

export async function fetchActivities(lang) {
  const data = toArray(await apiGet('/activities', { lang: apiLang(lang) }));
  return {
    codes: data.map((a) => ({ value: a.Activity_Code, label: a.Activity_Code })),
    names: data.map((a) => ({
      value: a.Activity_Code,
      label: `${a.Activity_Code} - ${a.Activity_Name}`,
    })),
  };
}

export async function fetchOwnershipTypes(lang) {
  const data = toArray(await apiGet('/ownership-types', { lang: apiLang(lang) }));
  return data
    .map((t) => ({ value: String(t.ID), label: t.Ownership_Type }))
    .filter((o) => o.label);
}

export async function fetchSizes(lang) {
  const data = toArray(await apiGet('/sizes', { lang: apiLang(lang) }));
  return data.map((s) => ({ value: String(s.id), label: s.zoma })).filter((o) => o.label);
}

/* ── Subject search ────────────────────────────────────────────────────────── */

/** Maps a `/api/documents` row onto the shape the UI screens consume. */
function normaliseSubject(item) {
  return {
    statId: item.Stat_ID,
    id: String(item.Stat_ID ?? ''),
    code: item.Legal_Code || item.Personal_no || '',
    name: item.Full_Name || '',
    abbreviation: item.Abbreviation || '',
    form: item.Abbreviation || item.Legal_Form || '',
    formFull: item.Legal_Form || item.Abbreviation || '',
    legalFormId: item.Legal_Form_ID,
    region: item.Region_name || '',
    muni: item.City_name || item.Community_name || item.Village_name || '',
    addr: item.Address || '',
    factualRegion: item.Region_name2 || '',
    factualMuni: item.City_name2 || item.Community_name2 || item.Village_name2 || '',
    factualAddr: item.Address2 || '',
    nace: item.Activity_2_Code || '',
    naceName: item.Activity_2_Name || '',
    head: item.Head || '',
    partner: item.Partner || '',
    phone: item.mob || '',
    email: item.Email || '',
    web: item.web || '',
    ownership: item.Ownership_Type || '',
    size: item.Zoma || '',
    regDate: item.Registration_Date || item.Reg_Date || '',
    active: item.ISActive === 1 || item.ISActive === true,
    x: item.X != null ? parseFloat(item.X) : null,
    y: item.Y != null ? parseFloat(item.Y) : null,
  };
}

/**
 * @param {object} form   normalised search form (see SearchScreen state)
 * @param {object} opts   { page, limit, sortBy, sortDir, lang, signal }
 */
export async function searchSubjects(form, opts = {}) {
  const params = {
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

  const payload = await apiGet('/documents', params, { signal: opts.signal, timeout: 60000 });
  const rows = Array.isArray(payload) ? payload : payload?.data || [];
  return {
    results: rows.map(normaliseSubject),
    pagination: payload?.pagination || null,
  };
}

/* ── Subject detail ────────────────────────────────────────────────────────── */

/** Runs the four detail endpoints in parallel; any failure degrades to []. */
export async function fetchSubjectDetail(statId, lang) {
  const settle = (p) => p.then((v) => toArray(v)).catch(() => []);
  const [representatives, partners, addressHistory, nameHistory] = await Promise.all([
    settle(apiGet('/representatives', { statId, lang: apiLang(lang) })),
    settle(apiGet('/partners', { statId, lang: apiLang(lang) })),
    settle(apiGet('/address-web', { statId })),
    settle(apiGet('/full-name-web', { statId })),
  ]);

  return {
    representatives: representatives.map((r) => ({
      person: r.Full_Name || r.Person || r.Name || '',
      role: r.Role || r.Position || r.Representative_Type || '',
      date: formatDate(r.Reg_Date || r.Start_Date || r.Date),
    })),
    partners: partners.map((p) => ({
      person: p.Full_Name || p.Partner || p.Name || '',
      share: p.Share != null ? `${p.Share}%` : p.Share_Percent || '',
      date: formatDate(p.Reg_Date || p.Start_Date || p.Date),
    })),
    addressHistory: addressHistory.map((a) => ({
      addr: a.Address || '',
      region: [a.Region_name, a.City_name].filter(Boolean).join(' · '),
      date: formatDate(a.Reg_Date || a.Date),
    })),
    nameHistory: nameHistory.map((n) => ({
      name: n.Full_Name || '',
      form: n.Legal_Form || '',
      ownership: n.Ownership_Type || '',
      date: formatDate(n.Reg_Date || n.Date),
    })),
  };
}

export async function fetchCoordinates(taxId, lang) {
  const data = toArray(await apiGet('/coordinates', { taxId, lang: apiLang(lang) }));
  if (!data.length) return null;
  const c = data[0];
  return { lat: parseFloat(c.X), lng: parseFloat(c.Y), region: c.Region };
}

/* ── Reports ───────────────────────────────────────────────────────────────── */

export async function fetchReport(n, lang) {
  const payload = await apiGet(`/report${n}`, { lang: apiLang(lang) }, { timeout: 60000 });
  return toArray(payload);
}

/* ── Charts ────────────────────────────────────────────────────────────────── */

/** `[{hints:'birth',2014:…},{hints:'death',…}]` → `[{year,birth,death}]`. */
export async function fetchBirthDeath(lang) {
  const data = toArray(await apiGet('/enterprise-birth-death', { lang: apiLang(lang) }));
  const birth = data.find((d) => d.hints === 'birth');
  const death = data.find((d) => d.hints === 'death');
  if (!birth || !death) return [];
  return Object.keys(birth)
    .filter((key) => key !== 'hints')
    .map((year) => ({ year, birth: Number(birth[year]) || 0, death: Number(death[year]) || 0 }));
}

/** One row per year, remaining keys are region names. */
export async function fetchBirthRegion(lang) {
  const data = toArray(await apiGet('/enterprise-birth-region', { lang: apiLang(lang) }));
  return data.map((item) => {
    const copy = { ...item };
    delete copy.Unknown;
    return copy;
  });
}

/** One row per sector with a column per year; the `სულ` total row is dropped. */
export async function fetchBirthSector(lang) {
  const data = toArray(await apiGet('/enterprise-birth-sector', { lang: apiLang(lang) }));
  return data.filter((item) => item.legend_title !== 'სულ');
}

/** `[{name, value}]` — the region distribution pie. */
export async function fetchBirthDistribution(lang) {
  const data = toArray(await apiGet('/enterprise-birth-distribution', { lang: apiLang(lang) }));
  return data.map((item) => ({
    ...item,
    name: lang === 'en' ? item.name_en || item.name : item.name,
  }));
}

/** One row per NACE section with a column per year. */
export async function fetchBirthNace(lang) {
  return toArray(await apiGet('/enterprise-nace', { lang: apiLang(lang) }));
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

/** `2012-06-08T00:00:00.000Z` → `06/2012`; passes through anything unparseable. */
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** `2012-06-08` → `8 ივნისი 2012` (or the English equivalent). */
const MONTHS_KA = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatLongDate(value, lang) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const months = lang === 'en' ? MONTHS_EN : MONTHS_KA;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Thin-space digit grouping, as in the prototype's `grp()`. */
export function groupDigits(n) {
  if (n == null || Number.isNaN(Number(n))) return '0';
  return Number(n).toLocaleString('en-US').replace(/,/g, ' ');
}
