import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMaterials } from '../contexts/MaterialContext';
import { useToasts } from '../contexts/ToastContext';
import { useDialogs } from '../contexts/DialogContext';
import type { MaterialPreviewHandle } from './MaterialPreview';
import type { MaterialDraft } from '../types/material';
import {
  buildDownloadFilename,
  createMaterialFromDraft,
  clamp01,
  coerceMaterialDraft,
  DEFAULT_MATERIAL_DRAFT,
  downloadBlob,
  sanitizeMaterialName,
  sanitizeMaterialTags,
} from '../utils/material';
import { type PreviewModel, type PreviewEnv } from './editor/EditorFields';
import { PreviewCompare } from './editor/PreviewCompare';
import { TextureControls } from './editor/TextureControls';
import { APP_COMMAND_EVENT, type AppCommandEventDetail } from '../types/commands';
import {
  ONBOARDING_SEEN_KEY,
  MATERIAL_PRESETS,
  EDITOR_CHECKBOX_CLASS,
  type MaterialPreset,
} from './editor/materialPresets';
import { OnboardingCard } from './editor/OnboardingCard';
import { QuickPresetsCard } from './editor/QuickPresetsCard';
import { PreviewControlsCard } from './editor/PreviewControlsCard';
import { MaterialIdentityCard } from './editor/MaterialIdentityCard';
import { MaterialSurfaceCard } from './editor/MaterialSurfaceCard';
import { MaterialOpticsCard } from './editor/MaterialOpticsCard';
import { DraftHistoryCard } from './editor/DraftHistoryCard';
import {
  isOpticsSectionDirty,
  isSurfaceSectionDirty,
  resetOpticsSection as applyOpticsSectionReset,
  resetSurfaceSection as applySurfaceSectionReset,
} from './editor/draftSections';
import { validateTextureDataUrl, validateTextureUploadFile } from './editor/textureUpload';
import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from '../utils/localStorage';
import { emitTelemetryEvent } from '../utils/telemetry';

const HISTORY_LIMIT = 120;
const DRAFT_AUTOSAVE_KEY = 'materialEditorDraftAutosaveV1';
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

async function loadShareUtils() {
  return await import('../utils/share');
}

