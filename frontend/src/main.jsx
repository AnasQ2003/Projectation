import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { installGlobalConsoleProtection } from './utils/crypto';

// Activate global browser console privacy shield
installGlobalConsoleProtection();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
