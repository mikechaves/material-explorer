import React from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarWidth: number; // Passed from parent to control sidebar width
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>; // Function to update sidebar width from parent
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, sidebarWidth, setSidebarWidth }) => {
  const { materials, selectMaterial, deleteMaterial } = useMaterials();

  const handleSelectMaterial = (id: string) => {
    console.log(`Selecting material with ID: ${id}`);
    selectMaterial(id);
  };

  const handleDeleteMaterial = (id: string) => {
    console.log(`Deleting material with ID: ${id}`);
    deleteMaterial(id);
  };

  const onResize = (event: React.SyntheticEvent<Element, Event>, { size }: { size: { width: number } }) => {
    setSidebarWidth(size.width);
  };

  // Function to toggle the sidebar collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };


  return (
    <div className={`fixed top-0 left-0 h-full bg-[#1f1e1d] text-white z-10 flex transition-all duration-300 ease-in-out`} style={{ width: isCollapsed ? '0px' : `${sidebarWidth}px` }}>
      <div className={`p-4 overflow-auto ${isCollapsed ? 'hidden' : 'block'}`}>
      {/* Flex container for the header */}
        <div className="flex justify-between items-center">
          <div className="flex-grow flex justify-start items-center">
            <a href="https://lumalabs.ai/">
              <img alt="Luma Logo" width="56" height="56" src="https://cdn-luma.com/public/lumalabs.ai/images/logo.png"/>
            </a>
            <h1 className="text-lg ml-4 font-bold">MATERIALS</h1>
          </div>
          <button onClick={toggleCollapse} className="px-2 py-0 text-xs font-bold rounded-full bg-gray-700 hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
          {isCollapsed ? '>>' : '<<'}
          </button>
        </div>
        <nav id="sidebarContent" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {materials.map((material) => (
              <div key={material.id} className="flex flex-col items-center mb-4 p-2">
                <MaterialPreview className="w-20 h-20" color={material.color} metalness={material.metalness} roughness={material.roughness} />
                <div className="mt-2 text-center">
                  <button
                    onClick={() => handleSelectMaterial(material.id)}
                    className="px-4 py-0 text-xs font-bold bg-gray-700 hover:bg-gray-600 border border-white/10 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mx-1 transition-colors duration-150 ease-in-out"
                    aria-label={`Edit ${material.color} material`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="px-2 py-0 text-xs font-bold bg-red-500 hover:bg-red-600 border border-white/10 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 mx-1 transition-colors duration-150 ease-in-out"
                    aria-label={`Delete ${material.color} material`}
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        </nav>
      </div>
      <Resizable
        width={sidebarWidth}
        height={Infinity}
        onResize={onResize}
        handle={<span className="react-resizable-handle" />}
        resizeHandles={['e']}
      >
        {/* Invisible Resizable handle */}
        <span />
      </Resizable>
    </div>
  );
};

export default Sidebar;
