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
