import { readFileSync } from 'fs';
import { join } from 'path';

import { policyApp } from './policyApp';

/**
 * `privacy-policy.html` is the page the store listings point at; `policyApp` is
 * the same document inside the app. Two copies of one policy drift, and a reader
 * would then be told two different things about what the app collects — so the
 * comment asking for them to be changed together is checked here instead.
 */
const html = readFileSync(join(__dirname, '../../privacy-policy.html'), 'utf8');

const strip = (fragment: string) =>
  fragment
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** The `<hr>` separates the Georgian half from the English one. */
const halves = html.split('<body>')[1].split('</body>')[0].split('<hr>');

describe('policyApp', () => {
  it.each([
    ['ka', 0],
    ['en', 1],
  ] as const)('says the same as the published page in %s', (lang, half) => {
    const published = [...halves[half].matchAll(/<(h2|p|li)([^>]*)>(.*?)<\/\1>/gs)]
      .filter(([, , attrs]) => !attrs.includes('muted'))
      .map(([, , , inner]) => strip(inner));

    expect(policyApp[lang].blocks.map((block) => block.text)).toEqual(published);
  });

  it('carries the six sections, in both languages, in the same shape', () => {
    for (const lang of ['ka', 'en'] as const) {
      const kinds = policyApp[lang].blocks.map((block) => block.kind);
      expect(kinds.filter((kind) => kind === 'heading')).toHaveLength(6);
      expect(kinds).toEqual(policyApp.ka.blocks.map((block) => block.kind));
      // The byline is shown apart from the blocks, so it has to survive the split.
      expect(policyApp[lang].owner).toMatch(/\S/);
      expect(policyApp[lang].updated).toMatch(/2026/);
    }
  });
});
