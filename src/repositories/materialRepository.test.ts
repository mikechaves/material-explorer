import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Material } from '../types/material';

vi.mock('../utils/storage', () => ({
  MATERIALS_STORAGE_KEY: 'materials',
  loadMaterials: vi.fn(),
  saveMaterials: vi.fn(),
}));

vi.mock('../utils/telemetry', () => ({
  emitTelemetryEvent: vi.fn(),
}));

import { loadMaterials, saveMaterials } from '../utils/storage';
import { emitTelemetryEvent } from '../utils/telemetry';
import { createMaterialRepository } from './materialRepository';

const loadMaterialsMock = vi.mocked(loadMaterials);
const saveMaterialsMock = vi.mocked(saveMaterials);
const emitTelemetryEventMock = vi.mocked(emitTelemetryEvent);

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
    emitTelemetryEventMock.mockReset();
  });

  it('falls back to local repository when API URL is not set', async () => {
    const localMaterials = [makeMaterial({ id: 'local-1' })];
    loadMaterialsMock.mockReturnValue(localMaterials);

    const repository = createMaterialRepository({ apiUrl: '' });

    expect(repository.source).toBe('local');
    expect(repository.scope).toBe(null);
    expect(repository.loadAll()).toEqual(localMaterials);
    const result = await repository.saveAll(localMaterials);
    expect(result).toEqual({ ok: true, remoteSynced: null });
    expect(saveMaterialsMock).toHaveBeenCalledWith(localMaterials, 'materials');
  });

  it('hydrates from remote API and caches locally when configured', async () => {
    const remoteMaterials = [makeMaterial({ id: 'remote-1', name: 'Remote Material' })];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://api.example.com/materials?scope=user-123');
      expect(init?.headers).toEqual({
        Authorization: 'Bearer test-token',
        'X-Material-Scope': 'user-123',
      });
      return new Response(JSON.stringify({ materials: remoteMaterials }), { status: 200 });
    }) as unknown as typeof fetch;

    const repository = createMaterialRepository({
      apiUrl: 'https://api.example.com',
      fetchImpl,
      userScope: 'user-123',
      authToken: 'test-token',
    });

    const hydrated = await repository.loadFromRemote?.();

    expect(repository.source).toBe('http+local-fallback');
    expect(repository.scope).toBe('user-123');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(hydrated).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'remote-1' })]));
    expect(saveMaterialsMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'remote-1' })]),
      'materials:user-123'
    );
  });

  it('returns success when remote save fails but local save succeeds', async () => {
    const fetchImpl = vi.fn(async () => new Response('upstream failure', { status: 500 })) as unknown as typeof fetch;
    const materials = [makeMaterial({ id: 'fallback-1' })];
    const repository = createMaterialRepository({ apiUrl: 'https://api.example.com', fetchImpl, userScope: 'user-1' });

    const result = await repository.saveAll(materials);

    expect(result).toEqual({ ok: true, remoteSynced: false });
    expect(saveMaterialsMock).toHaveBeenCalledWith(materials, 'materials:user-1');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(emitTelemetryEventMock).toHaveBeenCalledWith(
      'materials.save.remote_failed',
      { status: 500, scope: 'user-1', source: 'http+local-fallback' },
      'warn'
    );
  });

  it('returns failure when local save fails even with API enabled', async () => {
    saveMaterialsMock.mockReturnValue(false);
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch;
    const materials = [makeMaterial({ id: 'local-fail-1' })];
    const repository = createMaterialRepository({ apiUrl: 'https://api.example.com', fetchImpl, userScope: 'team-42' });

    const result = await repository.saveAll(materials);

    expect(result).toEqual({ ok: false, remoteSynced: false });
    expect(saveMaterialsMock).toHaveBeenCalledWith(materials, 'materials:team-42');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(emitTelemetryEventMock).toHaveBeenCalledWith(
      'materials.save.local_failed',
      { scope: 'team-42', source: 'http+local-fallback' },
      'error'
    );
  });

  it('uses scoped local storage key when API is disabled', async () => {
    const repository = createMaterialRepository({ apiUrl: '', userScope: 'alice' });
    const materials = [makeMaterial({ id: 'alice-1' })];

    repository.loadAll();
    await repository.saveAll(materials);

    expect(repository.source).toBe('local');
    expect(repository.scope).toBe('alice');
    expect(loadMaterialsMock).toHaveBeenCalledWith('materials:alice');
    expect(saveMaterialsMock).toHaveBeenCalledWith(materials, 'materials:alice');
  });

  it('emits telemetry when remote load responds with non-200 status', async () => {
    const fetchImpl = vi.fn(async () => new Response('bad gateway', { status: 502 })) as unknown as typeof fetch;
    const repository = createMaterialRepository({ apiUrl: 'https://api.example.com', fetchImpl, userScope: 'user-9' });

    const result = await repository.loadFromRemote?.();

    expect(result).toBeNull();
    expect(emitTelemetryEventMock).toHaveBeenCalledWith(
      'materials.load.remote_failed',
      { status: 502, scope: 'user-9', source: 'http+local-fallback' },
      'warn'
    );
  });

  it('emits telemetry when remote load payload is invalid', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ foo: 'bar' }), { status: 200 })
    ) as unknown as typeof fetch;
    const repository = createMaterialRepository({ apiUrl: 'https://api.example.com', fetchImpl, userScope: 'user-4' });

    const result = await repository.loadFromRemote?.();

    expect(result).toBeNull();
    expect(emitTelemetryEventMock).toHaveBeenCalledWith(
      'materials.load.remote_invalid_payload',
      { scope: 'user-4', source: 'http+local-fallback' },
      'warn'
    );
  });
});
