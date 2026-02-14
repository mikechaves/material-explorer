import React from 'react';
import {
  Dropdown,
  type PreviewEnv,
  type PreviewModel,
  PREVIEW_ENV_OPTIONS,
  PREVIEW_MODEL_OPTIONS,
} from './EditorFields';

type PreviewControlsCardProps = {
  previewModel: PreviewModel;
  previewEnv: PreviewEnv;
  autoRotate: boolean;
  previewEnabled: boolean;
  previewAutoEnable: boolean;
  enableZoom: boolean;
  showGrid: boolean;
  showBackground: boolean;
  compareOn: boolean;
  hasCompareReference: boolean;
  checkboxClass: string;
  onPreviewModelChange: (value: PreviewModel) => void;
  onPreviewEnvChange: (value: PreviewEnv) => void;
  onAutoRotateChange: (enabled: boolean) => void;
  onPreviewEnabledToggle: (enabled: boolean) => void;
  onPreviewAutoEnableToggle: (enabled: boolean) => void;
  onEnableZoomChange: (enabled: boolean) => void;
  onShowGridChange: (enabled: boolean) => void;
  onShowBackgroundChange: (enabled: boolean) => void;
  onResetView: () => void;
  onSnapshot: () => void;
  onSetCompareA: () => void;
  onToggleCompare: () => void;
  onShareLink: () => void;
  onShareWithTextures: () => void;
};

export function PreviewControlsCard({
  previewModel,
  previewEnv,
  autoRotate,
  previewEnabled,
  previewAutoEnable,
  enableZoom,
  showGrid,
  showBackground,
  compareOn,
  hasCompareReference,
  checkboxClass,
  onPreviewModelChange,
  onPreviewEnvChange,
  onAutoRotateChange,
  onPreviewEnabledToggle,
  onPreviewAutoEnableToggle,
  onEnableZoomChange,
  onShowGridChange,
  onShowBackgroundChange,
  onResetView,
  onSnapshot,
  onSetCompareA,
  onToggleCompare,
  onShareLink,
  onShareWithTextures,
}: PreviewControlsCardProps) {
  return (
    <div className="lg:sticky lg:top-0 z-20 bg-[#0d1428]/80 rounded-xl backdrop-blur-md p-3 section-shell space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-100">Preview Controls</div>
          <div className="text-xs ui-muted">Model, lighting, and camera behavior.</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Dropdown value={previewModel} onChange={onPreviewModelChange} options={PREVIEW_MODEL_OPTIONS} />
        <Dropdown value={previewEnv} onChange={onPreviewEnvChange} options={PREVIEW_ENV_OPTIONS} />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200/85 select-none">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(event) => onAutoRotateChange(event.target.checked)}
            className={checkboxClass}
          />
          Auto-rotate
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={previewEnabled}
            onChange={(event) => onPreviewEnabledToggle(event.target.checked)}
            className={checkboxClass}
          />
          3D
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={previewAutoEnable}
            onChange={(event) => onPreviewAutoEnableToggle(event.target.checked)}
            className={checkboxClass}
          />
          Always on startup
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableZoom}
            onChange={(event) => onEnableZoomChange(event.target.checked)}
            className={checkboxClass}
          />
          Zoom
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(event) => onShowGridChange(event.target.checked)}
            className={checkboxClass}
          />
          Grid
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showBackground}
            onChange={(event) => onShowBackgroundChange(event.target.checked)}
            className={checkboxClass}
          />
          Background
        </label>
      </div>

      {!previewEnabled && (
        <div className="text-[11px] text-slate-200/70 leading-relaxed">
          3D preview is disabled to keep first load fast. Enable it when you need interactive lighting or snapshots.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="ui-btn px-3 py-2 text-sm" disabled={!previewEnabled} onClick={onResetView}>
          Reset view
        </button>
        <button type="button" className="ui-btn px-3 py-2 text-sm" disabled={!previewEnabled} onClick={onSnapshot}>
          Snapshot (PNG)
        </button>
        <button
          type="button"
          className="ui-btn px-3 py-2 text-sm"
          onClick={onSetCompareA}
          disabled={compareOn && hasCompareReference}
          title="Capture current settings as A"
        >
          Set A
        </button>
        <button
          type="button"
          className="ui-btn px-3 py-2 text-sm"
          onClick={onToggleCompare}
          disabled={!hasCompareReference}
          title="Toggle A/B comparison"
        >
          {compareOn ? 'Hide Compare' : 'Compare'}
        </button>
        <button type="button" className="ui-btn px-3 py-2 text-sm" onClick={onShareLink}>
          Share link
        </button>
        <button type="button" className="ui-btn px-3 py-2 text-sm" onClick={onShareWithTextures}>
          Share + tex
        </button>
      </div>
    </div>
  );
}
