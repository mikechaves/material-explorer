import React from 'react';
import type { MaterialDraft } from '../../types/material';
import { Control } from './EditorFields';

type TextureControlsProps = {
  material: MaterialDraft;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadMap: (key: keyof MaterialDraft, file: File) => Promise<void>;
  setMaterial: React.Dispatch<React.SetStateAction<MaterialDraft>>;
};

function uploadFromInput(
  key: keyof MaterialDraft,
  onUploadMap: (key: keyof MaterialDraft, file: File) => Promise<void>
) {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onUploadMap(key, file);
    event.target.value = '';
  };
}

function UploadButton({ onChange }: { onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="ui-btn px-3 py-1.5 text-xs font-semibold cursor-pointer">
      Upload
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
    </label>
  );
}

const rowClass = 'section-shell px-3 py-3 flex items-start justify-between gap-3';
const actionClass = 'ui-btn px-3 py-1.5 text-xs font-semibold';

export function TextureControls({ material, onChange, onUploadMap, setMaterial }: TextureControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-100">Textures</div>
          <div className="text-xs ui-muted">Maps, tiling, and advanced material detail.</div>
        </div>
      </div>

      <div className={rowClass}>
        <div>
          <div className="text-sm text-slate-100 font-semibold">Tiling</div>
          <div className="text-xs ui-muted">Repeat controls for UV axis.</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-44">
            <Control name="repeatX" value={material.repeatX ?? 1} label="U" min={0.01} max={20} step={0.01} onChange={onChange} />
          </div>
          <div className="w-44">
            <Control name="repeatY" value={material.repeatY ?? 1} label="V" min={0.01} max={20} step={0.01} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className={rowClass}>
        <div className="text-sm text-slate-100">Base color map</div>
        <div className="flex items-center gap-2">
          <UploadButton onChange={uploadFromInput('baseColorMap', onUploadMap)} />
          {material.baseColorMap && (
            <button
              type="button"
              className={actionClass}
              onClick={() => setMaterial((prev) => ({ ...prev, baseColorMap: undefined }))}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className={rowClass}>
        <div className="text-sm text-slate-100">Normal map</div>
        <div className="flex items-center gap-2">
          <UploadButton onChange={uploadFromInput('normalMap', onUploadMap)} />
          {material.normalMap && (
            <>
              <button
                type="button"
                className={actionClass}
                onClick={() => setMaterial((prev) => ({ ...prev, normalMap: undefined }))}
              >
                Remove
              </button>
              <div className="w-44">
                <Control
                  name="normalScale"
                  value={material.normalScale ?? 1}
                  label="Scale"
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={onChange}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className={rowClass}>
        <div className="text-sm text-slate-100">Roughness map</div>
        <div className="flex items-center gap-2">
          <UploadButton onChange={uploadFromInput('roughnessMap', onUploadMap)} />
          {material.roughnessMap && (
            <button
              type="button"
              className={actionClass}
              onClick={() => setMaterial((prev) => ({ ...prev, roughnessMap: undefined }))}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className={rowClass}>
        <div className="text-sm text-slate-100">Metalness map</div>
        <div className="flex items-center gap-2">
          <UploadButton onChange={uploadFromInput('metalnessMap', onUploadMap)} />
          {material.metalnessMap && (
            <button
              type="button"
              className={actionClass}
              onClick={() => setMaterial((prev) => ({ ...prev, metalnessMap: undefined }))}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className={rowClass}>
        <div className="text-sm text-slate-100">AO map</div>
        <div className="flex items-center gap-2">
          <UploadButton onChange={uploadFromInput('aoMap', onUploadMap)} />
          {material.aoMap && (
            <>
              <button
                type="button"
                className={actionClass}
                onClick={() => setMaterial((prev) => ({ ...prev, aoMap: undefined }))}
              >
                Remove
              </button>
              <div className="w-44">
                <Control name="aoIntensity" value={material.aoIntensity ?? 1} label="Strength" min={0} max={2} step={0.01} onChange={onChange} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className={rowClass}>
        <div className="text-sm text-slate-100">Emissive map</div>
        <div className="flex items-center gap-2">
          <UploadButton onChange={uploadFromInput('emissiveMap', onUploadMap)} />
          {material.emissiveMap && (
            <button
              type="button"
              className={actionClass}
              onClick={() => setMaterial((prev) => ({ ...prev, emissiveMap: undefined }))}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className={rowClass}>
        <div className="text-sm text-slate-100">Opacity (alpha) map</div>
        <div className="flex items-center gap-2">
          <UploadButton onChange={uploadFromInput('alphaMap', onUploadMap)} />
          {material.alphaMap && (
            <>
              <button
                type="button"
                className={actionClass}
                onClick={() => setMaterial((prev) => ({ ...prev, alphaMap: undefined }))}
              >
                Remove
              </button>
              <div className="w-44">
                <Control name="alphaTest" value={material.alphaTest ?? 0} label="Cutoff" min={0} max={1} step={0.01} onChange={onChange} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
