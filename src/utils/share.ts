import type { MaterialDraft } from '../types/material';

export type SharePayloadV1 = {
  v: 1;
  material: Omit<MaterialDraft, 'baseColorMap' | 'normalMap'>;
};

function b64EncodeUnicode(str: string) {
  return btoa(encodeURIComponent(str));
}

function b64DecodeUnicode(b64: string) {
  return decodeURIComponent(atob(b64));
}

export function encodeSharePayload(payload: SharePayloadV1): string {
  return b64EncodeUnicode(JSON.stringify(payload));
}

export function decodeSharePayload(encoded: string): SharePayloadV1 | null {
  try {
    const json = b64DecodeUnicode(encoded);
    const parsed = JSON.parse(json) as any;
    if (!parsed || parsed.v !== 1 || !parsed.material) return null;
    return parsed as SharePayloadV1;
  } catch {
    return null;
  }
}


