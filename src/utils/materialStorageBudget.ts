import type { Material, MaterialDraft } from '../types/material';

export const TEXTURE_FIELDS = [
  'baseColorMap',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'alphaMap',
] as const;

export type TextureField = (typeof TEXTURE_FIELDS)[number];

export const MAX_TEXTURE_DATA_URL_CHARS = 2_500_000;
export const LOCAL_LIBRARY_STORAGE_WARN_CHARS = 3_250_000;
export const LOCAL_LIBRARY_STORAGE_BLOCK_CHARS = 4_250_000;

type MaterialLike = Material | MaterialDraft;

export type TextureStorageSummary = {
  textureCount: number;
  textureChars: number;
};

export type MaterialLibraryStorageReport = {
  serializedChars: number;
  textureChars: number;
  level: 'ok' | 'warn' | 'block';
};

export function summarizeMaterialTextures(material: MaterialLike): TextureStorageSummary {
  return TEXTURE_FIELDS.reduce<TextureStorageSummary>(
    (summary, field) => {
      const value = material[field];
      if (typeof value !== 'string' || value.length === 0) return summary;
      return {
        textureCount: summary.textureCount + 1,
        textureChars: summary.textureChars + value.length,
      };
    },
    { textureCount: 0, textureChars: 0 }
  );
}

export function formatEncodedSize(chars: number): string {
  if (chars <= 0) return '0 KB';
  const kib = chars / 1024;
  if (kib < 1024) return `${Math.max(1, Math.round(kib))} KB`;
  return `${(kib / 1024).toFixed(1)} MB`;
}

export function analyzeMaterialLibraryStorage(materials: Material[]): MaterialLibraryStorageReport {
  const serializedChars = JSON.stringify(materials).length;
  const textureChars = materials.reduce(
    (total, material) => total + summarizeMaterialTextures(material).textureChars,
    0
  );
  const level =
    serializedChars >= LOCAL_LIBRARY_STORAGE_BLOCK_CHARS
      ? 'block'
      : serializedChars >= LOCAL_LIBRARY_STORAGE_WARN_CHARS
        ? 'warn'
        : 'ok';

  return { serializedChars, textureChars, level };
}
