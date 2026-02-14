import React, { createContext, useState, useContext } from 'react';
import { saveMaterials, loadMaterials } from '../utils/storage';
import type { Material } from '../types/material';

interface MaterialContextType {
  materials: Material[];
  selectedMaterial: Material | null;
  addMaterial: (material: Material) => void;
  addMaterials: (newMaterials: Material[]) => void;
  updateMaterial: (materialToUpdate: Material) => void;
  updateMaterials: (materialsToUpdate: Material[]) => void;
  deleteMaterial: (id: string) => void;
  deleteMaterials: (ids: string[]) => void;
  selectMaterial: (id: string) => void;
  startNewMaterial: () => void;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export const MaterialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>(loadMaterials());
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const addMaterial = (material: Material) => {
    setMaterials((prev) => {
      const updated = [...prev, material];
      saveMaterials(updated);
      return updated;
    });
  };

  const addMaterials = (newMaterials: Material[]) => {
    if (newMaterials.length === 0) return;
    setMaterials((prev) => {
      const updated = [...prev, ...newMaterials];
      saveMaterials(updated);
      return updated;
    });
  };

  const updateMaterials = (materialsToUpdate: Material[]) => {
    if (materialsToUpdate.length === 0) return;
    const byId = new Map(materialsToUpdate.map((m) => [m.id, m]));
    setMaterials((prev) => {
      const updated = prev.map((material) => byId.get(material.id) ?? material);
      saveMaterials(updated);
      return updated;
    });
    setSelectedMaterial((prev) => (prev ? byId.get(prev.id) ?? prev : prev));
  };

  const updateMaterial = (materialToUpdate: Material) => {
    updateMaterials([materialToUpdate]);
  };

  const deleteMaterials = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setMaterials((prev) => {
      const updated = prev.filter((material) => !idSet.has(material.id));
      saveMaterials(updated);
      return updated;
    });
    setSelectedMaterial((prev) => (prev && idSet.has(prev.id) ? null : prev));
  };

  const removeMaterial = (id: string) => {
    deleteMaterials([id]);
  };

  const selectMaterial = (id: string) => {
    const material = materials.find((material) => material.id === id) || null;
    setSelectedMaterial(material);
  };

  const deleteMaterial = removeMaterial;
  const startNewMaterial = () => setSelectedMaterial(null);

  return (
    <MaterialContext.Provider
      value={{
        materials,
        selectedMaterial,
        addMaterial,
        addMaterials,
        updateMaterial,
        updateMaterials,
        deleteMaterial,
        deleteMaterials,
        selectMaterial,
        startNewMaterial,
      }}
    >
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
