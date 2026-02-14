import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import { useToasts } from '../contexts/ToastContext';
import { useDialogs } from '../contexts/DialogContext';
import { motion } from 'framer-motion';
import type { Material } from '../types/material';
import { createMaterialFromDraft, downloadBlob, downloadJson } from '../utils/material';
import { dispatchAppCommand } from '../types/commands';
import { buildCommandItems } from './sidebar/commandItems';
import { parseImportedMaterials, validateImportFileSize } from './sidebar/importMaterials';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarFilters } from './sidebar/SidebarFilters';
import { SidebarBulkBar } from './sidebar/SidebarBulkBar';
import { SidebarGrid } from './sidebar/SidebarGrid';
import { filterMaterials } from './sidebar/filterMaterials';
import { parseManualOrderStorage, sanitizeManualOrderIds } from './sidebar/manualOrder';
import type { SortMode } from './sidebar/sidebarTypes';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  width: number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
  isMobile?: boolean;
}

const [minWidth, maxWidth] = [200, 500];
const CARD_PREVIEW_STORAGE_KEY = 'materialExplorerCardPreview3d';

const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

async function loadGltfExporters() {
  return await import('../utils/gltfExport');
}

const CommandPalette = React.lazy(async () => {
  const module = await import('./sidebar/CommandPalette');
  return { default: module.CommandPalette };
});

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, width, setWidth, isMobile = false }) => {
  const { notify } = useToasts();
  const { confirm } = useDialogs();
  const {
    materials,
    storageError,
    syncWarning,
    clearStorageError,
    clearSyncWarning,
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
  const [cardPreviewEnabled, setCardPreviewEnabled] = useState<boolean>(() => {
    const stored = window.localStorage.getItem(CARD_PREVIEW_STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return !window.matchMedia('(pointer: coarse)').matches;
  });
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState<SortMode>('updated');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [manualOrder, setManualOrder] = useState<string[]>(() =>
    parseManualOrderStorage(window.localStorage.getItem('materialsOrder'))
  );

  const setSidebarWidthValue = React.useCallback(
    (nextWidth: number) => {
      const clamped = Math.min(Math.max(nextWidth, minWidth), maxWidth);
      setWidth(clamped);
      window.localStorage.setItem('sidebarWidth', clamped.toString());
    },
    [setWidth]
  );

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

  const exportAll = useCallback(() => {
    downloadJson('materials.json', { version: 1, exportedAt: Date.now(), materials });
  }, [materials]);

  const exportAllGlb = useCallback(async () => {
    try {
      const { exportLibraryAsGlb } = await loadGltfExporters();
      const result = await exportLibraryAsGlb(materials, { filename: 'materials-library.glb' });
      if (!result) return;
      downloadBlob(result.filename, result.blob);
    } catch (e) {
      console.error(e);
      notify({
        variant: 'error',
        title: 'Library GLB export failed',
        message: 'Please try again. If this persists, reduce material count or texture sizes.',
      });
    }
  }, [materials, notify]);

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
      notify({ variant: 'error', title: 'GLB export failed', message: 'Please try again for this material.' });
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
      const fileSizeError = validateImportFileSize(file);
      if (fileSizeError) {
        notify({ variant: 'warn', title: 'Import blocked', message: fileSizeError });
        return;
      }
      const raw = await file.text();
      const importResult = parseImportedMaterials(raw, materials);
      if (!importResult.ok) {
        notify({ variant: 'warn', title: 'Import blocked', message: importResult.message });
        return;
      }
      addMaterials(importResult.materials);
      notify({
        variant: 'success',
        title: `Imported ${importResult.materials.length} material${importResult.materials.length === 1 ? '' : 's'}`,
      });
    } catch (e) {
      console.error(e);
      notify({
        variant: 'error',
        title: 'Import failed',
        message: 'Make sure the file is valid JSON and try again.',
      });
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
    window.localStorage.setItem(CARD_PREVIEW_STORAGE_KEY, cardPreviewEnabled ? 'true' : 'false');
  }, [cardPreviewEnabled]);

  useEffect(() => {
    const ids = materials.map((m) => m.id);
    setManualOrder((prev) => {
      const next = prev.filter((id) => ids.includes(id));
      ids.forEach((id) => {
        if (!next.includes(id)) next.push(id);
      });
      const sanitized = sanitizeManualOrderIds(next);
      window.localStorage.setItem('materialsOrder', JSON.stringify(sanitized));
      return sanitized;
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

  const bulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: `Delete ${selectedIds.length} material${selectedIds.length === 1 ? '' : 's'}?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    deleteMaterials(selectedIds);
    setSelectedIds([]);
  }, [confirm, deleteMaterials, selectedIds]);

  const bulkSetFavorite = (fav: boolean) => {
    const now = Date.now();
    updateMaterials(selectedMaterials.map((m) => ({ ...m, favorite: fav, updatedAt: now })));
  };

  const filtered = useMemo(() => {
    return filterMaterials(materials, {
      query,
      onlyFavorites,
      selectedTags,
      sort,
      manualOrder,
    });
  }, [materials, onlyFavorites, query, sort, selectedTags, manualOrder]);
  const favoriteCount = useMemo(() => materials.filter((m) => !!m.favorite).length, [materials]);
  const hasActiveFilters = query.trim().length > 0 || onlyFavorites || selectedTags.length > 0;

  const focusSearch = useCallback(() => {
    if (isCollapsed) setIsCollapsed(false);
    const focusSearchField = () => searchInputRef.current?.focus();
    window.requestAnimationFrame(focusSearchField);
    window.setTimeout(focusSearchField, 220);
  }, [isCollapsed, setIsCollapsed]);

  const commandItems = useMemo(
    () =>
      buildCommandItems({
        isCollapsed,
        setIsCollapsed,
        startNewMaterial,
        focusSearch,
        openImportPicker: () => fileInputRef.current?.click(),
        exportAll,
        exportAllGlb,
      }),
    [exportAll, exportAllGlb, focusSearch, isCollapsed, setIsCollapsed, startNewMaterial]
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
        !!target && (target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');

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
      if (key === 'z') {
        event.preventDefault();
        dispatchAppCommand(event.shiftKey ? 'redo-material-change' : 'undo-material-change');
        return;
      }
      if (key === 'y') {
        event.preventDefault();
        dispatchAppCommand('redo-material-change');
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
        <div className="fixed inset-0 bg-black/55 z-10" onClick={() => setIsCollapsed(true)} aria-hidden="true" />
      )}
      <motion.div
        ref={sidebarRef}
        className="fixed top-0 left-0 h-full text-white z-20 flex glass-panel"
        animate={
          isMobile
            ? { x: isCollapsed ? '-100%' : 0, width: 'min(85vw, 360px)' }
            : { x: 0, width: isCollapsed ? 64 : width }
        }
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
      >
        <div className="p-4 w-full overflow-hidden">
          <SidebarHeader
            isCollapsed={isCollapsed}
            materialsCount={materials.length}
            favoriteCount={favoriteCount}
            logoUrl={logoUrl}
            fileInputRef={fileInputRef}
            onToggleCollapsed={() => setIsCollapsed((prev) => !prev)}
            onStartNew={startNewMaterial}
            onOpenImport={() => fileInputRef.current?.click()}
            onExportJson={exportAll}
            onExportGlb={() => {
              void exportAllGlb();
            }}
            onOpenCommands={() => setIsCommandPaletteOpen(true)}
            onImportFile={(file) => {
              void onImportFile(file);
            }}
          />

          {!isCollapsed && (
            <>
              {storageError && (
                <div className="mb-4 rounded-xl border border-rose-300/45 bg-rose-500/10 px-3 py-2">
                  <div className="text-xs text-rose-100/95">{storageError}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={exportAll} className="ui-btn px-2.5 py-1 text-xs font-semibold">
                      Export Backup JSON
                    </button>
                    <button type="button" onClick={clearStorageError} className="ui-btn px-2.5 py-1 text-xs">
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
              {syncWarning && (
                <div className="mb-4 rounded-xl border border-amber-300/45 bg-amber-500/10 px-3 py-2">
                  <div className="text-xs text-amber-100/95">{syncWarning}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={exportAll} className="ui-btn px-2.5 py-1 text-xs font-semibold">
                      Export Backup JSON
                    </button>
                    <button type="button" onClick={clearSyncWarning} className="ui-btn px-2.5 py-1 text-xs">
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <SidebarFilters
                searchInputRef={searchInputRef}
                query={query}
                onQueryChange={setQuery}
                cardPreviewEnabled={cardPreviewEnabled}
                onToggleCardPreview={() => setCardPreviewEnabled((value) => !value)}
                onlyFavorites={onlyFavorites}
                onToggleFavorites={() => setOnlyFavorites((value) => !value)}
                bulkMode={bulkMode}
                onToggleBulkMode={() => setBulkMode((value) => !value)}
                sort={sort}
                onSortChange={setSort}
                allTags={allTags}
                selectedTags={selectedTags}
                onToggleTag={(tag) =>
                  setSelectedTags((prev) =>
                    prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]
                  )
                }
                onClearTags={() => setSelectedTags([])}
              />

              {bulkMode && (
                <SidebarBulkBar
                  selectedCount={selectedIds.length}
                  onDelete={() => {
                    void bulkDelete();
                  }}
                  onExportJson={bulkExportJson}
                  onExportGlb={() => {
                    void bulkExportGlb();
                  }}
                  onFavorite={() => bulkSetFavorite(true)}
                  onUnfavorite={() => bulkSetFavorite(false)}
                />
              )}

              <SidebarGrid
                sort={sort}
                filtered={filtered}
                manualOrder={manualOrder}
                onManualOrderChange={(nextOrder) => {
                  const sanitized = sanitizeManualOrderIds(nextOrder);
                  setManualOrder(sanitized);
                  window.localStorage.setItem('materialsOrder', JSON.stringify(sanitized));
                }}
                cardPreviewEnabled={cardPreviewEnabled}
                bulkMode={bulkMode}
                selectedIds={selectedIds}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={() => {
                  setQuery('');
                  setOnlyFavorites(false);
                  setSelectedTags([]);
                }}
                onToggleSelected={(id) =>
                  setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))
                }
                onEdit={selectMaterial}
                onToggleFavorite={toggleFavorite}
                onDuplicate={duplicateOne}
                onExportJson={exportOne}
                onExportGlb={(material) => {
                  void exportOneGlb(material);
                }}
                onDelete={deleteMaterial}
              />
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
      {isCommandPaletteOpen && (
        <React.Suspense fallback={null}>
          <CommandPalette
            open={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            commands={commandItems}
          />
        </React.Suspense>
      )}
    </>
  );
};

export default Sidebar;
