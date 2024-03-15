// src/App.tsx
import React from 'react';
import './styles/App.css'; // Assuming you're using CSS for styles
import { MaterialProvider } from './contexts/MaterialContext';
import MaterialEditor from './components/MaterialEditor';
// Import other components as needed

function App() {
  return (
    <MaterialProvider>
      <div className="App">
        <header className="App-header">
          {/* Your app header here */}
        </header>
        <main>
          {/* Wrap the entire component tree that needs access to the MaterialContext */}
          <MaterialEditor />
          {/* You can add other components here that should have access to the MaterialContext */}
        </main>
      </div>
    </MaterialProvider>
  );
}

export default App;
