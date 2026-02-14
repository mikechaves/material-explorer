import React from 'react';
import type { MaterialDraft } from '../../types/material';
import { Control } from './EditorFields';

type MaterialOpticsCardProps = {
  material: MaterialDraft;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isDirty: boolean;
  onReset: () => void;
};

export function MaterialOpticsCard({ material, onChange, isDirty, onReset }: MaterialOpticsCardProps) {
  return (
    <div className="section-shell px-3 py-3 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="ui-label">Emissive</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ui-btn px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
            onClick={onReset}
            disabled={!isDirty}
            aria-label="Reset Optics"
          >
            Reset Optics
          </button>
          <input
            type="color"
            name="emissive"
            value={material.emissive ?? '#000000'}
            onChange={onChange}
            aria-label="Emissive color"
            className="w-10 h-10 cursor-pointer border border-slate-100/20 rounded-md bg-transparent"
          />
          <Control name="emissiveIntensity" value={material.emissiveIntensity} label="Intensity" onChange={onChange} />
        </div>
      </div>

      <Control name="clearcoat" value={material.clearcoat} label="Clearcoat" onChange={onChange} />
      <Control
        name="clearcoatRoughness"
        value={material.clearcoatRoughness}
        label="Clearcoat Roughness"
        onChange={onChange}
      />
      <Control name="transmission" value={material.transmission} label="Transmission" onChange={onChange} />
      <Control name="ior" value={material.ior} label="IOR" min={1} max={2.5} step={0.01} onChange={onChange} />
      <Control name="opacity" value={material.opacity} label="Opacity" onChange={onChange} />
    </div>
  );
}
