import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { useMaterials } from '../contexts/MaterialContext'; // Import the useMaterials hook
import MaterialPreview from './MaterialPreview';

const MaterialEditor: React.FC = () => {
  const { addMaterial } = useMaterials(); // Access the context's addMaterial function

  const [material, setMaterial] = useState({
    color: '#FFFFFF', // Initial default color
    metalness: 0.5, // Initial default metalness
    roughness: 0.5, // Initial default roughness
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMaterial((prevMaterial) => ({
      ...prevMaterial,
      [name]: name === 'color' ? value : parseFloat(value), // Update the material state
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newMaterial = { ...material, id: uuidv4() }; // Generate a unique ID for the new material
    addMaterial(newMaterial); // Add the new material to the context
    console.log('Material saved:', newMaterial);
    // Reset the form or provide feedback to the user
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
            value={material.metalness.toString()}
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
            value={material.roughness.toString()}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">Save Material</button>
      </form>
      <div className="flex-grow">
        <MaterialPreview
          className="w-full h-full" // Apply responsive or specific styling as needed
          color={material.color}
          metalness={material.metalness}
          roughness={material.roughness}
        />
      </div>
    </div>
  );
};

export default MaterialEditor;
