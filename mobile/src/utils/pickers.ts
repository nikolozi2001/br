/**
 * Selection maths for the multi-select search pickers. Kept out of SearchScreen
 * so the rules — what a group row means, which municipalities survive dropping a
 * region — can be tested without rendering the screen.
 */

import type { Option } from '../types';

const codeOf = (option: Option): string => option.code?.trim() ?? '';

/** Adds an option to the selection, or removes it when it is already picked. */
export function togglePicked(picked: Option[], option: Option): Option[] {
  return picked.some((o) => o.value === option.value)
    ? picked.filter((o) => o.value !== option.value)
    : [...picked, option];
}

/**
 * True when the selection is exactly `group` — every member and nothing else.
 * This is what lights up a group row ("business entities") and what makes
 * tapping it a second time clear the selection rather than re-apply it.
 */
export function isWholeGroup(picked: Option[], group: Option[]): boolean {
  return (
    group.length > 0 &&
    group.length === picked.length &&
    group.every((o) => picked.some((p) => p.value === o.value))
  );
}

/**
 * A municipality's code is its region's code plus a suffix ("15" → "15 11").
 * The separator matters: a bare `startsWith` would let a region coded "1" claim
 * "15 11". Georgia's regions are all two digits today, so nothing collides —
 * this keeps that from being load-bearing.
 */
export function belongsToRegion(muniCode: string, regionCode: string): boolean {
  const muni = muniCode.trim();
  const region = regionCode.trim();
  if (!muni || !region) return false;
  return muni === region || muni.startsWith(`${region} `);
}

/** The municipalities that still belong to one of the selected regions. */
export function municipalitiesIn(munis: Option[], regions: Option[]): Option[] {
  const codes = regions.map(codeOf).filter(Boolean);
  return munis.filter((m) => codes.some((code) => belongsToRegion(codeOf(m), code)));
}

/**
 * The options whose value is in `values`, keeping the order of `options`.
 *
 * The NACE code and name pickers are two views of one selection — both list the
 * same activities, keyed by activity code — so picking in either has to be
 * reflected in the other, exactly as the web form does it.
 */
export function pickedByValue(options: Option[], values: Iterable<string>): Option[] {
  const wanted = new Set(values);
  return options.filter((o) => wanted.has(o.value));
}

/**
 * Field label for a selection: the first pick plus a count ("Adjara +2"), so a
 * 44px field stays readable however many values are picked.
 */
export function summarise(picked: Option[], more: (n: number) => string): string | undefined {
  if (picked.length === 0) return undefined;
  if (picked.length === 1) return picked[0].label;
  return `${picked[0].label} ${more(picked.length - 1)}`;
}
