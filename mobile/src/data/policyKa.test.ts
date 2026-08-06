import { POLICY_KA_SOURCE, policyKa } from './policyKa';

/**
 * The Georgian policy is transcribed from a PDF rather than parsed at runtime,
 * so nothing else would notice if an edit dropped a block or left a hard wrap
 * behind. These are the shape checks the parser gets for free on the English one.
 */
describe('policyKa', () => {
  it('opens with the title and closes with the closing paragraph', () => {
    expect(policyKa[0].kind).toBe('heading');
    expect(policyKa[0].text).toContain('კონფიდენციალურობის დაცვის პოლიტიკა');
    expect(policyKa[policyKa.length - 1].text).toMatch(/\.$/);
  });

  it('lists the ten confidentiality principles the document enumerates', () => {
    const bullets = policyKa.filter((block) => block.kind === 'bullet');

    expect(bullets).toHaveLength(10);
    // Each principle opens with its own name, then explains it.
    for (const bullet of bullets) expect(bullet.text).toMatch(/^[^.]+\. \S/);
  });

  it('holds whole paragraphs, not the lines of the original page', () => {
    for (const block of policyKa) {
      expect(block.text).toBe(block.text.trim());
      expect(block.text).not.toMatch(/\s{2}|\n/);
      // Word's bullet glyph and the page numbers belong to the PDF, not the text.
      expect(block.text).not.toMatch(/|^\d{1,3}$/);
    }
  });

  it('points at the published document it was taken from', () => {
    expect(POLICY_KA_SOURCE).toMatch(/^https:\/\/www\.geostat\.ge\/.*\.pdf$/);
  });
});
