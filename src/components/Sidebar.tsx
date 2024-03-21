import React, { useState, useEffect } from 'react';
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

  // Update the width for both sidebar and material editor on drag
  const onResize = (event: React.SyntheticEvent<Element, Event>, { size }: { size: { width: number } }) => {
    setSidebarWidth(size.width);
  };

  return (
    <div 
      className={`fixed top-0 left-0 h-full bg-gray-800 text-white z-10 flex transition-all duration-300 ease-in-out`}
      style={{ width: isCollapsed ? '0px' : `${sidebarWidth}px` }} // Apply dynamic inline style based on sidebarWidth
    >
      <div className={`p-4 overflow-auto ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="flex justify-between items-center">
          <h1 className="text-lg">Materials</h1>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sm bg-gray-700 hover:bg-gray-600 rounded px-2 focus:outline-none focus:ring focus:ring-gray-500 focus:ring-opacity-50"
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? '>>' : '<<'}
          </button>
        </div>
        <nav id="sidebarContent" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {materials.map((material) => (
              <div key={material.id} className="flex flex-col items-center mb-4 p-2">
                <MaterialPreview
                  className="w-full h-24"
                  color={material.color}
                  metalness={material.metalness}
                  roughness={material.roughness}
                />
                <div className="mt-2 text-center">
                  <button
                    onClick={() => selectMaterial(material.id)}
                    className="text-sm text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mx-1"
                    aria-label={`Edit ${material.color} material`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMaterial(material.id)}
                    className="text-sm text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 mx-1"
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
