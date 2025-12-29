import React, { useEffect, useRef, useState } from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../logo.svg';
import type { Material } from '../types/material';
import { createMaterialFromDraft, downloadJson, normalizeMaterial } from '../utils/material';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  width: number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
}

const [minWidth, maxWidth] = [200, 500];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, width, setWidth }) => {
  const { materials, selectMaterial, deleteMaterial, addMaterial, startNewMaterial } = useMaterials();
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragged = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragged.current) return;
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setWidth(newWidth);
      localStorage.setItem("sidebarWidth", newWidth.toString());
      document.body.style.cursor = 'ew-resize';
    };

    const handleMouseUp = () => {
      isDragged.current = false;
      document.body.style.cursor = 'default';
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setWidth]);

  const exportAll = () => {
    downloadJson('materials.json', { version: 1, exportedAt: Date.now(), materials });
  };

  const exportOne = (material: Material) => {
    downloadJson(`${material.name || 'material'}.json`, { version: 1, exportedAt: Date.now(), material });
  };

  const duplicateOne = (material: Material) => {
    const copyName = `${material.name || 'Untitled'} Copy`;
    addMaterial(
      createMaterialFromDraft({
        name: copyName,
        color: material.color,
        metalness: material.metalness,
        roughness: material.roughness,
        emissive: material.emissive,
        emissiveIntensity: material.emissiveIntensity,
        clearcoat: material.clearcoat,
        clearcoatRoughness: material.clearcoatRoughness,
        transmission: material.transmission,
        ior: material.ior,
        opacity: material.opacity,
        baseColorMap: material.baseColorMap,
        normalMap: material.normalMap,
        normalScale: material.normalScale,
      })
    );
  };

  const onImportFile = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;

      const now = Date.now();
      const incoming: unknown[] = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as any).materials)
          ? (parsed as any).materials
          : parsed && typeof parsed === 'object' && (parsed as any).material
            ? [(parsed as any).material]
            : [parsed];

      const normalized = incoming
        .map((m) => normalizeMaterial(m, now))
        .filter((m): m is Material => m !== null);

      if (normalized.length === 0) {
        window.alert('No valid materials found in that file.');
        return;
      }

      // Ensure imported ids don’t collide; if they do, assign a new id.
      const existingIds = new Set(materials.map((m) => m.id));
      normalized.forEach((m) => {
        const draft = existingIds.has(m.id) ? { ...m, id: undefined } : m;
        addMaterial(createMaterialFromDraft(draft));
      });
    } catch (e) {
      console.error(e);
      window.alert('Failed to import materials. Make sure it is valid JSON.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div 
      ref={sidebarRef}
      className="fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-md text-white z-10 flex shadow-xl"
      animate={{ width: isCollapsed ? 64 : width }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
    >
      <div className="p-4 w-full overflow-hidden">
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center mb-6`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-4'}`}>
            <motion.button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                alt="Material Explorer" 
                width="40" 
                height="40" 
                src={logo}
                className="rounded-lg"
              />
            </motion.button>
            
            {!isCollapsed && (
              <motion.h1 
                className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                MATERIALS
              </motion.h1>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <motion.button
                className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => startNewMaterial()}
              >
                New
              </motion.button>
              <motion.button
                className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Import
              </motion.button>
              <motion.button
                className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={exportAll}
              >
                Export
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onImportFile(file);
                }}
              />
            </div>
          )}
        </div>

        {!isCollapsed && (
          <motion.div layout className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {materials.map((material) => (
                <motion.div
                  key={material.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-black/30 border border-white/5 
                                hover:border-purple-500/30 transition-all duration-300">
                    <MaterialPreview
                      className="w-full h-full"
                      color={material.color}
                      metalness={material.metalness}
                      roughness={material.roughness}
                      emissive={material.emissive}
                      emissiveIntensity={material.emissiveIntensity}
                      clearcoat={material.clearcoat}
                      clearcoatRoughness={material.clearcoatRoughness}
                      transmission={material.transmission}
                      ior={material.ior}
                      opacity={material.opacity}
                      baseColorMap={material.baseColorMap}
                      normalMap={material.normalMap}
                      normalScale={material.normalScale}
                    />
                    
                    {/* Control overlay */}
                    <div
                      className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent
                                 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                    >
                      <div className="flex flex-wrap gap-2 justify-center px-2">
                        <motion.button
                          onClick={() => selectMaterial(material.id)}
                          aria-label="Edit material"
                          className="px-4 py-1 text-xs font-medium bg-purple-500/90 hover:bg-purple-400 
                                   rounded-full text-white shadow-lg backdrop-blur-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          onClick={() => duplicateOne(material)}
                          aria-label="Duplicate material"
                          className="px-4 py-1 text-xs font-medium bg-white/15 hover:bg-white/20 
                                   rounded-full text-white shadow-lg backdrop-blur-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Duplicate
                        </motion.button>
                        <motion.button
                          onClick={() => exportOne(material)}
                          aria-label="Export material"
                          className="px-4 py-1 text-xs font-medium bg-white/15 hover:bg-white/20 
                                   rounded-full text-white shadow-lg backdrop-blur-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Export
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            const ok = window.confirm('Delete this material?');
                            if (ok) deleteMaterial(material.id);
                          }}
                          aria-label="Delete material"
                          className="px-4 py-1 text-xs font-medium bg-red-500/90 hover:bg-red-400 
                                   rounded-full text-white shadow-lg backdrop-blur-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Delete
                        </motion.button>
                      </div>
                    </div>

                    {/* Name badge */}
                    <div className="absolute top-2 left-2 right-2 pointer-events-none">
                      <div className="inline-flex max-w-full px-2 py-0.5 rounded-full bg-black/40 text-[11px] text-white/90 truncate">
                        {material.name || 'Untitled'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className="w-1 cursor-ew-resize bg-transparent hover:bg-purple-500/20 
                     transition-colors duration-200 relative"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={() => {
            isDragged.current = true;
            setIsDragging(true);
          }}
        >
          <motion.div
            className="absolute inset-y-0 -right-0.5 w-1 bg-purple-500/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragging ? 1 : 0 }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;