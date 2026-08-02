import { useEffect, useState } from 'react';

import {
  fetchActivities,
  fetchLegalForms,
  fetchMunicipalities,
  fetchOwnershipTypes,
  fetchRegions,
  fetchSizes,
} from '../api/registry';
import { useTheme } from '../theme/ThemeProvider';
import type { Option } from '../types';

/**
 * Loads every picker's option list once per language, plus the municipalities
 * of the currently selected region. Failures resolve to an empty list so a
 * picker opens (empty) rather than the screen breaking.
 */
export interface Lookups {
  legalForms: Option[];
  regions: Option[];
  municipalities: Option[];
  naceCodes: Option[];
  naceNames: Option[];
  ownership: Option[];
  sizes: Option[];
}

const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);

/** @param regionCodes location codes of the selected regions, e.g. `['15']` for Adjara. */
export default function useLookups(regionCodes: string[] = []): Lookups {
  const { lang } = useTheme();
  const [lookups, setLookups] = useState<Omit<Lookups, 'municipalities'>>({
    legalForms: [],
    regions: [],
    naceCodes: [],
    naceNames: [],
    ownership: [],
    sizes: [],
  });
  const [municipalities, setMunicipalities] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      safe(fetchLegalForms(lang), []),
      safe(fetchRegions(lang), []),
      safe(fetchActivities(lang), { codes: [], names: [] }),
      safe(fetchOwnershipTypes(lang), []),
      safe(fetchSizes(lang), []),
    ]).then(([legalForms, regions, activities, ownership, sizes]) => {
      if (cancelled) return;
      setLookups({
        legalForms,
        regions,
        naceCodes: activities.codes,
        naceNames: activities.names,
        ownership,
        sizes,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Joined so a new array with the same codes doesn't refetch on every render.
  const regionKey = regionCodes.join('|');

  useEffect(() => {
    let cancelled = false;
    const codes = regionKey ? regionKey.split('|') : [];

    Promise.all(codes.map((code) => safe(fetchMunicipalities(lang, code), []))).then((lists) => {
      if (!cancelled) setMunicipalities(lists.flat());
    });

    return () => {
      cancelled = true;
    };
  }, [lang, regionKey]);

  return { ...lookups, municipalities };
}
