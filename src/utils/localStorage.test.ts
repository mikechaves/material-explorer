import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearLocalStorage, getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from './localStorage';

describe('localStorage helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads and writes successfully when storage is available', () => {
    const store = new Map<string, string>();
    const localStorage = {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(() => {
        store.clear();
      }),
    };
    vi.stubGlobal('window', { localStorage });

    expect(setLocalStorageItem('local-storage-test', 'value')).toBe(true);
    expect(getLocalStorageItem('local-storage-test')).toBe('value');
    expect(removeLocalStorageItem('local-storage-test')).toBe(true);
  });

  it('returns safe defaults when storage operations throw', () => {
    const localStorage = {
      getItem: vi.fn(() => {
        throw new Error('read blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('write blocked');
      }),
      removeItem: vi.fn(() => {
        throw new Error('remove blocked');
      }),
      clear: vi.fn(() => {
        throw new Error('clear blocked');
      }),
    };
    vi.stubGlobal('window', { localStorage });

    expect(getLocalStorageItem('blocked')).toBeNull();
    expect(setLocalStorageItem('blocked', 'value')).toBe(false);
    expect(removeLocalStorageItem('blocked')).toBe(false);
    expect(clearLocalStorage()).toBe(false);
  });
});
