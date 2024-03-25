import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import { motion } from 'framer-motion';

interface MaterialEditorProps {
  width?: number;
}

const MaterialEditor: React.FC<MaterialEditorProps> = ({ width }) => {
  const { addMaterial, selectedMaterial, updateMaterial } = useMaterials();

  // Initialize form state with selectedMaterial or defaults
  const [material, setMaterial] = useState({
    id: '',
    color: '#FFFFFF',
    metalness: 0.5,
    roughness: 0.5,
  });

 // Assuming you're correctly obtaining `selectedMaterial` from `useMaterials()` hook
  useEffect(() => {
    if (selectedMaterial) {
      setMaterial(selectedMaterial);
    } else {
      // Reset to default values if no material is selected (optional, depending on desired behavior)
      setMaterial({ id: '', color: '#FFFFFF', metalness: 0.5, roughness: 0.5 });
    }
  }, [selectedMaterial]);


  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setMaterial((prevMaterial) => ({
      ...prevMaterial,
      [name]: name === 'color' ? value : parseFloat(value),
    }));
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (material.id) {
      // Existing material, update it
      updateMaterial(material);
    } else {
      // New material, add it
      const newMaterial = { ...material, id: uuidv4() };
      addMaterial(newMaterial);
    }
    // Reset the form
    setMaterial({ id: '', color: '#FFFFFF', metalness: 0.5, roughness: 0.5 });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
    {/* Use the width prop to dynamically adjust the width of the container */}
    {/* <div style={{ width: width || '100%' }} className="container mx-auto my-4 p-4 bg-white shadow-lg rounded-lg"> */}
    {/* <div style={{ width: width || '100%' }} className="container">   */}
      <div style={{ width: width || '100%' }} className="container mx-auto my-4 p-4 rounded-lg flex items-center justify-center h-screen ">
        <div className="flex flex-wrap md:flex-nowrap justify-center">
          <div className="w-full h-96 p-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="color" className="block mb-2 text-md font-bold text-white dark:text-gray-300">Color:</label>
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={material.color}
                  onChange={handleChange}
                  className="h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="metalness" className="block mb-2 text-md font-bold text-white dark:text-gray-300">Metalness:</label>
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
                <label htmlFor="roughness" className="block mb-2 text-md font-bold text-white dark:text-gray-300">Roughness:</label>
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
                // className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                // class="rounded-full bg-[rgba(255,255,255,0.16)] px-[16px] py-[4px]"
                className="flex gap-2 p-2 sm:pl-4 sm:pr-6 mx-auto font-bold bg-purple-600/90 hover:bg-purple-500/90 border-white/10 border rounded-full text-white/90 outline-none pointer-events-auto shadow-purple-500/20 shadow-md"
                >
                Save Material
              </button>
            </form>
          </div>
          <div className="w-96">
            <MaterialPreview
              //className="w-96 h-84"
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
