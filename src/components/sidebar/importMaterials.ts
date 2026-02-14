import type { Material } from '../../types/material';
import { createMaterialFromDraft, normalizeMaterial } from '../../utils/material';

const MAX_IMPORT_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_IMPORT_JSON_CHARS = 12 * 1024 * 1024;
const MAX_IMPORT_MATERIALS = 600;
const MAX_TEXTURE_DATA_URL_CHARS = 2_500_000;
const textureFields: Array<
  'baseColorMap' | 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'aoMap' | 'emissiveMap' | 'alphaMap'
> = ['baseColorMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export type ImportMaterialsResult = { ok: true; materials: Material[] } | { ok: false; message: string };

export function validateImportFileSize(file: File): string | null {
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return 'Import file is too large. Maximum supported size is 8 MB.';
  }
  return null;
}

export function parseImportedMaterials(
  raw: string,
  existingMaterials: Material[],
  now: number = Date.now()
): ImportMaterialsResult {
  if (raw.length > MAX_IMPORT_JSON_CHARS) {
    return { ok: false, message: 'Import payload is too large. Try splitting the file into smaller batches.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, message: 'Failed to import materials. Make sure it is valid JSON.' };
  }

  const incoming: unknown[] = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.materials)
      ? parsed.materials
      : isRecord(parsed) && 'material' in parsed
        ? [parsed.material]
        : [parsed];

  if (incoming.length > MAX_IMPORT_MATERIALS) {
    return {
      ok: false,
      message: `Import contains too many materials (${incoming.length}). Maximum supported is ${MAX_IMPORT_MATERIALS}.`,
    };
  }

  const normalized = incoming
    .map((item) => normalizeMaterial(item, now))
    .filter((item): item is Material => item !== null);

  if (normalized.length === 0) {
    return { ok: false, message: 'No valid materials found in that file.' };
  }

  const oversizedTextureMaterial = normalized.find((material) =>
    textureFields.some((field) => {
      const value = material[field];
      return typeof value === 'string' && value.length > MAX_TEXTURE_DATA_URL_CHARS;
    })
  );

  if (oversizedTextureMaterial) {
    return {
      ok: false,
      message:
        'Import includes very large embedded texture data. Use smaller textures or split imports to avoid browser storage limits.',
    };
  }

  // Ensure imported ids don’t collide; if they do, assign a new id.
  const existingIds = new Set(existingMaterials.map((material) => material.id));
  const imported = normalized.map((material) => {
    const draft = existingIds.has(material.id) ? { ...material, id: undefined } : material;
    const created = createMaterialFromDraft(draft);
    existingIds.add(created.id);
    return created;
  });

  return { ok: true, materials: imported };
}
