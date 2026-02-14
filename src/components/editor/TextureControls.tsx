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

export function TextureControls({ material, onChange, onUploadMap, setMaterial }: TextureControlsProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-white/90 font-medium">Textures</div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/70">Tiling</div>
        <div className="flex items-center gap-2">
          <div className="w-36">
            <Control name="repeatX" value={material.repeatX ?? 1} label="U" min={0.01} max={20} step={0.01} onChange={onChange} />
          </div>
          <div className="w-36">
            <Control name="repeatY" value={material.repeatY ?? 1} label="V" min={0.01} max={20} step={0.01} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/70">Base color map</div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={uploadFromInput('baseColorMap', onUploadMap)} />
          </label>
          {material.baseColorMap && (
            <button
              type="button"
              className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
              onClick={() => setMaterial((prev) => ({ ...prev, baseColorMap: undefined }))}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/70">Normal map</div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={uploadFromInput('normalMap', onUploadMap)} />
          </label>
          {material.normalMap && (
            <>
              <button
                type="button"
                className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
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

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/70">Roughness map</div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={uploadFromInput('roughnessMap', onUploadMap)} />
          </label>
          {material.roughnessMap && (
            <button
              type="button"
              className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
              onClick={() => setMaterial((prev) => ({ ...prev, roughnessMap: undefined }))}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/70">Metalness map</div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={uploadFromInput('metalnessMap', onUploadMap)} />
          </label>
          {material.metalnessMap && (
            <button
              type="button"
              className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
              onClick={() => setMaterial((prev) => ({ ...prev, metalnessMap: undefined }))}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/70">AO map</div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={uploadFromInput('aoMap', onUploadMap)} />
          </label>
          {material.aoMap && (
            <>
              <button
                type="button"
                className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
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

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/70">Emissive map</div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={uploadFromInput('emissiveMap', onUploadMap)} />
          </label>
          {material.emissiveMap && (
            <button
              type="button"
              className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
              onClick={() => setMaterial((prev) => ({ ...prev, emissiveMap: undefined }))}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/70">Opacity (alpha) map</div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full cursor-pointer">
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={uploadFromInput('alphaMap', onUploadMap)} />
          </label>
          {material.alphaMap && (
            <>
              <button
                type="button"
                className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full"
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
