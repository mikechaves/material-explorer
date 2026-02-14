import type { Material } from '../types/material';
import { loadMaterials, saveMaterials } from '../utils/storage';
import { normalizeMaterial } from '../utils/material';

export type MaterialSaveResult = {
  ok: boolean;
  remoteSynced: boolean | null;
};

export interface MaterialRepository {
  loadAll: () => Material[];
  saveAll: (materials: Material[]) => Promise<MaterialSaveResult>;
  loadFromRemote?: () => Promise<Material[] | null>;
  source: 'local' | 'http+local-fallback';
}

export const localMaterialRepository: MaterialRepository = {
  source: 'local',
  loadAll: loadMaterials,
  saveAll: async (materials) => ({ ok: saveMaterials(materials), remoteSynced: null }),
};

type CreateMaterialRepositoryOptions = {
  apiUrl?: string;
  fetchImpl?: typeof fetch;
};

const REQUEST_TIMEOUT_MS = 5000;

function resolveApiBaseUrl(rawApiUrl: string | undefined): string | null {
  const trimmed = rawApiUrl?.trim();
  if (!trimmed) return null;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function normalizeMaterialList(payload: unknown): Material[] | null {
  const maybeRecord = payload as { materials?: unknown } | null;
  const rawMaterials = Array.isArray(payload)
    ? payload
    : maybeRecord && typeof maybeRecord === 'object'
      ? maybeRecord.materials
      : null;
  if (!Array.isArray(rawMaterials)) return null;
  const now = Date.now();
  return rawMaterials
    .map((entry) => normalizeMaterial(entry, now))
    .filter((entry): entry is Material => entry !== null);
}

async function fetchWithTimeout(fetchImpl: typeof fetch, input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function createMaterialRepository(options: CreateMaterialRepositoryOptions = {}): MaterialRepository {
  const baseUrl = resolveApiBaseUrl(options.apiUrl ?? import.meta.env.VITE_MATERIALS_API_URL);
  if (!baseUrl) return localMaterialRepository;

  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);
  if (!fetchImpl) return localMaterialRepository;
  const materialsUrl = `${baseUrl}/materials`;

  return {
    source: 'http+local-fallback',
    loadAll: loadMaterials,
    saveAll: async (materials) => {
      const localSaved = saveMaterials(materials);
      if (!localSaved) return { ok: false, remoteSynced: false };

      try {
        const response = await fetchWithTimeout(fetchImpl, materialsUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version: 1, exportedAt: Date.now(), materials }),
        });
        if (!response.ok) {
          console.warn(`Remote material sync failed with status ${response.status}; using local fallback.`);
          return { ok: true, remoteSynced: false };
        }
        return { ok: true, remoteSynced: true };
      } catch (error) {
        console.warn('Remote material sync failed; using local fallback.', error);
        return { ok: true, remoteSynced: false };
      }
    },
    loadFromRemote: async () => {
      try {
        const response = await fetchWithTimeout(fetchImpl, materialsUrl, { method: 'GET' });
        if (!response.ok) return null;
        const parsed = (await response.json()) as unknown;
        const normalized = normalizeMaterialList(parsed);
        if (!normalized) return null;
        if (!saveMaterials(normalized)) {
          console.warn('Fetched remote materials but failed to cache them locally.');
        }
        return normalized;
      } catch (error) {
        console.warn('Remote material fetch failed; using local fallback.', error);
        return null;
      }
    },
  };
}

export const materialRepository = createMaterialRepository();
