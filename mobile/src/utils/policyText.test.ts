import { parsePolicy } from './policyText';

/** A wrapped line from the real page: 94–106 characters, ending mid-sentence. */
const wrapped = (text: string) => text.padEnd(95, ' ').trimEnd();

describe('parsePolicy', () => {
  it('rejoins lines that were hard-wrapped mid-sentence', () => {
    const html = [
      'Data confidentiality protection policy, development of its principles and rules, and use of info',
      'only for statistical purposes are important objectives of the National Statistics Office of Geor',
      '(Geostat).',
    ].join('<br />');

    const blocks = parsePolicy(html);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].text).toContain('rules, and use of info only for statistical');
    expect(blocks[0].text.endsWith('(Geostat).')).toBe(true);
  });

  it('starts a new paragraph after a short line that ends a sentence', () => {
    const html = [
      wrapped('Geostat aims to meet user demands and provide them with high quality data on the one hand,'),
      'and instructions on confidential data protection.',
      wrapped('The article 4 of Georgian law stipulates that data about physical and legal persons are held'),
      'and may be used exclusively for statistical purposes.',
    ].join('<br />');

    expect(parsePolicy(html)).toHaveLength(2);
  });

  it('keeps a long line that happens to end in a full stop with the paragraph', () => {
    // 95 characters: that is a wrap, even though it closes a sentence.
    const long = 'Geostat is obliged to strictly protect from disclosure the data it collects for statistics.';
    const html = [wrapped(long), 'The next line continues the same thought.'].join('<br />');

    expect(parsePolicy(html)).toHaveLength(1);
  });

  it('treats the Wingdings bullet Word leaves behind as a list item', () => {
    const html = [
      'When performing its duties Geostat enforces the following principles:',
      ' Confidential data management. Geostat has the utmost respect for primary data.',
      ' Exclusivity of the statistical purpose. Data is used only for statistics.',
    ].join('<br />');

    const blocks = parsePolicy(html);

    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'bullet', 'bullet']);
    expect(blocks[1].text.startsWith('Confidential data management')).toBe(true);
  });

  it('reads a short line that opens the document as its title', () => {
    const html = [
      'Privacy Policy',
      wrapped('Data confidentiality protection policy and the use of information only for statistics are'),
      'important objectives of Geostat.',
    ].join('<br />');

    const blocks = parsePolicy(html);

    expect(blocks[0]).toEqual({ kind: 'heading', text: 'Privacy Policy' });
    expect(blocks[1].kind).toBe('paragraph');
    expect(blocks[1].text.startsWith('Data confidentiality')).toBe(true);
  });

  it('does not mistake a wrapped line for a heading', () => {
    // Long enough to be a wrap even though it closes no sentence.
    const html = [wrapped('Geostat confidentiality policy is determined by the professional independence of'), 'the institution.'].join('<br />');

    expect(parsePolicy(html)[0].kind).toBe('paragraph');
  });

  it('drops the page numbers left in the original document', () => {
    const html = ['Prohibition of use for non-statistical purposes.', '2', 'Publicity of statistical data.'].join(
      '<br />',
    );

    expect(parsePolicy(html).every((b) => b.text !== '2')).toBe(true);
  });

  it('decodes the entities the page still carries', () => {
    expect(parsePolicy('Data &amp; statistics &rsquo;confidential&rsquo;.')[0].text).toBe(
      'Data & statistics ’confidential’.',
    );
  });

  it('ignores markup and empty lines', () => {
    expect(parsePolicy('<p>  </p><br /><br />Only this survives.')).toEqual([
      { kind: 'paragraph', text: 'Only this survives.' },
    ]);
  });

  it('returns nothing for markup with no text', () => {
    expect(parsePolicy('<p></p><br />')).toEqual([]);
  });
});
