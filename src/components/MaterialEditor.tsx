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

interface SliderProps {
  name: string;
  value: number;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
}

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

  // Watch for selected material changes
  useEffect(() => {
    if (selectedMaterial) {
      setMaterial(selectedMaterial);
    } else {
      setMaterial({
        id: '',
        color: '#FFFFFF',
        metalness: 0.5,
        roughness: 0.5,
      });
    }
  }, [selectedMaterial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMaterial((prev) => ({
      ...prev,
      [name]: name === 'color' ? value : parseFloat(value),
    }));
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 1000);
  };

  const Slider: React.FC<SliderProps> = ({ name, value, label, onChange, onMouseDown, onMouseUp }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-white/90 font-medium">{label}</label>
        <div 
          className="px-2 py-0.5 bg-purple-500/30 backdrop-blur-sm rounded text-xs text-white/90 font-medium"
        >
          {value.toFixed(2)}
        </div>
      </div>
      
      <div className="relative h-2">
        <div className="absolute inset-0 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-purple-500"
            style={{ width: `${value * 100}%` }}
            layoutId={`slider-${name}`}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          />
        </div>
        <input
          type="range"
          name={name}
          value={value}
          onChange={onChange}
          min="0"
          max="1"
          step="0.001"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        />
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-start gap-8 max-w-4xl p-6">
        {/* Controls */}
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
            <Slider 
              name="metalness" 
              value={material.metalness} 
              label="Metalness" 
              onChange={handleChange}
              onMouseDown={() => {
                setIsDragging(true);
                setActiveControl("metalness");
              }}
              onMouseUp={() => {
                setIsDragging(false);
                setActiveControl(null);
              }}
            />
            <Slider 
              name="roughness" 
              value={material.roughness} 
              label="Roughness"
              onChange={handleChange}
              onMouseDown={() => {
                setIsDragging(true);
                setActiveControl("roughness");
              }}
              onMouseUp={() => {
                setIsDragging(false);
                setActiveControl(null);
              }}
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

        {/* Preview */}
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