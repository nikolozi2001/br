import {
  fetchMunicipalities,
  fetchRegions,
  fetchReport,
  formatDate,
  formatLongDate,
  groupDigits,
  searchSubjects,
} from './registry';
import type { SearchForm } from '../types';

describe('groupDigits', () => {
  it('groups thousands with a thin space', () => {
    expect(groupDigits(1133623)).toBe('1 133 623');
    expect(groupDigits(280811)).toBe('280 811');
    expect(groupDigits(42)).toBe('42');
  });

  it('handles nullish / invalid input as 0', () => {
    expect(groupDigits(null)).toBe('0');
    expect(groupDigits(undefined)).toBe('0');
    expect(groupDigits('abc')).toBe('0');
  });

  it('accepts numeric strings', () => {
    expect(groupDigits('1000')).toBe('1 000');
  });
});

describe('formatDate', () => {
  it('formats an ISO timestamp as MM/YYYY', () => {
    expect(formatDate('2012-06-08T00:00:00.000Z')).toBe('06/2012');
  });

  it('passes through unparseable values', () => {
    expect(formatDate('not a date')).toBe('not a date');
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
  });
});

describe('formatLongDate', () => {
  it('formats a date with the Georgian month name', () => {
    expect(formatLongDate('2026-02-25T18:42:30.000Z', 'ka')).toBe('25 თებერვალი 2026');
  });

  it('formats a date with the English month name', () => {
    expect(formatLongDate('2009-03-14', 'en')).toBe('14 March 2009');
  });

  it('passes through unparseable values', () => {
    expect(formatLongDate('—', 'ka')).toBe('—');
    expect(formatLongDate('', 'en')).toBe('');
  });
});

import { groupPartnerPeriods } from './registry';
import type { PartnerRow } from '../types';

describe('groupPartnerPeriods', () => {
  const rows: PartnerRow[] = [
    { person: 'A', share: '55%', shareValue: 55, date: '2015-12' },
    { person: 'B', share: '45%', shareValue: 45, date: '2015-12' },
    { person: 'A', share: '55%', shareValue: 55, date: '2014-06' },
    { person: 'B', share: '45%', shareValue: 45, date: '2014-06' },
  ];

  it('groups by period, newest first', () => {
    const periods = groupPartnerPeriods(rows, ['#111', '#222']);
    expect(periods.map((p) => p.date)).toEqual(['2015-12', '2014-06']);
    expect(periods[0].slices).toHaveLength(2);
  });

  it('gives each partner a stable colour across periods', () => {
    const periods = groupPartnerPeriods(rows, ['#111', '#222']);
    const colorA1 = periods[0].slices.find((s) => s.label === 'A')!.color;
    const colorA2 = periods[1].slices.find((s) => s.label === 'A')!.color;
    expect(colorA1).toBe(colorA2);
    expect(colorA1).toBe('#111');
  });

  it('returns empty array for no partners', () => {
    expect(groupPartnerPeriods([], ['#111'])).toEqual([]);
  });
});

import {
  formatMonthlyDate,
  formatPeriod,
  toInvolvementRow,
  toPartnerRow,
  toRepresentativeRow,
} from './registry';

describe('formatMonthlyDate', () => {
  it('formats a YYYY-MM period as 01/MM/YYYY', () => {
    expect(formatMonthlyDate('2020-10')).toBe('01/10/2020');
    expect(formatMonthlyDate('2015-06')).toBe('01/06/2015');
  });
  it('passes non-period values through', () => {
    expect(formatMonthlyDate('')).toBe('');
    expect(formatMonthlyDate('—')).toBe('—');
  });
});

describe('formatPeriod', () => {
  it('formats a YYYY-MM period as MM/YYYY without timezone drift', () => {
    expect(formatPeriod('2015-12')).toBe('12/2015');
    expect(formatPeriod('2014-01')).toBe('01/2014');
  });
  it('passes non-period values through', () => {
    expect(formatPeriod('')).toBe('');
    expect(formatPeriod('n/a')).toBe('n/a');
  });
});

describe('toPartnerRow', () => {
  it('extracts a positive Person_ID', () => {
    const row = toPartnerRow({ Name: 'A', Share: 55, Date: '2015-12', Person_ID: 983138 });
    expect(row).toMatchObject({ person: 'A', shareValue: 55, share: '55%', date: '2015-12', personId: 983138 });
  });
  it('omits personId for a company partner (null/zero id)', () => {
    expect(toPartnerRow({ Name: 'Co', Share: 100, Date: '2013-07', Reg_Company_ID: 5 }).personId).toBeUndefined();
    expect(toPartnerRow({ Name: 'Co', Share: 100, Person_ID: 0 }).personId).toBeUndefined();
  });
  it('defaults a missing share to 0', () => {
    expect(toPartnerRow({ Name: 'A' }).shareValue).toBe(0);
  });
});

