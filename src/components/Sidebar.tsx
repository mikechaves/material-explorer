import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import type { Material } from '../types/material';
import { createMaterialFromDraft, downloadBlob, downloadJson, normalizeMaterial } from '../utils/material';
import { Listbox, Transition } from '@headlessui/react';
import { MaterialCard } from './sidebar/MaterialCard';
import { CommandPalette, type CommandPaletteItem } from './sidebar/CommandPalette';
import { dispatchAppCommand } from '../types/commands';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  width: number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
  isMobile?: boolean;
}

const [minWidth, maxWidth] = [200, 500];
type SortMode = 'updated' | 'created' | 'name' | 'manual';

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: 'updated', label: 'Updated' },
  { value: 'created', label: 'Created' },
  { value: 'name', label: 'Name' },
  { value: 'manual', label: 'Manual' },
];

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

async function loadGltfExporters() {
  return await import('../utils/gltfExport');
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, width, setWidth, isMobile = false }) => {
  const {
    materials,
    selectMaterial,
    deleteMaterial,
    deleteMaterials,
    addMaterial,
    addMaterials,
    updateMaterial,
    updateMaterials,
    startNewMaterial,
  } = useMaterials();
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragged = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState<SortMode>('updated');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [manualOrder, setManualOrder] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem('materialsOrder');
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });

  const setSidebarWidthValue = React.useCallback((nextWidth: number) => {
    const clamped = Math.min(Math.max(nextWidth, minWidth), maxWidth);
    setWidth(clamped);
    window.localStorage.setItem('sidebarWidth', clamped.toString());
  }, [setWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragged.current) return;
      setSidebarWidthValue(e.clientX);
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
  }, [setSidebarWidthValue]);

  const exportAll = () => {
    downloadJson('materials.json', { version: 1, exportedAt: Date.now(), materials });
  };

  const exportAllGlb = async () => {
    try {
      const { exportLibraryAsGlb } = await loadGltfExporters();
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
      const { exportMaterialAsGlb } = await loadGltfExporters();
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
        : isRecord(parsed) && Array.isArray(parsed.materials)
          ? parsed.materials
          : isRecord(parsed) && 'material' in parsed
            ? [parsed.material]
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
      const imported = normalized.map((m) => {
        const draft = existingIds.has(m.id) ? { ...m, id: undefined } : m;
        const created = createMaterialFromDraft(draft);
        existingIds.add(created.id);
        return created;
      });
      addMaterials(imported);
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
    const { exportLibraryAsGlb } = await loadGltfExporters();
    const result = await exportLibraryAsGlb(selectedMaterials, { filename: 'materials-selected.glb' });
    if (!result) return;
    downloadBlob(result.filename, result.blob);
  };

  const bulkDelete = () => {
    const ok = window.confirm(`Delete ${selectedIds.length} material(s)?`);
    if (!ok) return;
    deleteMaterials(selectedIds);
    setSelectedIds([]);
  };

  const bulkSetFavorite = (fav: boolean) => {
    const now = Date.now();
    updateMaterials(selectedMaterials.map((m) => ({ ...m, favorite: fav, updatedAt: now })));
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
  const favoriteCount = useMemo(() => materials.filter((m) => !!m.favorite).length, [materials]);
  const hasActiveFilters = query.trim().length > 0 || onlyFavorites || selectedTags.length > 0;

  const focusSearch = useCallback(() => {
    if (isCollapsed) setIsCollapsed(false);
    const focusSearchField = () => searchInputRef.current?.focus();
    window.requestAnimationFrame(focusSearchField);
    window.setTimeout(focusSearchField, 220);
  }, [isCollapsed, setIsCollapsed]);

  const commandItems = useMemo<CommandPaletteItem[]>(
    () => [
      {
        id: 'new-material',
        title: 'Create New Material',
        description: 'Start a blank draft in the editor.',
        shortcut: 'Ctrl/Cmd+Shift+N',
        keywords: ['new', 'material', 'draft'],
        run: () => startNewMaterial(),
      },
      {
        id: 'toggle-sidebar',
        title: isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
        description: 'Toggle the library panel.',
        shortcut: 'Ctrl/Cmd+B',
        keywords: ['sidebar', 'panel'],
        run: () => setIsCollapsed((prev) => !prev),
      },
      {
        id: 'focus-search',
        title: 'Focus Material Search',
        description: 'Jump to the sidebar search input.',
        shortcut: 'Ctrl/Cmd+F',
        keywords: ['search', 'find', 'filter'],
        run: () => focusSearch(),
      },
      {
        id: 'import-json',
        title: 'Import Materials JSON',
        description: 'Open file picker for JSON import.',
        shortcut: 'Ctrl/Cmd+I',
        keywords: ['import', 'json', 'file'],
        run: () => fileInputRef.current?.click(),
      },
      {
        id: 'export-json',
        title: 'Export Library (JSON)',
        description: 'Download full library as JSON.',
        keywords: ['export', 'json', 'download'],
        run: () => exportAll(),
      },
      {
        id: 'export-glb',
        title: 'Export Library (GLB)',
        description: 'Download full library as GLB.',
        keywords: ['export', 'glb', 'download'],
        run: () => {
          void exportAllGlb();
        },
      },
      {
        id: 'save-material',
        title: 'Save Current Material',
        description: 'Trigger save/update in the editor.',
        shortcut: 'Ctrl/Cmd+S',
        keywords: ['save', 'update', 'material'],
        run: () => dispatchAppCommand('save-material'),
      },
      {
        id: 'toggle-preview',
        title: 'Toggle 3D Preview',
        description: 'Enable or disable interactive 3D preview.',
        shortcut: 'Ctrl/Cmd+P',
        keywords: ['preview', '3d', 'render'],
        run: () => dispatchAppCommand('toggle-preview'),
      },
      {
        id: 'toggle-compare',
        title: 'Toggle Compare Mode',
        description: 'Capture or show A/B comparison in editor.',
        keywords: ['compare', 'ab', 'reference'],
        run: () => dispatchAppCommand('toggle-compare'),
      },
      {
        id: 'focus-editor-name',
        title: 'Focus Material Name',
        description: 'Jump cursor to the editor name field.',
        keywords: ['name', 'title', 'focus'],
        run: () => dispatchAppCommand('focus-material-name'),
      },
    ],
    [exportAll, focusSearch, isCollapsed, startNewMaterial, setIsCollapsed]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const hasModifier = event.metaKey || event.ctrlKey;
      if (!hasModifier) return;

      if (key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (isCommandPaletteOpen) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTypingTarget =
        !!target &&
        (target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');

      if (isTypingTarget && key !== 's') return;

      if (key === 'b') {
        event.preventDefault();
        setIsCollapsed((prev) => !prev);
        return;
      }
      if (key === 'f') {
        event.preventDefault();
        focusSearch();
        return;
      }
      if (key === 'i') {
        event.preventDefault();
        fileInputRef.current?.click();
        return;
      }
      if (key === 's') {
        event.preventDefault();
        dispatchAppCommand('save-material');
        return;
      }
      if (key === 'p') {
        event.preventDefault();
        dispatchAppCommand('toggle-preview');
        return;
      }
      if (event.shiftKey && key === 'n') {
        event.preventDefault();
        startNewMaterial();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusSearch, isCommandPaletteOpen, setIsCollapsed, startNewMaterial]);

  return (
    <>
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/55 z-10"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}
      <motion.div 
        ref={sidebarRef}
        className="fixed top-0 left-0 h-full text-white z-20 flex glass-panel"
        animate={
          isMobile
            ? { x: isCollapsed ? '-100%' : 0, width: 'min(85vw, 360px)' }
            : { x: 0, width: isCollapsed ? 64 : width }
        }
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      >
      <div className="p-4 w-full overflow-hidden">
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-start mb-5`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-3'}`}>
            <motion.button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-xl bg-slate-900/65 hover:bg-slate-800/75 border border-slate-100/15 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                alt="Material Explorer" 
                width="48" 
                height="48" 
                src={logoUrl}
                className="rounded-lg shadow-lg"
              />
            </motion.button>

            {!isCollapsed && (
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-wide text-slate-100">Material Explorer</div>
                <div className="text-xs ui-muted">{materials.length} materials • {favoriteCount} favorites</div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <motion.button
                className="ui-btn px-3 py-1.5 text-xs font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => startNewMaterial()}
              >
                New
              </motion.button>
              <motion.button
                className="ui-btn px-3 py-1.5 text-xs font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Import
              </motion.button>
              <motion.button
                className="ui-btn px-3 py-1.5 text-xs font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={exportAll}
              >
                Export JSON
              </motion.button>
              <motion.button
                className="ui-btn px-3 py-1.5 text-xs font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => void exportAllGlb()}
              >
                Export GLB
              </motion.button>
              <motion.button
                className="ui-btn px-3 py-1.5 text-xs font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsCommandPaletteOpen(true)}
              >
                Commands
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
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or tags…"
                className="ui-input flex-1 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setOnlyFavorites((v) => !v)}
                className="ui-chip px-3 py-2 text-sm"
                data-active={onlyFavorites}
                title="Toggle favorites"
                aria-label={onlyFavorites ? 'Show all materials' : 'Show only favorites'}
                aria-pressed={onlyFavorites}
              >
                ★
              </button>
              <button
                type="button"
                onClick={() => setBulkMode((v) => !v)}
                className="ui-chip px-3 py-2 text-sm"
                data-active={bulkMode}
                title="Bulk select"
                aria-label={bulkMode ? 'Disable bulk selection' : 'Enable bulk selection'}
                aria-pressed={bulkMode}
              >
                ✓
              </button>
              <Listbox value={sort} onChange={setSort}>
                <div className="relative">
                  <Listbox.Button
                    className="ui-input px-3 py-2 text-sm text-left"
                  >
                    {sort === 'updated' ? 'Updated' : sort === 'created' ? 'Created' : sort === 'name' ? 'Name' : 'Manual'}
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options
                      className="absolute z-50 mt-2 w-40 max-h-60 overflow-auto rounded-xl glass-panel p-1.5 text-sm text-white"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <Listbox.Option
                          key={opt.value}
                          value={opt.value}
                          className={({ active, selected }) =>
                            classNames(
                              'cursor-pointer select-none rounded-lg px-3 py-2 transition-colors',
                              active && 'bg-white/10',
                              selected && 'bg-cyan-400/20 text-cyan-100'
                            )
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
                      className="ui-chip px-2.5 py-1 text-xs"
                      data-active={active}
                    >
                      {t}
                    </button>
                  );
                })}
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="ui-chip px-2.5 py-1 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {bulkMode && (
              <div className="mb-4 p-3 rounded-xl section-shell">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-200/80">
                    Selected: <span className="font-semibold text-white">{selectedIds.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={bulkDelete}
                      className="ui-btn ui-btn-danger px-3 py-1 text-xs disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={bulkExportJson}
                      className="ui-btn px-3 py-1 text-xs disabled:opacity-50"
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={() => void bulkExportGlb()}
                      className="ui-btn px-3 py-1 text-xs disabled:opacity-50"
                    >
                      Export GLB
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={() => bulkSetFavorite(true)}
                      className="ui-btn px-3 py-1 text-xs disabled:opacity-50"
                    >
                      Favorite
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={() => bulkSetFavorite(false)}
                      className="ui-btn px-3 py-1 text-xs disabled:opacity-50"
                    >
                      Unfavorite
                    </button>
                  </div>
                </div>
              </div>
            )}
          {filtered.length === 0 ? (
            <div className="section-shell px-4 py-5 text-sm text-slate-200/85">
              <div className="font-semibold text-slate-100">No materials found</div>
              <div className="mt-1 text-xs ui-muted">Try changing filters or create a new material from scratch.</div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setOnlyFavorites(false);
                    setSelectedTags([]);
                  }}
                  className="ui-btn mt-3 px-3 py-1.5 text-xs font-semibold"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : sort === 'manual' ? (
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
          className="w-1 cursor-ew-resize bg-transparent hover:bg-cyan-300/25 
                     transition-colors duration-200 relative"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
          aria-valuenow={width}
          tabIndex={0}
          onMouseDown={() => {
            isDragged.current = true;
            setIsDragging(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setSidebarWidthValue(width - 16);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setSidebarWidthValue(width + 16);
            } else if (e.key === 'Home') {
              e.preventDefault();
              setSidebarWidthValue(minWidth);
            } else if (e.key === 'End') {
              e.preventDefault();
              setSidebarWidthValue(maxWidth);
            }
          }}
        >
          <motion.div
            className="absolute inset-y-0 -right-0.5 w-1 bg-cyan-300/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragging ? 1 : 0 }}
          />
        </div>
      )}
      </motion.div>
      <CommandPalette open={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={commandItems} />
    </>
  );
};

export default Sidebar;
