import React, { useState, useEffect } from 'react';
import { MaterialProvider } from './contexts/MaterialContext';
import MaterialEditor from './components/MaterialEditor';
import Sidebar from './components/Sidebar';
import './styles/App.css';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(200); // Initial sidebar width

  useEffect(() => {
    const handleResize = () => {
      // Adjust sidebar width here if necessary
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <MaterialProvider>
      <div className="App flex">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth} // Passing setSidebarWidth to Sidebar
        />
        <main
          id="maincontent"
          style={{ marginLeft: `${sidebarWidth}px` }} // Dynamically set marginLeft to match the sidebarWidth
          className="material-editor transition-all duration-300 ease-in-out flex-grow"
        >
          <MaterialEditor />
        </main>
      </div>
    </MaterialProvider>
  );
}

export default App;
