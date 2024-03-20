import React, { useState } from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';

const Sidebar: React.FC = () => {
  const { materials, selectMaterial, deleteMaterial } = useMaterials();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`transform duration-300 ease-in-out ${
        isCollapsed ? 'w-0' : 'sm:w-64'
      } overflow-hidden`}
    >
      <div className={`bg-gray-800 text-white p-4 flex justify-between items-center`}>
        <h1 className="text-lg">Materials</h1>
        <button onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      <div className="overflow-y-auto">
        {materials.map((material) => (
          <div key={material.id} className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <MaterialPreview
                className="hidden sm:block"
                color={material.color}
                metalness={material.metalness}
                roughness={material.roughness}
              />
              {/* Add a button or link for selecting/editing a material */}
              <button onClick={() => selectMaterial(material.id)} className="text-blue-500 hover:text-blue-700">
                Edit
              </button>
            </div>
            {/* Add a button for deleting a material */}
            <button onClick={() => deleteMaterial(material.id)} className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Delete
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
