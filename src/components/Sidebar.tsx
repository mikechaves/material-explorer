import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { useMaterials } from '../contexts/MaterialContext';
import MaterialPreview from './MaterialPreview';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const [minWidth, maxWidth] = [200, 500];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { materials, selectMaterial, deleteMaterial } = useMaterials();
  const [width, setWidth] = useState(
    parseInt(localStorage.getItem("sidebarWidth") ?? '350')
  );
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredMaterial, setHoveredMaterial] = useState<string | null>(null);

  const handleSelectMaterial = (id: string) => {
    selectMaterial(id);
  };

  const handleDeleteMaterial = (id: string) => {
    deleteMaterial(id);
  };

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragged = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragged.current) return;
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setWidth(newWidth);
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
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", width.toString());
  }, [width]);

  const variants = {
    open: { width: width },
    closed: { width: 64 }, // Collapsed width to show just the logo and toggle
  };

  return (
    <motion.div 
      ref={sidebarRef}
      className="fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-md text-white z-10 flex shadow-xl"
      animate={isCollapsed ? "closed" : "open"}
      variants={variants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      initial={false}
    >
      <div className={`p-4 overflow-auto ${isCollapsed ? 'w-16' : 'w-full'}`}>
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center mb-6`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-4'}`}>
            <motion.button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg bg-transparent hover:bg-gray-800/50 
                       transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                alt="Luma Logo" 
                width="40" 
                height="40" 
                src="https://cdn-luma.com/public/lumalabs.ai/images/logo.png"
                className="rounded-lg"
              />
            </motion.button>
            
            {!isCollapsed && (
              <motion.h1 
                className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
              >
                MATERIALS
              </motion.h1>
            )}
          </div>
          
          {!isCollapsed && (
            <motion.button
              onClick={() => setIsCollapsed(true)}
              className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 
                       transition-colors duration-200 border border-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ←
            </motion.button>
          )}
        </div>

        {!isCollapsed && (
          <motion.div 
            layout
            className="grid grid-cols-2 gap-4"
          >
            <AnimatePresence>
              {materials.map((material) => (
                <motion.div
                  key={material.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="relative group"
                  onMouseEnter={() => setHoveredMaterial(material.id)}
                  onMouseLeave={() => setHoveredMaterial(null)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm
                                border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                    <MaterialPreview
                      className="w-full h-full"
                      color={material.color}
                      metalness={material.metalness}
                      roughness={material.roughness}
                    />
                    
                    {/* Control buttons inside the card */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex justify-center gap-2">
                        <motion.button
                          onClick={() => handleSelectMaterial(material.id)}
                          className="px-3 py-1 text-xs font-medium bg-purple-600/90 hover:bg-purple-500/90 
                                   rounded-full text-white shadow-lg backdrop-blur-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="px-3 py-1 text-xs font-medium bg-red-600/90 hover:bg-red-500/90 
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

      {/* Resizer handle */}
      {!isCollapsed && (
        <motion.div
          className="w-1 cursor-ew-resize bg-transparent hover:bg-purple-500/20 
                     transition-colors duration-200 relative"
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
        </motion.div>
      )}
    </motion.div>
  );
};

export default Sidebar;