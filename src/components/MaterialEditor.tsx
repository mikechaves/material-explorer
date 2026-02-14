import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMaterials } from '../contexts/MaterialContext';
import type { MaterialPreviewHandle } from './MaterialPreview';
import type { MaterialDraft } from '../types/material';
import { createMaterialFromDraft, clamp01, coerceMaterialDraft, DEFAULT_MATERIAL_DRAFT, downloadBlob } from '../utils/material';
import { decodeSharePayload, encodeSharePayloadV2 } from '../utils/share';
import { Control, type PreviewModel, type PreviewEnv } from './editor/EditorFields';
import { PreviewCompare } from './editor/PreviewCompare';
import { TextureControls } from './editor/TextureControls';
import { APP_COMMAND_EVENT, type AppCommandEventDetail } from '../types/commands';
import { ONBOARDING_SEEN_KEY, MATERIAL_PRESETS, EDITOR_CHECKBOX_CLASS, type MaterialPreset } from './editor/materialPresets';
import { OnboardingCard } from './editor/OnboardingCard';
import { QuickPresetsCard } from './editor/QuickPresetsCard';
import { PreviewControlsCard } from './editor/PreviewControlsCard';

const HISTORY_LIMIT = 120;
const DRAFT_COMPARE_KEYS: Array<keyof MaterialDraft> = [
  'id',
  'name',
  'favorite',
  'tags',
  'color',
  'metalness',
  'roughness',
  'emissive',
  'emissiveIntensity',
  'clearcoat',
  'clearcoatRoughness',
  'transmission',
  'ior',
  'opacity',
  'baseColorMap',
  'normalMap',
  'normalScale',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'alphaMap',
  'aoIntensity',
  'alphaTest',
  'repeatX',
  'repeatY',
  'createdAt',
  'updatedAt',
];

function cloneDraft(draft: MaterialDraft): MaterialDraft {
  if (typeof structuredClone === 'function') return structuredClone(draft);
  return JSON.parse(JSON.stringify(draft)) as MaterialDraft;
}

function areStringArraysEqual(a: string[] | undefined, b: string[] | undefined) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function areDraftsEqual(a: MaterialDraft, b: MaterialDraft) {
  return DRAFT_COMPARE_KEYS.every((key) => {
    if (key === 'tags') return areStringArraysEqual(a.tags, b.tags);
    return a[key] === b[key];
  });
}

