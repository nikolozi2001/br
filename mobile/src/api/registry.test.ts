import { formatDate, formatLongDate, groupDigits } from './registry';

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
