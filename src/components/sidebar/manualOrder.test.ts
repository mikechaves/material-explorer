import { describe, expect, it } from 'vitest';
import {
  MAX_MANUAL_ORDER_ID_CHARS,
  MAX_MANUAL_ORDER_IDS,
  MAX_MANUAL_ORDER_STORAGE_CHARS,
  parseManualOrderStorage,
  sanitizeManualOrderIds,
} from './manualOrder';

describe('manual order storage helpers', () => {
  it('sanitizes ids by trimming, deduplicating, and removing invalid values', () => {
    const sanitized = sanitizeManualOrderIds(['  m-1  ', '', 'm-2', 'm-1', 42, null]);
    expect(sanitized).toEqual(['m-1', 'm-2']);
  });

  it('clamps id length and count', () => {
    const longId = 'x'.repeat(MAX_MANUAL_ORDER_ID_CHARS + 30);
    const many = Array.from({ length: MAX_MANUAL_ORDER_IDS + 10 }, (_, index) => `id-${index}`);
    const sanitized = sanitizeManualOrderIds([longId, ...many]);

    expect(sanitized.length).toBe(MAX_MANUAL_ORDER_IDS);
    expect(sanitized[0]).toBe('x'.repeat(MAX_MANUAL_ORDER_ID_CHARS));
  });

  it('parses storage payloads safely', () => {
    expect(parseManualOrderStorage(null)).toEqual([]);
    expect(parseManualOrderStorage('invalid-json')).toEqual([]);
    expect(parseManualOrderStorage('{"not":"array"}')).toEqual([]);
    expect(parseManualOrderStorage(JSON.stringify(['m-1', 'm-2']))).toEqual(['m-1', 'm-2']);
  });

  it('rejects oversized storage payloads', () => {
    const oversized = 'x'.repeat(MAX_MANUAL_ORDER_STORAGE_CHARS + 1);
    expect(parseManualOrderStorage(oversized)).toEqual([]);
  });
});
