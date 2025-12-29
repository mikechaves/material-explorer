import type { Material, MaterialDraft } from '../types/material';
import { v4 as uuidv4 } from 'uuid';

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function isHexColor(s: unknown): s is string {
  return typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
}

export function normalizeMaterial(input: unknown, now: number = Date.now()): Material | null {
  if (!input || typeof input !== 'object') return null;
  const m = input as Record<string, unknown>;

  const id = typeof m.id === 'string' ? m.id : '';
  if (!id) return null;

  const name = typeof m.name === 'string' && m.name.trim() ? m.name.trim() : 'Untitled';
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

  const createdAt =
    typeof m.createdAt === 'number' && Number.isFinite(m.createdAt) ? (m.createdAt as number) : now;
  const updatedAt =
    typeof m.updatedAt === 'number' && Number.isFinite(m.updatedAt) ? (m.updatedAt as number) : undefined;

  return {
    id,
    name,
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
    createdAt,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function createMaterialFromDraft(draft: MaterialDraft, now: number = Date.now()): Material {
  const baseName = (draft.name ?? '').trim() || 'Untitled';
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

  return {
    id: draft.id ?? uuidv4(),
    name: baseName,
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


