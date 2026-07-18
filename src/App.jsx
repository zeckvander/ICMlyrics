import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Identificacao from '@/pages/Identificacao';
import Louvor from '@/pages/Louvor'; 
import LouvorDetail from '@/pages/LouvorDetail';
import NovaLista from '@/pages/NovaLista';
import Drive from '@/pages/Drive';
import HistoricoListas from '@/pages/HistoricoListas'; 
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import Biblia from '@/pages/biblia'; 
import ModoPlaylist from '@/pages/ModoPlaylist';
import Backup from '@/pages/Backup'; 
import Avisos from '@/pages/Avisos'; // IMPORTADO AQUI
import { ToolsProvider } from '@/components/tools/ToolsProvider';

const PrivateLayout = ({ children }) => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError?.type === 'auth_required') {
    return <Navigate to="/login" replace />;
  }

  return <ToolsProvider>{children}</ToolsProvider>;
};

function App() {
  const APP_VERSION = "1.0.2"; 

  useEffect(() => {
    const savedVersion = localStorage.getItem("app_version");

    if (savedVersion !== APP_VERSION) {
      console.log("Atualização detectada. Preservando sessão e limpando cache antigo...");
      
      const keysToKeep = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
      
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key) && key !== 'app_version') {
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem("app_version", APP_VERSION);
    }
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router 
          future={{ 
            v7_startTransition: true, 
            v7_relativeSplatPath: true 
          }}
        >
          <ScrollToTop />
          
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/" element={<PrivateLayout><Identificacao /></PrivateLayout>} />
            <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
            <Route path="/louvor" element={<PrivateLayout><Louvor /></PrivateLayout>} /> 
            <Route path="/louvor/:id" element={<PrivateLayout><LouvorDetail /></PrivateLayout>} />
            <Route path="/nova-lista" element={<PrivateLayout><NovaLista /></PrivateLayout>} />
            <Route path="/drive" element={<PrivateLayout><Drive /></PrivateLayout>} />
            <Route path="/historico-listas" element={<PrivateLayout><HistoricoListas /></PrivateLayout>} /> 
            <Route path="/chat" element={<PrivateLayout><Chat /></PrivateLayout>} />
            <Route path="/modo-playlist" element={<PrivateLayout><ModoPlaylist /></PrivateLayout>} />
            <Route path="/biblia" element={<PrivateLayout><Biblia /></PrivateLayout>} />
            
            <Route path="/backup" element={<PrivateLayout><Backup /></PrivateLayout>} />
            
            {/* ROTA DO MURAL DE AVISOS ADICIONADA */}
            <Route path="/avisos" element={<PrivateLayout><Avisos /></PrivateLayout>} />

            <Route path="*" element={<PageNotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;