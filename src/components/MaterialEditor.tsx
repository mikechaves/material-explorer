import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import type { MaterialDraft } from '../types/material';
import { createMaterialFromDraft, clamp01 } from '../utils/material';

interface MaterialEditorProps {
  width?: number;
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

  const emptyDraft: MaterialDraft = React.useMemo(
    () => ({
      name: 'Untitled',
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
    }),
    []
  );

  const [material, setMaterial] = useState<MaterialDraft>(emptyDraft);

  useEffect(() => {
    if (selectedMaterial) setMaterial(selectedMaterial);
    else setMaterial(emptyDraft);
  }, [selectedMaterial, emptyDraft]);

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

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-start gap-8 max-w-4xl p-6">
        <motion.div 
          className="w-80 space-y-6 bg-black/60 backdrop-blur-sm rounded-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
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
                      const dataUrl = await readFileAsDataUrl(file);
                      setMaterial((prev) => ({ ...prev, baseColorMap: dataUrl }));
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
                      const dataUrl = await readFileAsDataUrl(file);
                      setMaterial((prev) => ({ ...prev, normalMap: dataUrl }));
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

        <div className="w-[400px] h-[400px]">
          <MaterialPreview
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
          />
        </div>
      </div>
    </div>
  );
};

export default MaterialEditor;
