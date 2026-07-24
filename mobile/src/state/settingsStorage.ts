import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Settings } from '../theme/ThemeProvider';

/**
 * Stable key — settings are versioned by field-level migration, not by bumping
 * the key (which would wipe the whole blob). Older keys are consolidated once.
 */
const KEY = 'br.settings';
/** Superseded keys, oldest → newest; newer values win during consolidation. */
const LEGACY_KEYS = ['br.settings.v1', 'br.settings.v2'];

const KNOWN_FIELDS: (keyof Settings)[] = ['dark', 'fontSize', 'lang', 'defaultActiveOnly', 'saveHistory'];

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Overlays whatever recognised fields a stored blob has onto `base`, dropping
 * anything unknown. Preserves the user's real choices across schema changes.
 */
export function migrateSettings(raw: unknown, base: Settings): Settings {
  const merged: Settings = { ...base };
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const field of KNOWN_FIELDS) {
      if (obj[field] !== undefined) {
        (merged as unknown as Record<string, unknown>)[field] = obj[field];
      }
    }
  }
  return merged;
}

/**
 * Loads settings, migrating from any legacy key on first run so a schema change
 * never resets unrelated preferences (dark mode, language, …).
 */
export async function loadSettings(defaults: Settings): Promise<Settings> {
  const current = await AsyncStorage.getItem(KEY);
  if (current) return migrateSettings(safeParse(current), defaults);

  // No current blob — fold any legacy keys into one, newest values winning.
  let consolidated = defaults;
  let migrated = false;
  for (const legacy of LEGACY_KEYS) {
    const raw = await AsyncStorage.getItem(legacy);
    if (raw) {
      migrated = true;
      consolidated = migrateSettings(safeParse(raw), consolidated);
    }
  }
  if (migrated) {
    await AsyncStorage.setItem(KEY, JSON.stringify(consolidated)).catch(() => {});
    await AsyncStorage.multiRemove(LEGACY_KEYS).catch(() => {});
  }
  return consolidated;
}

export function saveSettings(settings: Settings): void {
  AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {});
}
