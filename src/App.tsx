import React, { useEffect, useState } from 'react';
import { MaterialProvider } from './contexts/MaterialContext';
import MaterialEditor from './components/MaterialEditor';
import Sidebar from './components/Sidebar';
import './styles/App.css';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 350;
    const raw = window.localStorage.getItem('sidebarWidth');
    const parsed = raw ? Number.parseInt(raw, 10) : 350;
    return Number.isFinite(parsed) ? parsed : 350;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Default to a closed sidebar on mobile (drawer).
  useEffect(() => {
    if (isMobile) setIsSidebarCollapsed(true);
  }, [isMobile]);

  return (
    <MaterialProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-black">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          width={sidebarWidth}
          setWidth={setSidebarWidth}
          isMobile={isMobile}
        />
        {isMobile && isSidebarCollapsed && (
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute top-4 left-4 z-20 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm backdrop-blur"
          >
            Menu
          </button>
        )}
        <main
          style={{ 
            marginLeft: isMobile ? 0 : isSidebarCollapsed ? '64px' : `${sidebarWidth}px`,
            width: isMobile ? '100%' : isSidebarCollapsed ? 'calc(100% - 64px)' : `calc(100% - ${sidebarWidth}px)`
          }}
          className="h-full transition-all duration-300 ease-in-out overflow-hidden"
        >
          <MaterialEditor />
        </main>
      </div>
    </MaterialProvider>
  );
}

export default App;