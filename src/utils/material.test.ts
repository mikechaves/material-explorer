import { describe, expect, it } from 'vitest';
import { clamp01, isHexColor, normalizeMaterial } from './material';

describe('material utils', () => {
  it('clamp01 bounds numbers between 0 and 1', () => {
    expect(clamp01(-0.2)).toBe(0);
    expect(clamp01(0.6)).toBe(0.6);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it('validates 6-char hex colors', () => {
    expect(isHexColor('#a1B2c3')).toBe(true);
    expect(isHexColor('#abcd')).toBe(false);
    expect(isHexColor('red')).toBe(false);
  });

  it('normalizes materials and clamps out-of-range values', () => {
    const now = 1700000000000;
    const normalized = normalizeMaterial(
      {
        id: 'm-1',
        name: '  Steel  ',
        color: 'invalid',
        metalness: 2,
        roughness: -1,
        ior: 99,
        tags: [' polished ', '', 42],
      },
      now
    );

    expect(normalized).not.toBeNull();
    expect(normalized?.name).toBe('Steel');
    expect(normalized?.color).toBe('#FFFFFF');
    expect(normalized?.metalness).toBe(1);
    expect(normalized?.roughness).toBe(0);
    expect(normalized?.ior).toBe(2.5);
    expect(normalized?.tags).toEqual(['polished']);
    expect(normalized?.createdAt).toBe(now);
  });

  it('returns null for invalid material payloads', () => {
    expect(normalizeMaterial(null)).toBeNull();
    expect(normalizeMaterial({})).toBeNull();
    expect(normalizeMaterial({ id: '' })).toBeNull();
  });
});
