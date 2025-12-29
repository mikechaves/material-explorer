import React, { useEffect, useRef, useState } from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../logo.svg';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  width: number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
}

const [minWidth, maxWidth] = [200, 500];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, width, setWidth }) => {
  const { materials, selectMaterial, deleteMaterial } = useMaterials();
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragged = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragged.current) return;
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setWidth(newWidth);
      localStorage.setItem("sidebarWidth", newWidth.toString());
      document.body.style.cursor = 'ew-resize';
    };

    const handleMouseUp = () => {
      isDragged.current = false;
      document.body.style.cursor = 'default';
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setWidth]);

  return (
    <motion.div 
      ref={sidebarRef}
      className="fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-md text-white z-10 flex shadow-xl"
      animate={{ width: isCollapsed ? 64 : width }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
    >
      <div className="p-4 w-full overflow-hidden">
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center mb-6`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-4'}`}>
            <motion.button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                alt="Material Explorer" 
                width="40" 
                height="40" 
                src={logo}
                className="rounded-lg"
              />
            </motion.button>
            
            {!isCollapsed && (
              <motion.h1 
                className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                MATERIALS
              </motion.h1>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <motion.div layout className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {materials.map((material) => (
                <motion.div
                  key={material.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-black/30 border border-white/5 
                                hover:border-purple-500/30 transition-all duration-300">
                    <MaterialPreview
                      className="w-full h-full"
                      color={material.color}
                      metalness={material.metalness}
                      roughness={material.roughness}
                    />
                    
                    {/* Control overlay */}
                    <div
                      className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent
                                 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                    >
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => selectMaterial(material.id)}
                          aria-label="Edit material"
                          className="px-4 py-1 text-xs font-medium bg-purple-500/90 hover:bg-purple-400 
                                   rounded-full text-white shadow-lg backdrop-blur-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            const ok = window.confirm('Delete this material?');
                            if (ok) deleteMaterial(material.id);
                          }}
                          aria-label="Delete material"
                          className="px-4 py-1 text-xs font-medium bg-red-500/90 hover:bg-red-400 
                                   rounded-full text-white shadow-lg backdrop-blur-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className="w-1 cursor-ew-resize bg-transparent hover:bg-purple-500/20 
                     transition-colors duration-200 relative"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={() => {
            isDragged.current = true;
            setIsDragging(true);
          }}
        >
          <motion.div
            className="absolute inset-y-0 -right-0.5 w-1 bg-purple-500/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragging ? 1 : 0 }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;