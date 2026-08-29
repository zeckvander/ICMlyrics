import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import bannerImg from "../assets/Tromb_mundo.jpg";

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [erroMsg, setErroMsg] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleSalvarNovaSenha = async (e) => {
    e.preventDefault();
    setErroMsg('');

    if (novaSenha.length < 6) {
      setErroMsg('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroMsg('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // Atualiza a senha do usuário atualmente autenticado via link do e-mail
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;

      setSucesso(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (error) {
      setErroMsg(error.message || 'Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative bg-cover bg-center bg-no-repeat text-slate-100 flex items-center justify-center p-4 font-sans"
      style={{ backgroundImage: `url(${bannerImg})` }}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-sm my-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Redefinir Sua Senha</h1>
          <p className="text-xs text-slate-300 mt-1">Digite sua nova senha abaixo para acessar sua conta</p>
        </div>

        <form onSubmit={handleSalvarNovaSenha} className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-md p-5 rounded-2xl shadow-2xl space-y-4">
          
          {erroMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erroMsg}</span>
            </div>
          )}

          {sucesso ? (
            <div className="flex flex-col items-center text-center p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <span className="font-semibold text-sm">Senha alterada com sucesso!</span>
              <span className="text-slate-300">Redirecionando para a tela de login...</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nova Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    required
                    placeholder="Nova senha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    required
                    placeholder="Repita a nova senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}