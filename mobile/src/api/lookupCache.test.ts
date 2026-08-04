import AsyncStorage from '@react-native-async-storage/async-storage';

import { cachedLookup, clearLookupCache } from './lookupCache';

describe('cachedLookup', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await clearLookupCache();
  });

  it('loads once and serves the rest from memory', async () => {
    const load = jest.fn().mockResolvedValue(['a']);

    await expect(cachedLookup('k', load)).resolves.toEqual(['a']);
    await expect(cachedLookup('k', load)).resolves.toEqual(['a']);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps separate entries per key, so languages do not mix', async () => {
    await cachedLookup('list.ka', async () => ['ქართული']);
    await expect(cachedLookup('list.en', async () => ['English'])).resolves.toEqual(['English']);
    await expect(cachedLookup('list.ka', async () => ['ignored'])).resolves.toEqual(['ქართული']);
  });

  it('shares one request between callers that arrive together', async () => {
    let release: (value: string[]) => void = () => {};
    const load = jest.fn().mockReturnValue(new Promise<string[]>((resolve) => { release = resolve; }));

    const both = Promise.all([cachedLookup('k', load), cachedLookup('k', load)]);
    release(['once']);

    await expect(both).resolves.toEqual([['once'], ['once']]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('serves a cold start from storage without touching the network', async () => {
    // A fresh launch has an empty memory map but keeps what AsyncStorage holds.
    await AsyncStorage.setItem('br.lookups.v1.k', JSON.stringify({ at: Date.now(), value: ['stored'] }));

    const load = jest.fn();
    await expect(cachedLookup('k', load)).resolves.toEqual(['stored']);
    expect(load).not.toHaveBeenCalled();
  });

  it('writes what it loaded, so the next launch starts warm', async () => {
    await cachedLookup('k', async () => ['loaded']);

    const raw = await AsyncStorage.getItem('br.lookups.v1.k');
    expect(JSON.parse(raw as string)).toMatchObject({ value: ['loaded'] });
  });

  it('clearLookupCache empties both layers', async () => {
    await cachedLookup('k', async () => ['loaded']);
    await clearLookupCache();

    expect(await AsyncStorage.getItem('br.lookups.v1.k')).toBeNull();
    const load = jest.fn().mockResolvedValue(['again']);
    await expect(cachedLookup('k', load)).resolves.toEqual(['again']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('falls back to a stale entry when the refresh fails', async () => {
    const stored = { at: Date.now() - 30 * 24 * 60 * 60 * 1000, value: ['last month'] };
    await AsyncStorage.setItem('br.lookups.v1.k', JSON.stringify(stored));

    const load = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(cachedLookup('k', load)).resolves.toEqual(['last month']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('propagates the failure when there is nothing to fall back on', async () => {
    const load = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(cachedLookup('k', load)).rejects.toThrow('offline');
  });

  it('refetches once the stored entry is older than a week', async () => {
    const eightDays = Date.now() - 8 * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem('br.lookups.v1.k', JSON.stringify({ at: eightDays, value: ['old'] }));

    await expect(cachedLookup('k', async () => ['fresh'])).resolves.toEqual(['fresh']);
  });

  it('ignores a stored entry that is not readable', async () => {
    await AsyncStorage.setItem('br.lookups.v1.k', 'not json');
    await expect(cachedLookup('k', async () => ['loaded'])).resolves.toEqual(['loaded']);
  });
});
