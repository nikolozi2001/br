import type { PieSlice } from '../types';

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Serialises a partner-share pie into a standalone SVG string (pie + legend),
 * mirroring the on-screen `PieChart`. Unlike the raster export this is a real
 * vector file, so it matches the web report's "SVG" download option.
 */
export function buildPieSvg(slices: PieSlice[], title: string): string {
  const cx = 80;
  const cy = 118;
  const r = 66;
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  // A slice covering the whole circle can't be drawn as an arc (start === end).
  const full = slices.find((s) => s.value >= total);
  let angle = -Math.PI / 2;

  const shapes = full
    ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${full.color}"/>`
    : slices
        .map((slice) => {
          const sweep = (slice.value / total) * 2 * Math.PI;
          const x1 = cx + r * Math.cos(angle);
          const y1 = cy + r * Math.sin(angle);
          angle += sweep;
          const x2 = cx + r * Math.cos(angle);
          const y2 = cy + r * Math.sin(angle);
          const large = sweep > Math.PI ? 1 : 0;
          return `<path d="M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(
            2,
          )} ${y2.toFixed(2)} Z" fill="${slice.color}"/>`;
        })
        .join('');

  const legendX = 178;
  const legend = slices
    .map((slice, i) => {
      const y = 84 + i * 28;
      return (
        `<rect x="${legendX}" y="${y}" width="13" height="13" rx="3" fill="${slice.color}"/>` +
        `<text x="${legendX + 22}" y="${y + 11}" font-family="sans-serif" font-size="14" fill="#1a1a2e">${escapeXml(
          slice.label,
        )}</text>` +
        `<text x="404" y="${y + 11}" font-family="sans-serif" font-size="14" font-weight="600" fill="#475569" text-anchor="end">${escapeXml(
          slice.percent,
        )}</text>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="230" viewBox="0 0 420 230">` +
    `<rect width="420" height="230" fill="#ffffff"/>` +
    `<text x="16" y="30" font-family="sans-serif" font-size="15" font-weight="700" fill="#0080be">${escapeXml(
      title,
    )}</text>` +
    shapes +
    legend +
    `</svg>`
  );
}
