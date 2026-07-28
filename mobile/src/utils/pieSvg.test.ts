import { buildPieSvg } from './pieSvg';
import type { PieSlice } from '../types';

const twoSlices: PieSlice[] = [
  { label: 'A', color: '#111', value: 55, percent: '55%' },
  { label: 'B', color: '#222', value: 45, percent: '45%' },
];

describe('buildPieSvg', () => {
  it('produces a standalone svg with the title and legend labels', () => {
    const svg = buildPieSvg(twoSlices, 'Partner shares, 2015-12');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('Partner shares, 2015-12');
    expect(svg).toContain('>A<');
    expect(svg).toContain('55%');
    expect(svg).toContain('#111');
  });

  it('draws two arc paths for a two-slice pie', () => {
    const svg = buildPieSvg(twoSlices, 't');
    expect(svg.match(/<path /g)).toHaveLength(2);
    expect(svg).not.toContain('<circle');
  });

  it('draws a full circle (not an arc) for a single 100% slice', () => {
    const svg = buildPieSvg([{ label: 'Solo', color: '#0f0', value: 100, percent: '100%' }], 't');
    expect(svg).toContain('<circle');
    expect(svg).not.toContain('<path');
  });

  it('escapes special characters in labels', () => {
    const svg = buildPieSvg([{ label: 'A & B', color: '#000', value: 100, percent: '100%' }], 't');
    expect(svg).toContain('A &amp; B');
  });
});
