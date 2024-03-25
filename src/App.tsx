import React, { useState, useEffect } from 'react';
import { MaterialProvider } from './contexts/MaterialContext';
import MaterialEditor from './components/MaterialEditor';
import Sidebar from './components/Sidebar';
import './styles/App.css';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  //const [sidebarWidth, setSidebarWidth] = useState(200); // Initial sidebar width
  const [sidebarWidth, setSidebarWidth] = useState(window.innerWidth * 0.2);
  
  useEffect(() => {
    const handleResize = () => {
      // Adjust sidebar width here if necessary
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <MaterialProvider>
      {/* <div className = "App flex"> */}
      <div className="w-full h-screen grid grid-cols-[max-content_auto] grid-rows-[5fr_1fr] gap-y-2 p-2 bg-black">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          //sidebarWidth={sidebarWidth}
          //setSidebarWidth={setSidebarWidth} // Passing setSidebarWidth to Sidebar
        />
        <main
          id="maincontent"
          style={{ marginLeft: `${sidebarWidth}px` }} // Adjust marginLeft to create space for the sidebar
          className="material-editor transition-all duration-300 ease-in-out flex-grow bg-black w-[100dvw] h-[100dvh] overflow-hidden"
        >
          <MaterialEditor width={window.innerWidth - sidebarWidth} />
        </main>
      </div>
    </MaterialProvider>
  );
}

export default App;
