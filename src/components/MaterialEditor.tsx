import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import { motion } from 'framer-motion';

const MaterialEditor: React.FC = () => {
  const { addMaterial, selectedMaterial, updateMaterial } = useMaterials();

  const [material, setMaterial] = useState({
    id: selectedMaterial?.id || '',
    color: selectedMaterial?.color || '#FFFFFF',
    metalness: selectedMaterial?.metalness || 0.5,
    roughness: selectedMaterial?.roughness || 0.5,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMaterial((prevMaterial) => ({
      ...prevMaterial,
      [name]: name === 'color' ? value : parseFloat(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const materialToSave = { ...material, id: material.id || uuidv4() };
    if (material.id) {
      updateMaterial(materialToSave);
    } else {
      addMaterial(materialToSave);
    }
    console.log('Material saved:', materialToSave);
    setMaterial({ id: '', color: '#FFFFFF', metalness: 0.5, roughness: 0.5 });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
    <div className="container mx-auto my-4 p-4 bg-white shadow-lg rounded-lg">
      <div className="flex flex-wrap md:flex-nowrap">
        <div className="w-full md:w-1/2 p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="color" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Color:</label>
              <input
                type="color"
                id="color"
                name="color"
                value={material.color}
                onChange={handleChange}
                className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="metalness" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Metalness:</label>
              <input
                type="range"
                id="metalness"
                name="metalness"
                min="0"
                max="1"
                step="0.01"
                value={material.metalness.toString()}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="roughness" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Roughness:</label>
              <input
                type="range"
                id="roughness"
                name="roughness"
                min="0"
                max="1"
                step="0.01"
                value={material.roughness.toString()}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
            <button 
              type="submit" 
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
              Save Material
            </button>
          </form>
        </div>
        <div className="w-full md:w-1/2 p-4">
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
