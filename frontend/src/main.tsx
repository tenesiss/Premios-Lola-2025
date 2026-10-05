import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './stylesheets/index.css';
import './stylesheets/admin.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
