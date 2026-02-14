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
import { APP_COMMAND_EVENT, type AppCommandEventDetail } from '../types/commands';

type MaterialPreset = {
  id: string;
  label: string;
  description: string;
  values: Partial<MaterialDraft>;
};

const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'brushed-metal',
    label: 'Brushed Metal',
    description: 'Reflective and premium',
    values: {
      color: '#9ca7bc',
      metalness: 0.96,
      roughness: 0.22,
      clearcoat: 0.15,
      clearcoatRoughness: 0.08,
      transmission: 0,
      opacity: 1,
    },
  },
  {
    id: 'frosted-glass',
    label: 'Frosted Glass',
    description: 'Soft translucent look',
    values: {
      color: '#dcefff',
      metalness: 0,
      roughness: 0.16,
      transmission: 0.95,
      ior: 1.45,
      clearcoat: 0.22,
      clearcoatRoughness: 0.12,
      opacity: 1,
    },
  },
  {
    id: 'matte-clay',
    label: 'Matte Clay',
    description: 'Warm product mockups',
    values: {
      color: '#b77f63',
      metalness: 0,
      roughness: 0.88,
      clearcoat: 0,
      transmission: 0,
      opacity: 1,
    },
  },
  {
    id: 'neon-polymer',
    label: 'Neon Polymer',
    description: 'Glow-focused accent',
    values: {
      color: '#1f6cff',
      emissive: '#00e6ff',
      emissiveIntensity: 0.82,
      metalness: 0.38,
      roughness: 0.32,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
      transmission: 0,
      opacity: 1,
    },
  },
];

const checkboxClass =
  'h-3.5 w-3.5 rounded border border-cyan-100/40 bg-slate-950/55 text-cyan-300 focus:ring-2 focus:ring-cyan-300/35';
const ONBOARDING_SEEN_KEY = 'materialExplorerOnboardingSeen';

