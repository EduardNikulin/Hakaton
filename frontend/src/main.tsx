import React from 'react';
import ReactDOM from 'react-dom/client';
// Явно .tsx: иначе Vite/TS могут выбрать legacy App.jsx
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);