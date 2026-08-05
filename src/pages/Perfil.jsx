import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Importando o hook de navegação
import { 
  Settings, 
  Mic, 
  Music, 
  Moon, 
  Sun, 
  Cloud, 
  Database, // <-- Ícone atualizado para combinar com sua tela de backup
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';

export default function ConfigScreen() {
  const navigate = useNavigate(); // <-- Inicializando a navegação
  const [perfil, setPerfil] = useState('instrumento');
  const [tema, setTema] = useState('escuro');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6 font-sans">
      
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-800">
        <Settings className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </header>

      {/* Conta do Usuário */}
      <section className="mb-8 bg-gray-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Ezequiel Ferreira</h2>
            <p className="text-sm text-gray-400">Teclado / Piano</p>
          </div>
        </div>
      </section>

      {/* 1. Preferências de Execução */}
      <section className="mb-8">
        <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3 font-semibold">
          Preferências de Execução
        </h3>
        <div className="bg-gray-800 rounded-xl p-2 grid grid-cols-2 gap-2 shadow-lg">
          <button
            onClick={() => setPerfil('voz')}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
              perfil === 'voz' 
                ? 'bg-blue-600 text-white' 
                : 'bg-transparent text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Mic className="w-6 h-6" />
            <span className="font-medium">Voz (Letra)</span>
          </button>
          
          <button
            onClick={() => setPerfil('instrumento')}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
              perfil === 'instrumento' 
                ? 'bg-blue-600 text-white' 
                : 'bg-transparent text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Music className="w-6 h-6" />
            <span className="font-medium">Instrumento (Cifra)</span>
          </button>
        </div>
      </section>

      {/* 2. Aparência */}
      <section className="mb-8">
        <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3 font-semibold">
          Aparência
        </h3>
        <div className="bg-gray-800 rounded-xl divide-y divide-gray-700 shadow-lg">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {tema === 'escuro' ? <Moon className="w-5 h-5 text-gray-300" /> : <Sun className="w-5 h-5 text-gray-300" />}
              <span className="font-medium">Modo Escuro</span>
            </div>
            <button 
              onClick={() => setTema(tema === 'escuro' ? 'claro' : 'escuro')}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${tema === 'escuro' ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${tema === 'escuro' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Conta e Backup Integrado */}
      <section className="mb-8">
        <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3 font-semibold">
          Dados do Aplicativo
        </h3>
        <div className="bg-gray-800 rounded-xl divide-y divide-gray-700 shadow-lg">
          <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-750 transition-colors rounded-t-xl text-left">
            <Cloud className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <span className="block font-medium">Sincronização em Nuvem</span>
              <span className="block text-xs text-gray-400">Ativado</span>
            </div>
          </button>
          
          {/* BOTÃO QUE ABRE A TELA DE BACKUP QUE VOCÊ CRIOU */}
          <button 
            onClick={() => navigate('/backup')} 
            className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-colors text-left rounded-b-xl"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-400" />
              <div>
                <span className="block font-medium">Gerenciar Meus Dados</span>
                <span className="block text-xs text-gray-400">Exportar ou restaurar backup manual</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </section>

      {/* Rodapé */}
      <button className="w-full flex items-center justify-center gap-2 p-4 text-red-400 hover:bg-gray-800 rounded-xl transition-colors font-medium">
        <LogOut className="w-5 h-5" />
        Sair da Conta
      </button>

    </div>
  );
}