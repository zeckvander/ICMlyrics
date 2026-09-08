import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Mic, 
  Music, 
  Moon, 
  Sun, 
  Database, 
  LogOut, 
  User, 
  ChevronRight, 
  ArrowLeft, 
  AlertTriangle, 
  Check, 
  Smartphone, 
  Type, 
  LogIn, 
  X, 
  Guitar, 
  Sliders, 
  Edit3, 
  Play, 
  Upload, 
  UserCheck, 
  Volume2, 
  Cloud, 
  CheckCircle2,
  Sparkles,
  HelpCircle
} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

const INSTRUMENTOS = [
  { id: 'teclado', nome: 'Teclado / Piano', icon: Music },
  { id: 'violao', nome: 'Violão / Guitarra', icon: Guitar },
  { id: 'baixo', nome: 'Contrabaixo', icon: Volume2 },
  { id: 'outro', nome: 'Outro Instrumento', icon: Sliders },
];

const NAIPES_VOCAIS = [
  { id: 'responsável', nome: 'Responsável', desc: 'Todas as vozes e partituras' },
  { id: 'soprano', nome: 'Soprano', desc: 'Voz feminina aguda' },
  { id: 'contralto', nome: 'Contralto', desc: 'Voz feminina grave' },
  { id: 'tenor', nome: 'Tenor', desc: 'Voz masculina aguda' },
  { id: 'baixo_voz', nome: 'Baixo', desc: 'Voz masculina grave' },
];

const AVATARES_PRESETS = [
  { id: 'preset1', bg: 'from-rose-500 to-red-600', isLetter: true },
  { id: 'preset5', bg: 'from-blue-500 to-indigo-600', emoji: '🎵' },
  { id: 'preset2', bg: 'from-purple-500 to-pink-600', emoji: '🎤' },
  { id: 'preset3', bg: 'from-emerald-500 to-teal-600', emoji: '🎹' },
  { id: 'preset4', bg: 'from-amber-500 to-orange-600', emoji: '🎸' },
  { id: 'preset6', bg: 'from-cyan-500 to-blue-600', emoji: '🎼' },
];

