import React, { useState } from 'react';
import { MaterialProvider } from './contexts/MaterialContext';
import MaterialEditor from './components/MaterialEditor';
import Sidebar from './components/Sidebar';
import './styles/App.css'; 
import logo from './logo.svg';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (

    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
    <MaterialProvider>
      <div className="flex">
        {/* If the Sidebar contains navigation links, wrap them in a <nav> tag for accessibility */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        <main id="maincontent" className={`flex-grow transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-1/5'}`}>
          <MaterialEditor />
        </main>
      </div>
    </MaterialProvider>
    </div>
  );
}

export default App;
