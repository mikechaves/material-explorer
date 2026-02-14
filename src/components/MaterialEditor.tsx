import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMaterials } from '../contexts/MaterialContext';
import type { MaterialPreviewHandle } from './MaterialPreview';
import type { MaterialDraft } from '../types/material';
import { createMaterialFromDraft, clamp01, coerceMaterialDraft, DEFAULT_MATERIAL_DRAFT, downloadBlob } from '../utils/material';
import { decodeSharePayload, encodeSharePayloadV2 } from '../utils/share';
import { Dropdown, Control, type PreviewModel, type PreviewEnv, PREVIEW_MODEL_OPTIONS, PREVIEW_ENV_OPTIONS } from './editor/EditorFields';
import { PreviewCompare } from './editor/PreviewCompare';
import { TextureControls } from './editor/TextureControls';

const MaterialEditor: React.FC = () => {
  const { addMaterial, updateMaterial, selectedMaterial, startNewMaterial } = useMaterials();
  const previewRef = useRef<MaterialPreviewHandle>(null);

  const emptyDraft: MaterialDraft = React.useMemo(
    () => ({ ...DEFAULT_MATERIAL_DRAFT }),
    []
  );

  const [material, setMaterial] = useState<MaterialDraft>(emptyDraft);
  const [previewModel, setPreviewModel] = useState<PreviewModel>(() => {
    const v = window.localStorage.getItem('previewModel');
    if (v === 'sphere' || v === 'box' || v === 'torusKnot' || v === 'icosahedron') return v;
    return 'sphere';
  });
  const [previewEnv, setPreviewEnv] = useState<PreviewEnv>(() => {
    const v = window.localStorage.getItem('previewEnv');
    if (v === 'warehouse' || v === 'studio' || v === 'city' || v === 'sunset' || v === 'dawn' || v === 'night' || v === 'forest' || v === 'apartment' || v === 'park' || v === 'lobby')
      return v;
    return 'warehouse';
  });
  const [autoRotate, setAutoRotate] = useState<boolean>(() => window.localStorage.getItem('previewAutoRotate') !== 'false');
  const [enableZoom, setEnableZoom] = useState<boolean>(() => window.localStorage.getItem('previewEnableZoom') === 'true');
  const [showGrid, setShowGrid] = useState<boolean>(() => window.localStorage.getItem('previewShowGrid') === 'true');
  const [showBackground, setShowBackground] = useState<boolean>(() => window.localStorage.getItem('previewShowBackground') !== 'false');
  const [previewEnabled, setPreviewEnabled] = useState<boolean>(() => window.localStorage.getItem('previewEnabled') === 'true');
  const [compareOn, setCompareOn] = useState(false);
  const [compareA, setCompareA] = useState<MaterialDraft | null>(null);

  useEffect(() => {
    if (selectedMaterial) setMaterial(selectedMaterial);
    else setMaterial(emptyDraft);
  }, [selectedMaterial, emptyDraft]);

  // Load from share URL (?m=...)
  useEffect(() => {
    const url = new URL(window.location.href);
    const m = url.searchParams.get('m');
    if (!m) return;
    const payload = decodeSharePayload(m);
    if (!payload) return;
    startNewMaterial();
    setMaterial(coerceMaterialDraft(payload.material, emptyDraft));
    // keep URL clean after applying
    url.searchParams.delete('m');
    window.history.replaceState({}, '', url.toString());
  }, [startNewMaterial, emptyDraft]);

  useEffect(() => {
    window.localStorage.setItem('previewModel', previewModel);
  }, [previewModel]);
  useEffect(() => {
    window.localStorage.setItem('previewEnv', previewEnv);
  }, [previewEnv]);
  useEffect(() => {
    window.localStorage.setItem('previewAutoRotate', autoRotate ? 'true' : 'false');
  }, [autoRotate]);
  useEffect(() => {
    window.localStorage.setItem('previewEnableZoom', enableZoom ? 'true' : 'false');
  }, [enableZoom]);
  useEffect(() => {
    window.localStorage.setItem('previewShowGrid', showGrid ? 'true' : 'false');
  }, [showGrid]);
  useEffect(() => {
    window.localStorage.setItem('previewShowBackground', showBackground ? 'true' : 'false');
  }, [showBackground]);
  useEffect(() => {
    window.localStorage.setItem('previewEnabled', previewEnabled ? 'true' : 'false');
  }, [previewEnabled]);

  const copyShareLink = async (url: string, successMessage: string) => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(url);
      window.alert(successMessage);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newValue = (() => {
      if (name === 'name') return value;
      if (name === 'color') return value;
      if (name === 'emissive') return value;
      const parsed = Number.parseFloat(value);
      if (!Number.isFinite(parsed)) return null;
      if (name === 'ior') return Math.max(1, Math.min(2.5, parsed));
      if (name === 'normalScale') return Math.max(0, Math.min(2, parsed));
      if (name === 'aoIntensity') return Math.max(0, Math.min(2, parsed));
      if (name === 'alphaTest') return Math.max(0, Math.min(1, parsed));
      if (name === 'repeatX') return Math.max(0.01, Math.min(20, parsed));
      if (name === 'repeatY') return Math.max(0.01, Math.min(20, parsed));
      return clamp01(parsed);
    })();

    if (newValue === null) return;
    setMaterial(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const uploadMap = async (key: keyof MaterialDraft, file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    setMaterial((prev) => ({ ...prev, [key]: dataUrl }));
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8 max-w-6xl mx-auto p-4 sm:p-6">
        {/* Preview first on mobile, right on desktop */}
        <div className="order-1 lg:order-2">
          <PreviewCompare
            compareOn={compareOn}
            compareA={compareA}
            material={material}
            previewRef={previewRef}
            previewEnabled={previewEnabled}
            onEnablePreview={() => setPreviewEnabled(true)}
            previewEnv={previewEnv}
            previewModel={previewModel}
            autoRotate={autoRotate}
            enableZoom={enableZoom}
            showGrid={showGrid}
            showBackground={showBackground}
          />
        </div>

        {/* Controls */}
        <motion.div
          className="order-2 lg:order-1 w-full lg:w-[420px] bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="lg:sticky lg:top-0 z-20 bg-black/60 backdrop-blur-sm pt-1 pb-3">
            <div className="space-y-3">
            <div className="text-sm text-white/90 font-medium">Preview</div>
            <div className="flex items-center gap-2">
              <Dropdown
                value={previewModel}
                onChange={setPreviewModel}
                options={PREVIEW_MODEL_OPTIONS}
              />
              <Dropdown
                value={previewEnv}
                onChange={setPreviewEnv}
                options={PREVIEW_ENV_OPTIONS}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-white/80 select-none">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
              />
              Auto-rotate
            </label>

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 select-none">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={previewEnabled}
                  onChange={(e) => setPreviewEnabled(e.target.checked)}
                />
                3D
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableZoom}
                  onChange={(e) => setEnableZoom(e.target.checked)}
                />
                Zoom
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                Grid
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showBackground}
                  onChange={(e) => setShowBackground(e.target.checked)}
                />
                Background
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white/90"
                disabled={!previewEnabled}
                onClick={() => previewRef.current?.resetView()}
              >
                Reset view
              </button>
              <button
                type="button"
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white/90"
                disabled={!previewEnabled}
                onClick={async () => {
                  const blob = await previewRef.current?.snapshotPng();
                  if (!blob) return;
                  downloadBlob(`${(material.name || 'material').trim() || 'material'}.png`, blob);
                }}
              >
                Snapshot (PNG)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white/90"
                onClick={() => {
                  setCompareA(JSON.parse(JSON.stringify(material)) as MaterialDraft);
                  setCompareOn(true);
                }}
                disabled={compareOn && !!compareA}
                title="Capture current settings as A"
              >
                Set A
              </button>
              <button
                type="button"
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white/90"
                onClick={() => setCompareOn((v) => !v)}
                disabled={!compareA}
                title="Toggle A/B comparison"
              >
                {compareOn ? 'Hide Compare' : 'Compare'}
              </button>
              <button
                type="button"
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white/90"
                onClick={async () => {
                  const { baseColorMap, normalMap, roughnessMap, metalnessMap, aoMap, emissiveMap, alphaMap, ...rest } =
                    material;
                  const payload = encodeSharePayloadV2({ v: 2, includeTextures: false, material: rest });
                  const url = new URL(window.location.href);
                  url.searchParams.set('m', payload);
                  await copyShareLink(url.toString(), 'Share link copied (no textures).');
                }}
              >
                Share link
              </button>
              <button
                type="button"
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white/90"
                onClick={async () => {
                  const payload = encodeSharePayloadV2({ v: 2, includeTextures: true, material });
                  const url = new URL(window.location.href);
                  url.searchParams.set('m', payload);

                  // Safety: URLs beyond ~8k chars can break in some contexts.
                  if (url.toString().length > 8000) {
                    window.alert(
                      'That share link is too large (textures make URLs huge). Use Export JSON for sharing textures instead.'
                    );
                    return;
                  }

                  await copyShareLink(url.toString(), 'Share link copied (with textures).');
                }}
              >
                Share + tex
              </button>
            </div>
          </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/90">Name</label>
            <input
              type="text"
              name="name"
              value={material.name ?? ''}
              onChange={handleChange}
              placeholder="Untitled"
              className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white/90 outline-none
                         focus:bg-white/10 border border-white/5 focus:border-purple-500/30"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="text-sm text-white/90">Favorite</label>
            <input
              type="checkbox"
              checked={!!material.favorite}
              onChange={(e) => setMaterial((prev) => ({ ...prev, favorite: e.target.checked }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/90">Tags</label>
            <input
              type="text"
              value={(material.tags ?? []).join(', ')}
              onChange={(e) => {
                const tags = e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean);
                setMaterial((prev) => ({ ...prev, tags }));
              }}
              placeholder="e.g. glass, carpaint, fabric"
              className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white/90 outline-none
                         focus:bg-white/10 border border-white/5 focus:border-purple-500/30"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm text-white/90">Material Color</label>
            <div className="flex items-center gap-4">
              <motion.div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <input
                  type="color"
                  name="color"
                  value={material.color}
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full cursor-pointer border-0"
                />
              </motion.div>
              <div 
                className="flex-1 h-12 rounded-lg"
                style={{ backgroundColor: material.color }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Control 
              name="metalness" 
              value={material.metalness} 
              label="Metalness" 
              onChange={handleChange}
            />
            <Control 
              name="roughness" 
              value={material.roughness} 
              label="Roughness" 
              onChange={handleChange}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm text-white/90 font-medium">Emissive</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="emissive"
                  value={material.emissive ?? '#000000'}
                  onChange={handleChange}
                  className="w-10 h-10 cursor-pointer border-0 bg-transparent"
                />
                <Control
                  name="emissiveIntensity"
                  value={material.emissiveIntensity}
                  label="Intensity"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Control
              name="clearcoat"
              value={material.clearcoat}
              label="Clearcoat"
              onChange={handleChange}
            />
            <Control
              name="clearcoatRoughness"
              value={material.clearcoatRoughness}
              label="Clearcoat Roughness"
              onChange={handleChange}
            />
          </div>

          <div className="space-y-4">
            <Control
              name="transmission"
              value={material.transmission}
              label="Transmission"
              onChange={handleChange}
            />
            <Control
              name="ior"
              value={material.ior}
              label="IOR"
              min={1}
              max={2.5}
              step={0.01}
              onChange={handleChange}
            />
            <Control
              name="opacity"
              value={material.opacity}
              label="Opacity"
              onChange={handleChange}
            />
          </div>

          <TextureControls material={material} onChange={handleChange} onUploadMap={uploadMap} setMaterial={setMaterial} />

          <motion.button
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg
                     text-white text-sm font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const now = Date.now();
              const full = createMaterialFromDraft({
                ...material,
                updatedAt: now,
                ...(material.id ? {} : { createdAt: now }),
              });

              if (material.id) updateMaterial(full);
              else addMaterial(full);
            }}
          >
            {material.id ? 'Update Material' : 'Save Material'}
          </motion.button>

          {material.id && (
            <motion.button
              className="w-full py-2 bg-white/10 hover:bg-white/15 rounded-lg
                       text-white text-sm font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startNewMaterial()}
            >
              New Material
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MaterialEditor;
