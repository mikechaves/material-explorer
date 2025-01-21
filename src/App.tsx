import React, { useState, useEffect } from 'react';
import { MaterialProvider } from './contexts/MaterialContext';
import MaterialEditor from './components/MaterialEditor';
import Sidebar from './components/Sidebar';
import './styles/App.css';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth] = useState(window.innerWidth * 0.2);

  useEffect(() => {
    const handleResize = () => {
      // Future resize handling if needed
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <MaterialProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-black">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        <main
          style={{ 
            marginLeft: isSidebarCollapsed ? '64px' : `${sidebarWidth}px`,
            width: isSidebarCollapsed ? 'calc(100% - 64px)' : `calc(100% - ${sidebarWidth}px)`
          }}
          className="h-full transition-all duration-300 ease-in-out"
        >
          <MaterialEditor />
        </main>
      </div>
    </MaterialProvider>
  );
}

export default App;