import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';

interface MaterialEditorProps {
  width?: number;
}

interface Material {
  id: string;
  color: string;
  metalness: number;
  roughness: number;
}

const Control = ({ name, value, label, onChange }: { 
  name: string; 
  value: number; 
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
          min="0"
          max="1"
          step="0.01"
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
          min="0"
          max="1"
          step="0.01"
          className="w-16 px-2 py-0.5 bg-purple-500/20 backdrop-blur-sm rounded text-sm text-white/90 
                   font-medium appearance-none outline-none focus:bg-purple-500/30"
          onBlur={(e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val)) val = 0;
            if (val < 0) val = 0;
            if (val > 1) val = 1;
            e.target.value = val.toString();
            const event = new Event('change', { bubbles: true });
            e.target.dispatchEvent(event);
          }}
        />
      </div>
    </div>
  </div>
);

const MaterialEditor: React.FC<MaterialEditorProps> = ({ width = 800 }) => {
  const { addMaterial, updateMaterial, selectedMaterial } = useMaterials();
  const [isDragging, setIsDragging] = useState(false);
  const [activeControl, setActiveControl] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const [material, setMaterial] = useState<Material>({
    id: '',
    color: '#FFFFFF',
    metalness: 0.5,
    roughness: 0.5,
  });

  useEffect(() => {
    if (selectedMaterial) {
      setMaterial(selectedMaterial);
    }
  }, [selectedMaterial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'color' ? value : parseFloat(value);
    setMaterial(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-start gap-8 max-w-4xl p-6">
        <motion.div 
          className="w-80 space-y-6 bg-black/60 backdrop-blur-sm rounded-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
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

          <motion.button
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg
                     text-white text-sm font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (material.id) {
                updateMaterial(material);
              } else {
                addMaterial({ ...material, id: Date.now().toString() });
              }
              setShowFeedback(true);
              setTimeout(() => setShowFeedback(false), 1000);
            }}
          >
            Save Material
          </motion.button>
        </motion.div>

        <div className="w-[400px] h-[400px]">
          <MaterialPreview
            className="w-full h-full"
            color={material.color}
            metalness={material.metalness}
            roughness={material.roughness}
          />
        </div>
      </div>
    </div>
  );
};

export default MaterialEditor;
