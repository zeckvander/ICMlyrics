import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // 1. Importa o App (que tem as rotas)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Renderiza apenas o App. O Router já está dentro dele! */}
    <App />
  </React.StrictMode>,
)