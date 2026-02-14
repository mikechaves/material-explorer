import type { Material, MaterialDraft } from '../types/material';
import { v4 as uuidv4 } from 'uuid';

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function isHexColor(s: unknown): s is string {
  return typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
}

export const DEFAULT_MATERIAL_DRAFT: MaterialDraft = {
  name: 'Untitled',
  favorite: false,
  tags: [],
  color: '#FFFFFF',
  metalness: 0.5,
  roughness: 0.5,
  emissive: '#000000',
  emissiveIntensity: 0,
  clearcoat: 0,
  clearcoatRoughness: 0.03,
  transmission: 0,
  ior: 1.5,
  opacity: 1,
  normalScale: 1,
  aoIntensity: 1,
  alphaTest: 0,
  repeatX: 1,
  repeatY: 1,
};

function asFiniteNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asOptionalDataUrl(value: unknown, fallback?: string): string | undefined {
  if (typeof value === 'string' && value) return value;
  return fallback;
}

export function coerceMaterialDraft(input: unknown, base: MaterialDraft = DEFAULT_MATERIAL_DRAFT): MaterialDraft {
  const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const fallback = { ...DEFAULT_MATERIAL_DRAFT, ...base };
  const tags = Array.isArray(src.tags)
    ? (src.tags
        .filter((t) => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean) as string[])
    : (fallback.tags ?? []);

  const draft: MaterialDraft = {
    ...fallback,
    id: typeof src.id === 'string' && src.id ? src.id : fallback.id,
    name: typeof src.name === 'string' && src.name.trim() ? src.name.trim() : fallback.name,
    favorite: typeof src.favorite === 'boolean' ? src.favorite : !!fallback.favorite,
    tags,
    color: isHexColor(src.color) ? src.color : fallback.color,
    metalness: clamp01(asFiniteNumber(src.metalness, fallback.metalness)),
    roughness: clamp01(asFiniteNumber(src.roughness, fallback.roughness)),
    emissive: isHexColor(src.emissive) ? src.emissive : fallback.emissive,
    emissiveIntensity: clamp01(asFiniteNumber(src.emissiveIntensity, fallback.emissiveIntensity)),
    clearcoat: clamp01(asFiniteNumber(src.clearcoat, fallback.clearcoat)),
    clearcoatRoughness: clamp01(asFiniteNumber(src.clearcoatRoughness, fallback.clearcoatRoughness)),
    transmission: clamp01(asFiniteNumber(src.transmission, fallback.transmission)),
    ior: Math.max(1, Math.min(2.5, asFiniteNumber(src.ior, fallback.ior))),
    opacity: clamp01(asFiniteNumber(src.opacity, fallback.opacity)),
    baseColorMap: asOptionalDataUrl(src.baseColorMap, fallback.baseColorMap),
    normalMap: asOptionalDataUrl(src.normalMap, fallback.normalMap),
    normalScale: Math.max(0, Math.min(2, asFiniteNumber(src.normalScale, fallback.normalScale ?? 1))),
    roughnessMap: asOptionalDataUrl(src.roughnessMap, fallback.roughnessMap),
    metalnessMap: asOptionalDataUrl(src.metalnessMap, fallback.metalnessMap),
    aoMap: asOptionalDataUrl(src.aoMap, fallback.aoMap),
    emissiveMap: asOptionalDataUrl(src.emissiveMap, fallback.emissiveMap),
    alphaMap: asOptionalDataUrl(src.alphaMap, fallback.alphaMap),
    aoIntensity: Math.max(0, Math.min(2, asFiniteNumber(src.aoIntensity, fallback.aoIntensity ?? 1))),
    alphaTest: Math.max(0, Math.min(1, asFiniteNumber(src.alphaTest, fallback.alphaTest ?? 0))),
    repeatX: Math.max(0.01, Math.min(20, asFiniteNumber(src.repeatX, fallback.repeatX ?? 1))),
    repeatY: Math.max(0.01, Math.min(20, asFiniteNumber(src.repeatY, fallback.repeatY ?? 1))),
    createdAt: typeof src.createdAt === 'number' && Number.isFinite(src.createdAt) ? src.createdAt : fallback.createdAt,
    updatedAt: typeof src.updatedAt === 'number' && Number.isFinite(src.updatedAt) ? src.updatedAt : fallback.updatedAt,
  };

  return draft;
}

