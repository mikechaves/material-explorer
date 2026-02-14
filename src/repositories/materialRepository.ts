import type { Material } from '../types/material';
import { getLocalStorageItem } from '../utils/localStorage';
import { loadMaterials, MATERIALS_STORAGE_KEY, saveMaterials } from '../utils/storage';
import { normalizeMaterial } from '../utils/material';
import { emitTelemetryEvent } from '../utils/telemetry';

export type MaterialSaveResult = {
  ok: boolean;
  remoteSynced: boolean | null;
};

export interface MaterialRepository {
  loadAll: () => Material[];
  saveAll: (materials: Material[]) => Promise<MaterialSaveResult>;
  loadFromRemote?: () => Promise<Material[] | null>;
  source: 'local' | 'http+local-fallback';
  scope: string | null;
}

type CreateMaterialRepositoryOptions = {
  apiUrl?: string;
  fetchImpl?: typeof fetch;
  userScope?: string;
  authToken?: string;
  authTokenHeader?: string;
};

const REQUEST_TIMEOUT_MS = 5000;
const USER_SCOPE_STORAGE_KEY = 'materialExplorerUserScope';
const AUTH_TOKEN_STORAGE_KEY = 'materialExplorerAuthToken';
const DEFAULT_AUTH_TOKEN_HEADER = 'Authorization';

function resolveApiBaseUrl(rawApiUrl: string | undefined): string | null {
  const trimmed = rawApiUrl?.trim();
  if (!trimmed) return null;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function resolveUserScope(rawUserScope: string | undefined): string | null {
  const trimmed = rawUserScope?.trim();
  if (trimmed) return trimmed;
  const localValue = getLocalStorageItem(USER_SCOPE_STORAGE_KEY)?.trim();
  return localValue || null;
}

function resolveAuthToken(rawAuthToken: string | undefined): string | null {
  const trimmed = rawAuthToken?.trim();
  if (trimmed) return trimmed;
  const localValue = getLocalStorageItem(AUTH_TOKEN_STORAGE_KEY)?.trim();
  return localValue || null;
}

function resolveStorageKey(scope: string | null): string {
  return scope ? `${MATERIALS_STORAGE_KEY}:${scope}` : MATERIALS_STORAGE_KEY;
}

function createLocalMaterialRepository(storageKey: string, scope: string | null): MaterialRepository {
  return {
    source: 'local',
    scope,
    loadAll: () => loadMaterials(storageKey),
    saveAll: async (materials) => {
      const ok = saveMaterials(materials, storageKey);
      if (!ok) {
        emitTelemetryEvent('materials.save.local_failed', { scope, source: 'local' }, 'error');
      }
      return { ok, remoteSynced: null };
    },
  };
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
  const scope = resolveUserScope(options.userScope ?? import.meta.env.VITE_MATERIALS_USER_SCOPE);
  const storageKey = resolveStorageKey(scope);
  const fallbackRepository = createLocalMaterialRepository(storageKey, scope);

  const baseUrl = resolveApiBaseUrl(options.apiUrl ?? import.meta.env.VITE_MATERIALS_API_URL);
  if (!baseUrl) return fallbackRepository;

  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);
  if (!fetchImpl) return fallbackRepository;
  const authToken = resolveAuthToken(options.authToken ?? import.meta.env.VITE_MATERIALS_AUTH_TOKEN);
  const authTokenHeader = options.authTokenHeader ?? DEFAULT_AUTH_TOKEN_HEADER;

  const materialsUrl = new URL(`${baseUrl}/materials`);
  if (scope) materialsUrl.searchParams.set('scope', scope);

  const requestHeaders = (() => {
    const headers: Record<string, string> = {};
    if (scope) headers['X-Material-Scope'] = scope;
    if (authToken) {
      headers[authTokenHeader] = authTokenHeader.toLowerCase() === 'authorization' ? `Bearer ${authToken}` : authToken;
    }
    return headers;
  })();

  return {
    source: 'http+local-fallback',
    scope,
    loadAll: () => loadMaterials(storageKey),
    saveAll: async (materials) => {
      const localSaved = saveMaterials(materials, storageKey);
      if (!localSaved) {
        emitTelemetryEvent('materials.save.local_failed', { scope, source: 'http+local-fallback' }, 'error');
        return { ok: false, remoteSynced: false };
      }

      try {
        const response = await fetchWithTimeout(fetchImpl, materialsUrl.toString(), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...requestHeaders },
          body: JSON.stringify({ version: 1, exportedAt: Date.now(), materials }),
        });
        if (!response.ok) {
          console.warn(`Remote material sync failed with status ${response.status}; using local fallback.`);
          emitTelemetryEvent(
            'materials.save.remote_failed',
            { status: response.status, scope, source: 'http+local-fallback' },
            'warn'
          );
          return { ok: true, remoteSynced: false };
        }
        return { ok: true, remoteSynced: true };
      } catch (error) {
        console.warn('Remote material sync failed; using local fallback.', error);
        emitTelemetryEvent(
          'materials.save.remote_exception',
          { scope, source: 'http+local-fallback', message: error instanceof Error ? error.message : String(error) },
          'warn'
        );
        return { ok: true, remoteSynced: false };
      }
    },
    loadFromRemote: async () => {
      try {
        const response = await fetchWithTimeout(fetchImpl, materialsUrl.toString(), {
          method: 'GET',
          headers: requestHeaders,
        });
        if (!response.ok) {
          emitTelemetryEvent(
            'materials.load.remote_failed',
            { status: response.status, scope, source: 'http+local-fallback' },
            'warn'
          );
          return null;
        }
        const parsed = (await response.json()) as unknown;
        const normalized = normalizeMaterialList(parsed);
        if (!normalized) {
          emitTelemetryEvent('materials.load.remote_invalid_payload', { scope, source: 'http+local-fallback' }, 'warn');
          return null;
        }
        if (!saveMaterials(normalized, storageKey)) {
          console.warn('Fetched remote materials but failed to cache them locally.');
          emitTelemetryEvent('materials.load.local_cache_failed', { scope, source: 'http+local-fallback' }, 'warn');
        }
        return normalized;
      } catch (error) {
        console.warn('Remote material fetch failed; using local fallback.', error);
        emitTelemetryEvent(
          'materials.load.remote_exception',
          { scope, source: 'http+local-fallback', message: error instanceof Error ? error.message : String(error) },
          'warn'
        );
        return null;
      }
    },
  };
}

export const localMaterialRepository: MaterialRepository = createLocalMaterialRepository(MATERIALS_STORAGE_KEY, null);
export const materialRepository = createMaterialRepository();
