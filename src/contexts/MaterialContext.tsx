import React, { createContext, useState, useContext } from 'react';
import { saveMaterials, loadMaterials } from '../utils/storage';

interface Material {
  id: string;
  color: string;
  metalness: number;
  roughness: number;
}

interface MaterialContextType {
  materials: Material[];
  addMaterial: (material: Material) => void;
  removeMaterial: (id: string) => void;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);
  export const MaterialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [materials, setMaterials] = useState<Material[]>(loadMaterials()); // Load materials when the provider mounts

    const addMaterial = (material: Material) => {
      setMaterials((prevMaterials) => {
        const updatedMaterials = [...prevMaterials, material];
        saveMaterials(updatedMaterials); // Save every time materials change
        return updatedMaterials;
      });
    };

    const removeMaterial = (id: string) => {
      setMaterials((prevMaterials) => {
        const updatedMaterials = prevMaterials.filter((material) => material.id !== id);
        saveMaterials(updatedMaterials); // Save every time materials change
        return updatedMaterials;
      });
    };
// export const MaterialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [materials, setMaterials] = useState<Material[]>([]);

  // const addMaterial = (material: Material) => {
  //   setMaterials((prevMaterials) => [...prevMaterials, material]);
  // };

  // const removeMaterial = (id: string) => {
  //   setMaterials((prevMaterials) => prevMaterials.filter((material) => material.id !== id));
  // };

  return (
    <MaterialContext.Provider value={{ materials, addMaterial, removeMaterial }}>
      {children}
    </MaterialContext.Provider>
  );
};

export const useMaterials = () => {
  const context = useContext(MaterialContext);
  if (context === undefined) {
    throw new Error('useMaterials must be used within a MaterialProvider');
  }
  return context;
};
