import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // Import Tailwind styles
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Keep web-vitals quiet by default (it can spam the console in production).
// If you want to measure performance locally, uncomment:
// if (process.env.NODE_ENV === 'development') reportWebVitals(console.log);
reportWebVitals();
