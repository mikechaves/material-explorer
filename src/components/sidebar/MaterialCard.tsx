import React from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import type { Material } from '../../types/material';

const MaterialPreview = React.lazy(() => import('../MaterialPreview'));

type MaterialCardProps = {
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
};

export function MaterialCard({
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
}: MaterialCardProps) {
  const controls = useDragControls();
  const previewFallback = <div className="w-full h-full bg-white/5 animate-pulse" aria-hidden="true" />;

  const inner = (
    <div className="relative group">
      <div className="aspect-square rounded-xl overflow-hidden bg-black/30 border border-white/5 hover:border-purple-500/30 transition-all duration-300">
        <React.Suspense fallback={previewFallback}>
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
        </React.Suspense>

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

        <div className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <div className="flex flex-wrap gap-2 justify-center px-2">
            {reorderable && (
              <motion.button
                onPointerDown={(event) => controls.start(event)}
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

        <div className="absolute top-2 left-2 right-2 pointer-events-none">
          <div className="flex items-center gap-1">
            <div className="inline-flex max-w-full px-2 py-0.5 rounded-full bg-black/40 text-[11px] text-white/90 truncate">
              {material.name || 'Untitled'}
            </div>
            {material.favorite && <div className="px-2 py-0.5 rounded-full bg-black/40 text-[11px] text-yellow-300">★</div>}
          </div>
        </div>

        {!!material.tags?.length && (
          <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((tag) => (
              <div key={tag} className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-white/80 truncate">
                {tag}
              </div>
            ))}
            {material.tags.length > 3 && (
              <div className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-white/60">+{material.tags.length - 3}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (reorderable) {
    return (
      <Reorder.Item value={material.id} dragListener={false} dragControls={controls} className="relative" whileDrag={{ scale: 1.02 }}>
        {inner}
      </Reorder.Item>
    );
  }

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative">
      {inner}
    </motion.div>
  );
}
