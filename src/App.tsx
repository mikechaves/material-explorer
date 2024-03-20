import React from 'react';
import './styles/App.css';
import { MaterialProvider } from './contexts/MaterialContext';
import MaterialEditor from './components/MaterialEditor';
import Sidebar from './components/Sidebar'; // Make sure to import the Sidebar component

function App() {
  return (
    <MaterialProvider>
      <div className="App">
        <header className="App-header">
          {/* Your app header here */}
        </header>
        <main>
          <Sidebar /> {/* Add the Sidebar component here */}
          {/* Wrap the entire component tree that needs access to the MaterialContext */}
          <MaterialEditor />
          {/* You can add other components here that should have access to the MaterialContext */}
        </main>
      </div>
    </MaterialProvider>
  );
}

export default App;
