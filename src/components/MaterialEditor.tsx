import React, { useState, useContext } from 'react';
import { MaterialContext } from '../contexts/MaterialContext';

const MaterialEditor: React.FC = () => {
  const { addMaterial } = useContext(MaterialContext);
  const [material, setMaterial] = useState({ color: '#fff', metalness: 0.5, roughness: 0.5 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaterial(material);
    setMaterial({ color: '#fff', metalness: 0.5, roughness: 0.5 }); // Reset form
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form inputs for material properties */}
      <button type="submit">Save Material</button>
    </form>
  );
};

export default MaterialEditor;
