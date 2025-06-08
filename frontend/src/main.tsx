// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Importa o CSS global
import { AuthProvider } from './context/AuthContext.tsx'; // NOVO: Importa AuthProvider

// Cria o "root" para o React renderizar a aplicação
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* NOVO: Envolve a aplicação com AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);