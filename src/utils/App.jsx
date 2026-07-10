import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Identificacao from '@/pages/Identificacao';
import Home from '@/pages/Home';
import LouvorDetail from '@/pages/LouvorDetail';
import NovaLista from '@/pages/NovaLista';
import Drive from '@/pages/Drive';
import ConsultarLouvores from '@/pages/HistoricoListas';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import ModoPlaylist from '@/pages/ModoPlaylist'; // Nova importação da tela criada
import { ToolsProvider } from '@/components/tools/ToolsProvider';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <ToolsProvider>
    <Routes>
      <Route path="/" element={<Identificacao />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/inicio" element={<Home />} />
      <Route path="/louvor/:id" element={<LouvorDetail />} />
      <Route path="/nova-lista" element={<NovaLista />} />
      <Route path="/drive" element={<Drive />} />
      <Route path="/consultar-louvores" element={<ConsultarLouvores />} />
      <Route path="/chat" element={<Chat />} />
      
      {/* Rota adicionada para o Modo Playlist */}
      <Route path="/modo-playlist" element={<ModoPlaylist />} />
      
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </ToolsProvider>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App