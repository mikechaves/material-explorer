import type { Material } from '../types/material';
import { normalizeMaterial } from './material';

export const MATERIALS_STORAGE_KEY = 'materials';

export const saveMaterials = (materials: Material[], storageKey = MATERIALS_STORAGE_KEY): boolean => {
  try {
    if (typeof window === 'undefined') return true;
    const serializedMaterials = JSON.stringify(materials);
    window.localStorage.setItem(storageKey, serializedMaterials);
    return true;
  } catch (error) {
    console.error('Failed to save materials:', error);
    return false;
  }
};

export const loadMaterials = (storageKey = MATERIALS_STORAGE_KEY): Material[] => {
  try {
    if (typeof window === 'undefined') return [];
    const serializedMaterials = window.localStorage.getItem(storageKey);
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
