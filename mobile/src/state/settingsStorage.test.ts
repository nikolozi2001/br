import { migrateSettings } from './settingsStorage';
import type { Settings } from '../theme/ThemeProvider';

const DEFAULTS: Settings = {
  themeMode: 'system',
  fontSize: 'normal',
  lang: 'ka',
  saveHistory: true,
};

describe('migrateSettings', () => {
  it('preserves recognised fields from a stored blob', () => {
    const stored = {
      themeMode: 'dark',
      fontSize: 'large',
      lang: 'en',
      saveHistory: false,
    };
    expect(migrateSettings(stored, DEFAULTS)).toEqual(stored);
  });

  it('fills missing fields from defaults (field-level migration, no reset)', () => {
    // An old blob that only knew about theme + lang keeps them; new fields default.
    const legacy = { themeMode: 'light', lang: 'en' };
    expect(migrateSettings(legacy, DEFAULTS)).toEqual({
      themeMode: 'light',
      fontSize: 'normal',
      lang: 'en',
      saveHistory: true,
    });
  });

  it('ignores unknown keys', () => {
    const stored = { themeMode: 'dark', someRemovedFlag: 42 };
    const result = migrateSettings(stored, DEFAULTS);
    expect(result).not.toHaveProperty('someRemovedFlag');
    expect(result.themeMode).toBe('dark');
  });

  it('rejects a themeMode value it does not know', () => {
    expect(migrateSettings({ themeMode: 'sepia' }, DEFAULTS).themeMode).toBe('system');
  });

  it('returns a copy of defaults for null / non-object input', () => {
    expect(migrateSettings(null, DEFAULTS)).toEqual(DEFAULTS);
    expect(migrateSettings('garbage', DEFAULTS)).toEqual(DEFAULTS);
    expect(migrateSettings(null, DEFAULTS)).not.toBe(DEFAULTS);
  });
});

describe('migrateSettings — legacy `dark` boolean', () => {
  it('keeps a deliberate dark choice', () => {
    expect(migrateSettings({ dark: true, lang: 'en' }, DEFAULTS)).toEqual({
      ...DEFAULTS,
      themeMode: 'dark',
      lang: 'en',
    });
  });

  it('moves the old default (dark: false) onto the device appearance', () => {
    expect(migrateSettings({ dark: false }, DEFAULTS).themeMode).toBe('system');
  });

  it('prefers themeMode when a blob carries both', () => {
    expect(migrateSettings({ dark: true, themeMode: 'light' }, DEFAULTS).themeMode).toBe('light');
  });

  it('does not leak the legacy field into the result', () => {
    expect(migrateSettings({ dark: true }, DEFAULTS)).not.toHaveProperty('dark');
  });
});
