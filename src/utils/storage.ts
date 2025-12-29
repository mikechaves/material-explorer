import type { Material } from '../types/material';

const MATERIALS_STORAGE_KEY = 'materials';

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function isHexColor(s: unknown): s is string {
  return typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
}

function normalizeMaterial(input: unknown): Material | null {
  if (!input || typeof input !== 'object') return null;
  const m = input as Record<string, unknown>;

  const id = typeof m.id === 'string' ? m.id : '';
  if (!id) return null;

  const color = isHexColor(m.color) ? (m.color as string) : '#FFFFFF';
  const metalness = clamp01(typeof m.metalness === 'number' ? m.metalness : Number(m.metalness));
  const roughness = clamp01(typeof m.roughness === 'number' ? m.roughness : Number(m.roughness));

  return { id, color, metalness, roughness };
}

export const saveMaterials = (materials: Material[]) => {
  try {
    if (typeof window === 'undefined') return;
    const serializedMaterials = JSON.stringify(materials);
    window.localStorage.setItem(MATERIALS_STORAGE_KEY, serializedMaterials);
  } catch (error) {
    console.error('Failed to save materials:', error);
  }
};

export const loadMaterials = (): Material[] => {
  try {
    if (typeof window === 'undefined') return [];
    const serializedMaterials = window.localStorage.getItem(MATERIALS_STORAGE_KEY);
    if (!serializedMaterials) return [];
    const parsed = JSON.parse(serializedMaterials) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeMaterial).filter((m): m is Material => m !== null);
  } catch (error) {
    console.error('Failed to load materials:', error);
    return [];
  }
};

