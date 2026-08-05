import { createRequestGuard } from './requestGuard';

describe('createRequestGuard', () => {
  it('treats the only request in flight as current', () => {
    const guard = createRequestGuard();
    const token = guard.start();
    expect(guard.isCurrent(token)).toBe(true);
  });

  it('drops the earlier request once a newer one starts', () => {
    const guard = createRequestGuard();
    const first = guard.start();
    const second = guard.start();

    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });

  it('keeps the newest result when responses come back out of order', async () => {
    // The case this exists for: the user searches, then searches again, and the
    // first response arrives last.
    const guard = createRequestGuard();
    let shown: string | null = null;

    const search = async (label: string, delayMs: number) => {
      const token = guard.start();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (!guard.isCurrent(token)) return;
      shown = label;
    };

    const slowFirst = search('stale', 30);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const fastSecond = search('fresh', 1);

    await Promise.all([slowFirst, fastSecond]);

    expect(shown).toBe('fresh');
  });

  it('hands out a distinct token to every request', () => {
    const guard = createRequestGuard();
    const tokens = [guard.start(), guard.start(), guard.start()];
    expect(new Set(tokens).size).toBe(3);
  });

  it('never treats a token it did not issue as current', () => {
    const guard = createRequestGuard();
    guard.start();
    expect(guard.isCurrent(0)).toBe(false);
    expect(guard.isCurrent(99)).toBe(false);
  });

  it('keeps separate guards independent', () => {
    const a = createRequestGuard();
    const b = createRequestGuard();

    const tokenA = a.start();
    b.start();
    b.start();

    expect(a.isCurrent(tokenA)).toBe(true);
  });
});
