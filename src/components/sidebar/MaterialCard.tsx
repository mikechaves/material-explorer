import React from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import type { Material } from '../../types/material';

const MaterialPreview = React.lazy(() => import('../MaterialPreview'));

type MaterialCardProps = {
  material: Material;
  previewEnabled: boolean;
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
  previewEnabled,
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
  const [showPreview, setShowPreview] = React.useState(false);
  const swatchStyle: React.CSSProperties = {
    background: `radial-gradient(circle at 25% 20%, rgba(255,255,255,0.28), rgba(255,255,255,0) 45%), linear-gradient(145deg, ${material.color} 0%, #111827 100%)`,
  };

  const inner = (
    <div
      className="relative group"
      onPointerEnter={() => setShowPreview(true)}
      onFocusCapture={() => setShowPreview(true)}
    >
      <div className="aspect-square rounded-2xl overflow-hidden bg-slate-950/40 border border-slate-200/10 hover:border-cyan-200/40 transition-all duration-300 shadow-lg">
        {previewEnabled && showPreview ? (
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
        ) : (
          <div className="w-full h-full" style={swatchStyle} aria-hidden="true" />
        )}

        {bulkMode && (
          <button
            type="button"
            onClick={onToggleSelected}
            className={`absolute top-2 right-2 w-7 h-7 rounded-md border flex items-center justify-center ${
              selected ? 'bg-cyan-400/55 border-cyan-200/70 text-slate-950' : 'bg-slate-950/55 border-slate-100/20 text-slate-100'
            }`}
            aria-label="Select material"
          >
            {selected ? '✓' : ''}
          </button>
        )}

        <div className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <div className="flex flex-wrap gap-2 justify-center px-2">
            {reorderable && (
              <motion.button
                onPointerDown={(event) => controls.start(event)}
                aria-label="Drag to reorder"
                className="ui-btn px-3 py-1 text-xs font-semibold cursor-grab"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Drag
              </motion.button>
            )}
            <motion.button
              onClick={onEdit}
              aria-label="Edit material"
              className="ui-btn ui-btn-primary px-4 py-1 text-xs"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Edit
            </motion.button>
            <motion.button
              onClick={onToggleFavorite}
              aria-label="Toggle favorite"
              className="ui-btn px-4 py-1 text-xs font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {material.favorite ? '★' : '☆'}
            </motion.button>
            <motion.button
              onClick={onDuplicate}
              aria-label="Duplicate material"
              className="ui-btn px-4 py-1 text-xs font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Duplicate
            </motion.button>
            <motion.button
              onClick={onExportJson}
              aria-label="Export material JSON"
              className="ui-btn px-4 py-1 text-xs font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              JSON
            </motion.button>
            <motion.button
              onClick={onExportGlb}
              aria-label="Export material as GLB"
              className="ui-btn px-4 py-1 text-xs font-semibold"
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
              className="ui-btn ui-btn-danger px-4 py-1 text-xs"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Delete
            </motion.button>
          </div>
        </div>

        <div className="absolute top-2 left-2 right-2 pointer-events-none">
          <div className="flex items-center gap-1">
            <div className="inline-flex max-w-full px-2 py-0.5 rounded-full bg-slate-950/55 text-[11px] text-white/90 truncate">
              {material.name || 'Untitled'}
            </div>
            {material.favorite && <div className="px-2 py-0.5 rounded-full bg-slate-950/55 text-[11px] text-amber-200">★</div>}
          </div>
        </div>

        {!!material.tags?.length && (
          <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((tag) => (
              <div key={tag} className="px-2 py-0.5 rounded-full bg-slate-950/55 text-[10px] text-slate-100/85 truncate">
                {tag}
              </div>
            ))}
            {material.tags.length > 3 && (
              <div className="px-2 py-0.5 rounded-full bg-slate-950/55 text-[10px] text-slate-200/70">+{material.tags.length - 3}</div>
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