export default function ConfigScreen() {
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState(() => localStorage.getItem('icmlyrics_perfil') || 'voz');
  const [instrumento, setInstrumento] = useState(() => localStorage.getItem('icmlyrics_instrumento') || ' ');
  const [cifraPadrao, setCifraPadrao] = useState(() => localStorage.getItem('icmlyrics_cifra_padrao') || 'cifra1');
  const [tamanhoFonte, setTamanhoFonte] = useState(() => localStorage.getItem('icmlyrics_fonte') || 'md');
  const [manterTelaAcesa, setManterTelaAcesa] = useState(() => localStorage.getItem('icmlyrics_keep_awake') === 'true');
  const [tema, setTema] = useState(() => localStorage.getItem('icmlyrics_tema') || 'claro');
  
  const [naipeVocal, setNaipeVocal] = useState(() => localStorage.getItem('icmlyrics_naipe') || ' ');
  const [autoScroll, setAutoScroll] = useState(() => localStorage.getItem('icmlyrics_autoscroll') === 'true');
  const [velocidadeScroll, setVelocidadeScroll] = useState(() => localStorage.getItem('icmlyrics_velocidade_scroll') || '1x');

  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [nomeExibicao, setNomeExibicao] = useState(() => localStorage.getItem('icmlyrics_user') || 'Visitante');
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('icmlyrics_avatar') || '');
  const [avatarPreset, setAvatarPreset] = useState(() => localStorage.getItem('icmlyrics_avatar_preset') || 'preset1');

  const [temAlteracoesPendentes, setTemAlteracoesPendentes] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [editPerfilOpen, setEditPerfilOpen] = useState(false);
  const [limparFavoritos, setLimparFavoritos] = useState(false);
  
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);

  const [tempNome, setTempNome] = useState('');
  const [tempPreset, setTempPreset] = useState(avatarPreset);
  const [uploadingR2, setUploadingR2] = useState(false);

  const eEscuro = tema === 'escuro';

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    const jaViuTutorial = localStorage.getItem('icmlyrics_tutorial_perfil_visto');
    if (!jaViuTutorial) {
      setWelcomeOpen(true);
    }

    async function checarSessao() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUsuarioLogado(session.user);
        
        const { data: dadosPerfil } = await supabase
          .from('perfis_usuario')
          .select('username, avatar_url, naipe_vocal, instrumento, cifra_padrao, fonte, keep_awake, tema, autoscroll, velocidade_scroll')
          .eq('id', session.user.id)
          .maybeSingle();

        if (dadosPerfil) {
          if (dadosPerfil.username) setNomeExibicao(dadosPerfil.username);
          if (dadosPerfil.avatar_url) setAvatarUrl(dadosPerfil.avatar_url);
          if (dadosPerfil.naipe_vocal) setNaipeVocal(dadosPerfil.naipe_vocal);
          if (dadosPerfil.instrumento) setInstrumento(dadosPerfil.instrumento);
          if (dadosPerfil.cifra_padrao) setCifraPadrao(dadosPerfil.cifra_padrao);
          if (dadosPerfil.fonte) setTamanhoFonte(dadosPerfil.fonte);
          if (dadosPerfil.keep_awake !== undefined) setManterTelaAcesa(dadosPerfil.keep_awake);
          if (dadosPerfil.tema) setTema(dadosPerfil.tema);
          if (dadosPerfil.autoscroll !== undefined) setAutoScroll(dadosPerfil.autoscroll);
          if (dadosPerfil.velocidade_scroll) setVelocidadeScroll(dadosPerfil.velocidade_scroll);
        } else if (session.user.user_metadata?.username) {
          setNomeExibicao(session.user.user_metadata.username);
        }
      }
      setIsInitialLoad(false);
    }
    checarSessao();
  }, []);

  useEffect(() => {
    localStorage.setItem('icmlyrics_perfil', perfil);
    localStorage.setItem('icmlyrics_instrumento', instrumento);
    localStorage.setItem('icmlyrics_cifra_padrao', cifraPadrao);
    localStorage.setItem('icmlyrics_fonte', tamanhoFonte);
    localStorage.setItem('icmlyrics_keep_awake', manterTelaAcesa);
    localStorage.setItem('icmlyrics_tema', tema);
    localStorage.setItem('icmlyrics_naipe', naipeVocal);
    localStorage.setItem('icmlyrics_autoscroll', autoScroll);
    localStorage.setItem('icmlyrics_velocidade_scroll', velocidadeScroll);
    localStorage.setItem('icmlyrics_user', nomeExibicao);
    localStorage.setItem('icmlyrics_avatar', avatarUrl);
    localStorage.setItem('icmlyrics_avatar_preset', avatarPreset);

    if (!isInitialLoad) {
      setTemAlteracoesPendentes(true);
    }
  }, [perfil, instrumento, cifraPadrao, tamanhoFonte, manterTelaAcesa, tema, naipeVocal, autoScroll, velocidadeScroll, nomeExibicao, avatarUrl, avatarPreset]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (temAlteracoesPendentes) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [temAlteracoesPendentes]);

  const handleNavegarComVerificacao = (path) => {
    if (temAlteracoesPendentes) {
      setPendingPath(path);
      setUnsavedOpen(true);
    } else {
      navigate(path);
    }
  };

  const salvarNaNuvem = async () => {
    if (!usuarioLogado) {
      handleNavegarComVerificacao('/login');
      return false;
    }

    setLoading(true);
    try {
      await supabase
        .from('perfis_usuario')
        .upsert({ 
          id: usuarioLogado.id, 
          username: nomeExibicao, 
          avatar_url: avatarUrl,
          naipe_vocal: naipeVocal,
          instrumento: instrumento,
          cifra_padrao: cifraPadrao,
          fonte: tamanhoFonte,
          keep_awake: manterTelaAcesa,
          tema: tema,
          autoscroll: autoScroll,
          velocidade_scroll: velocidadeScroll,
          updated_at: new Date() 
        });

      setTemAlteracoesPendentes(false);
      mostrarToast('Configurações salvas!');
      return true;
    } catch (err) {
      console.error('Erro ao salvar:', err);
      mostrarToast('Falha ao salvar preferências.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmarSalvarESair = async () => {
    const salvou = await salvarNaNuvem();
    if (salvou) {
      setUnsavedOpen(false);
      if (pendingPath) {
        navigate(pendingPath);
        setPendingPath(null);
      }
    }
  };

  const descartarESair = () => {
    setTemAlteracoesPendentes(false);
    setUnsavedOpen(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  };

  const fecharWelcomeModal = () => {
    localStorage.setItem('icmlyrics_tutorial_perfil_visto', 'true');
    setWelcomeOpen(false);
  };

  const handleUploadR2 = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingR2(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const localPreviewUrl = URL.createObjectURL(file);
      setAvatarUrl(localPreviewUrl);
      mostrarToast('Foto atualizada!');
    } catch (err) {
      mostrarToast('Falha ao enviar a foto.');
    } finally {
      setUploadingR2(false);
    }
  };

  const salvarEdicaoPerfil = async () => {
    if (!tempNome.trim()) return;

    setNomeExibicao(tempNome.trim());
    setAvatarPreset(tempPreset);
    setEditPerfilOpen(false);
    mostrarToast('Perfil atualizado!');
  };

  const handleLogoutCompleto = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro no Logout:", err);
    }

    if (limparFavoritos) {
      localStorage.clear();
      sessionStorage.clear();
    } else {
      localStorage.removeItem("icmlyrics_user");
      localStorage.removeItem("icmlyrics_user_nuvem");
      localStorage.removeItem("icmlyrics_role");
      sessionStorage.removeItem("icmlyrics_modal_novidades_visto");
    }

    setLoading(false);
    setLogoutOpen(false);
    setUsuarioLogado(null);
    setTemAlteracoesPendentes(false);
    navigate("/");
  };

  const instAtual = INSTRUMENTOS.find(i => i.id === instrumento);
  const naipeAtual = NAIPES_VOCAIS.find(n => n.id === naipeVocal);
  const presetAtualObj = AVATARES_PRESETS.find(p => p.id === avatarPreset);

  const iniciais = nomeExibicao
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');

  return (
    <div className={`min-h-screen p-4 md:p-6 font-sans pb-32 transition-colors duration-300 ${eEscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      <header className={`flex items-center justify-between mb-6 pb-4 border-b ${eEscuro ? 'border-slate-800/80' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleNavegarComVerificacao("/dashboard")} 
            className={`p-2.5 rounded-xl transition-all active:scale-95 ${
              eEscuro 
                ? 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800' 
                : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm border border-slate-200'
            }`}
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <h1 className="text-xl font-bold tracking-tight">Configurações</h1>
              <button 
                onClick={() => setWelcomeOpen(true)}
                className={`p-1 rounded-full text-slate-400 hover:text-blue-500 transition-colors`}
                title="Ver dicas da tela"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <p className={`text-xs ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
            </p>
          </div>
        </div>

        {!usuarioLogado && (
          <button
            onClick={() => handleNavegarComVerificacao("/login")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 border ${
              eEscuro 
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30' 
                : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 shadow-sm'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
        )}
      </header>

      <section className={`mb-6 rounded-2xl p-5 shadow-lg border relative overflow-hidden transition-all ${
        eEscuro 
          ? 'bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border-slate-800/80' 
          : 'bg-gradient-to-r from-white via-blue-50/30 to-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            
            <div className="relative group">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={nomeExibicao} 
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-md" 
                />
              ) : avatarPreset ? (
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${presetAtualObj?.bg || 'from-blue-500 to-indigo-600'} flex items-center justify-center text-2xl font-bold text-white shadow-md border border-white/20`}>
                  {presetAtualObj?.isLetter ? (nomeExibicao ? nomeExibicao.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U') : (presetAtualObj?.emoji || '🎵')}
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner ${
                  eEscuro ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-600 text-white'
                }`}>
                  {iniciais || <User className="w-7 h-7" />}
                </div>
              )}
              
              <span 
                className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-slate-900 rounded-full ${usuarioLogado ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                title={usuarioLogado ? 'Conectado' : 'Modo Offline/Local'} 
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{nomeExibicao}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {usuarioLogado ? 'Conta Conectada' : 'Modo Local'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                {perfil === 'voz' 
                  ? `Voz: ${naipeAtual?.nome || ' '}` 
                  : `Instrumento: ${instAtual?.nome || ' '}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setTempNome(nomeExibicao);
              setTempPreset(avatarPreset);
              setEditPerfilOpen(true);
            }}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              eEscuro 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>
      </section>

      <section className="mb-6 space-y-4">
        <div className={`rounded-2xl p-2 grid grid-cols-2 gap-2 shadow-sm border ${eEscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <button
            onClick={() => { setPerfil('voz'); mostrarToast('Perfil alterado para Voz'); }}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all ${
              perfil === 'voz' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold' 
                : eEscuro ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-6 h-6" />
            <div className="text-center">
              <span className="block text-sm">Voz (Letra)</span>
              <span className={`text-[10px] block opacity-80 ${perfil === 'voz' ? 'text-blue-100' : 'text-slate-500'}`}>Preferência letra</span>
            </div>
          </button>
          
          <button
            onClick={() => { setPerfil('instrumento'); mostrarToast('Perfil alterado para Instrumento'); }}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all ${
              perfil === 'instrumento' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold' 
                : eEscuro ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Music className="w-6 h-6" />
            <div className="text-center">
              <span className="block text-sm">Instrumento (Cifra)</span>
              <span className={`text-[10px] block opacity-80 ${perfil === 'instrumento' ? 'text-blue-100' : 'text-slate-500'}`}>Preferência cifra</span>
            </div>
          </button>
        </div>

        {perfil === 'voz' && (
          <div className={`p-4 rounded-2xl shadow-md border space-y-5 animate-in fade-in slide-in-from-top-2 ${eEscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div>
              <label className={`block text-xs font-semibold mb-2 ${eEscuro ? 'text-slate-200' : 'text-slate-700'}`}>
                Classificação Vocal / Naipe:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NAIPES_VOCAIS.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { setNaipeVocal(n.id); mostrarToast(`Naipe: ${n.nome}`); }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      naipeVocal === n.id
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/50 font-semibold'
                        : eEscuro ? 'border-slate-800 hover:bg-slate-800/60 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-bold block ${eEscuro && naipeVocal !== n.id ? 'text-slate-200' : ''}`}>{n.nome}</span>
                      <span className={`text-[10px] ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>{n.desc}</span>
                    </div>
                    {naipeVocal === n.id && <Check className="w-4 h-4 text-blue-500" />}
                  </button>
                ))}
              </div>
            </div>

            <div className={`pt-4 border-t ${eEscuro ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className={`block text-xs font-semibold ${eEscuro ? 'text-slate-200' : 'text-slate-900'}`}>Rolar Letra Automaticamente (Auto-Scroll)</span>
                    <span className={`block text-[11px] ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>Desce a letra na velocidade desejada</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setAutoScroll(!autoScroll); mostrarToast(!autoScroll ? 'Auto-scroll ativado' : 'Auto-scroll desligado'); }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${autoScroll ? 'bg-blue-600' : eEscuro ? 'bg-slate-800' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${autoScroll ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {autoScroll && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className={`block text-[11px] font-medium ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                    Velocidade de Rolagem:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['0.5x', '1x', '1.5x', '2x'].map((vel) => (
                      <button
                        key={vel}
                        onClick={() => setVelocidadeScroll(vel)}
                        className={`p-2 text-xs rounded-xl border font-bold transition-all ${
                          velocidadeScroll === vel
                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                            : eEscuro ? 'border-slate-800 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {vel}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {perfil === 'instrumento' && (
          <div className={`p-4 rounded-2xl shadow-md border space-y-4 animate-in fade-in slide-in-from-top-2 ${eEscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div>
              <label className={`block text-xs font-semibold mb-2 ${eEscuro ? 'text-slate-200' : 'text-slate-700'}`}>
                Selecione seu Instrumento Principal:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INSTRUMENTOS.map((inst) => {
                  const IconComp = inst.icon;
                  return (
                    <button
                      key={inst.id}
                      onClick={() => { setInstrumento(inst.id); mostrarToast(`Instrumento: ${inst.nome}`); }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        instrumento === inst.id
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/50 font-semibold'
                          : eEscuro ? 'border-slate-800 hover:bg-slate-800/60 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${instrumento === inst.id ? 'bg-blue-500/20' : eEscuro ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-bold ${eEscuro && instrumento !== inst.id ? 'text-slate-200' : ''}`}>{inst.nome}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`pt-3 border-t ${eEscuro ? 'border-slate-800' : 'border-slate-100'}`}>
              <label className={`block text-xs font-semibold mb-2 ${eEscuro ? 'text-slate-200' : 'text-slate-700'}`}>
                Cifra padrão ao abrir o louvor:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCifraPadrao('cifra1')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    cifraPadrao === 'cifra1'
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : eEscuro ? 'border-slate-800 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cifra 1 
                </button>
                <button
                  onClick={() => setCifraPadrao('cifra2')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    cifraPadrao === 'cifra2'
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : eEscuro ? 'border-slate-800 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cifra 2
                </button>
              </div>
            </div>

            <div className={`pt-4 border-t ${eEscuro ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className={`block text-xs font-semibold ${eEscuro ? 'text-slate-200' : 'text-slate-900'}`}>Rolar Cifra Automaticamente (Auto-Scroll)</span>
                    <span className={`block text-[11px] ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>Desce a cifra na velocidade desejada</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setAutoScroll(!autoScroll); mostrarToast(!autoScroll ? 'Auto-scroll ativado' : 'Auto-scroll desligado'); }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${autoScroll ? 'bg-blue-600' : eEscuro ? 'bg-slate-800' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${autoScroll ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {autoScroll && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className={`block text-[11px] font-medium ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                    Velocidade de Rolagem:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['0.5x', '1x', '1.5x', '2x'].map((vel) => (
                      <button
                        key={vel}
                        onClick={() => setVelocidadeScroll(vel)}
                        className={`p-2 text-xs rounded-xl border font-bold transition-all ${
                          velocidadeScroll === vel
                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                            : eEscuro ? 'border-slate-800 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {vel}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="mb-8 space-y-4">
        <div className={`rounded-2xl divide-y shadow-md border ${eEscuro ? 'bg-slate-900 divide-slate-800/80 border-slate-800' : 'bg-white divide-slate-100 border-slate-200'}`}>
          
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${eEscuro ? 'bg-slate-800 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-medium text-xs ${eEscuro ? 'text-slate-200' : 'text-slate-900'}`}>Manter Tela Acesa no Culto</span>
                <span className={`block text-[11px] ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                  Evita que o celular bloqueie durante o louvor
                </span>
              </div>
            </div>
            <button 
              onClick={() => { setManterTelaAcesa(!manterTelaAcesa); mostrarToast(!manterTelaAcesa ? 'Tela sempre acesa ativada' : 'Modo normal'); }}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${manterTelaAcesa ? 'bg-blue-600' : eEscuro ? 'bg-slate-800' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${manterTelaAcesa ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${eEscuro ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Type className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-medium text-xs ${eEscuro ? 'text-slate-200' : 'text-slate-900'}`}>Tamanho do Texto (Letras / Cifras)</span>
                <span className={`block text-[11px] ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                  Ajuste a escala da letra para facilitar a leitura
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'sm', label: 'Pequena' },
                { id: 'md', label: 'Normal' },
                { id: 'lg', label: 'Grande' },
                { id: 'xl', label: 'Extra' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTamanhoFonte(f.id)}
                  className={`p-2 text-xs rounded-xl border transition-all font-medium ${
                    tamanhoFonte === f.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : eEscuro ? 'border-slate-800 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className={`p-3 rounded-xl border font-mono text-center ${
              tamanhoFonte === 'sm' ? 'text-xs' : tamanhoFonte === 'md' ? 'text-sm' : tamanhoFonte === 'lg' ? 'text-base font-semibold' : 'text-lg font-bold'
            } ${eEscuro ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-slate-100 border-slate-200 text-blue-700'}`}>
              Aquilo que fui não sou mais
            </div>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${eEscuro ? 'bg-slate-800 text-purple-400' : 'bg-amber-100 text-amber-600'}`}>
                {eEscuro ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <span className={`font-medium text-xs ${eEscuro ? 'text-slate-200' : 'text-slate-900'}`}>Aparência Escura</span>
            </div>
            <button 
              onClick={() => setTema(eEscuro ? 'claro' : 'escuro')}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${eEscuro ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${eEscuro ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                (temAlteracoesPendentes || !usuarioLogado)
                  ? (eEscuro ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600') 
                  : (eEscuro ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
              }`}>
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-medium text-xs ${eEscuro ? 'text-slate-200' : 'text-slate-900'}`}>
                  Salvar Preferências na Nuvem
                </span>
                <span className={`block text-[11px] ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  {!usuarioLogado 
                    ? 'Faça login para sincronizar suas configurações' 
                    : temAlteracoesPendentes 
                      ? 'Você possui alterações não salvas' 
                      : 'Todas as preferências estão sincronizadas'}
                </span>
              </div>
            </div>

            <button
              onClick={salvarNaNuvem}
              disabled={usuarioLogado && !temAlteracoesPendentes || loading}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                (!usuarioLogado || temAlteracoesPendentes)
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 cursor-pointer'
                  : eEscuro
                    ? 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {(!usuarioLogado || temAlteracoesPendentes) ? (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{loading ? 'Salvando...' : 'Salvar'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Salvo</span>
                </>
              )}
            </button>
          </div>

        </div>

        <div className={`rounded-2xl shadow-md border ${eEscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <button 
            onClick={() => handleNavegarComVerificacao('/backup')} 
            className={`w-full flex items-center justify-between p-4 transition-colors text-left group rounded-2xl ${eEscuro ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${eEscuro ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-medium text-xs ${eEscuro ? 'text-slate-200' : 'text-slate-900'}`}>Gerenciar Meus Dados & Backups</span>
                <span className={`block text-[11px] ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>Exportar ou restaurar preferências offline</span>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${eEscuro ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>
        </div>
      </section>

      <section className="mt-6">
        <button 
          onClick={() => setLogoutOpen(true)}
          className={`w-full flex items-center justify-center gap-2 p-4 text-red-500 rounded-2xl transition-all font-semibold border text-xs shadow-sm active:scale-[0.99] ${
            eEscuro 
              ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' 
              : 'bg-red-50 border-red-100 hover:bg-red-100'
          }`}
        >
          <LogOut className="w-4 h-4" />
          Encerrar Sessão no Dispositivo
        </button>
      </section>

      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className={`max-w-md rounded-2xl p-6 ${eEscuro ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900'}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-base font-bold ${eEscuro ? 'text-slate-100' : 'text-slate-900'}`}>
              <Sparkles className="w-5 h-5 text-blue-500" />
              Bem-vindo às Configurações, {nomeExibicao}!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs leading-relaxed">
            <p className={`${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
              Aqui você pode personalizar todo o funcionamento do aplicativo para o seu momento de louvor:
            </p>
            
            <ul className="space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="p-1 rounded-md bg-blue-500/10 text-blue-500 font-bold">1</span>
                <span><strong>Modo Voz ou Instrumento:</strong> Escolha se prefere abrir letras ou cifras por padrão.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-1 rounded-md bg-blue-500/10 text-blue-500 font-bold">2</span>
                <span><strong>Naipe ou Instrumento:</strong> Voz ou instrumento principal.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-1 rounded-md bg-blue-500/10 text-blue-500 font-bold">3</span>
                <span><strong>Aparência & Leitura:</strong> Ajuste a escala do texto, tema escuro e opção de manter a tela acesa.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-1 rounded-md bg-blue-500/10 text-blue-500 font-bold">4</span>
                <span><strong>Sincronização em Nuvem:</strong> Salve suas escolhas para acessá-las de qualquer aparelho.</span>
              </li>
            </ul>
          </div>

          <DialogFooter className="mt-4">
            <Button 
              onClick={fecharWelcomeModal} 
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Entendido, vamos lá!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unsavedOpen} onOpenChange={setUnsavedOpen}>
        <DialogContent className={`max-w-xs rounded-2xl p-6 ${eEscuro ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900'}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-base font-bold ${eEscuro ? 'text-slate-100' : 'text-slate-900'}`}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alterações não salvas
            </DialogTitle>
          </DialogHeader>
          
          <p className={`text-xs leading-relaxed mt-1 ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
            Você possui alterações de configuração pendentes. Deseja salvá-las na nuvem antes de sair?
          </p>

          <DialogFooter className="flex flex-col gap-2 mt-4">
            <Button 
              onClick={confirmarSalvarESair} 
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar e Sair"}
            </Button>
            <Button 
              variant="outline" 
              onClick={descartarESair} 
              className={`w-full h-9 text-xs ${eEscuro ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              disabled={loading}
            >
              Sair sem Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editPerfilOpen} onOpenChange={setEditPerfilOpen}>
        <DialogContent className={`max-w-md rounded-2xl p-6 ${eEscuro ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900'}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-base font-bold ${eEscuro ? 'text-slate-100' : 'text-slate-900'}`}>
              <UserCheck className="w-5 h-5 text-blue-600" />
              Editar Perfil & Avatar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${eEscuro ? 'text-slate-200' : 'text-slate-700'}`}>
                Nome de Exibição:
              </label>
              <input
                type="text"
                value={tempNome}
                onChange={(e) => setTempNome(e.target.value)}
                placeholder="Seu nome no louvor"
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  eEscuro 
                    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-2 ${eEscuro ? 'text-slate-200' : 'text-slate-700'}`}>
                Escolha um Avatar:
              </label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {AVATARES_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setTempPreset(p.id);
                      setAvatarUrl('');
                    }}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${p.bg} flex items-center justify-center text-lg font-bold text-white border-2 transition-all ${
                      tempPreset === p.id && !avatarUrl ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    {p.isLetter ? (tempNome ? tempNome.charAt(0).toUpperCase() : 'U') : p.emoji}
                  </button>
                ))}
              </div>

              <div className={`pt-2 border-t ${eEscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                <label className={`block text-xs font-semibold mb-1.5 ${eEscuro ? 'text-slate-200' : 'text-slate-700'}`}>
                  Ou faça upload da sua foto:
                </label>
                <div className="flex items-center gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed rounded-xl text-xs cursor-pointer transition-colors ${
                    eEscuro ? 'border-slate-700 text-slate-300 hover:bg-slate-800/50' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>{uploadingR2 ? 'Enviando...' : 'Selecionar Imagem'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUploadR2} 
                      disabled={uploadingR2} 
                      className="hidden" 
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      onClick={() => setAvatarUrl('')}
                      className="p-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                      title="Remover foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setEditPerfilOpen(false)} 
              className={`h-9 text-xs ${eEscuro ? 'border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              Cancelar
            </Button>
            <Button 
              onClick={salvarEdicaoPerfil} 
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Salvar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className={`max-w-xs rounded-2xl p-6 ${eEscuro ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900'}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-base font-bold ${eEscuro ? 'text-slate-100' : 'text-slate-900'}`}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Deseja realmente sair?
            </DialogTitle>
          </DialogHeader>
          
          <p className={`text-xs leading-relaxed mt-1 ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
            Sua sessão será encerrada neste aparelho. Suas configurações e listas personalizadas <strong className="text-blue-400">continuam salvas com segurança na sua conta</strong>.
          </p>

          <div className={`flex flex-col gap-1.5 py-3 mt-2 border-t border-b select-none ${eEscuro ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-start gap-2.5">
              <input 
                type="checkbox" 
                id="limpar_favoritos_logout" 
                checked={limparFavoritos}
                onChange={(e) => setLimparFavoritos(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="limpar_favoritos_logout" className={`text-xs font-semibold cursor-pointer leading-tight ${eEscuro ? 'text-slate-200' : 'text-slate-700'}`}>
                Apagar dados e cache deste aparelho
              </label>
            </div>
            <p className={`text-[10px] pl-6 leading-tight ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              Limpa os arquivos salvos localmente neste celular/PC. <strong>Não afeta nem apaga nada da sua conta na nuvem.</strong>
            </p>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setLogoutOpen(false)} 
              className={`h-9 text-xs ${eEscuro ? 'border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleLogoutCompleto} 
              disabled={loading}
              className="h-9 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
            >
              {loading ? "Saindo..." : "Confirmar e Sair"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}