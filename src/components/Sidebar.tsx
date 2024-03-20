import React, { useState } from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';

const Sidebar: React.FC = () => {
  const { materials } = useMaterials();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // This div will be full width (w-full) on small screens and 64 width (w-64)
  // on medium screens and larger.
  return (
    <aside
      className={`transform duration-300 ease-in-out ${
        isCollapsed ? 'w-0' : 'sm:w-64'
      } overflow-hidden`}
    >
      <div className={`bg-gray-800 text-white p-4 flex justify-between items-center`}>
        <h1 className="text-lg">Materials</h1>
        {/* Collapsible toggle */}
        <button onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      <div className="overflow-y-auto">
        {materials.map((material) => (
          <div key={material.id} className="p-4 border-b border-gray-200">
            {/* The preview might be hidden on small screens (hidden sm:block) */}
            <MaterialPreview
              className="hidden sm:block"
              color={material.color}
              metalness={material.metalness}
              roughness={material.roughness}
            />
          </div>
        ))}
      </div>
    </aside>
  );
};


export default Sidebar;
