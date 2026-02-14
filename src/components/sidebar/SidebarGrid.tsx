import React from 'react';
import { AnimatePresence, Reorder, motion } from 'framer-motion';
import type { Material } from '../../types/material';
import { MaterialCard } from './MaterialCard';
import type { SortMode } from './sidebarTypes';

type SidebarGridProps = {
  sort: SortMode;
  filtered: Material[];
  manualOrder: string[];
  onManualOrderChange: (nextOrder: string[]) => void;
  cardPreviewEnabled: boolean;
  bulkMode: boolean;
  selectedIds: string[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onToggleSelected: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleFavorite: (material: Material) => void;
  onDuplicate: (material: Material) => void;
  onExportJson: (material: Material) => void;
  onExportGlb: (material: Material) => void;
  onDelete: (id: string) => void;
};

export function SidebarGrid({
  sort,
  filtered,
  manualOrder,
  onManualOrderChange,
  cardPreviewEnabled,
  bulkMode,
  selectedIds,
  hasActiveFilters,
  onResetFilters,
  onToggleSelected,
  onEdit,
  onToggleFavorite,
  onDuplicate,
  onExportJson,
  onExportGlb,
  onDelete,
}: SidebarGridProps) {
  if (filtered.length === 0) {
    return (
      <div className="section-shell px-4 py-5 text-sm text-slate-200/85">
        <div className="font-semibold text-slate-100">No materials found</div>
        <div className="mt-1 text-xs ui-muted">Try changing filters or create a new material from scratch.</div>
        {hasActiveFilters && (
          <button type="button" onClick={onResetFilters} className="ui-btn mt-3 px-3 py-1.5 text-xs font-semibold">
            Reset filters
          </button>
        )}
      </div>
    );
  }

  const renderCard = (material: Material, reorderable = false) => (
    <MaterialCard
      key={material.id}
      material={material}
      previewEnabled={cardPreviewEnabled}
      bulkMode={bulkMode}
      selected={selectedIds.includes(material.id)}
      onToggleSelected={() => onToggleSelected(material.id)}
      onEdit={() => onEdit(material.id)}
      onToggleFavorite={() => onToggleFavorite(material)}
      onDuplicate={() => onDuplicate(material)}
      onExportJson={() => onExportJson(material)}
      onExportGlb={() => onExportGlb(material)}
      onDelete={() => onDelete(material.id)}
      reorderable={reorderable}
    />
  );

  if (sort === 'manual') {
    return (
      <Reorder.Group
        axis="y"
        values={manualOrder}
        onReorder={onManualOrderChange}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {filtered.map((material) => renderCard(material, true))}
      </Reorder.Group>
    );
  }

  return (
    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <AnimatePresence>{filtered.map((material) => renderCard(material))}</AnimatePresence>
    </motion.div>
  );
}
