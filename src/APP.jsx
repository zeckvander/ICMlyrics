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
import ModoPlaylist from '@/pages/ModoPlaylist'; // 1. IMPORTAÇÃO ADICIONADA AQUI
import { ToolsProvider } from '@/components/tools/ToolsProvider';

// Componente para proteger as rotas privadas
const PrivateLayout = ({ children }) => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Carregamento
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Erro de registro
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Se precisar de autenticação, redireciona de forma segura para o login
  if (authError?.type === 'auth_required') {
    return <Navigate to="/login" replace />;
  }

  // Se estiver tudo ok, renderiza as rotas protegidas com o ToolsProvider
  return <ToolsProvider>{children}</ToolsProvider>;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        {/* Configurado o objeto future para silenciar os avisos do v7 */}
        <Router 
          future={{ 
            v7_startTransition: true, 
            v7_relativeSplatPath: true 
          }}
        >
          <ScrollToTop />
          
          <Routes>
            {/* ROTAS PÚBLICAS (Acessíveis sem login) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ROTAS PRIVADAS (Protegidas pelo PrivateLayout) */}
            <Route path="/" element={<PrivateLayout><Identificacao /></PrivateLayout>} />
            <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
            <Route path="/louvor" element={<PrivateLayout><Louvor /></PrivateLayout>} /> 
            <Route path="/louvor/:id" element={<PrivateLayout><LouvorDetail /></PrivateLayout>} />
            <Route path="/nova-lista" element={<PrivateLayout><NovaLista /></PrivateLayout>} />
            <Route path="/drive" element={<PrivateLayout><Drive /></PrivateLayout>} />
            <Route path="/historico-listas" element={<PrivateLayout><HistoricoListas /></PrivateLayout>} /> 
            <Route path="/chat" element={<PrivateLayout><Chat /></PrivateLayout>} />
            
            {/* 2. ROTA PRIVADA DO MODO PLAYLIST ADICIONADA AQUI */}
            <Route path="/modo-playlist" element={<PrivateLayout><ModoPlaylist /></PrivateLayout>} />

            {/* ROTA 404 */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>

          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;