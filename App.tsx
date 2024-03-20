import React, { useState } from 'react';
import { MaterialProvider } from './contexts/MaterialContext';
import MaterialEditor from './components/MaterialEditor';
import Sidebar from './components/Sidebar';

function App() {
  // State to manage the collapsed state of the sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <MaterialProvider>
      <div className="flex">
        {/* Sidebar takes up 1/5th of the space when expanded, hidden on small screens */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Material Editor takes the remaining space */}
        <main className={`flex-grow transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-1/5'}`}>
          <MaterialEditor />
        </main>
      </div>
    </MaterialProvider>
  );
}

export default App;
