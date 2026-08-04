import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache for the picker lookup lists. They are reference data — the NACE table
 * alone is ~1700 rows and half a megabyte — and it was re-fetched every time the
 * search screen mounted or the language changed.
 *
 * Two layers: a module-level map that makes a re-mount free, and AsyncStorage so
 * a cold start does not wait on the network either. A stale entry is still
 * served when the refresh fails, which also makes the pickers work offline.
 */

/** Bump to discard every stored entry after a shape change. */
const VERSION = 1;
const PREFIX = `br.lookups.v${VERSION}.`;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface Entry<T> {
  at: number;
  value: T;
}

const memory = new Map<string, unknown>();
/** In-flight loads, so two screens mounting at once share one request. */
const pending = new Map<string, Promise<unknown>>();

const isFresh = (entry: Entry<unknown>): boolean => Date.now() - entry.at < MAX_AGE_MS;

function readStored<T>(raw: string | null): Entry<T> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Entry<T>;
    return parsed && typeof parsed.at === 'number' && 'value' in parsed ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Returns the cached list for `key`, or loads and caches it.
 *
 * @param key stable per endpoint *and* language — the lists are localised.
 */
export async function cachedLookup<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memory.get(key);
  if (hit !== undefined) return hit as T;

  const inFlight = pending.get(key);
  if (inFlight) return inFlight as Promise<T>;

  const task = (async (): Promise<T> => {
    const stored = readStored<T>(await AsyncStorage.getItem(PREFIX + key).catch(() => null));
    if (stored && isFresh(stored)) {
      memory.set(key, stored.value);
      return stored.value;
    }

    try {
      const value = await load();
      memory.set(key, value);
      // Persisting is best-effort: a full disk must not fail the lookup.
      void AsyncStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), value } satisfies Entry<T>)).catch(
        () => {},
      );
      return value;
    } catch (err) {
      // Expired beats empty — a picker with last week's list still works.
      if (stored) {
        memory.set(key, stored.value);
        return stored.value;
      }
      throw err;
    }
  })().finally(() => pending.delete(key));

  pending.set(key, task);
  return task;
}

/** Drops every cached list. Exposed for tests and for a future "refresh" action. */
export async function clearLookupCache(): Promise<void> {
  memory.clear();
  pending.clear();
  const keys = await AsyncStorage.getAllKeys().catch(() => [] as readonly string[]);
  const ours = keys.filter((k) => k.startsWith(PREFIX));
  if (ours.length) await AsyncStorage.multiRemove(ours).catch(() => {});
}
