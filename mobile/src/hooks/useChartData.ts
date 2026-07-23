import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  fetchBirthDeath,
  fetchBirthDistribution,
  fetchBirthNace,
  fetchBirthRegion,
  fetchBirthSector,
  fetchDeathDistribution,
  fetchDeathNace,
  fetchDeathRegion,
  fetchDeathSector,
} from '../api/registry';
import type { ApiRecord, BirthDeathPoint, Lang } from '../types';

export interface ChartData {
  birthDeath: BirthDeathPoint[];
  nace: ApiRecord[];
  naceDeath: ApiRecord[];
  region: ApiRecord[];
  regionDeath: ApiRecord[];
  distribution: ApiRecord[];
  distributionDeath: ApiRecord[];
  sector: ApiRecord[];
  sectorDeath: ApiRecord[];
}

/** Charts change at most daily, so a cache entry stays fresh for 24h. */
const TTL = 1000 * 60 * 60 * 24;
const storageKey = (lang: Lang) => `br.chartcache.${lang}`;

interface CacheEntry {
  ts: number;
  data: ChartData;
}

/** Survives tab switches and language toggles within a session. */
const memory = new Map<Lang, CacheEntry>();

function isFresh(entry: CacheEntry | undefined): entry is CacheEntry {
  return Boolean(entry && Date.now() - entry.ts < TTL);
}

async function readCache(lang: Lang): Promise<ChartData | null> {
  const mem = memory.get(lang);
  if (isFresh(mem)) return mem.data;
  try {
    const raw = await AsyncStorage.getItem(storageKey(lang));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!isFresh(entry)) return null;
    memory.set(lang, entry);
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(lang: Lang, data: ChartData) {
  const entry: CacheEntry = { ts: Date.now(), data };
  memory.set(lang, entry);
  AsyncStorage.setItem(storageKey(lang), JSON.stringify(entry)).catch(() => {});
}

async function fetchAll(lang: Lang): Promise<ChartData> {
  const safe = <T>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [] as T[]);
  const [
    birthDeath,
    nace,
    naceDeath,
    region,
    regionDeath,
    distribution,
    distributionDeath,
    sector,
    sectorDeath,
  ] = await Promise.all([
    safe(fetchBirthDeath(lang)),
    safe(fetchBirthNace(lang)),
    safe(fetchDeathNace(lang)),
    safe(fetchBirthRegion(lang)),
    safe(fetchDeathRegion(lang)),
    safe(fetchBirthDistribution(lang)),
    safe(fetchDeathDistribution(lang)),
    safe(fetchBirthSector(lang)),
    safe(fetchDeathSector(lang)),
  ]);
  return {
    birthDeath,
    nace,
    naceDeath,
    region,
    regionDeath,
    distribution,
    distributionDeath,
    sector,
    sectorDeath,
  };
}

export interface UseChartData {
  data: ChartData | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Loads the full chart bundle for `lang`, served from cache when fresh so tab
 * revisits and language toggles are instant. `reload` forces a network refresh.
 */
export default function useChartData(lang: Lang): UseChartData {
  const [data, setData] = useState<ChartData | null>(() => {
    const mem = memory.get(lang);
    return isFresh(mem) ? mem.data : null;
  });
  const [loading, setLoading] = useState(!data);

  const load = useCallback(
    async (force: boolean) => {
      if (!force) {
        const cached = await readCache(lang);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }
      setLoading(true);
      const fresh = await fetchAll(lang);
      writeCache(lang, fresh);
      return fresh;
    },
    [lang],
  );

  useEffect(() => {
    let cancelled = false;
    // Show cached data for the new language immediately, if any.
    const mem = memory.get(lang);
    if (isFresh(mem)) {
      setData(mem.data);
      setLoading(false);
    } else {
      setData(null);
      setLoading(true);
    }
    void load(false).then((fresh) => {
      if (fresh && !cancelled) {
        setData(fresh);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lang, load]);

  const reload = useCallback(() => {
    setLoading(true);
    void load(true).then((fresh) => fresh && setData(fresh)).finally(() => setLoading(false));
  }, [load]);

  return { data, loading, reload };
}
