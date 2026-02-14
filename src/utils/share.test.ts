import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { DEFAULT_MATERIAL_DRAFT } from './material';
import { decodeSharePayload, encodeSharePayloadV2 } from './share';

function encodeLegacyPayload(payload: unknown): string {
  return Buffer.from(encodeURIComponent(JSON.stringify(payload)), 'utf8').toString('base64');
}

describe('share utils', () => {
  it('sanitizes decoded v2 payloads', () => {
    const encoded = encodeSharePayloadV2({
      v: 2,
      includeTextures: true,
      material: {
        ...DEFAULT_MATERIAL_DRAFT,
        name: '  Alloy  ',
        metalness: 5,
        roughness: -2,
        repeatX: 0,
        repeatY: 50,
      },
    });

    const decoded = decodeSharePayload(encoded);
    expect(decoded?.v).toBe(2);
    if (!decoded || decoded.v !== 2) throw new Error('Expected v2 payload');

    expect(decoded.material.name).toBe('Alloy');
    expect(decoded.material.metalness).toBe(1);
    expect(decoded.material.roughness).toBe(0);
    expect(decoded.material.repeatX).toBe(0.01);
    expect(decoded.material.repeatY).toBe(20);
  });

  it('strips legacy v1 texture maps from decoded payloads', () => {
    const encoded = encodeLegacyPayload({
      v: 1,
      material: {
        name: 'Legacy Material',
        baseColorMap: 'data:image/png;base64,AAAA',
        normalMap: 'data:image/png;base64,BBBB',
      },
    });

    const decoded = decodeSharePayload(encoded);
    expect(decoded?.v).toBe(1);
    if (!decoded || decoded.v !== 1) throw new Error('Expected v1 payload');

    expect(decoded.material.name).toBe('Legacy Material');
    expect('baseColorMap' in decoded.material).toBe(false);
    expect('normalMap' in decoded.material).toBe(false);
  });

  it('returns null for malformed payloads', () => {
    expect(decodeSharePayload('%%%bad%%%')).toBeNull();
  });
});
