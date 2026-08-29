import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, Lock, User, Music, ArrowLeft, LogIn, UserPlus, AlertCircle, Eye, EyeOff, Mail, KeyRound, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import bannerImg from "../assets/Tromb_mundo.jpg";

const INSTRUMENTOS_SIMPLIFICADOS = [
  { id: 'piano', nome: 'Piano / Teclado', perfilDefault: 'instrumento' },
  { id: 'violao', nome: 'Violão / Guitarra', perfilDefault: 'instrumento' },
  { id: 'baixo', nome: 'Contrabaixo', perfilDefault: 'instrumento' },
  { id: 'outros', nome: 'Outros', perfilDefault: 'instrumento' },
  { id: 'voz', nome: 'Voz (Apenas Letra)', perfilDefault: 'voz' },
];

export default function LoginScreen() {
  const navigate = useNavigate();
  
  const [modo, setModo] = useState('login');
  
  const [usernameInput, setUsernameInput] = useState('');
  const [emailReal, setEmailReal] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [instrumento, setInstrumento] = useState('piano');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const [checandoUsername, setChecandoUsername] = useState(false);
  const [usernameDisponivel, setUsernameDisponivel] = useState(null);
  const [sugestaoIndex, setSugestaoIndex] = useState(0);

  const sanitizar = (texto) => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

  const gerarVariaçõesUsername = (nomeCompleto) => {
    if (!nomeCompleto.trim()) return [''];

    const partes = nomeCompleto.trim().split(/\s+/).map(sanitizar).filter(Boolean);
    if (partes.length === 0) return [''];

    const primeiro = partes[0];
    const ultimo = partes.length > 1 ? partes[partes.length - 1] : '';

    const numRandom2D = Math.floor(10 + Math.random() * 90);
    const numRandom1D = Math.floor(1 + Math.random() * 9);

    const opcoes = [
      `@${partes.join('')}`,                           
      ultimo ? `@${primeiro}_${ultimo}` : `@${primeiro}_icm`, 
      ultimo ? `@${primeiro}.${ultimo}` : `@${primeiro}music`, 
      `@${primeiro}${numRandom2D}`, 
      ultimo ? `@${primeiro}${ultimo}${numRandom1D}` : `@${primeiro}_lyrics`,
    ];

    return [...new Set(opcoes)];
  };

  const handleNomeChange = (e) => {
    const novoNome = e.target.value;
    setNome(novoNome);

    if (modo === 'cadastro') {
      const variacoes = gerarVariaçõesUsername(novoNome);
      setSugestaoIndex(0);
      setUsernameInput(variacoes[0] || '');
    }
  };

  const handleGirarSugestao = () => {
    if (!nome.trim()) return;
    const novasVariacoes = gerarVariaçõesUsername(nome);
    const proximoIndex = (sugestaoIndex + 1) % novasVariacoes.length;
    
    setSugestaoIndex(proximoIndex);
    setUsernameInput(novasVariacoes[proximoIndex]);
  };

  useEffect(() => {
    if (modo !== 'cadastro' || !usernameInput || usernameInput.length < 3) {
      setUsernameDisponivel(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecandoUsername(true);
      try {
        const usernameFormatado = usernameInput.startsWith('@') ? usernameInput : `@${usernameInput}`;
        
        const { data } = await supabase
          .from('perfis_usuario')
          .select('username')
          .ilike('username', usernameFormatado)
          .maybeSingle();

        setUsernameDisponivel(!data); 
      } catch (err) {
        console.error("Erro ao verificar username:", err);
      } finally {
        setChecandoUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameInput, modo]);

  const handleUsernameManualChange = (e) => {
    let val = e.target.value.trim().replace(/\s+/g, '');
    if (val && !val.startsWith('@') && !val.includes('@')) {
      val = '@' + val;
    }
    setUsernameInput(val);
  };

  const handleRecuperarSenha = async (e) => {
    e.preventDefault();
    setErroMsg('');
    setMsgSucesso('');
    setLoading(true);

    try {
      let targetEmail = usernameInput.trim();

      if (targetEmail.startsWith('@')) {
        const { data: perfil } = await supabase
          .from('perfis_usuario')
          .select('email_recuperacao')
          .ilike('username', targetEmail)
          .maybeSingle();

        if (perfil?.email_recuperacao) {
          targetEmail = perfil.email_recuperacao;
        } else {
          throw new Error('Usuário não encontrado ou sem e-mail cadastrado.');
        }
      }

      if (!targetEmail || !targetEmail.includes('@')) {
        throw new Error('Por favor, informe um e-mail válido ou seu @login.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) throw error;

      setMsgSucesso('Se a conta existir, enviamos um link de redefinição para o seu e-mail!');
    } catch (error) {
      setErroMsg(error.message || 'Erro ao processar a recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroMsg('');
    setMsgSucesso('');

    if (modo === 'recuperar') {
      return handleRecuperarSenha(e);
    }

    setLoading(true);

    try {
      const isCadastro = modo === 'cadastro';
      const usernameTratado = usernameInput.startsWith('@') ? usernameInput : `@${usernameInput}`;

      if (isCadastro) {
        if (usernameTratado.length < 3) {
          throw new Error('O login deve ter pelo menos 3 caracteres.');
        }

        if (usernameDisponivel === false) {
          throw new Error(`O login ${usernameTratado} já está em uso. Clique no botão de recarregar ao lado para escolher outro!`);
        }

        const instObj = INSTRUMENTOS_SIMPLIFICADOS.find(i => i.id === instrumento);
        const perfilInicial = instObj?.perfilDefault || 'instrumento';

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailReal,
          password: senha,
          options: {
            data: {
              full_name: nome,
              username: usernameTratado,
              instrumento: instrumento
            }
          }
        });

        if (authError) throw authError;

        if (authData?.user) {
          await supabase.from('perfis_usuario').upsert({
            id: authData.user.id,
            username: usernameTratado,
            email_recuperacao: emailReal,
            instrumento: instrumento,
            perfil: perfilInicial,
            updated_at: new Date().toISOString()
          });

          localStorage.setItem('icmlyrics_user', nome);
          localStorage.setItem('icmlyrics_perfil', perfilInicial);
          localStorage.setItem('icmlyrics_instrumento', instrumento);
          navigate('/perfil');
        }

      } else {
        let emailParaLogin = usernameInput;

        if (usernameInput.startsWith('@')) {
          const { data: perfil } = await supabase
            .from('perfis_usuario')
            .select('email_recuperacao')
            .ilike('username', usernameInput)
            .maybeSingle();

          if (perfil?.email_recuperacao) {
            emailParaLogin = perfil.email_recuperacao;
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailParaLogin,
          password: senha,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Login ou senha incorretos.');
          }
          throw error;
        }

        if (data?.user) {
          const nomeSalvo = data.user.user_metadata?.full_name || usernameTratado;
          localStorage.setItem('icmlyrics_user', nomeSalvo);

          const { data: perfilBanco } = await supabase
            .from('perfis_usuario')
            .select('perfil, instrumento')
            .eq('id', data.user.id)
            .single();

          if (perfilBanco) {
            localStorage.setItem('icmlyrics_perfil', perfilBanco.perfil || 'instrumento');
            localStorage.setItem('icmlyrics_instrumento', perfilBanco.instrumento || 'piano');
          }

          navigate('/perfil');
        }
      }
    } catch (error) {
      setErroMsg(error.message || 'Ocorreu um erro ao processar.');
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
        
        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner backdrop-blur-md">
            {modo === 'cadastro' && <UserPlus className="w-6 h-6" />}
            {modo === 'login' && <LogIn className="w-6 h-6" />}
            {modo === 'recuperar' && <KeyRound className="w-6 h-6" />}
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {modo === 'cadastro' && 'Criar Conta no ICMLyrics'}
            {modo === 'login' && 'Acessar Sua Conta'}
            {modo === 'recuperar' && 'Recuperar Senha'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {modo === 'cadastro' && 'Sincronize suas cifras e anotações na nuvem'}
            {modo === 'login' && 'Entre para recuperar suas preferências salvas'}
            {modo === 'recuperar' && 'Informe seu login ou e-mail para receber o link'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-md p-5 rounded-2xl shadow-2xl space-y-4">
          
          {erroMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erroMsg}</span>
            </div>
          )}

          {msgSucesso && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
              <span>{msgSucesso}</span>
            </div>
          )}

          {modo === 'cadastro' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Lucas Silva"
                  value={nome}
                  onChange={handleNomeChange}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          {modo !== 'recuperar' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Login (@usuario)</label>
                
                {modo === 'cadastro' && usernameInput.length >= 3 && (
                  <span className="text-[11px] flex items-center gap-1">
                    {checandoUsername ? (
                      <span className="text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checando...</span>
                    ) : usernameDisponivel === true ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Disponível</span>
                    ) : usernameDisponivel === false ? (
                      <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> Em uso</span>
                    ) : null}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <AtSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    readOnly
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    autoComplete="off"
                    placeholder="@lucassilva"
                    value={usernameInput}
                    onChange={handleUsernameManualChange}
                    className={`w-full bg-slate-950/80 border rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                      modo === 'cadastro' && usernameDisponivel === false 
                        ? 'border-red-500/60 focus:border-red-500' 
                        : modo === 'cadastro' && usernameDisponivel === true 
                        ? 'border-emerald-500/60 focus:border-emerald-500' 
                        : 'border-slate-800 focus:border-blue-500'
                    }`}
                  />
                </div>

                {modo === 'cadastro' && (
                  <button
                    type="button"
                    onClick={handleGirarSugestao}
                    title="Gerar outra combinação de login"
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all active:scale-95 flex items-center justify-center shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {(modo === 'cadastro' || modo === 'recuperar') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {modo === 'recuperar' ? 'Seu Login ou E-mail' : 'E-mail para Recuperação'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type={modo === 'recuperar' ? "text" : "email"}
                  required
                  placeholder={modo === 'recuperar' ? "@LucasSilva ou email@exemplo.com" : "seuemail@exemplo.com"}
                  value={modo === 'recuperar' ? usernameInput : emailReal}
                  onChange={(e) => modo === 'recuperar' ? setUsernameInput(e.target.value) : setEmailReal(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          {modo !== 'recuperar' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Senha</label>
                {modo === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setModo('recuperar'); setErroMsg(''); setMsgSucesso(''); }}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  readOnly
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
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
          )}

          {modo === 'cadastro' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Instrumento Principal</label>
              <div className="relative">
                <Music className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <select
                  value={instrumento}
                  onChange={(e) => setInstrumento(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {INSTRUMENTOS_SIMPLIFICADOS.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (modo === 'cadastro' && usernameDisponivel === false)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? 'Aguarde...' : modo === 'cadastro' ? 'Criar Conta' : modo === 'recuperar' ? 'Enviar Link de Recuperação' : 'Entrar'}
          </button>
        </form>

        <div className="text-center mt-6">
          {modo === 'recuperar' ? (
            <button
              onClick={() => { setModo('login'); setErroMsg(''); setMsgSucesso(''); }}
              className="text-xs text-slate-300 hover:text-blue-400 font-medium transition-colors"
            >
              Voltar para o Login
            </button>
          ) : (
            <button
              onClick={() => {
                setModo(modo === 'login' ? 'cadastro' : 'login');
                setErroMsg('');
                setMsgSucesso('');
              }}
              className="text-xs text-slate-300 hover:text-blue-400 font-medium transition-colors"
            >
              {modo === 'cadastro' 
                ? 'Já tem uma conta? Faça login' 
                : 'Não tem uma conta? Clique aqui para criar'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}