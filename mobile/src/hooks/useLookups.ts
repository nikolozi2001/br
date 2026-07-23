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
 * Loads every picker's option list once per language. Failures resolve to an
 * empty list so a picker opens (empty) rather than the screen breaking.
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

export default function useLookups(): Lookups {
  const { lang } = useTheme();
  const [lookups, setLookups] = useState<Lookups>({
    legalForms: [],
    regions: [],
    municipalities: [],
    naceCodes: [],
    naceNames: [],
    ownership: [],
    sizes: [],
  });

  useEffect(() => {
    let cancelled = false;
    const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);

    Promise.all([
      safe(fetchLegalForms(lang), []),
      safe(fetchRegions(lang), []),
      safe(fetchMunicipalities(lang), []),
      safe(fetchActivities(lang), { codes: [], names: [] }),
      safe(fetchOwnershipTypes(lang), []),
      safe(fetchSizes(lang), []),
    ]).then(([legalForms, regions, municipalities, activities, ownership, sizes]) => {
      if (cancelled) return;
      setLookups({
        legalForms,
        regions,
        municipalities,
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

  return lookups;
}
