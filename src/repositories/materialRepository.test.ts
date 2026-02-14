import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Material } from '../types/material';

vi.mock('../utils/storage', () => ({
  loadMaterials: vi.fn(),
  saveMaterials: vi.fn(),
}));

import { loadMaterials, saveMaterials } from '../utils/storage';
import { createMaterialRepository } from './materialRepository';

const loadMaterialsMock = vi.mocked(loadMaterials);
const saveMaterialsMock = vi.mocked(saveMaterials);

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

describe('materialRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadMaterialsMock.mockReturnValue([]);
    saveMaterialsMock.mockReturnValue(true);
  });

  it('falls back to local repository when API URL is not set', async () => {
    const localMaterials = [makeMaterial({ id: 'local-1' })];
    loadMaterialsMock.mockReturnValue(localMaterials);

    const repository = createMaterialRepository({ apiUrl: '' });

    expect(repository.source).toBe('local');
    expect(repository.loadAll()).toEqual(localMaterials);
    const result = await repository.saveAll(localMaterials);
    expect(result).toEqual({ ok: true, remoteSynced: null });
    expect(saveMaterialsMock).toHaveBeenCalledWith(localMaterials);
  });

  it('hydrates from remote API and caches locally when configured', async () => {
    const remoteMaterials = [makeMaterial({ id: 'remote-1', name: 'Remote Material' })];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe('https://api.example.com/materials');
      return new Response(JSON.stringify({ materials: remoteMaterials }), { status: 200 });
    }) as unknown as typeof fetch;

    const repository = createMaterialRepository({ apiUrl: 'https://api.example.com', fetchImpl });

    const hydrated = await repository.loadFromRemote?.();

    expect(repository.source).toBe('http+local-fallback');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(hydrated).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'remote-1' })]));
    expect(saveMaterialsMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'remote-1' })])
    );
  });

  it('returns success when remote save fails but local save succeeds', async () => {
    const fetchImpl = vi.fn(async () => new Response('upstream failure', { status: 500 })) as unknown as typeof fetch;
    const materials = [makeMaterial({ id: 'fallback-1' })];
    const repository = createMaterialRepository({ apiUrl: 'https://api.example.com', fetchImpl });

    const result = await repository.saveAll(materials);

    expect(result).toEqual({ ok: true, remoteSynced: false });
    expect(saveMaterialsMock).toHaveBeenCalledWith(materials);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns failure when local save fails even with API enabled', async () => {
    saveMaterialsMock.mockReturnValue(false);
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch;
    const materials = [makeMaterial({ id: 'local-fail-1' })];
    const repository = createMaterialRepository({ apiUrl: 'https://api.example.com', fetchImpl });

    const result = await repository.saveAll(materials);

    expect(result).toEqual({ ok: false, remoteSynced: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
