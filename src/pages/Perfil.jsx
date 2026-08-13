import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Mic, 
  Music, 
  Moon, 
  Sun, 
  Cloud, 
  Database, 
  LogOut,
  User,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export default function ConfigScreen() {
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState(() => localStorage.getItem('icmlyrics_perfil') || 'instrumento');
  const [tema, setTema] = useState(() => localStorage.getItem('icmlyrics_tema') || 'escuro');
  const [sincronizacao, setSincronizacao] = useState(() => localStorage.getItem('icmlyrics_sync') !== 'false');
  
  const usuarioLocal = localStorage.getItem('icmlyrics_user') || 'Ezequiel Ferreira';

  useEffect(() => {
    localStorage.setItem('icmlyrics_perfil', perfil);
  }, [perfil]);

  useEffect(() => {
    localStorage.setItem('icmlyrics_tema', tema);
  }, [tema]);

  useEffect(() => {
    localStorage.setItem('icmlyrics_sync', sincronizacao);
  }, [sincronizacao]);

  const eEscuro = tema === 'escuro';

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair da conta?')) {
      localStorage.removeItem('icmlyrics_user');
      localStorage.removeItem('icmlyrics_user_nuvem');
      localStorage.removeItem('icmlyrics_role');
      navigate('/');
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 font-sans pb-28 transition-colors ${eEscuro ? 'bg-gray-900 text-gray-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Cabeçalho */}
      <header className={`flex items-center justify-between mb-8 pb-4 border-b ${eEscuro ? 'border-gray-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className={`p-2 rounded-xl transition-colors ${eEscuro ? 'bg-gray-800 text-gray-300 hover:text-white' : 'bg-slate-200 text-slate-700 hover:text-slate-900'}`}
            aria-label="Voltar ao dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">Configurações</h1>
          </div>
        </div>
      </header>

      {/* Conta do Usuário */}
      <section className={`mb-8 rounded-xl p-4 shadow-lg border ${eEscuro ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${eEscuro ? 'bg-gray-700 text-gray-300' : 'bg-blue-100 text-blue-600'}`}>
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{usuarioLocal}</h2>
            <p className={`text-sm capitalize ${eEscuro ? 'text-gray-400' : 'text-slate-500'}`}>
              {perfil === 'voz' ? 'Voz (Letra)' : 'Teclado / Piano (Cifra)'}
            </p>
          </div>
        </div>
      </section>

      {/* 1. Preferências de Execução */}
      <section className="mb-8">
        <h3 className={`text-sm uppercase tracking-wider mb-3 font-semibold ${eEscuro ? 'text-gray-400' : 'text-slate-500'}`}>
          Preferências de Execução
        </h3>
        <div className={`rounded-xl p-2 grid grid-cols-2 gap-2 shadow-lg border ${eEscuro ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-slate-200'}`}>
          <button
            onClick={() => setPerfil('voz')}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
              perfil === 'voz' 
                ? 'bg-blue-600 text-white shadow-md' 
                : eEscuro ? 'text-gray-400 hover:bg-gray-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-6 h-6" />
            <span className="font-medium">Voz (Letra)</span>
          </button>
          
          <button
            onClick={() => setPerfil('instrumento')}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
              perfil === 'instrumento' 
                ? 'bg-blue-600 text-white shadow-md' 
                : eEscuro ? 'text-gray-400 hover:bg-gray-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Music className="w-6 h-6" />
            <span className="font-medium">Instrumento (Cifra)</span>
          </button>
        </div>
      </section>

      {/* 2. Aparência */}
      <section className="mb-8">
        <h3 className={`text-sm uppercase tracking-wider mb-3 font-semibold ${eEscuro ? 'text-gray-400' : 'text-slate-500'}`}>
          Aparência
        </h3>
        <div className={`rounded-xl divide-y shadow-lg border ${eEscuro ? 'bg-gray-800 divide-gray-700 border-gray-700/50' : 'bg-white divide-slate-100 border-slate-200'}`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {eEscuro ? <Moon className="w-5 h-5 text-gray-300" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <span className="font-medium">Modo Escuro</span>
            </div>
            <button 
              onClick={() => setTema(eEscuro ? 'claro' : 'escuro')}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${eEscuro ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${eEscuro ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Conta e Backup Integrado */}
      <section className="mb-8">
        <h3 className={`text-sm uppercase tracking-wider mb-3 font-semibold ${eEscuro ? 'text-gray-400' : 'text-slate-500'}`}>
          Dados do Aplicativo
        </h3>
        <div className={`rounded-xl divide-y shadow-lg border ${eEscuro ? 'bg-gray-800 divide-gray-700 border-gray-700/50' : 'bg-white divide-slate-100 border-slate-200'}`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 text-blue-400" />
              <div>
                <span className="block font-medium">Sincronização em Nuvem</span>
                <span className={`block text-xs ${eEscuro ? 'text-gray-400' : 'text-slate-500'}`}>
                  {sincronizacao ? 'Ativado' : 'Desativado'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSincronizacao(!sincronizacao)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${sincronizacao ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${sincronizacao ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          
          <button 
            onClick={() => navigate('/backup')} 
            className={`w-full flex items-center justify-between p-4 transition-colors text-left rounded-b-xl group ${eEscuro ? 'hover:bg-gray-750' : 'hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-500" />
              <div>
                <span className="block font-medium">Gerenciar Meus Dados</span>
                <span className={`block text-xs ${eEscuro ? 'text-gray-400' : 'text-slate-500'}`}>Exportar ou restaurar backup manual</span>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 group-hover:translate-x-0.5 transition-transform ${eEscuro ? 'text-gray-500' : 'text-slate-400'}`} />
          </button>
        </div>
      </section>

      {/* Rodapé / Sair */}
      <button 
        onClick={handleLogout}
        className={`w-full flex items-center justify-center gap-2 p-4 text-red-400 rounded-xl transition-colors font-medium border ${eEscuro ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800' : 'bg-white border-red-100 hover:bg-red-500/5'}`}
      >
        <LogOut className="w-5 h-5" />
        Sair da Conta
      </button>

    </div>
  );
}