const MaterialEditor: React.FC = () => {
  const { materials, addMaterial, addMaterials, updateMaterial, selectedMaterial, startNewMaterial } = useMaterials();
  const { notify } = useToasts();
  const { showCopyDialog } = useDialogs();
  const previewRef = useRef<MaterialPreviewHandle>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const importDraftInputRef = useRef<HTMLInputElement>(null);

  const emptyDraft: MaterialDraft = React.useMemo(() => ({ ...DEFAULT_MATERIAL_DRAFT }), []);

  const [material, setMaterial] = useState<MaterialDraft>(emptyDraft);
  const [undoStack, setUndoStack] = useState<MaterialDraft[]>([]);
  const [redoStack, setRedoStack] = useState<MaterialDraft[]>([]);
  const [previewModel, setPreviewModel] = useState<PreviewModel>(() => {
    const v = getLocalStorageItem('previewModel');
    if (v === 'sphere' || v === 'box' || v === 'torusKnot' || v === 'icosahedron') return v;
    return 'sphere';
  });
  const [previewEnv, setPreviewEnv] = useState<PreviewEnv>(() => {
    const v = getLocalStorageItem('previewEnv');
    if (
      v === 'warehouse' ||
      v === 'studio' ||
      v === 'city' ||
      v === 'sunset' ||
      v === 'dawn' ||
      v === 'night' ||
      v === 'forest' ||
      v === 'apartment' ||
      v === 'park' ||
      v === 'lobby'
    )
      return v;
    return 'warehouse';
  });
  const [autoRotate, setAutoRotate] = useState<boolean>(() => getLocalStorageItem('previewAutoRotate') !== 'false');
  const [enableZoom, setEnableZoom] = useState<boolean>(() => getLocalStorageItem('previewEnableZoom') === 'true');
  const [showGrid, setShowGrid] = useState<boolean>(() => getLocalStorageItem('previewShowGrid') === 'true');
  const [showBackground, setShowBackground] = useState<boolean>(
    () => getLocalStorageItem('previewShowBackground') !== 'false'
  );
  const [previewAutoEnable, setPreviewAutoEnable] = useState<boolean>(
    () => getLocalStorageItem('previewAutoEnable') === 'true'
  );
  const [previewEnabled, setPreviewEnabled] = useState<boolean>(() => {
    if (getLocalStorageItem('previewAutoEnable') === 'true') return true;
    return getLocalStorageItem('previewEnabled') === 'true';
  });
  const [compareOn, setCompareOn] = useState(false);
  const [compareA, setCompareA] = useState<MaterialDraft | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => getLocalStorageItem(ONBOARDING_SEEN_KEY) !== 'true'
  );
  const previewPerfRef = useRef<{
    firstEnableAtMs: number | null;
    firstEnableSource: string | null;
    firstEnableEventSent: boolean;
    firstReadyEventSent: boolean;
  }>({
    firstEnableAtMs: previewEnabled ? performance.now() : null,
    firstEnableSource: previewEnabled ? (previewAutoEnable ? 'startup-auto' : 'startup-manual') : null,
    firstEnableEventSent: false,
    firstReadyEventSent: false,
  });

  const markPreviewEnabled = React.useCallback(
    (source: string) => {
      const perfState = previewPerfRef.current;
      if (perfState.firstEnableAtMs !== null) return;
      perfState.firstEnableAtMs = performance.now();
      perfState.firstEnableSource = source;
      perfState.firstEnableEventSent = true;
      emitTelemetryEvent(
        'preview.first_enabled',
        {
          source,
          autoRotate,
          enableZoom,
          model: previewModel,
          environment: previewEnv,
        },
        'info'
      );
    },
    [autoRotate, enableZoom, previewEnv, previewModel]
  );

  const setMaterialWithHistory = React.useCallback((nextState: React.SetStateAction<MaterialDraft>) => {
    setMaterial((prev) => {
      const next =
        typeof nextState === 'function' ? (nextState as (prevState: MaterialDraft) => MaterialDraft)(prev) : nextState;
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
      setRedoStack((future) => {
        const nextFuture = [...future, cloneDraft(material)];
        if (nextFuture.length > HISTORY_LIMIT) nextFuture.shift();
        return nextFuture;
      });
      setMaterial(cloneDraft(previous));
      return stack.slice(0, -1);
    });
  }, [material]);

  const redoMaterialChange = React.useCallback(() => {
    setRedoStack((stack) => {
      const next = stack[stack.length - 1];
      if (!next) return stack;
      setUndoStack((past) => {
        const nextPast = [...past, cloneDraft(material)];
        if (nextPast.length > HISTORY_LIMIT) nextPast.shift();
        return nextPast;
      });
      setMaterial(cloneDraft(next));
      return stack.slice(0, -1);
    });
  }, [material]);

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

    let cancelled = false;
    void (async () => {
      try {
        const { decodeSharePayload } = await loadShareUtils();
        const payload = decodeSharePayload(m);
        if (!payload) {
          if (!cancelled) {
            notify({
              variant: 'warn',
              title: 'Share link invalid',
              message: 'Could not decode that share payload. The editor opened with a blank draft instead.',
            });
            url.searchParams.delete('m');
            window.history.replaceState({}, '', url.toString());
          }
          return;
        }
        if (cancelled) return;
        startNewMaterial();
        setMaterial(cloneDraft(coerceMaterialDraft(payload.material, emptyDraft)));
        setUndoStack([]);
        setRedoStack([]);
        // keep URL clean after applying
        url.searchParams.delete('m');
        window.history.replaceState({}, '', url.toString());
      } catch (error) {
        console.error('Failed to decode share payload.', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [startNewMaterial, emptyDraft, notify]);

  useEffect(() => {
    if (selectedMaterial) return;
    const raw = getLocalStorageItem(DRAFT_AUTOSAVE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const restored = coerceMaterialDraft(parsed, emptyDraft);
      if (areDraftsEqual(restored, emptyDraft)) return;
      setMaterial(restored);
      notify({ variant: 'info', title: 'Draft restored', message: 'Recovered your last unsaved material draft.' });
    } catch {
      // ignore malformed autosave payloads
    }
  }, [emptyDraft, notify, selectedMaterial]);

  useEffect(() => {
    if (selectedMaterial) return;
    try {
      setLocalStorageItem(DRAFT_AUTOSAVE_KEY, JSON.stringify(material));
    } catch {
      // ignore autosave write errors
    }
  }, [material, selectedMaterial]);

  useEffect(() => {
    setLocalStorageItem('previewModel', previewModel);
  }, [previewModel]);
  useEffect(() => {
    setLocalStorageItem('previewEnv', previewEnv);
  }, [previewEnv]);
  useEffect(() => {
    setLocalStorageItem('previewAutoRotate', autoRotate ? 'true' : 'false');
  }, [autoRotate]);
  useEffect(() => {
    setLocalStorageItem('previewEnableZoom', enableZoom ? 'true' : 'false');
  }, [enableZoom]);
  useEffect(() => {
    setLocalStorageItem('previewShowGrid', showGrid ? 'true' : 'false');
  }, [showGrid]);
  useEffect(() => {
    setLocalStorageItem('previewShowBackground', showBackground ? 'true' : 'false');
  }, [showBackground]);
  useEffect(() => {
    setLocalStorageItem('previewEnabled', previewEnabled ? 'true' : 'false');
  }, [previewEnabled]);
  useEffect(() => {
    setLocalStorageItem('previewAutoEnable', previewAutoEnable ? 'true' : 'false');
  }, [previewAutoEnable]);

  useEffect(() => {
    const perfState = previewPerfRef.current;
    if (!previewEnabled) return;
    if (perfState.firstEnableAtMs === null) {
      markPreviewEnabled('state-sync');
      return;
    }
    if (perfState.firstEnableEventSent) return;
    perfState.firstEnableEventSent = true;
    emitTelemetryEvent(
      'preview.first_enabled',
      {
        source: perfState.firstEnableSource ?? 'startup',
        autoRotate,
        enableZoom,
        model: previewModel,
        environment: previewEnv,
      },
      'info'
    );
  }, [autoRotate, enableZoom, markPreviewEnabled, previewEnabled, previewEnv, previewModel]);

  const copyShareLink = async (url: string, successMessage: string) => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(url);
      notify({ variant: 'success', title: successMessage });
    } catch {
      notify({
        variant: 'warn',
        title: 'Clipboard unavailable',
        message: 'Use the manual copy dialog instead.',
      });
      showCopyDialog({
        title: 'Copy share link',
        message: 'Clipboard access was blocked. Copy the link below.',
        value: url,
      });
    }
  };

  const enablePreviewNow = () => {
    markPreviewEnabled('enable-preview-now');
    setPreviewEnabled(true);
  };

  const enablePreviewAlways = () => {
    markPreviewEnabled('enable-preview-always');
    setPreviewAutoEnable(true);
    setPreviewEnabled(true);
  };

  const handlePreviewEnabledToggle = (enabled: boolean) => {
    if (enabled) markPreviewEnabled('preview-toggle');
    setPreviewEnabled(enabled);
    if (!enabled) setPreviewAutoEnable(false);
  };

  const handlePreviewAutoEnableToggle = (enabled: boolean) => {
    if (enabled) markPreviewEnabled('preview-auto-enable');
    setPreviewAutoEnable(enabled);
    if (enabled) setPreviewEnabled(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof MaterialDraft;
    const newValue = (() => {
      if (name === 'name') return sanitizeMaterialName(value);
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

  const handleFavoriteChange = React.useCallback(
    (checked: boolean) => {
      setMaterialWithHistory((prev) => {
        if (prev.favorite === checked) return prev;
        return { ...prev, favorite: checked };
      });
    },
    [setMaterialWithHistory]
  );

  const handleTagsInputChange = React.useCallback(
    (value: string) => {
      const tags = sanitizeMaterialTags(value.split(','));
      setMaterialWithHistory((prev) => {
        if (areStringArraysEqual(prev.tags, tags)) return prev;
        return { ...prev, tags };
      });
    },
    [setMaterialWithHistory]
  );

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const uploadMap = async (key: keyof MaterialDraft, file: File) => {
    const fileValidationMessage = validateTextureUploadFile(file);
    if (fileValidationMessage) {
      notify({ variant: 'warn', title: 'Texture upload blocked', message: fileValidationMessage });
      emitTelemetryEvent(
        'texture.upload.rejected',
        {
          key,
          reason: 'file-validation',
          fileType: file.type || 'unknown',
          fileSize: file.size,
          message: fileValidationMessage,
        },
        'warn'
      );
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const dataUrlValidationMessage = validateTextureDataUrl(dataUrl);
      if (dataUrlValidationMessage) {
        notify({ variant: 'warn', title: 'Texture upload blocked', message: dataUrlValidationMessage });
        emitTelemetryEvent(
          'texture.upload.rejected',
          {
            key,
            reason: 'data-url-validation',
            fileType: file.type || 'unknown',
            fileSize: file.size,
            dataUrlLength: dataUrl.length,
            message: dataUrlValidationMessage,
          },
          'warn'
        );
        return;
      }

      setMaterialWithHistory((prev) => {
        if (prev[key] === dataUrl) return prev;
        return { ...prev, [key]: dataUrl };
      });
      emitTelemetryEvent(
        'texture.upload.accepted',
        {
          key,
          fileType: file.type || 'unknown',
          fileSize: file.size,
          dataUrlLength: dataUrl.length,
        },
        'info'
      );
    } catch (error) {
      notify({
        variant: 'error',
        title: 'Texture upload failed',
        message: 'Could not read this file. Try a different image.',
      });
      emitTelemetryEvent(
        'texture.upload.failed',
        {
          key,
          fileType: file.type || 'unknown',
          fileSize: file.size,
          message: error instanceof Error ? error.message : String(error),
        },
        'error'
      );
    }
  };

  const applyPreset = (preset: MaterialPreset) => {
    setMaterialWithHistory((prev) => ({
      ...prev,
      ...preset.values,
      name: prev.name?.trim() ? prev.name : preset.label,
      updatedAt: Date.now(),
    }));
  };

  const saveMaterial = React.useCallback(() => {
    const now = Date.now();
    const full = createMaterialFromDraft({
      ...material,
      updatedAt: now,
      ...(material.id ? {} : { createdAt: now }),
    });

    if (material.id) updateMaterial(full);
    else addMaterial(full);
  }, [addMaterial, material, updateMaterial]);

  const duplicateCurrentMaterial = React.useCallback(() => {
    const now = Date.now();
    const duplicate = createMaterialFromDraft({
      ...material,
      id: undefined,
      name: `${sanitizeMaterialName(material.name)} Copy`,
      createdAt: now,
      updatedAt: now,
    });
    addMaterial(duplicate);
    setMaterial(coerceMaterialDraft(duplicate, emptyDraft));
    notify({ variant: 'success', title: 'Material duplicated' });
  }, [addMaterial, emptyDraft, material, notify]);

  const randomizeMaterial = React.useCallback(() => {
    const randomHex = () =>
      `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')
        .toUpperCase()}`;
    setMaterialWithHistory((prev) => ({
      ...prev,
      color: randomHex(),
      emissive: randomHex(),
      metalness: Number(Math.random().toFixed(2)),
      roughness: Number(Math.random().toFixed(2)),
      emissiveIntensity: Number(Math.random().toFixed(2)),
      clearcoat: Number(Math.random().toFixed(2)),
      clearcoatRoughness: Number(Math.random().toFixed(2)),
      transmission: Number(Math.random().toFixed(2)),
      ior: Number((1 + Math.random() * 1.5).toFixed(2)),
      opacity: Number((0.25 + Math.random() * 0.75).toFixed(2)),
      updatedAt: Date.now(),
    }));
    notify({ variant: 'info', title: 'Randomized material draft' });
  }, [notify, setMaterialWithHistory]);

  const clearAllTextures = React.useCallback(() => {
    setMaterialWithHistory((prev) => ({
      ...prev,
      baseColorMap: undefined,
      normalMap: undefined,
      roughnessMap: undefined,
      metalnessMap: undefined,
      aoMap: undefined,
      emissiveMap: undefined,
      alphaMap: undefined,
      updatedAt: Date.now(),
    }));
    notify({ variant: 'info', title: 'Cleared all texture maps' });
  }, [notify, setMaterialWithHistory]);

  const exportCurrentDraftJson = React.useCallback(() => {
    const blob = new Blob([JSON.stringify(material, null, 2)], { type: 'application/json' });
    downloadBlob(buildDownloadFilename(material.name, 'json', 'material-draft'), blob);
    notify({ variant: 'success', title: 'Draft JSON exported' });
  }, [material, notify]);

  const importDraftFromJson = React.useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const restored = coerceMaterialDraft(parsed, emptyDraft);
        setMaterialWithHistory(restored);
        notify({ variant: 'success', title: 'Draft JSON imported' });
      } catch {
        notify({ variant: 'error', title: 'Import failed', message: 'Could not parse this JSON file.' });
      }
    },
    [emptyDraft, notify, setMaterialWithHistory]
  );

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    setLocalStorageItem(ONBOARDING_SEEN_KEY, 'true');
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
          if (next) markPreviewEnabled('command-toggle-preview');
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
        removeLocalStorageItem(ONBOARDING_SEEN_KEY);
      }
    };

    window.addEventListener(APP_COMMAND_EVENT, onCommand as EventListener);
    return () => window.removeEventListener(APP_COMMAND_EVENT, onCommand as EventListener);
  }, [compareA, markPreviewEnabled, material, redoMaterialChange, saveMaterial, undoMaterialChange]);

  const baselineDraft = React.useMemo(
    () => (selectedMaterial ? coerceMaterialDraft(selectedMaterial, emptyDraft) : emptyDraft),
    [emptyDraft, selectedMaterial]
  );
  const isDirty = React.useMemo(() => !areDraftsEqual(material, baselineDraft), [baselineDraft, material]);
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  const surfaceDirty = React.useMemo(() => isSurfaceSectionDirty(material, baselineDraft), [baselineDraft, material]);
  const opticsDirty = React.useMemo(() => isOpticsSectionDirty(material, baselineDraft), [baselineDraft, material]);

  const resetDraftChanges = React.useCallback(() => {
    setMaterial(cloneDraft(baselineDraft));
    setUndoStack([]);
    setRedoStack([]);
  }, [baselineDraft]);

  const resetSurfaceSection = React.useCallback(() => {
    setMaterialWithHistory((prev) => applySurfaceSectionReset(prev, baselineDraft));
  }, [baselineDraft, setMaterialWithHistory]);

  const resetOpticsSection = React.useCallback(() => {
    setMaterialWithHistory((prev) => applyOpticsSectionReset(prev, baselineDraft));
  }, [baselineDraft, setMaterialWithHistory]);

  const handlePrimaryPreviewReady = React.useCallback(() => {
    const perfState = previewPerfRef.current;
    if (perfState.firstReadyEventSent) return;
    if (perfState.firstEnableAtMs === null) return;
    perfState.firstReadyEventSent = true;
    emitTelemetryEvent(
      'preview.first_ready',
      {
        source: perfState.firstEnableSource ?? 'unknown',
        durationMs: Math.round(performance.now() - perfState.firstEnableAtMs),
        autoRotate,
        enableZoom,
        model: previewModel,
        environment: previewEnv,
      },
      'info'
    );
  }, [autoRotate, enableZoom, previewEnv, previewModel]);

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
              onPrimaryPreviewReady={handlePrimaryPreviewReady}
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
                  downloadBlob(buildDownloadFilename(material.name, 'png', 'material'), blob);
                })();
              }}
              onSetCompareA={() => {
                setCompareA(JSON.parse(JSON.stringify(material)) as MaterialDraft);
                setCompareOn(true);
              }}
              onToggleCompare={() => setCompareOn((value) => !value)}
              onShareLink={() => {
                void (async () => {
                  const { encodeSharePayloadV2 } = await loadShareUtils();
                  const {
                    baseColorMap: _baseColorMap,
                    normalMap: _normalMap,
                    roughnessMap: _roughnessMap,
                    metalnessMap: _metalnessMap,
                    aoMap: _aoMap,
                    emissiveMap: _emissiveMap,
                    alphaMap: _alphaMap,
                    ...rest
                  } = material;
                  const payload = encodeSharePayloadV2({ v: 2, includeTextures: false, material: rest });
                  const url = new URL(window.location.href);
                  url.searchParams.set('m', payload);
                  await copyShareLink(url.toString(), 'Share link copied (no textures).');
                })();
              }}
              onShareWithTextures={() => {
                void (async () => {
                  const { encodeSharePayloadV2 } = await loadShareUtils();
                  const payload = encodeSharePayloadV2({ v: 2, includeTextures: true, material });
                  const url = new URL(window.location.href);
                  url.searchParams.set('m', payload);

                  if (url.toString().length > 8000) {
                    notify({
                      variant: 'warn',
                      title: 'Share link too large',
                      message: 'Textures can exceed URL limits. Use Export JSON when sharing textures.',
                    });
                    return;
                  }

                  await copyShareLink(url.toString(), 'Share link copied (with textures).');
                })();
              }}
            />

            <QuickPresetsCard presets={MATERIAL_PRESETS} onApplyPreset={applyPreset} />

            <MaterialIdentityCard
              material={material}
              checkboxClass={EDITOR_CHECKBOX_CLASS}
              nameInputRef={nameInputRef}
              onNameChange={handleChange}
              onFavoriteChange={handleFavoriteChange}
              onTagsInputChange={handleTagsInputChange}
            />

            <MaterialSurfaceCard
              material={material}
              onChange={handleChange}
              isDirty={surfaceDirty}
              onReset={resetSurfaceSection}
            />

            <MaterialOpticsCard
              material={material}
              onChange={handleChange}
              isDirty={opticsDirty}
              onReset={resetOpticsSection}
            />

            <TextureControls
              material={material}
              onChange={handleChange}
              onUploadMap={uploadMap}
              setMaterial={setMaterialWithHistory}
            />

            <DraftHistoryCard
              isDirty={isDirty}
              canUndo={canUndo}
              canRedo={canRedo}
              onRevert={resetDraftChanges}
              onUndo={undoMaterialChange}
              onRedo={redoMaterialChange}
            />

            <div className="section-shell px-3 py-3 space-y-2">
              <div className="text-xs font-semibold text-slate-100">Power Tools</div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="ui-btn py-2 text-xs" onClick={duplicateCurrentMaterial}>
                  Duplicate
                </button>
                <button type="button" className="ui-btn py-2 text-xs" onClick={randomizeMaterial}>
                  Randomize
                </button>
                <button type="button" className="ui-btn py-2 text-xs" onClick={clearAllTextures}>
                  Clear Textures
                </button>
                <button type="button" className="ui-btn py-2 text-xs" onClick={exportCurrentDraftJson}>
                  Export Draft JSON
                </button>
              </div>
              <input
                ref={importDraftInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importDraftFromJson(file);
                  event.currentTarget.value = '';
                }}
              />
              <button
                type="button"
                className="ui-btn w-full py-2 text-xs"
                onClick={() => importDraftInputRef.current?.click()}
              >
                Import Draft JSON
              </button>
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
