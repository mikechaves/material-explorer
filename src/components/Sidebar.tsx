// src/components/Sidebar.tsx

import React from 'react';
import { useMaterials } from '../contexts/MaterialContext';

const Sidebar: React.FC = () => {
  const { materials } = useMaterials();

  return (
    <aside className="w-64 h-full overflow-y-auto">
      {materials.map((material) => (
        <div key={material.id} className="p-4 border-b border-gray-200">
          <h2 className="text-lg">{material.id}</h2>
          {/* Additional material properties can be displayed here */}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
