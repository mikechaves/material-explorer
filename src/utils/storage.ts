interface Material {
    id: string;
    color: string;
    metalness: number;
    roughness: number;
  }
  
  const MATERIALS_STORAGE_KEY = 'materials';
  
  export const saveMaterials = (materials: Material[]) => {
    try {
      const serializedMaterials = JSON.stringify(materials);
      localStorage.setItem(MATERIALS_STORAGE_KEY, serializedMaterials);
    } catch (error) {
      console.error("Failed to save materials:", error);
    }
  };
  
  export const loadMaterials = (): Material[] => {
    try {
      const serializedMaterials = localStorage.getItem(MATERIALS_STORAGE_KEY);
      return serializedMaterials ? JSON.parse(serializedMaterials) : [];
    } catch (error) {
      console.error("Failed to load materials:", error);
      return [];
    }
  };
  
