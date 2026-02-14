import type { Material } from '../types/material';
import { loadMaterials, saveMaterials } from '../utils/storage';

export interface MaterialRepository {
  loadAll: () => Material[];
  saveAll: (materials: Material[]) => boolean;
}

export const localMaterialRepository: MaterialRepository = {
  loadAll: loadMaterials,
  saveAll: saveMaterials,
};
