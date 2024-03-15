// src/contexts/MaterialContext.tsx

import React, { createContext, useState, useContext } from 'react';

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
  const [materials, setMaterials] = useState<Material[]>([]);

  const addMaterial = (material: Material) => {
    setMaterials((prevMaterials) => [...prevMaterials, material]);
  };

  const removeMaterial = (id: string) => {
    setMaterials((prevMaterials) => prevMaterials.filter((material) => material.id !== id));
  };

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
