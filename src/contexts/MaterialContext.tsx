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
  selectedMaterial: Material | null; // Add selectedMaterial to the context type
  addMaterial: (material: Material) => void;
  removeMaterial: (id: string) => void;
  selectMaterial: (id: string) => void; // Function to select a material for editing
  deleteMaterial: (id: string) => void; // Alias for removeMaterial with additional logic
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export const MaterialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>(loadMaterials()); // Load materials from storage
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null); // State to keep track of the selected material

  const addMaterial = (material: Material) => {
    setMaterials((prevMaterials) => {
      const updatedMaterials = [...prevMaterials, material];
      saveMaterials(updatedMaterials); // Persist changes
      return updatedMaterials;
    });
  };

  const removeMaterial = (id: string) => {
    setMaterials((prevMaterials) => {
      const updatedMaterials = prevMaterials.filter((material) => material.id !== id);
      saveMaterials(updatedMaterials); // Persist changes
      // Deselect the material if it's being deleted
      if (selectedMaterial?.id === id) {
        setSelectedMaterial(null);
      }
      return updatedMaterials;
    });
  };

  const selectMaterial = (id: string) => {
    const material = materials.find(material => material.id === id) || null;
    setSelectedMaterial(material);
  };

  const deleteMaterial = removeMaterial; // You can directly use removeMaterial or add additional logic if needed

  return (
    <MaterialContext.Provider value={{ materials, selectedMaterial, addMaterial, removeMaterial, selectMaterial, deleteMaterial }}>
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
