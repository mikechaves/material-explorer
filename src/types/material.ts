export interface Material {
  id: string;
  name: string;
  color: string;
  metalness: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  ior: number;
  opacity: number;
  baseColorMap?: string; // data URL
  normalMap?: string; // data URL
  normalScale?: number; // 0..2
  createdAt: number;
  updatedAt?: number;
}

export type MaterialDraft = Omit<Material, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
};


