/**
 * Turns geostat.ge's privacy policy markup into blocks the app can lay out
 * itself.
 *
 * The page was pasted out of Word: the whole policy is one `<p>` broken by 63
 * `<br>`, and those breaks are *hard wraps in the middle of sentences*, not
 * paragraph ends. Rendering one per line is what makes the page look ragged.
 *
 * The wraps sit at 94–106 characters, so a line that ends a sentence well short
 * of that was the last line of a paragraph rather than a wrap. That is the whole
 * heuristic, and it is why {@link WRAP_FLOOR} is a length rather than a marker.
 */

export interface PolicyBlock {
  kind: 'heading' | 'paragraph' | 'bullet';
  text: string;
}

/** Shorter than this and ending a sentence ⇒ end of a paragraph, not a wrap. */
const WRAP_FLOOR = 80;

/** Word's Wingdings bullet, plus the real one in case the page is ever cleaned up. */
const BULLET = /^[•]\s*/;

const SENTENCE_END = /[.:;!?]["'’”)]?$/;

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&ndash;': '–',
  '&mdash;': '—',
};

const decode = (text: string): string =>
  text.replace(/&[a-z]+;|&#\d+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity);

/** A line that is only a number is a page number left over from the original document. */
const isPageNumber = (line: string): boolean => /^\d{1,3}$/.test(line);

/**
 * Short *and* not closing a sentence: too short to be a wrap, so it is a title.
 * In the current document that matches exactly one line — "Privacy Policy".
 */
const isHeading = (line: string): boolean => line.length < WRAP_FLOOR && !SENTENCE_END.test(line);

export function parsePolicy(html: string): PolicyBlock[] {
  const lines = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((line) => decode(line).replace(/\s+/g, ' ').trim())
    .filter((line) => line && !isPageNumber(line));

  const blocks: PolicyBlock[] = [];
  let open: PolicyBlock | null = null;

  for (const line of lines) {
    const bullet = BULLET.test(line);
    const text = line.replace(BULLET, '');

    if (!bullet && !open && isHeading(text)) {
      blocks.push({ kind: 'heading', text });
      continue;
    }

    if (bullet || !open) {
      open = { kind: bullet ? 'bullet' : 'paragraph', text };
      blocks.push(open);
    } else {
      open.text += ` ${text}`;
    }

    // A short line that closes a sentence ends the block; a long one wrapped.
    if (SENTENCE_END.test(text) && text.length < WRAP_FLOOR) open = null;
  }

  return blocks;
}
