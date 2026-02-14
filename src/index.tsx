import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // Import Tailwind styles
import App from './App';
import reportWebVitals from './reportWebVitals';
import { emitTelemetryEvent } from './utils/telemetry';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals((metric) => {
  emitTelemetryEvent(
    'web-vital',
    {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
    },
    'info'
  );
});