const MaterialEditor: React.FC = () => {
  const { materials, addMaterial, addMaterials, updateMaterial, selectedMaterial, startNewMaterial } = useMaterials();
  const previewRef = useRef<MaterialPreviewHandle>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const emptyDraft: MaterialDraft = React.useMemo(
    () => ({ ...DEFAULT_MATERIAL_DRAFT }),
    []
  );

  const [material, setMaterial] = useState<MaterialDraft>(emptyDraft);
  const [undoStack, setUndoStack] = useState<MaterialDraft[]>([]);
  const [redoStack, setRedoStack] = useState<MaterialDraft[]>([]);
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

  const setMaterialWithHistory = React.useCallback((nextState: React.SetStateAction<MaterialDraft>) => {
    setMaterial((prev) => {
      const next =
        typeof nextState === 'function'
          ? (nextState as (prevState: MaterialDraft) => MaterialDraft)(prev)
          : nextState;
      if (next === prev) return prev;
      setUndoStack((stack) => {
        const nextStack = [...stack, cloneDraft(prev)];
        if (nextStack.length > HISTORY_LIMIT) nextStack.shift();
        return nextStack;
      });
      setRedoStack([]);
      return next;
    });
  }, []);

  const undoMaterialChange = React.useCallback(() => {
    setUndoStack((stack) => {
      const previous = stack[stack.length - 1];
      if (!previous) return stack;
      setMaterial((current) => {
        setRedoStack((future) => {
          const nextFuture = [...future, cloneDraft(current)];
          if (nextFuture.length > HISTORY_LIMIT) nextFuture.shift();
          return nextFuture;
        });
        return cloneDraft(previous);
      });
      return stack.slice(0, -1);
    });
  }, []);

  const redoMaterialChange = React.useCallback(() => {
    setRedoStack((stack) => {
      const next = stack[stack.length - 1];
      if (!next) return stack;
      setMaterial((current) => {
        setUndoStack((past) => {
          const nextPast = [...past, cloneDraft(current)];
          if (nextPast.length > HISTORY_LIMIT) nextPast.shift();
          return nextPast;
        });
        return cloneDraft(next);
      });
      return stack.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    if (selectedMaterial) setMaterial(cloneDraft(selectedMaterial));
    else setMaterial(cloneDraft(emptyDraft));
    setUndoStack([]);
    setRedoStack([]);
  }, [selectedMaterial, emptyDraft]);

  // Load from share URL (?m=...)
  useEffect(() => {
    const url = new URL(window.location.href);
    const m = url.searchParams.get('m');
    if (!m) return;
    const payload = decodeSharePayload(m);
    if (!payload) return;
    startNewMaterial();
    setMaterial(cloneDraft(coerceMaterialDraft(payload.material, emptyDraft)));
    setUndoStack([]);
    setRedoStack([]);
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
    const field = name as keyof MaterialDraft;
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
    setMaterialWithHistory((prev) => {
      if (prev[field] === newValue) return prev;
      return {
        ...prev,
        [field]: newValue,
      };
    });
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
    setMaterialWithHistory((prev) => {
      if (prev[key] === dataUrl) return prev;
      return { ...prev, [key]: dataUrl };
    });
  };

  const applyPreset = (preset: MaterialPreset) => {
    setMaterialWithHistory((prev) => ({
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
      if (action === 'undo-material-change') {
        undoMaterialChange();
        return;
      }
      if (action === 'redo-material-change') {
        redoMaterialChange();
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
  }, [compareA, material, redoMaterialChange, saveMaterial, undoMaterialChange]);

  const baselineDraft = React.useMemo(
    () => (selectedMaterial ? coerceMaterialDraft(selectedMaterial, emptyDraft) : emptyDraft),
    [emptyDraft, selectedMaterial]
  );
  const isDirty = React.useMemo(() => !areDraftsEqual(material, baselineDraft), [baselineDraft, material]);
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const resetDraftChanges = React.useCallback(() => {
    setMaterial(cloneDraft(baselineDraft));
    setUndoStack([]);
    setRedoStack([]);
  }, [baselineDraft]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-[1240px] mx-auto p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
          <section className="order-1 lg:order-2 space-y-3">
            {showOnboarding && materials.length === 0 && (
              <OnboardingCard
                onAddStarterKit={addStarterKit}
                onStartBlank={startBlankFromOnboarding}
                onDismiss={dismissOnboarding}
              />
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
            <PreviewControlsCard
              previewModel={previewModel}
              previewEnv={previewEnv}
              autoRotate={autoRotate}
              previewEnabled={previewEnabled}
              previewAutoEnable={previewAutoEnable}
              enableZoom={enableZoom}
              showGrid={showGrid}
              showBackground={showBackground}
              compareOn={compareOn}
              hasCompareReference={!!compareA}
              checkboxClass={EDITOR_CHECKBOX_CLASS}
              onPreviewModelChange={setPreviewModel}
              onPreviewEnvChange={setPreviewEnv}
              onAutoRotateChange={setAutoRotate}
              onPreviewEnabledToggle={handlePreviewEnabledToggle}
              onPreviewAutoEnableToggle={handlePreviewAutoEnableToggle}
              onEnableZoomChange={setEnableZoom}
              onShowGridChange={setShowGrid}
              onShowBackgroundChange={setShowBackground}
              onResetView={() => previewRef.current?.resetView()}
              onSnapshot={() => {
                void (async () => {
                  const blob = await previewRef.current?.snapshotPng();
                  if (!blob) return;
                  downloadBlob(`${(material.name || 'material').trim() || 'material'}.png`, blob);
                })();
              }}
              onSetCompareA={() => {
                setCompareA(JSON.parse(JSON.stringify(material)) as MaterialDraft);
                setCompareOn(true);
              }}
              onToggleCompare={() => setCompareOn((value) => !value)}
              onShareLink={() => {
                void (async () => {
                  const { baseColorMap, normalMap, roughnessMap, metalnessMap, aoMap, emissiveMap, alphaMap, ...rest } = material;
                  const payload = encodeSharePayloadV2({ v: 2, includeTextures: false, material: rest });
                  const url = new URL(window.location.href);
                  url.searchParams.set('m', payload);
                  await copyShareLink(url.toString(), 'Share link copied (no textures).');
                })();
              }}
              onShareWithTextures={() => {
                void (async () => {
                  const payload = encodeSharePayloadV2({ v: 2, includeTextures: true, material });
                  const url = new URL(window.location.href);
                  url.searchParams.set('m', payload);

                  if (url.toString().length > 8000) {
                    window.alert(
                      'That share link is too large (textures make URLs huge). Use Export JSON for sharing textures instead.'
                    );
                    return;
                  }

                  await copyShareLink(url.toString(), 'Share link copied (with textures).');
                })();
              }}
            />

            <QuickPresetsCard presets={MATERIAL_PRESETS} onApplyPreset={applyPreset} />

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
                  onChange={(e) =>
                    setMaterialWithHistory((prev) => {
                      if (prev.favorite === e.target.checked) return prev;
                      return { ...prev, favorite: e.target.checked };
                    })
                  }
                  className={EDITOR_CHECKBOX_CLASS}
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
                    setMaterialWithHistory((prev) => {
                      if ((prev.tags ?? []).join('|') === tags.join('|')) return prev;
                      return { ...prev, tags };
                    });
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

            <TextureControls
              material={material}
              onChange={handleChange}
              onUploadMap={uploadMap}
              setMaterial={setMaterialWithHistory}
            />

            <div className="section-shell px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs ui-muted">Draft history</div>
                  <div className={`text-[11px] ${isDirty ? 'text-amber-100/90' : 'ui-muted'}`}>
                    {isDirty ? 'Unsaved changes' : 'All changes saved'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="ui-btn px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    onClick={resetDraftChanges}
                    disabled={!isDirty}
                    title="Revert all unsaved changes"
                  >
                    Revert
                  </button>
                  <button
                    type="button"
                    className="ui-btn px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    onClick={undoMaterialChange}
                    disabled={!canUndo}
                    title="Undo (Ctrl/Cmd+Z)"
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    className="ui-btn px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    onClick={redoMaterialChange}
                    disabled={!canRedo}
                    title="Redo (Ctrl/Cmd+Shift+Z)"
                  >
                    Redo
                  </button>
                </div>
              </div>
            </div>

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
