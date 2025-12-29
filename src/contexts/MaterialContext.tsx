import React, { createContext, useState, useContext } from 'react';
import { saveMaterials, loadMaterials } from '../utils/storage';
import type { Material } from '../types/material';

interface MaterialContextType {
  materials: Material[];
  selectedMaterial: Material | null;
  addMaterial: (material: Material) => void;
  updateMaterial: (materialToUpdate: Material) => void; // Declare the updateMaterial function
  // removeMaterial: (id: string) => void;
  deleteMaterial: (id: string) => void;
  selectMaterial: (id: string) => void;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export const MaterialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>(loadMaterials());
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const addMaterial = (material: Material) => {
    setMaterials((prevMaterials) => {
      const updatedMaterials = [...prevMaterials, material];
      saveMaterials(updatedMaterials);
      return updatedMaterials;
    });
  };

  const updateMaterial = (materialToUpdate: Material) => {
    setMaterials((prevMaterials) => {
      const updatedMaterials = prevMaterials.map((material) => 
        material.id === materialToUpdate.id ? materialToUpdate : material
      );
      saveMaterials(updatedMaterials); // Persist the updated materials array
      return updatedMaterials;
    });
    setSelectedMaterial((prev) => (prev?.id === materialToUpdate.id ? materialToUpdate : prev));
  };

  const removeMaterial = (id: string) => {
    setMaterials((prevMaterials) => {
      const updatedMaterials = prevMaterials.filter((material) => material.id !== id);
      saveMaterials(updatedMaterials);
      return updatedMaterials;
    });
    setSelectedMaterial((prev) => (prev?.id === id ? null : prev));
  };

  const selectMaterial = (id: string) => {
    const material = materials.find((material) => material.id === id) || null;
    setSelectedMaterial(material);
  };

  const deleteMaterial = removeMaterial;

  return (
    // <MaterialContext.Provider value={{ materials, selectedMaterial, addMaterial, updateMaterial, removeMaterial, selectMaterial, deleteMaterial }}>
    <MaterialContext.Provider value={{ materials, selectedMaterial, addMaterial, updateMaterial, deleteMaterial, selectMaterial }}>
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