export function normalizeMaterial(input: unknown, now: number = Date.now()): Material | null {
  if (!input || typeof input !== 'object') return null;
  const m = input as Record<string, unknown>;

  const id = typeof m.id === 'string' ? m.id : '';
  if (!id) return null;

  const name = typeof m.name === 'string' && m.name.trim() ? m.name.trim() : 'Untitled';
  const favorite = typeof m.favorite === 'boolean' ? m.favorite : false;
  const tags = Array.isArray(m.tags)
    ? (m.tags
        .filter((t) => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean) as string[])
    : [];
  const color = isHexColor(m.color) ? (m.color as string) : '#FFFFFF';

  const metalness = clamp01(typeof m.metalness === 'number' ? m.metalness : Number(m.metalness));
  const roughness = clamp01(typeof m.roughness === 'number' ? m.roughness : Number(m.roughness));

  const emissive = isHexColor(m.emissive) ? (m.emissive as string) : '#000000';
  const emissiveIntensity = clamp01(
    typeof m.emissiveIntensity === 'number' ? m.emissiveIntensity : Number(m.emissiveIntensity)
  );
  const clearcoat = clamp01(typeof m.clearcoat === 'number' ? m.clearcoat : Number(m.clearcoat));
  const clearcoatRoughness = clamp01(
    typeof m.clearcoatRoughness === 'number' ? m.clearcoatRoughness : Number(m.clearcoatRoughness)
  );
  const transmission = clamp01(typeof m.transmission === 'number' ? m.transmission : Number(m.transmission));
  const iorRaw = typeof m.ior === 'number' ? m.ior : Number(m.ior);
  const ior = Number.isFinite(iorRaw) ? Math.max(1, Math.min(2.5, iorRaw)) : 1.5;
  const opacity = clamp01(typeof m.opacity === 'number' ? m.opacity : Number(m.opacity));
  const baseColorMap = typeof m.baseColorMap === 'string' && m.baseColorMap ? m.baseColorMap : undefined;
  const normalMap = typeof m.normalMap === 'string' && m.normalMap ? m.normalMap : undefined;
  const normalScaleRaw = typeof m.normalScale === 'number' ? m.normalScale : Number(m.normalScale);
  const normalScale = Number.isFinite(normalScaleRaw) ? Math.max(0, Math.min(2, normalScaleRaw)) : 1;
  const roughnessMap = typeof m.roughnessMap === 'string' && m.roughnessMap ? m.roughnessMap : undefined;
  const metalnessMap = typeof m.metalnessMap === 'string' && m.metalnessMap ? m.metalnessMap : undefined;
  const aoMap = typeof m.aoMap === 'string' && m.aoMap ? m.aoMap : undefined;
  const emissiveMap = typeof m.emissiveMap === 'string' && m.emissiveMap ? m.emissiveMap : undefined;
  const alphaMap = typeof m.alphaMap === 'string' && m.alphaMap ? m.alphaMap : undefined;
  const aoIntensityRaw = typeof m.aoIntensity === 'number' ? m.aoIntensity : Number(m.aoIntensity);
  const aoIntensity = Number.isFinite(aoIntensityRaw) ? Math.max(0, Math.min(2, aoIntensityRaw)) : 1;
  const alphaTestRaw = typeof m.alphaTest === 'number' ? m.alphaTest : Number(m.alphaTest);
  const alphaTest = Number.isFinite(alphaTestRaw) ? Math.max(0, Math.min(1, alphaTestRaw)) : 0;
  const repeatXRaw = typeof m.repeatX === 'number' ? m.repeatX : Number(m.repeatX);
  const repeatYRaw = typeof m.repeatY === 'number' ? m.repeatY : Number(m.repeatY);
  const repeatX = Number.isFinite(repeatXRaw) ? Math.max(0.01, Math.min(20, repeatXRaw)) : 1;
  const repeatY = Number.isFinite(repeatYRaw) ? Math.max(0.01, Math.min(20, repeatYRaw)) : 1;

  const createdAt = typeof m.createdAt === 'number' && Number.isFinite(m.createdAt) ? (m.createdAt as number) : now;
  const updatedAt =
    typeof m.updatedAt === 'number' && Number.isFinite(m.updatedAt) ? (m.updatedAt as number) : undefined;

  return {
    id,
    name,
    ...(favorite ? { favorite } : {}),
    ...(tags.length ? { tags } : {}),
    color,
    metalness,
    roughness,
    emissive,
    emissiveIntensity,
    clearcoat,
    clearcoatRoughness,
    transmission,
    ior,
    opacity,
    ...(baseColorMap ? { baseColorMap } : {}),
    ...(normalMap ? { normalMap } : {}),
    ...(Number.isFinite(normalScaleRaw) ? { normalScale } : {}),
    ...(roughnessMap ? { roughnessMap } : {}),
    ...(metalnessMap ? { metalnessMap } : {}),
    ...(aoMap ? { aoMap } : {}),
    ...(emissiveMap ? { emissiveMap } : {}),
    ...(alphaMap ? { alphaMap } : {}),
    ...(Number.isFinite(aoIntensityRaw) ? { aoIntensity } : {}),
    ...(Number.isFinite(alphaTestRaw) ? { alphaTest } : {}),
    ...(Number.isFinite(repeatXRaw) ? { repeatX } : {}),
    ...(Number.isFinite(repeatYRaw) ? { repeatY } : {}),
    createdAt,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function createMaterialFromDraft(draft: MaterialDraft, now: number = Date.now()): Material {
  const baseName = (draft.name ?? '').trim() || 'Untitled';
  const favorite = !!draft.favorite;
  const tags = Array.isArray(draft.tags)
    ? Array.from(new Set(draft.tags.map((t) => String(t).trim()).filter(Boolean)))
    : [];
  const color = isHexColor(draft.color) ? draft.color : '#FFFFFF';
  const metalness = clamp01(draft.metalness);
  const roughness = clamp01(draft.roughness);
  const emissive = isHexColor(draft.emissive) ? draft.emissive : '#000000';
  const emissiveIntensity = clamp01(draft.emissiveIntensity);
  const clearcoat = clamp01(draft.clearcoat);
  const clearcoatRoughness = clamp01(draft.clearcoatRoughness);
  const transmission = clamp01(draft.transmission);
  const ior = Number.isFinite(draft.ior) ? Math.max(1, Math.min(2.5, draft.ior)) : 1.5;
  const opacity = clamp01(draft.opacity);
  const baseColorMap = typeof draft.baseColorMap === 'string' && draft.baseColorMap ? draft.baseColorMap : undefined;
  const normalMap = typeof draft.normalMap === 'string' && draft.normalMap ? draft.normalMap : undefined;
  const normalScaleRaw = draft.normalScale ?? 1;
  const normalScale = Number.isFinite(normalScaleRaw) ? Math.max(0, Math.min(2, normalScaleRaw)) : 1;
  const roughnessMap = typeof draft.roughnessMap === 'string' && draft.roughnessMap ? draft.roughnessMap : undefined;
  const metalnessMap = typeof draft.metalnessMap === 'string' && draft.metalnessMap ? draft.metalnessMap : undefined;
  const aoMap = typeof draft.aoMap === 'string' && draft.aoMap ? draft.aoMap : undefined;
  const emissiveMap = typeof draft.emissiveMap === 'string' && draft.emissiveMap ? draft.emissiveMap : undefined;
  const alphaMap = typeof draft.alphaMap === 'string' && draft.alphaMap ? draft.alphaMap : undefined;
  const aoIntensityRaw = draft.aoIntensity ?? 1;
  const aoIntensity = Number.isFinite(aoIntensityRaw) ? Math.max(0, Math.min(2, aoIntensityRaw)) : 1;
  const alphaTestRaw = draft.alphaTest ?? 0;
  const alphaTest = Number.isFinite(alphaTestRaw) ? Math.max(0, Math.min(1, alphaTestRaw)) : 0;
  const repeatXRaw = draft.repeatX ?? 1;
  const repeatYRaw = draft.repeatY ?? 1;
  const repeatX = Number.isFinite(repeatXRaw) ? Math.max(0.01, Math.min(20, repeatXRaw)) : 1;
  const repeatY = Number.isFinite(repeatYRaw) ? Math.max(0.01, Math.min(20, repeatYRaw)) : 1;

  return {
    id: draft.id ?? uuidv4(),
    name: baseName,
    ...(favorite ? { favorite } : {}),
    ...(tags.length ? { tags } : {}),
    color,
    metalness,
    roughness,
    emissive,
    emissiveIntensity,
    clearcoat,
    clearcoatRoughness,
    transmission,
    ior,
    opacity,
    ...(baseColorMap ? { baseColorMap } : {}),
    ...(normalMap ? { normalMap } : {}),
    ...(Number.isFinite(draft.normalScale ?? NaN) ? { normalScale } : {}),
    ...(roughnessMap ? { roughnessMap } : {}),
    ...(metalnessMap ? { metalnessMap } : {}),
    ...(aoMap ? { aoMap } : {}),
    ...(emissiveMap ? { emissiveMap } : {}),
    ...(alphaMap ? { alphaMap } : {}),
    ...(Number.isFinite(draft.aoIntensity ?? NaN) ? { aoIntensity } : {}),
    ...(Number.isFinite(draft.alphaTest ?? NaN) ? { alphaTest } : {}),
    ...(Number.isFinite(draft.repeatX ?? NaN) ? { repeatX } : {}),
    ...(Number.isFinite(draft.repeatY ?? NaN) ? { repeatY } : {}),
    createdAt: draft.createdAt ?? now,
    updatedAt: draft.updatedAt ?? now,
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
