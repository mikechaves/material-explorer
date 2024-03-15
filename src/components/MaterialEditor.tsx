// src/components/MaterialEditor.tsx

import React, { useState } from 'react';
import MaterialPreview from './MaterialPreview'; // Import the MaterialPreview component

const MaterialEditor: React.FC = () => {
  // State for material properties
  const [material, setMaterial] = useState({
    id: null,
    color: '#FFFFFF', // Default color
    metalness: 0.5, // Default metalness
    roughness: 0.5, // Default roughness
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMaterial((prevMaterial) => ({
      ...prevMaterial,
      [name]: name === 'color' ? value : parseFloat(value), // Parse number for metalness and roughness
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Material saved:', material);
    // Here you would typically call a context method or prop callback to save the material
  };

  return (
    <div className="flex flex-col md:flex-row">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="mb-4">
          <label htmlFor="color" className="block mb-2">Color:</label>
          <input
            type="color"
            id="color"
            name="color"
            value={material.color}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="metalness" className="block mb-2">Metalness:</label>
          <input
            type="range"
            id="metalness"
            name="metalness"
            min="0"
            max="1"
            step="0.01"
            value={material.metalness}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="roughness" className="block mb-2">Roughness:</label>
          <input
            type="range"
            id="roughness"
            name="roughness"
            min="0"
            max="1"
            step="0.01"
            value={material.roughness}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">Save Material</button>
      </form>

      <div className="flex-grow">
        {/* MaterialPreview integration */}
        <MaterialPreview color={material.color} metalness={material.metalness} roughness={material.roughness} />
      </div>
    </div>
  );
};

export default MaterialEditor;
