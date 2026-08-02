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

/** @param regionCode location code of the selected region, e.g. `15` for Adjara. */
export default function useLookups(regionCode?: string): Lookups {
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

  useEffect(() => {
    let cancelled = false;

    safe(fetchMunicipalities(lang, regionCode), []).then((list) => {
      if (!cancelled) setMunicipalities(list);
    });

    return () => {
      cancelled = true;
    };
  }, [lang, regionCode]);

  return { ...lookups, municipalities };
}
