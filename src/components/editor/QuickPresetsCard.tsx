import React from 'react';
import type { MaterialPreset } from './materialPresets';

type QuickPresetsCardProps = {
  presets: MaterialPreset[];
  onApplyPreset: (preset: MaterialPreset) => void;
};

export function QuickPresetsCard({ presets, onApplyPreset }: QuickPresetsCardProps) {
  return (
    <div className="section-shell px-3 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-100">Quick Presets</div>
        <div className="text-[11px] ui-muted">One-click starter looks</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset(preset)}
            className="ui-chip px-3 py-2 text-left"
          >
            <div className="text-xs font-semibold text-slate-100">{preset.label}</div>
            <div className="text-[11px] ui-muted leading-snug">{preset.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
