import { migrateSettings } from './settingsStorage';
import type { Settings } from '../theme/ThemeProvider';

const DEFAULTS: Settings = {
  dark: false,
  fontSize: 'normal',
  lang: 'ka',
  defaultActiveOnly: false,
  saveHistory: true,
};

describe('migrateSettings', () => {
  it('preserves recognised fields from a stored blob', () => {
    const stored = { dark: true, fontSize: 'large', lang: 'en', defaultActiveOnly: true, saveHistory: false };
    expect(migrateSettings(stored, DEFAULTS)).toEqual(stored);
  });

  it('fills missing fields from defaults (field-level migration, no reset)', () => {
    // An old blob that only knew about dark + lang keeps them; new fields default.
    const legacy = { dark: true, lang: 'en' };
    expect(migrateSettings(legacy, DEFAULTS)).toEqual({
      dark: true,
      fontSize: 'normal',
      lang: 'en',
      defaultActiveOnly: false,
      saveHistory: true,
    });
  });

  it('ignores unknown keys', () => {
    const stored = { dark: true, someRemovedFlag: 42 };
    const result = migrateSettings(stored, DEFAULTS);
    expect(result).not.toHaveProperty('someRemovedFlag');
    expect(result.dark).toBe(true);
  });

  it('returns a copy of defaults for null / non-object input', () => {
    expect(migrateSettings(null, DEFAULTS)).toEqual(DEFAULTS);
    expect(migrateSettings('garbage', DEFAULTS)).toEqual(DEFAULTS);
    expect(migrateSettings(null, DEFAULTS)).not.toBe(DEFAULTS);
  });
});
