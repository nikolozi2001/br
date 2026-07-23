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

/** An all-empty bundle means every endpoint failed — treat it as a network error. */
function isEmptyBundle(data: ChartData): boolean {
  return Object.values(data).every((arr) => arr.length === 0);
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
  /** True when the last load produced no data at all (network failure). */
  error: boolean;
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
  const [error, setError] = useState(false);

  // Returns the fetched (or cached) bundle, or null when the fetch came back empty.
  const load = useCallback(
    async (force: boolean): Promise<ChartData | null> => {
      if (!force) {
        const cached = await readCache(lang);
        if (cached) return cached;
      }
      const fresh = await fetchAll(lang);
      if (isEmptyBundle(fresh)) return null;
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
    setError(false);
    void load(false).then((result) => {
      if (cancelled) return;
      if (result) setData(result);
      else if (!isFresh(memory.get(lang))) setError(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [lang, load]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(false);
    void load(true)
      .then((result) => {
        if (result) setData(result);
        else setError(true);
      })
      .finally(() => setLoading(false));
  }, [load]);

  return { data, loading, error, reload };
}
