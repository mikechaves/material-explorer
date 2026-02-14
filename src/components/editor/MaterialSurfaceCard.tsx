import React from 'react';
import { motion } from 'framer-motion';
import type { MaterialDraft } from '../../types/material';
import { Control } from './EditorFields';

type MaterialSurfaceCardProps = {
  material: MaterialDraft;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isDirty: boolean;
  onReset: () => void;
};

export function MaterialSurfaceCard({ material, onChange, isDirty, onReset }: MaterialSurfaceCardProps) {
  return (
    <div className="section-shell px-3 py-3 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="ui-label">Material Color</label>
        <button
          type="button"
          className="ui-btn px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
          onClick={onReset}
          disabled={!isDirty}
          aria-label="Reset Surface"
        >
          Reset Surface
        </button>
      </div>
      <div className="flex items-center gap-4">
        <motion.div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-100/20">
          <input
            type="color"
            name="color"
            value={material.color}
            onChange={onChange}
            aria-label="Material color"
            className="absolute inset-0 w-full h-full cursor-pointer border-0"
          />
        </motion.div>
        <div
          className="flex-1 h-12 rounded-xl border border-slate-100/20"
          style={{ backgroundColor: material.color }}
        />
      </div>
      <Control name="metalness" value={material.metalness} label="Metalness" onChange={onChange} />
      <Control name="roughness" value={material.roughness} label="Roughness" onChange={onChange} />
    </div>
  );
}
