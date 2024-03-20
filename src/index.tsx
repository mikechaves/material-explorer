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

reportWebVitals(console.log);
// Or for more advanced analytics integration
reportWebVitals((metrics) => {
  console.log(metrics);
  // Send to an analytics endpoint
  // fetch('your-analytics-endpoint', { body: JSON.stringify(metrics), ... });
});
