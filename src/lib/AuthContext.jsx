import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();
const STORAGE_KEY = "icmtools_musico";

export const AuthProvider = ({ children }) => {
  // Inicializa o estado lendo direto do localStorage
  const [user, setUser] = useState(() => {
    const nomeSalvo = localStorage.getItem(STORAGE_KEY);
    return nomeSalvo ? { name: nomeSalvo } : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(true);
  const [appPublicSettings, setAppPublicSettings] = useState({}); 

  // Função adaptada caso alguma outra tela do seu app tente chamá-la
  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  // Função adaptada para manter a compatibilidade com o resto do código
  const checkUserAuth = async () => {
    const nomeSalvo = localStorage.getItem(STORAGE_KEY);
    if (nomeSalvo) {
      setUser({ name: nomeSalvo });
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  // Logout local limpando o localStorage
  const logout = (shouldRedirect = true) => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = "/";
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};