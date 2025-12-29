import React, { useState } from 'react';
import { MaterialProvider } from './contexts/MaterialContext';
import MaterialEditor from './components/MaterialEditor';
import Sidebar from './components/Sidebar';
import './styles/App.css';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 350;
    const raw = window.localStorage.getItem('sidebarWidth');
    const parsed = raw ? Number.parseInt(raw, 10) : 350;
    return Number.isFinite(parsed) ? parsed : 350;
  });

  return (
    <MaterialProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-black">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          width={sidebarWidth}
          setWidth={setSidebarWidth}
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