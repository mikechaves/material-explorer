import type { Material } from '../types/material';
import { normalizeMaterial } from './material';

const MATERIALS_STORAGE_KEY = 'materials';

export const saveMaterials = (materials: Material[]): boolean => {
  try {
    if (typeof window === 'undefined') return true;
    const serializedMaterials = JSON.stringify(materials);
    window.localStorage.setItem(MATERIALS_STORAGE_KEY, serializedMaterials);
    return true;
  } catch (error) {
    console.error('Failed to save materials:', error);
    return false;
  }
};

export const loadMaterials = (): Material[] => {
  try {
    if (typeof window === 'undefined') return [];
    const serializedMaterials = window.localStorage.getItem(MATERIALS_STORAGE_KEY);
    if (!serializedMaterials) return [];
    const parsed = JSON.parse(serializedMaterials) as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.map((m) => normalizeMaterial(m, now)).filter((m): m is Material => m !== null);
  } catch (error) {
    console.error('Failed to load materials:', error);
    return [];
  }
};
