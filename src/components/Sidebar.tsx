import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import type { Material } from '../types/material';
import { createMaterialFromDraft, downloadBlob, downloadJson, normalizeMaterial } from '../utils/material';
import { exportLibraryAsGlb, exportMaterialAsGlb } from '../utils/gltfExport';
import { Listbox, Transition } from '@headlessui/react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  width: number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
  isMobile?: boolean;
}

const [minWidth, maxWidth] = [200, 500];

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

const logoUrl = `${process.env.PUBLIC_URL}/logo.png`;

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, width, setWidth, isMobile = false }) => {
  const { materials, selectMaterial, deleteMaterial, addMaterial, updateMaterial, startNewMaterial } = useMaterials();
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragged = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState<'updated' | 'created' | 'name' | 'manual'>('updated');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualOrder, setManualOrder] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem('materialsOrder');
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });

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

  const exportAllGlb = async () => {
    try {
      const result = await exportLibraryAsGlb(materials, { filename: 'materials-library.glb' });
      if (!result) return;
      downloadBlob(result.filename, result.blob);
    } catch (e) {
      console.error(e);
      window.alert('Failed to export library GLB.');
    }
  };

  const exportOne = (material: Material) => {
    downloadJson(`${material.name || 'material'}.json`, { version: 1, exportedAt: Date.now(), material });
  };

  const exportOneGlb = async (material: Material) => {
    try {
      const { filename, blob } = await exportMaterialAsGlb(material);
      downloadBlob(filename, blob);
    } catch (e) {
      console.error(e);
      window.alert('Failed to export GLB.');
    }
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
        roughnessMap: material.roughnessMap,
        metalnessMap: material.metalnessMap,
        aoMap: material.aoMap,
        emissiveMap: material.emissiveMap,
        alphaMap: material.alphaMap,
        aoIntensity: material.aoIntensity,
        alphaTest: material.alphaTest,
        repeatX: material.repeatX,
        repeatY: material.repeatY,
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

  const toggleFavorite = (material: Material) => {
    updateMaterial({ ...material, favorite: !material.favorite, updatedAt: Date.now() });
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => (m.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [materials]);

  useEffect(() => {
    setSelectedTags((prev) => prev.filter((t) => allTags.includes(t)));
  }, [allTags]);

  useEffect(() => {
    const ids = materials.map((m) => m.id);
    setManualOrder((prev) => {
      const next = prev.filter((id) => ids.includes(id));
      ids.forEach((id) => {
        if (!next.includes(id)) next.push(id);
      });
      window.localStorage.setItem('materialsOrder', JSON.stringify(next));
      return next;
    });
  }, [materials]);

  useEffect(() => {
    if (!bulkMode) setSelectedIds([]);
  }, [bulkMode]);

  const selectedMaterials = useMemo(
    () => materials.filter((m) => selectedIds.includes(m.id)),
    [materials, selectedIds]
  );

  const bulkExportJson = () => {
    downloadJson('materials-selected.json', { version: 1, exportedAt: Date.now(), materials: selectedMaterials });
  };

  const bulkExportGlb = async () => {
    const result = await exportLibraryAsGlb(selectedMaterials, { filename: 'materials-selected.glb' });
    if (!result) return;
    downloadBlob(result.filename, result.blob);
  };

  const bulkDelete = () => {
    const ok = window.confirm(`Delete ${selectedIds.length} material(s)?`);
    if (!ok) return;
    selectedIds.forEach((id) => deleteMaterial(id));
    setSelectedIds([]);
  };

  const bulkSetFavorite = (fav: boolean) => {
    const now = Date.now();
    selectedMaterials.forEach((m) => updateMaterial({ ...m, favorite: fav, updatedAt: now }));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = materials.slice();
    if (onlyFavorites) list = list.filter((m) => !!m.favorite);
    if (selectedTags.length) {
      list = list.filter((m) => selectedTags.every((t) => (m.tags ?? []).includes(t)));
    }
    if (q) {
      list = list.filter((m) => {
        const hay = `${m.name ?? ''} ${(m.tags ?? []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (sort === 'manual') {
      const idx = new Map(manualOrder.map((id, i) => [id, i]));
      list.sort((a, b) => (idx.get(a.id) ?? 999999) - (idx.get(b.id) ?? 999999));
    } else {
      list.sort((a, b) => {
        if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sort === 'created') return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        return (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0);
      });
    }
    return list;
  }, [materials, onlyFavorites, query, sort, selectedTags, manualOrder]);

  return (
    <>
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-10"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}
      <motion.div 
        ref={sidebarRef}
        className="fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-md text-white z-20 flex shadow-xl"
        animate={
          isMobile
            ? { x: isCollapsed ? '-100%' : 0, width: 'min(85vw, 360px)' }
            : { x: 0, width: isCollapsed ? 64 : width }
        }
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
                width="48" 
                height="48" 
                src={logoUrl}
                className="rounded-lg"
              />
            </motion.button>
            
            {/* Title removed for cleaner header; logo + controls are sufficient */}
          </div>

          {!isCollapsed && (
            <div className="flex flex-wrap items-center justify-end gap-2">
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
                Export JSON
              </motion.button>
              <motion.button
                className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => void exportAllGlb()}
              >
                Export GLB
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
          <>
            <div className="flex items-center gap-2 mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or tags…"
                className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white/90 outline-none
                           focus:bg-white/10 border border-white/5 focus:border-purple-500/30"
              />
              <button
                type="button"
                onClick={() => setOnlyFavorites((v) => !v)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  onlyFavorites ? 'bg-purple-600/30 border-purple-500/30' : 'bg-white/5 border-white/10'
                }`}
                title="Toggle favorites"
              >
                ★
              </button>
              <button
                type="button"
                onClick={() => setBulkMode((v) => !v)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  bulkMode ? 'bg-purple-600/30 border-purple-500/30' : 'bg-white/5 border-white/10'
                }`}
                title="Bulk select"
              >
                ✓
              </button>
              <Listbox value={sort} onChange={setSort}>
                <div className="relative">
                  <Listbox.Button
                    className="px-3 py-2 bg-white/5 rounded-lg text-sm text-white/90 outline-none
                               focus:bg-white/10 border border-white/5 focus:border-purple-500/30 text-left"
                  >
                    {sort === 'updated' ? 'Updated' : sort === 'created' ? 'Created' : sort === 'name' ? 'Name' : 'Manual'}
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options
                      className="absolute z-50 mt-2 w-40 max-h-60 overflow-auto rounded-lg bg-gray-950/95 backdrop-blur
                                 border border-white/10 shadow-xl p-1 text-sm text-white"
                    >
                      {[
                        { value: 'updated', label: 'Updated' },
                        { value: 'created', label: 'Created' },
                        { value: 'name', label: 'Name' },
                        { value: 'manual', label: 'Manual' },
                      ].map((opt) => (
                        <Listbox.Option
                          key={opt.value}
                          value={opt.value as any}
                          className={({ active }) =>
                            classNames('cursor-pointer select-none rounded-md px-3 py-2', active && 'bg-white/10')
                          }
                        >
                          {opt.label}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {allTags.map((t) => {
                  const active = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setSelectedTags((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]))
                      }
                      className={`px-2 py-1 rounded-full text-xs border ${
                        active
                          ? 'bg-purple-600/30 border-purple-500/30 text-white'
                          : 'bg-white/5 border-white/10 text-white/80'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="px-2 py-1 rounded-full text-xs border bg-white/5 border-white/10 text-white/60"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {bulkMode && (
              <div className="mb-4 p-3 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-white/80">
                    Selected: <span className="font-semibold text-white">{selectedIds.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={bulkDelete}
                      className="px-3 py-1 rounded-full text-xs bg-red-500/80 hover:bg-red-500 disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={bulkExportJson}
                      className="px-3 py-1 rounded-full text-xs bg-white/10 hover:bg-white/15 disabled:opacity-50"
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={() => void bulkExportGlb()}
                      className="px-3 py-1 rounded-full text-xs bg-white/10 hover:bg-white/15 disabled:opacity-50"
                    >
                      Export GLB
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={() => bulkSetFavorite(true)}
                      className="px-3 py-1 rounded-full text-xs bg-white/10 hover:bg-white/15 disabled:opacity-50"
                    >
                      Favorite
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={() => bulkSetFavorite(false)}
                      className="px-3 py-1 rounded-full text-xs bg-white/10 hover:bg-white/15 disabled:opacity-50"
                    >
                      Unfavorite
                    </button>
                  </div>
                </div>
              </div>
            )}
          {sort === 'manual' ? (
            <Reorder.Group
              axis="y"
              values={manualOrder}
              onReorder={(v) => {
                setManualOrder(v);
                window.localStorage.setItem('materialsOrder', JSON.stringify(v));
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {filtered.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  bulkMode={bulkMode}
                  selected={selectedIds.includes(material.id)}
                  onToggleSelected={() =>
                    setSelectedIds((prev) =>
                      prev.includes(material.id) ? prev.filter((x) => x !== material.id) : [...prev, material.id]
                    )
                  }
                  onEdit={() => selectMaterial(material.id)}
                  onToggleFavorite={() => toggleFavorite(material)}
                  onDuplicate={() => duplicateOne(material)}
                  onExportJson={() => exportOne(material)}
                  onExportGlb={() => void exportOneGlb(material)}
                  onDelete={() => deleteMaterial(material.id)}
                  reorderable
                />
              ))}
            </Reorder.Group>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {filtered.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    bulkMode={bulkMode}
                    selected={selectedIds.includes(material.id)}
                    onToggleSelected={() =>
                      setSelectedIds((prev) =>
                        prev.includes(material.id) ? prev.filter((x) => x !== material.id) : [...prev, material.id]
                      )
                    }
                    onEdit={() => selectMaterial(material.id)}
                    onToggleFavorite={() => toggleFavorite(material)}
                    onDuplicate={() => duplicateOne(material)}
                    onExportJson={() => exportOne(material)}
                    onExportGlb={() => void exportOneGlb(material)}
                    onDelete={() => deleteMaterial(material.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          </>
        )}
      </div>

      {/* Resize Handle */}
      {!isMobile && !isCollapsed && (
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
    </>
  );
};

function MaterialCard({
  material,
  bulkMode,
  selected,
  onToggleSelected,
  onEdit,
  onToggleFavorite,
  onDuplicate,
  onExportJson,
  onExportGlb,
  onDelete,
  reorderable,
}: {
  material: Material;
  bulkMode: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onExportJson: () => void;
  onExportGlb: () => void;
  onDelete: () => void;
  reorderable?: boolean;
}) {
  const controls = useDragControls();

  const inner = (
    <div className="relative group">
      <div className="aspect-square rounded-xl overflow-hidden bg-black/30 border border-white/5 hover:border-purple-500/30 transition-all duration-300">
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
          roughnessMap={material.roughnessMap}
          metalnessMap={material.metalnessMap}
          aoMap={material.aoMap}
          emissiveMap={material.emissiveMap}
          alphaMap={material.alphaMap}
          aoIntensity={material.aoIntensity}
          alphaTest={material.alphaTest}
          repeatX={material.repeatX}
          repeatY={material.repeatY}
        />

        {bulkMode && (
          <button
            type="button"
            onClick={onToggleSelected}
            className={`absolute top-2 right-2 w-7 h-7 rounded-md border flex items-center justify-center ${
              selected ? 'bg-purple-600/70 border-purple-500/40' : 'bg-black/40 border-white/10'
            }`}
            aria-label="Select material"
          >
            {selected ? '✓' : ''}
          </button>
        )}

        {/* Control overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <div className="flex flex-wrap gap-2 justify-center px-2">
            {reorderable && (
              <motion.button
                onPointerDown={(e) => controls.start(e)}
                aria-label="Drag to reorder"
                className="px-3 py-1 text-xs font-medium bg-white/15 hover:bg-white/20 rounded-full text-white shadow-lg backdrop-blur-sm cursor-grab"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Drag
              </motion.button>
            )}
            <motion.button
              onClick={onEdit}
              aria-label="Edit material"
              className="px-4 py-1 text-xs font-medium bg-purple-500/90 hover:bg-purple-400 rounded-full text-white shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Edit
            </motion.button>
            <motion.button
              onClick={onToggleFavorite}
              aria-label="Toggle favorite"
              className="px-4 py-1 text-xs font-medium bg-white/15 hover:bg-white/20 rounded-full text-white shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {material.favorite ? '★' : '☆'}
            </motion.button>
            <motion.button
              onClick={onDuplicate}
              aria-label="Duplicate material"
              className="px-4 py-1 text-xs font-medium bg-white/15 hover:bg-white/20 rounded-full text-white shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Duplicate
            </motion.button>
            <motion.button
              onClick={onExportJson}
              aria-label="Export material JSON"
              className="px-4 py-1 text-xs font-medium bg-white/15 hover:bg-white/20 rounded-full text-white shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              JSON
            </motion.button>
            <motion.button
              onClick={onExportGlb}
              aria-label="Export material as GLB"
              className="px-4 py-1 text-xs font-medium bg-white/15 hover:bg-white/20 rounded-full text-white shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              GLB
            </motion.button>
            <motion.button
              onClick={() => {
                const ok = window.confirm('Delete this material?');
                if (ok) onDelete();
              }}
              aria-label="Delete material"
              className="px-4 py-1 text-xs font-medium bg-red-500/90 hover:bg-red-400 rounded-full text-white shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Delete
            </motion.button>
          </div>
        </div>

        {/* Name badge */}
        <div className="absolute top-2 left-2 right-2 pointer-events-none">
          <div className="flex items-center gap-1">
            <div className="inline-flex max-w-full px-2 py-0.5 rounded-full bg-black/40 text-[11px] text-white/90 truncate">
              {material.name || 'Untitled'}
            </div>
            {material.favorite && (
              <div className="px-2 py-0.5 rounded-full bg-black/40 text-[11px] text-yellow-300">★</div>
            )}
          </div>
        </div>

        {!!(material.tags?.length) && (
          <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((t) => (
              <div key={t} className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-white/80 truncate">
                {t}
              </div>
            ))}
            {material.tags.length > 3 && (
              <div className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-white/60">
                +{material.tags.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (reorderable) {
    return (
      <Reorder.Item
        value={material.id}
        dragListener={false}
        dragControls={controls}
        className="relative"
        whileDrag={{ scale: 1.02 }}
      >
        {inner}
      </Reorder.Item>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative"
    >
      {inner}
    </motion.div>
  );
}

export default Sidebar;