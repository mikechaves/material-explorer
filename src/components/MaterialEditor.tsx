import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import { motion, AnimatePresence } from 'framer-motion';

interface MaterialEditorProps {
  width?: number;
}

const MaterialEditor: React.FC<MaterialEditorProps> = ({ width }) => {
  const { addMaterial, selectedMaterial, updateMaterial } = useMaterials();
  const [isDragging, setIsDragging] = useState(false);

  const [material, setMaterial] = useState({
    id: '',
    color: '#FFFFFF',
    metalness: 0.5,
    roughness: 0.5,
  });

  useEffect(() => {
    if (selectedMaterial) {
      setMaterial(selectedMaterial);
    } else {
      setMaterial({ id: '', color: '#FFFFFF', metalness: 0.5, roughness: 0.5 });
    }
  }, [selectedMaterial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMaterial((prev) => ({
      ...prev,
      [name]: name === 'color' ? value : parseFloat(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (material.id) {
      updateMaterial(material);
    } else {
      const newMaterial = { ...material, id: uuidv4() };
      addMaterial(newMaterial);
    }
    setMaterial({ id: '', color: '#FFFFFF', metalness: 0.5, roughness: 0.5 });
  };

  // Custom slider component with visual feedback
  const Slider = ({ name, value, onChange }: { name: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <motion.div className="relative w-full h-8" whileHover={{ scale: 1.02 }}>
      <input
        type="range"
        id={name}
        name={name}
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-200/10 rounded-lg appearance-none cursor-pointer 
                 hover:bg-gray-200/20 transition-all duration-200
                 before:content-[''] before:absolute before:w-2 before:h-2 
                 before:bg-purple-500 before:rounded-full before:pointer-events-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
      />
      <motion.div 
        className="absolute -right-16 top-0 bg-purple-500/90 px-2 py-1 rounded-md text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: isDragging ? 1 : 0 }}
      >
        {value.toFixed(2)}
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ width: width || '100%' }} className="container mx-auto my-4 p-4 rounded-lg flex items-center justify-center h-screen">
        <div className="flex flex-wrap md:flex-nowrap justify-center gap-8">
          <motion.div 
            className="w-full max-w-md p-6 bg-white/5 rounded-xl backdrop-blur-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block mb-2 text-md font-bold text-white/90">Color</label>
                <div className="flex items-center gap-4">
                  <motion.input
                    type="color"
                    id="color"
                    name="color"
                    value={material.color}
                    onChange={handleChange}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-white/10
                             hover:border-purple-500/50 transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                  <span className="text-white/70">{material.color}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-md font-bold text-white/90">Metalness</label>
                <Slider name="metalness" value={material.metalness} onChange={handleChange} />
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-md font-bold text-white/90">Roughness</label>
                <Slider name="roughness" value={material.roughness} onChange={handleChange} />
              </div>

              <motion.button 
                type="submit"
                className="flex gap-2 p-2 sm:pl-4 sm:pr-6 mx-auto font-bold bg-purple-600/90 
                         hover:bg-purple-500/90 border-white/10 border rounded-full text-white/90 
                         outline-none pointer-events-auto shadow-purple-500/20 shadow-md"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.9)" }}
                whileTap={{ scale: 0.95 }}
              >
                Save Material
              </motion.button>
            </form>
          </motion.div>

          <div className="w-96 relative">
            <MaterialPreview
              className="w-full"
              color={material.color}
              metalness={material.metalness}
              roughness={material.roughness}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MaterialEditor;