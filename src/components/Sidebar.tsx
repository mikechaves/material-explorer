import React, { useEffect, useState } from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import { motion } from 'framer-motion';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { materials, selectMaterial, deleteMaterial } = useMaterials();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.5 }
      };

  return (
    
    <motion.div {...animationProps}>
      <aside
        className={`transform top-0 left-0 h-full fixed overflow-auto transition-width duration-300 ease-in-out 
                    ${isCollapsed ? 'w-0' : 'w-1/5'} bg-gray-800 text-white p-4`}
      >
        {/* <div className="bg-blue-500 text-white p-4">
      This is a Tailwind CSS styled component.
    </div> */}
        <div className="flex justify-between items-center">
          <h1 className="text-lg">Materials</h1>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sm bg-gray-700 hover:bg-gray-600 rounded px-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            aria-expanded={!isCollapsed}
            aria-controls="sidebarContent"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? '>>' : '<<'}
          </button>
        </div>
        <nav>
          <div id="sidebarContent" className={`mt-4 ${isCollapsed ? 'hidden' : ''}`}>
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
                      className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      aria-label={`Edit ${material.color} material`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMaterial(material.id)}
                      className="text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                      aria-label={`Delete ${material.color} material`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </motion.div>
  );
};

export default Sidebar;
