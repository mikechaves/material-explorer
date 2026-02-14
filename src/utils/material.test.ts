import { describe, expect, it } from 'vitest';
import {
  MATERIAL_NAME_MAX_LENGTH,
  MATERIAL_TAG_MAX_COUNT,
  MATERIAL_TAG_MAX_LENGTH,
  clamp01,
  coerceMaterialDraft,
  createMaterialFromDraft,
  isHexColor,
  normalizeMaterial,
} from './material';

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

  it('coerces draft payloads and sanitizes invalid values', () => {
    const coerced = coerceMaterialDraft({
      name: '  Copper  ',
      color: 'invalid',
      metalness: 3,
      roughness: -4,
      tags: [' polished ', '', 42],
      repeatX: 0,
      repeatY: 30,
      baseColorMap: 123,
    });

    expect(coerced.name).toBe('Copper');
    expect(coerced.color).toBe('#FFFFFF');
    expect(coerced.metalness).toBe(1);
    expect(coerced.roughness).toBe(0);
    expect(coerced.tags).toEqual(['polished']);
    expect(coerced.repeatX).toBe(0.01);
    expect(coerced.repeatY).toBe(20);
    expect(coerced.baseColorMap).toBeUndefined();
  });

  it('applies name and tag limits consistently across material conversions', () => {
    const overlongName = ` ${'N'.repeat(MATERIAL_NAME_MAX_LENGTH + 25)} `;
    const overlongTag = ` ${'T'.repeat(MATERIAL_TAG_MAX_LENGTH + 12)} `;
    const manyTags = Array.from({ length: MATERIAL_TAG_MAX_COUNT + 5 }, (_, idx) => ` tag-${idx} `);

    const coerced = coerceMaterialDraft({
      name: overlongName,
      tags: [overlongTag, 'dup', 'dup', '', 42, ...manyTags],
    });

    expect(coerced.name).toHaveLength(MATERIAL_NAME_MAX_LENGTH);
    expect(coerced.tags?.length).toBe(MATERIAL_TAG_MAX_COUNT);
    expect(coerced.tags?.[0]).toHaveLength(MATERIAL_TAG_MAX_LENGTH);
    expect(coerced.tags?.filter((tag) => tag === 'dup')).toHaveLength(1);

    const normalized = normalizeMaterial({
      id: 'material-1',
      name: '   ',
      tags: [overlongTag, 'dup', 'dup', ...manyTags],
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.name).toBe('Untitled');
    expect(normalized?.tags?.length).toBe(MATERIAL_TAG_MAX_COUNT);
    expect(normalized?.tags?.[0]).toHaveLength(MATERIAL_TAG_MAX_LENGTH);
    expect(normalized?.tags?.filter((tag) => tag === 'dup')).toHaveLength(1);

    const created = createMaterialFromDraft({
      ...coerced,
      name: '  ',
      tags: [overlongTag, 'dup', 'dup', ...manyTags],
    });

    expect(created.name).toBe('Untitled');
    expect(created.tags?.length).toBe(MATERIAL_TAG_MAX_COUNT);
    expect(created.tags?.[0]).toHaveLength(MATERIAL_TAG_MAX_LENGTH);
    expect(created.tags?.filter((tag) => tag === 'dup')).toHaveLength(1);
  });
});
