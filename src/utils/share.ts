import type { MaterialDraft } from '../types/material';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { coerceMaterialDraft } from './material';

export type SharePayloadV1 = {
  v: 1;
  material: Omit<MaterialDraft, 'baseColorMap' | 'normalMap'>;
};

export type SharePayloadV2 = {
  v: 2;
  includeTextures?: boolean;
  material: MaterialDraft;
};

function b64EncodeUnicode(str: string) {
  return btoa(encodeURIComponent(str));
}

function b64DecodeUnicode(b64: string) {
  return decodeURIComponent(atob(b64));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function encodeSharePayload(payload: SharePayloadV1): string {
  return b64EncodeUnicode(JSON.stringify(payload));
}

export function encodeSharePayloadV2(payload: SharePayloadV2): string {
  // URL-safe compression (much shorter than base64 JSON).
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeSharePayload(encoded: string): SharePayloadV1 | SharePayloadV2 | null {
  try {
    // v2 uses lz-string; v1 uses base64. Try v2 first.
    const maybeJsonV2 = decompressFromEncodedURIComponent(encoded);
    if (maybeJsonV2) {
      const parsed = JSON.parse(maybeJsonV2) as unknown;
      if (isRecord(parsed) && (parsed.v === 2 || parsed.v === '2') && 'material' in parsed) {
        return {
          v: 2,
          includeTextures: parsed.includeTextures === true,
          material: coerceMaterialDraft(parsed.material),
        };
      }
    }

    const json = b64DecodeUnicode(encoded);
    const parsed = JSON.parse(json) as unknown;
    if (!isRecord(parsed) || parsed.v !== 1 || !('material' in parsed)) return null;
    const { baseColorMap: _baseColorMap, normalMap: _normalMap, ...material } = coerceMaterialDraft(parsed.material);
    return { v: 1, material };
  } catch {
    return null;
  }
}