describe('toRepresentativeRow', () => {
  it('maps position and person id', () => {
    const row = toRepresentativeRow({ Full_Name: 'X', Position: 'დირექტორი', Date: '2015-12', Person_ID: 22 });
    expect(row).toMatchObject({ person: 'X', role: 'დირექტორი', personId: 22 });
  });
});

describe('toInvolvementRow', () => {
  it('maps company, role, formatted date and codes', () => {
    const row = toInvolvementRow({
      Full_Name: 'შპს ემბრიო',
      Position: 'პარტნიორი',
      Date: '2020-10',
      Stat_ID: 21150413,
      Legal_Code: '404854485',
    });
    expect(row).toEqual({
      company: 'შპს ემბრიო',
      role: 'პარტნიორი',
      date: '01/10/2020',
      statId: '21150413',
      legalCode: '404854485',
    });
  });
});

describe('fetchReport', () => {
  const mockJson = (payload: unknown) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    }) as unknown as typeof fetch;
  };

  it('passes a bare recordset through (reports 1, 3–10)', async () => {
    mockJson([{ ID: 1, Registered_Qty: 10 }]);
    await expect(fetchReport(3, 'ka')).resolves.toEqual([{ ID: 1, Registered_Qty: 10 }]);
  });

  it('unwraps report 2 and folds its totals into a totals row', async () => {
    mockJson({
      totals: { total_registered: 1133623, total_active: 280811 },
      rows: [{ ID: 1, Legal_Form: 'შპს', Registered_Qty: 386266, Active_Qty: 80153 }],
    });

    const rows = await fetchReport(2, 'ka');

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ ID: 1, Legal_Form: 'შპს' });
    expect(rows[1]).toEqual({
      data_type: 'totals',
      Registered_Qty: 1133623,
      Active_Qty: 280811,
    });
  });

  it('keeps the rows when the envelope has no totals', async () => {
    mockJson({ rows: [{ ID: 1 }] });
    await expect(fetchReport(2, 'ka')).resolves.toEqual([{ ID: 1 }]);
  });
});

describe('location lookups', () => {
  const mockJson = (payload: unknown) => {
    const spy = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload });
    global.fetch = spy as unknown as typeof fetch;
    return spy;
  };
  const urlOf = (spy: jest.Mock) => String(spy.mock.calls[0][0]);

  it('reads regions from /locations/regions, not the country list', async () => {
    const spy = mockJson([
      { ID: 3, Location_Code: '15 ', Location_Name: 'Adjara AR', Parent_ID: 1 },
    ]);

    const regions = await fetchRegions('en');

    expect(urlOf(spy)).toContain('/locations/regions?lang=en');
    expect(regions).toEqual([{ value: '3', label: 'Adjara AR', code: '15' }]);
  });

  it('asks for the municipalities of the given region code', async () => {
    const spy = mockJson([
      { ID: 3, Location_Code: '15', Location_Name: 'Adjara AR' },
      { ID: 41, Location_Code: '15 11', Location_Name: 'City of Batumi' },
      { ID: 42, Location_Code: '15 23', Location_Name: 'Keda municipality' },
    ]);

    const municipalities = await fetchMunicipalities('en', '15');

    expect(urlOf(spy)).toContain('/locations/code/15?lang=en');
    // The region itself comes back in the list and is not a municipality.
    expect(municipalities.map((m) => m.code)).toEqual(['15 11', '15 23']);
  });

  it('has nothing to list until a region is picked', async () => {
    const spy = mockJson([]);
    await expect(fetchMunicipalities('en')).resolves.toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('searchSubjects address filters', () => {
  it('sends location codes rather than localised names', async () => {
    const spy = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) });
    global.fetch = spy as unknown as typeof fetch;

    await searchSubjects(
      {
        addrType: 'jur',
        region: { value: '3', label: 'Adjara AR', code: '15' },
        muni: { value: '41', label: 'City of Batumi', code: '15 11' },
      } as SearchForm,
      { lang: 'en' },
    );

    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain('legalAddressRegion=15');
    expect(url).toContain('legalAddressCity=15+11');
    expect(url).not.toContain('Adjara');
  });
});
