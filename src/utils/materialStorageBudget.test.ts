import { describe, expect, it } from 'vitest';
import type { Material } from '../types/material';
import {
  analyzeMaterialLibraryStorage,
  formatEncodedSize,
  LOCAL_LIBRARY_STORAGE_BLOCK_CHARS,
  LOCAL_LIBRARY_STORAGE_WARN_CHARS,
  summarizeMaterialTextures,
} from './materialStorageBudget';

function makeMaterial(overrides: Partial<Material> = {}): Material {
  const now = Date.now();
  return {
    id: overrides.id ?? 'mat-1',
    name: overrides.name ?? 'Material',
    color: overrides.color ?? '#ffffff',
    metalness: overrides.metalness ?? 0.5,
    roughness: overrides.roughness ?? 0.5,
    emissive: overrides.emissive ?? '#000000',
    emissiveIntensity: overrides.emissiveIntensity ?? 0,
    clearcoat: overrides.clearcoat ?? 0,
    clearcoatRoughness: overrides.clearcoatRoughness ?? 0.03,
    transmission: overrides.transmission ?? 0,
    ior: overrides.ior ?? 1.5,
    opacity: overrides.opacity ?? 1,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    ...overrides,
  };
}

describe('materialStorageBudget', () => {
  it('summarizes embedded texture payloads', () => {
    const material = makeMaterial({
      baseColorMap: 'data:image/png;base64,abc',
      normalMap: 'data:image/png;base64,defghi',
    });

    expect(summarizeMaterialTextures(material)).toEqual({
      textureCount: 2,
      textureChars: material.baseColorMap!.length + material.normalMap!.length,
    });
  });

  it('classifies projected library storage levels', () => {
    const ok = analyzeMaterialLibraryStorage([makeMaterial({ baseColorMap: 'a'.repeat(1024) })]);
    const warn = analyzeMaterialLibraryStorage([
      makeMaterial({ baseColorMap: 'a'.repeat(LOCAL_LIBRARY_STORAGE_WARN_CHARS) }),
    ]);
    const block = analyzeMaterialLibraryStorage([
      makeMaterial({ baseColorMap: 'a'.repeat(LOCAL_LIBRARY_STORAGE_BLOCK_CHARS) }),
    ]);

    expect(ok.level).toBe('ok');
    expect(warn.level).toBe('warn');
    expect(block.level).toBe('block');
  });

  it('formats encoded payload sizes for user feedback', () => {
    expect(formatEncodedSize(0)).toBe('0 KB');
    expect(formatEncodedSize(1024)).toBe('1 KB');
    expect(formatEncodedSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
