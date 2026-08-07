import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * A fixed `lineHeight` drops the trailing line of wrapped Georgian text: the last
 * line draws over the one above it, outside its container, and gets clipped. It
 * showed up on the privacy screen at `lineHeight: 23` / `fontSize: 15`, and every
 * other fixed value in the app sat at the same ratio or tighter — subject names,
 * addresses, report titles.
 *
 * On a register app that is worse than a layout bug. A name cut from
 * "შპს ალფა ბეტა გამა" to "შპს ალფა ბეტა" still looks like a name, so nobody
 * reading it can tell it is wrong.
 *
 * The fix everywhere was to let the platform compute leading. This test exists
 * because the next person nudging vertical spacing will reach for `lineHeight`
 * first, and nothing on screen will tell them it broke.
 */
const SRC = join(__dirname, '..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });

/** Comments discuss `lineHeight` deliberately — only real style values count. */
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('typography', () => {
  it('leaves leading to the platform, with no fixed lineHeight in src/', () => {
    const offenders = sourceFiles(SRC)
      .filter((path) => /\blineHeight\s*:/.test(withoutComments(readFileSync(path, 'utf8'))))
      .map((path) => path.slice(SRC.length + 1).replace(/\\/g, '/'));

    expect(offenders).toEqual([]);
  });
});
