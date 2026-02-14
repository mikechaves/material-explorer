import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Material } from '../types/material';
import { materialRepository } from '../repositories/materialRepository';

interface MaterialContextType {
  materials: Material[];
  selectedMaterial: Material | null;
  storageError: string | null;
  syncWarning: string | null;
  clearStorageError: () => void;
  clearSyncWarning: () => void;
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
const STORAGE_ERROR_MESSAGE =
  'Could not save materials locally. Your browser storage may be full. Export JSON backup before continuing.';
const SYNC_WARNING_MESSAGE = 'Remote sync is unavailable. Changes are still saved locally on this device.';

export const MaterialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>(() => materialRepository.loadAll());
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const hasLocalMutationsRef = useRef(false);
  const persistSequenceRef = useRef(0);

  useEffect(() => {
    if (!materialRepository.loadFromRemote) return;

    let cancelled = false;
    void materialRepository.loadFromRemote().then((remoteMaterials) => {
      if (cancelled || !remoteMaterials || hasLocalMutationsRef.current) return;
      setMaterials(remoteMaterials);
      setSelectedMaterial((prev) => {
        if (!prev) return prev;
        return remoteMaterials.find((material) => material.id === prev.id) ?? null;
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistMaterials = (updated: Material[]) => {
    hasLocalMutationsRef.current = true;
    const persistSequence = ++persistSequenceRef.current;
    void materialRepository.saveAll(updated).then((result) => {
      if (persistSequence !== persistSequenceRef.current) return;
      setStorageError(result.ok ? null : STORAGE_ERROR_MESSAGE);
      if (!result.ok) {
        setSyncWarning(null);
        return;
      }
      if (result.remoteSynced === false && materialRepository.source === 'http+local-fallback') {
        setSyncWarning(SYNC_WARNING_MESSAGE);
        return;
      }
      setSyncWarning(null);
    });
  };

  const addMaterial = (material: Material) => {
    setMaterials((prev) => {
      const updated = [...prev, material];
      persistMaterials(updated);
      return updated;
    });
  };

  const addMaterials = (newMaterials: Material[]) => {
    if (newMaterials.length === 0) return;
    setMaterials((prev) => {
      const updated = [...prev, ...newMaterials];
      persistMaterials(updated);
      return updated;
    });
  };

  const updateMaterials = (materialsToUpdate: Material[]) => {
    if (materialsToUpdate.length === 0) return;
    const byId = new Map(materialsToUpdate.map((m) => [m.id, m]));
    setMaterials((prev) => {
      const updated = prev.map((material) => byId.get(material.id) ?? material);
      persistMaterials(updated);
      return updated;
    });
    setSelectedMaterial((prev) => (prev ? (byId.get(prev.id) ?? prev) : prev));
  };

  const updateMaterial = (materialToUpdate: Material) => {
    updateMaterials([materialToUpdate]);
  };

  const deleteMaterials = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setMaterials((prev) => {
      const updated = prev.filter((material) => !idSet.has(material.id));
      persistMaterials(updated);
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
  const clearStorageError = () => setStorageError(null);
  const clearSyncWarning = () => setSyncWarning(null);
  const startNewMaterial = () => setSelectedMaterial(null);

  return (
    <MaterialContext.Provider
      value={{
        materials,
        selectedMaterial,
        storageError,
        syncWarning,
        clearStorageError,
        clearSyncWarning,
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
