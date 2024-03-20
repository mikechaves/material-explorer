import React from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { materials, selectMaterial, deleteMaterial } = useMaterials();

  return (
    <aside
      className={`transform top-0 left-0 h-full fixed overflow-auto transition-width duration-300 ease-in-out 
                  ${isCollapsed ? 'w-0' : 'w-1/5'} bg-gray-800 text-white p-4`}
    >
      <div className="flex justify-between items-center">
        <h1 className="text-lg">Materials</h1>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sm bg-gray-700 hover:bg-gray-600 rounded px-2"
        >
          {isCollapsed ? '>>' : '<<'}
        </button>
      </div>
      <div className="mt-4">
        {materials.map((material) => (
          <div key={material.id} className="flex justify-between items-center mb-2">
            <div className="flex-grow">
              <MaterialPreview
                className="block"
                color={material.color}
                metalness={material.metalness}
                roughness={material.roughness}
              />
              <div className="flex justify-between my-2">
                <button
                  onClick={() => selectMaterial(material.id)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMaterial(material.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