const MaterialEditor: React.FC = () => {
  const { materials, addMaterial, addMaterials, updateMaterial, selectedMaterial, startNewMaterial } = useMaterials();
  const previewRef = useRef<MaterialPreviewHandle>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
  const [previewAutoEnable, setPreviewAutoEnable] = useState<boolean>(() => window.localStorage.getItem('previewAutoEnable') === 'true');
  const [previewEnabled, setPreviewEnabled] = useState<boolean>(() => {
    if (window.localStorage.getItem('previewAutoEnable') === 'true') return true;
    return window.localStorage.getItem('previewEnabled') === 'true';
  });
  const [compareOn, setCompareOn] = useState(false);
  const [compareA, setCompareA] = useState<MaterialDraft | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => window.localStorage.getItem(ONBOARDING_SEEN_KEY) !== 'true'
  );

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
  useEffect(() => {
    window.localStorage.setItem('previewAutoEnable', previewAutoEnable ? 'true' : 'false');
  }, [previewAutoEnable]);

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

  const enablePreviewNow = () => {
    setPreviewEnabled(true);
  };

  const enablePreviewAlways = () => {
    setPreviewAutoEnable(true);
    setPreviewEnabled(true);
  };

  const handlePreviewEnabledToggle = (enabled: boolean) => {
    setPreviewEnabled(enabled);
    if (!enabled) setPreviewAutoEnable(false);
  };

  const handlePreviewAutoEnableToggle = (enabled: boolean) => {
    setPreviewAutoEnable(enabled);
    if (enabled) setPreviewEnabled(true);
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

  const applyPreset = (preset: MaterialPreset) => {
    setMaterial((prev) => ({
      ...prev,
      ...preset.values,
      name: prev.name?.trim() ? prev.name : preset.label,
      updatedAt: Date.now(),
    }));
  };

  const saveMaterial = () => {
    const now = Date.now();
    const full = createMaterialFromDraft({
      ...material,
      updatedAt: now,
      ...(material.id ? {} : { createdAt: now }),
    });

    if (material.id) updateMaterial(full);
    else addMaterial(full);
  };

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    window.localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
  };

  const startBlankFromOnboarding = () => {
    startNewMaterial();
    dismissOnboarding();
  };

  const addStarterKit = () => {
    const now = Date.now();
    const starter = MATERIAL_PRESETS.map((preset, index) =>
      createMaterialFromDraft({
        ...DEFAULT_MATERIAL_DRAFT,
        ...preset.values,
        name: preset.label,
        tags: ['starter', ...(preset.id === 'frosted-glass' ? ['glass'] : [])],
        createdAt: now + index,
        updatedAt: now + index,
      })
    );
    addMaterials(starter);
    startNewMaterial();
    dismissOnboarding();
  };

  useEffect(() => {
    const onCommand = (event: Event) => {
      const customEvent = event as CustomEvent<AppCommandEventDetail>;
      const action = customEvent.detail?.action;
      if (!action) return;

      if (action === 'save-material') {
        saveMaterial();
        return;
      }
      if (action === 'toggle-preview') {
        setPreviewEnabled((prev) => {
          const next = !prev;
          if (!next) setPreviewAutoEnable(false);
          return next;
        });
        return;
      }
      if (action === 'toggle-compare') {
        if (compareA) {
          setCompareOn((prev) => !prev);
          return;
        }
        setCompareA(JSON.parse(JSON.stringify(material)) as MaterialDraft);
        setCompareOn(true);
        return;
      }
      if (action === 'focus-material-name') {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
        return;
      }
      if (action === 'open-onboarding') {
        setShowOnboarding(true);
        window.localStorage.removeItem(ONBOARDING_SEEN_KEY);
      }
    };

    window.addEventListener(APP_COMMAND_EVENT, onCommand as EventListener);
    return () => window.removeEventListener(APP_COMMAND_EVENT, onCommand as EventListener);
  }, [compareA, material, saveMaterial]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-[1240px] mx-auto p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
          <section className="order-1 lg:order-2 space-y-3">
            {showOnboarding && materials.length === 0 && (
              <motion.div
                className="section-shell px-4 py-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-sm font-semibold text-slate-100">Welcome to Material Explorer</div>
                <div className="mt-1 text-xs ui-muted">
                  Start fast with a polished starter kit or jump straight into a blank material.
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" className="ui-btn ui-btn-primary px-3 py-1.5 text-xs" onClick={addStarterKit}>
                    Add Starter Kit
                  </button>
                  <button type="button" className="ui-btn px-3 py-1.5 text-xs" onClick={startBlankFromOnboarding}>
                    Start Blank
                  </button>
                  <button type="button" className="ui-btn px-3 py-1.5 text-xs" onClick={dismissOnboarding}>
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            )}
            <div className="section-shell px-4 py-3">
              <div className="text-sm font-semibold text-slate-100">Live Material Lab</div>
              <div className="text-xs ui-muted">Tune values in real time and compare before committing changes.</div>
            </div>
            <PreviewCompare
              compareOn={compareOn}
              compareA={compareA}
              material={material}
              previewRef={previewRef}
              previewEnabled={previewEnabled}
              previewAutoEnable={previewAutoEnable}
              onEnablePreview={enablePreviewNow}
              onAlwaysEnablePreview={enablePreviewAlways}
              previewEnv={previewEnv}
              previewModel={previewModel}
              autoRotate={autoRotate}
              enableZoom={enableZoom}
              showGrid={showGrid}
              showBackground={showBackground}
            />
          </section>

          <motion.section
            className="order-2 lg:order-1 w-full lg:w-[420px] glass-panel rounded-2xl px-4 py-3 lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="lg:sticky lg:top-0 z-20 bg-[#0d1428]/80 rounded-xl backdrop-blur-md p-3 section-shell space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Preview Controls</div>
                  <div className="text-xs ui-muted">Model, lighting, and camera behavior.</div>
                </div>
              </div>

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

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200/85 select-none">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className={checkboxClass}
                  />
                  Auto-rotate
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={previewEnabled}
                    onChange={(e) => handlePreviewEnabledToggle(e.target.checked)}
                    className={checkboxClass}
                  />
                  3D
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={previewAutoEnable}
                    onChange={(e) => handlePreviewAutoEnableToggle(e.target.checked)}
                    className={checkboxClass}
                  />
                  Always on startup
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enableZoom}
                    onChange={(e) => setEnableZoom(e.target.checked)}
                    className={checkboxClass}
                  />
                  Zoom
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className={checkboxClass}
                  />
                  Grid
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showBackground}
                    onChange={(e) => setShowBackground(e.target.checked)}
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
                <button
                  type="button"
                  className="ui-btn px-3 py-2 text-sm"
                  disabled={!previewEnabled}
                  onClick={() => previewRef.current?.resetView()}
                >
                  Reset view
                </button>
                <button
                  type="button"
                  className="ui-btn px-3 py-2 text-sm"
                  disabled={!previewEnabled}
                  onClick={async () => {
                    const blob = await previewRef.current?.snapshotPng();
                    if (!blob) return;
                    downloadBlob(`${(material.name || 'material').trim() || 'material'}.png`, blob);
                  }}
                >
                  Snapshot (PNG)
                </button>
                <button
                  type="button"
                  className="ui-btn px-3 py-2 text-sm"
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
                  className="ui-btn px-3 py-2 text-sm"
                  onClick={() => setCompareOn((v) => !v)}
                  disabled={!compareA}
                  title="Toggle A/B comparison"
                >
                  {compareOn ? 'Hide Compare' : 'Compare'}
                </button>
                <button
                  type="button"
                  className="ui-btn px-3 py-2 text-sm"
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
                  className="ui-btn px-3 py-2 text-sm"
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

            <div className="section-shell px-3 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-100">Quick Presets</div>
                <div className="text-[11px] ui-muted">One-click starter looks</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MATERIAL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="ui-chip px-3 py-2 text-left"
                  >
                    <div className="text-xs font-semibold text-slate-100">{preset.label}</div>
                    <div className="text-[11px] ui-muted leading-snug">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="section-shell px-3 py-3 space-y-3">
              <div className="space-y-2">
                <label className="ui-label" htmlFor="material-name">Name</label>
                <input
                  ref={nameInputRef}
                  id="material-name"
                  type="text"
                  name="name"
                  value={material.name ?? ''}
                  onChange={handleChange}
                  placeholder="Untitled"
                  className="ui-input px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="ui-label" htmlFor="material-favorite">Favorite</label>
                <input
                  id="material-favorite"
                  type="checkbox"
                  checked={!!material.favorite}
                  onChange={(e) => setMaterial((prev) => ({ ...prev, favorite: e.target.checked }))}
                  className={checkboxClass}
                />
              </div>

              <div className="space-y-2">
                <label className="ui-label" htmlFor="material-tags">Tags</label>
                <input
                  id="material-tags"
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
                  className="ui-input px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="section-shell px-3 py-3 space-y-4">
              <label className="ui-label">Material Color</label>
              <div className="flex items-center gap-4">
                <motion.div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-100/20">
                  <input
                    type="color"
                    name="color"
                    value={material.color}
                    onChange={handleChange}
                    aria-label="Material color"
                    className="absolute inset-0 w-full h-full cursor-pointer border-0"
                  />
                </motion.div>
                <div
                  className="flex-1 h-12 rounded-xl border border-slate-100/20"
                  style={{ backgroundColor: material.color }}
                />
              </div>
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

            <div className="section-shell px-3 py-3 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <label className="ui-label">Emissive</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="emissive"
                    value={material.emissive ?? '#000000'}
                    onChange={handleChange}
                    aria-label="Emissive color"
                    className="w-10 h-10 cursor-pointer border border-slate-100/20 rounded-md bg-transparent"
                  />
                  <Control
                    name="emissiveIntensity"
                    value={material.emissiveIntensity}
                    label="Intensity"
                    onChange={handleChange}
                  />
                </div>
              </div>

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
              className="ui-btn ui-btn-primary w-full py-2.5 text-sm"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={saveMaterial}
            >
              {material.id ? 'Update Material' : 'Save Material'}
            </motion.button>

            {material.id && (
              <motion.button
                className="ui-btn w-full py-2.5 text-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => startNewMaterial()}
              >
                New Material
              </motion.button>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default MaterialEditor;
