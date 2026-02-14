import { describe, expect, it } from 'vitest';
import { parseImportedMaterials, validateImportFileSize } from './importMaterials';
import type { Material } from '../../types/material';

function makeMaterial(id: string, name: string): Material {
  const now = Date.now();
  return {
    id,
    name,
    color: '#ffffff',
    metalness: 0.5,
    roughness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 0,
    clearcoat: 0,
    clearcoatRoughness: 0.03,
    transmission: 0,
    ior: 1.5,
    opacity: 1,
    createdAt: now,
    updatedAt: now,
  };
}

describe('importMaterials', () => {
  it('imports valid materials payload', () => {
    const payload = {
      version: 1,
      materials: [makeMaterial('m-1', 'Imported One')],
    };

    const result = parseImportedMaterials(JSON.stringify(payload), []);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.materials).toHaveLength(1);
    expect(result.materials[0]?.name).toBe('Imported One');
  });

  it('rejects too many materials', () => {
    const payload = {
      version: 1,
      materials: Array.from({ length: 601 }, (_, index) => makeMaterial(`m-${index}`, `Material ${index}`)),
    };

    const result = parseImportedMaterials(JSON.stringify(payload), []);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain('too many materials');
  });

  it('rejects malformed JSON', () => {
    const result = parseImportedMaterials('{bad-json', []);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain('valid JSON');
  });

  it('rejects oversized texture payload', () => {
    const payload = {
      version: 1,
      materials: [
        {
          ...makeMaterial('m-oversize', 'Big Texture'),
          baseColorMap: `data:image/png;base64,${'a'.repeat(2_500_001)}`,
        },
      ],
    };

    const result = parseImportedMaterials(JSON.stringify(payload), []);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain('very large embedded texture');
  });

  it('validates file size limits', () => {
    const tooLarge = { size: 8 * 1024 * 1024 + 1 } as File;
    const valid = { size: 1024 } as File;
    expect(validateImportFileSize(tooLarge)).toContain('too large');
    expect(validateImportFileSize(valid)).toBeNull();
  });
});
