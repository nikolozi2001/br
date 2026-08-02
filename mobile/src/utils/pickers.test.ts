import {
  belongsToRegion,
  isWholeGroup,
  municipalitiesIn,
  summarise,
  togglePicked,
} from './pickers';
import type { Option } from '../types';

const opt = (value: string, label = value, code?: string): Option => ({ value, label, code });

const ADJARA = opt('3', 'Adjara AR', '15');
const GURIA = opt('4', 'Guria', '23');
const BATUMI = opt('41', 'City of Batumi', '15 11');
const KEDA = opt('42', 'Keda municipality', '15 23');
const OZURGETI = opt('50', 'Ozurgeti municipality', '23 11');

describe('togglePicked', () => {
  it('adds an option that is not picked yet', () => {
    expect(togglePicked([ADJARA], GURIA)).toEqual([ADJARA, GURIA]);
  });

  it('removes an option that is already picked', () => {
    expect(togglePicked([ADJARA, GURIA], ADJARA)).toEqual([GURIA]);
  });

  it('matches on value, not on object identity', () => {
    expect(togglePicked([ADJARA], { ...ADJARA })).toEqual([]);
  });

  it('leaves the original array alone', () => {
    const picked = [ADJARA];
    togglePicked(picked, GURIA);
    expect(picked).toEqual([ADJARA]);
  });
});

describe('isWholeGroup', () => {
  const group = [opt('1'), opt('2'), opt('3')];

  it('is true when exactly the group is picked, whatever the order', () => {
    expect(isWholeGroup([opt('3'), opt('1'), opt('2')], group)).toBe(true);
  });

  it('is false when a member is missing', () => {
    expect(isWholeGroup([opt('1'), opt('2')], group)).toBe(false);
  });

  it('is false when something outside the group is also picked', () => {
    expect(isWholeGroup([...group, opt('9')], group)).toBe(false);
  });

  it('is false for an empty group, so an unloaded list never reads as selected', () => {
    expect(isWholeGroup([], [])).toBe(false);
  });
});

describe('belongsToRegion', () => {
  it('accepts a municipality of that region', () => {
    expect(belongsToRegion('15 11', '15')).toBe(true);
  });

  it('accepts the region itself', () => {
    expect(belongsToRegion('15', '15')).toBe(true);
  });

  it('rejects a municipality of another region', () => {
    expect(belongsToRegion('23 11', '15')).toBe(false);
  });

  it('does not let a shorter code claim a longer one', () => {
    // "1" is not a region today, but nothing stops one being added.
    expect(belongsToRegion('15 11', '1')).toBe(false);
    expect(belongsToRegion('150 11', '15')).toBe(false);
  });

  it('ignores surrounding whitespace', () => {
    expect(belongsToRegion(' 15 11 ', ' 15 ')).toBe(true);
  });

  it('rejects empty codes rather than matching everything', () => {
    expect(belongsToRegion('15 11', '')).toBe(false);
    expect(belongsToRegion('', '15')).toBe(false);
  });
});

describe('municipalitiesIn', () => {
  it('keeps the municipalities of the regions still selected', () => {
    expect(municipalitiesIn([BATUMI, KEDA, OZURGETI], [ADJARA])).toEqual([BATUMI, KEDA]);
  });

  it('keeps municipalities across several regions', () => {
    expect(municipalitiesIn([BATUMI, OZURGETI], [ADJARA, GURIA])).toEqual([BATUMI, OZURGETI]);
  });

  it('drops everything once the last region goes', () => {
    expect(municipalitiesIn([BATUMI, KEDA], [])).toEqual([]);
  });

  it('drops municipalities that carry no code', () => {
    expect(municipalitiesIn([opt('99', 'Nowhere')], [ADJARA])).toEqual([]);
  });
});

describe('summarise', () => {
  const more = (n: number) => `+${n}`;

  it('has nothing to show for an empty selection', () => {
    expect(summarise([], more)).toBeUndefined();
  });

  it('shows a single pick in full', () => {
    expect(summarise([ADJARA], more)).toBe('Adjara AR');
  });

  it('counts the rest after the first', () => {
    expect(summarise([ADJARA, GURIA, BATUMI], more)).toBe('Adjara AR +2');
  });
});
