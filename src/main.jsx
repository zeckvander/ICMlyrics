import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

if (import.meta.env.DEV) {
  const filterViteLogs = (method) => {
    const original = console[method];
    console[method] = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('[vite]')) return;
      original(...args);
    };
  };
  filterViteLogs('log');
  filterViteLogs('debug');
  filterViteLogs('info');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)