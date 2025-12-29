import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview, { type MaterialPreviewHandle } from './MaterialPreview';
import type { MaterialDraft } from '../types/material';
import { createMaterialFromDraft, clamp01, downloadBlob } from '../utils/material';
import { decodeSharePayload, encodeSharePayloadV2 } from '../utils/share';

interface MaterialEditorProps {
  width?: number;
}

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function Dropdown<T extends { value: string; label: string }>({
  value,
  onChange,
  options,
}: {
  value: T['value'];
  onChange: (value: T['value']) => void;
  options: T[];
}) {
  const selected = options.find((o) => o.value === value) ?? options[0];
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative flex-1">
        <Listbox.Button
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white/90 outline-none
                     focus:bg-white/10 border border-white/5 focus:border-purple-500/30 text-left"
        >
          {selected?.label}
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options
            className="absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-lg bg-gray-950/95 backdrop-blur
                       border border-white/10 shadow-xl p-1 text-sm text-white"
          >
            {options.map((opt) => (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
                className={({ active }) =>
                  classNames(
                    'cursor-pointer select-none rounded-md px-3 py-2',
                    active && 'bg-white/10'
                  )
                }
              >
                {opt.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

const Control = ({
  name,
  value,
  label,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  name: string; 
  value: number; 
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center gap-2">
      <label className="text-sm text-white/90 font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className="w-32 h-2 appearance-none bg-white/5 rounded-full cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none 
                   [&::-webkit-slider-thumb]:w-3 
                   [&::-webkit-slider-thumb]:h-3 
                   [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:bg-purple-500 
                   [&::-webkit-slider-thumb]:hover:bg-purple-400
                   [&::-webkit-slider-thumb]:transition-colors
                   [&::-webkit-slider-thumb]:cursor-grab
                   [&:active::-webkit-slider-thumb]:cursor-grabbing
                   [&::-moz-range-thumb]:w-3
                   [&::-moz-range-thumb]:h-3
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-purple-500
                   [&::-moz-range-thumb]:hover:bg-purple-400
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:cursor-grab
                   [&:active::-moz-range-thumb]:cursor-grabbing
                   [&::-moz-range-progress]:bg-purple-500/50
                   [&::-moz-range-track]:bg-transparent"
        />
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className="w-16 px-2 py-0.5 bg-purple-500/20 backdrop-blur-sm rounded text-sm text-white/90 
                   font-medium appearance-none outline-none focus:bg-purple-500/30"
        />
      </div>
    </div>
  </div>
);

const MaterialEditor: React.FC<MaterialEditorProps> = ({ width = 800 }) => {
  const { addMaterial, updateMaterial, selectedMaterial, startNewMaterial } = useMaterials();
  const previewRef = useRef<MaterialPreviewHandle | null>(null);

  const emptyDraft: MaterialDraft = React.useMemo(
    () => ({
      name: 'Untitled',
      favorite: false,
      tags: [],
      color: '#FFFFFF',
      metalness: 0.5,
      roughness: 0.5,
      emissive: '#000000',
      emissiveIntensity: 0,
      clearcoat: 0,
      clearcoatRoughness: 0.03,
      transmission: 0,
      ior: 1.5,
      opacity: 1,
      normalScale: 1,
      aoIntensity: 1,
      alphaTest: 0,
      repeatX: 1,
      repeatY: 1,
    }),
    []
  );

  const [material, setMaterial] = useState<MaterialDraft>(emptyDraft);
  const [previewModel, setPreviewModel] = useState<'sphere' | 'box' | 'torusKnot' | 'icosahedron'>(() => {
    const v = window.localStorage.getItem('previewModel');
    if (v === 'sphere' || v === 'box' || v === 'torusKnot' || v === 'icosahedron') return v;
    return 'sphere';
  });
  const [previewEnv, setPreviewEnv] = useState<
    'warehouse' | 'studio' | 'city' | 'sunset' | 'dawn' | 'night' | 'forest' | 'apartment' | 'park' | 'lobby'
  >(() => {
    const v = window.localStorage.getItem('previewEnv');
    if (v === 'warehouse' || v === 'studio' || v === 'city' || v === 'sunset' || v === 'dawn' || v === 'night' || v === 'forest' || v === 'apartment' || v === 'park' || v === 'lobby')
      return v;
    return 'warehouse';
  });
  const [autoRotate, setAutoRotate] = useState<boolean>(() => window.localStorage.getItem('previewAutoRotate') !== 'false');
  const [enableZoom, setEnableZoom] = useState<boolean>(() => window.localStorage.getItem('previewEnableZoom') === 'true');
  const [showGrid, setShowGrid] = useState<boolean>(() => window.localStorage.getItem('previewShowGrid') === 'true');
  const [showBackground, setShowBackground] = useState<boolean>(() => window.localStorage.getItem('previewShowBackground') !== 'false');
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
    setMaterial((prev) => {
      const incoming = (payload as any).material as MaterialDraft;
      return { ...prev, ...incoming };
    });
    // keep URL clean after applying
    url.searchParams.delete('m');
    window.history.replaceState({}, '', url.toString());
  }, [startNewMaterial]);

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
          <div className={compareOn && compareA ? 'flex flex-col sm:flex-row gap-4' : ''}>
            {compareOn && compareA && (
              <div className="w-full sm:w-[360px] md:w-[400px] aspect-square relative">
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/50 text-xs text-white/80">
                  A
                </div>
                <MaterialPreview
                  className="w-full h-full"
                  color={compareA.color}
                  metalness={compareA.metalness}
                  roughness={compareA.roughness}
                  emissive={compareA.emissive}
                  emissiveIntensity={compareA.emissiveIntensity}
                  clearcoat={compareA.clearcoat}
                  clearcoatRoughness={compareA.clearcoatRoughness}
                  transmission={compareA.transmission}
                  ior={compareA.ior}
                  opacity={compareA.opacity}
                  baseColorMap={compareA.baseColorMap}
                  normalMap={compareA.normalMap}
                  normalScale={compareA.normalScale}
                  roughnessMap={compareA.roughnessMap}
                  metalnessMap={compareA.metalnessMap}
                  aoMap={compareA.aoMap}
                  emissiveMap={compareA.emissiveMap}
                  alphaMap={compareA.alphaMap}
                  aoIntensity={compareA.aoIntensity}
                  alphaTest={compareA.alphaTest}
                  repeatX={compareA.repeatX}
                  repeatY={compareA.repeatY}
                  environment={previewEnv}
                  model={previewModel}
                  autoRotate={autoRotate}
                  enableZoom={enableZoom}
                  showGrid={showGrid}
                  showBackground={showBackground}
                />
              </div>
            )}

            <div className="w-full sm:w-[360px] md:w-[400px] aspect-square relative">
              {compareOn && compareA && (
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/50 text-xs text-white/80">
                  B
                </div>
              )}
              <MaterialPreview
                ref={previewRef}
                className="w-full h-full"
                color={material.color}
                metalness={material.metalness}
                roughness={material.roughness}
                emissive={material.emissive}
                emissiveIntensity={material.emissiveIntensity}
                clearcoat={material.clearcoat}
                clearcoatRoughness={material.clearcoatRoughness}
                transmission={material.transmission}
                ior={material.ior}
                opacity={material.opacity}
                baseColorMap={material.baseColorMap}
                normalMap={material.normalMap}
                normalScale={material.normalScale}
                roughnessMap={material.roughnessMap}
                metalnessMap={material.metalnessMap}
                aoMap={material.aoMap}
                emissiveMap={material.emissiveMap}
                alphaMap={material.alphaMap}
                aoIntensity={material.aoIntensity}
                alphaTest={material.alphaTest}
                repeatX={material.repeatX}
                repeatY={material.repeatY}
                environment={previewEnv}
                model={previewModel}
                autoRotate={autoRotate}
                enableZoom={enableZoom}
                showGrid={showGrid}
                showBackground={showBackground}
              />
            </div>
          </div>
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
                onChange={(v) => setPreviewModel(v as any)}
                options={[
                  { value: 'sphere', label: 'Sphere' },
                  { value: 'box', label: 'Box' },
                  { value: 'torusKnot', label: 'Torus knot' },
                  { value: 'icosahedron', label: 'Icosahedron' },
                ]}
              />
              <Dropdown
                value={previewEnv}
                onChange={(v) => setPreviewEnv(v as any)}
                options={[
                  { value: 'warehouse', label: 'Warehouse' },
                  { value: 'studio', label: 'Studio' },
                  { value: 'city', label: 'City' },
                  { value: 'sunset', label: 'Sunset' },
                  { value: 'dawn', label: 'Dawn' },
                  { value: 'night', label: 'Night' },
                  { value: 'forest', label: 'Forest' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'park', label: 'Park' },
                  { value: 'lobby', label: 'Lobby' },
                ]}
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
                onClick={() => previewRef.current?.resetView()}
              >
                Reset view
              </button>
              <button
                type="button"
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white/90"
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
                  const payload = encodeSharePayloadV2({ v: 2, includeTextures: false, material: rest as any });
                  const url = new URL(window.location.href);
                  url.searchParams.set('m', payload);
                  await navigator.clipboard.writeText(url.toString());
                  window.alert('Share link copied (no textures).');
                }}
              >
                Share link
              </button>
              <button
                type="button"
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white/90"
                onClick={async () => {
                  const payload = encodeSharePayloadV2({ v: 2, includeTextures: true, material: material as any });
                  const url = new URL(window.location.href);
                  url.searchParams.set('m', payload);

                  // Safety: URLs beyond ~8k chars can break in some contexts.
                  if (url.toString().length > 8000) {
                    window.alert(
                      'That share link is too large (textures make URLs huge). Use Export JSON for sharing textures instead.'
                    );
                    return;
                  }

                  await navigator.clipboard.writeText(url.toString());
                  window.alert('Share link copied (with textures).');
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

          <div className="space-y-3">
            <div className="text-sm text-white/90 font-medium">Textures</div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/70">Tiling</div>
              <div className="flex items-center gap-2">
                <div className="w-36">
                  <Control name="repeatX" value={material.repeatX ?? 1} label="U" min={0.01} max={20} step={0.01} onChange={handleChange} />
                </div>
                <div className="w-36">
                  <Control name="repeatY" value={material.repeatY ?? 1} label="V" min={0.01} max={20} step={0.01} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/70">Base color map</div>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-full cursor-pointer">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadMap('baseColorMap', file);
                      e.target.value = '';
                    }}
                  />
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
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadMap('normalMap', file);
                      e.target.value = '';
                    }}
                  />
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
                        onChange={handleChange}
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
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadMap('roughnessMap', file);
                      e.target.value = '';
                    }}
                  />
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
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadMap('metalnessMap', file);
                      e.target.value = '';
                    }}
                  />
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
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadMap('aoMap', file);
                      e.target.value = '';
                    }}
                  />
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
                      <Control name="aoIntensity" value={material.aoIntensity ?? 1} label="Strength" min={0} max={2} step={0.01} onChange={handleChange} />
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
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadMap('emissiveMap', file);
                      e.target.value = '';
                    }}
                  />
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
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadMap('alphaMap', file);
                      e.target.value = '';
                    }}
                  />
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
                      <Control name="alphaTest" value={material.alphaTest ?? 0} label="Cutoff" min={0} max={1} step={0.01} onChange={handleChange} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

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
