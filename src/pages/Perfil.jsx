import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

const INSTRUMENTOS = [
  { id: 'teclado', nome: 'Teclado / Piano' },
  { id: 'violao', nome: 'Violão / Guitarra' },
  { id: 'baixo', nome: 'Contrabaixo' },
  { id: 'outro', nome: 'Outro Instrumento' },
];

export default function ConfigScreen() {
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState(() => localStorage.getItem('icmlyrics_perfil') || 'instrumento');
  const [instrumento, setInstrumento] = useState(() => localStorage.getItem('icmlyrics_instrumento') || 'teclado');
  const [cifraPadrao, setCifraPadrao] = useState(() => localStorage.getItem('icmlyrics_cifra_padrao') || 'cifra1');
  const [tamanhoFonte, setTamanhoFonte] = useState(() => localStorage.getItem('icmlyrics_fonte') || 'md');
  const [manterTelaAcesa, setManterTelaAcesa] = useState(() => localStorage.getItem('icmlyrics_keep_awake') === 'true');
  const [tema, setTema] = useState(() => localStorage.getItem('icmlyrics_tema') || 'escuro');
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [limparFavoritos, setLimparFavoritos] = useState(false);
  const [avisoLocalOpen, setAvisoLocalOpen] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [usernamePerfil, setUsernamePerfil] = useState('');
  
  const eEscuro = tema === 'escuro';

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    async function checarSessaoEPopup() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUsuarioLogado(session.user);
        
        const { data: dadosPerfil } = await supabase
          .from('perfis_usuario')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle();

        if (dadosPerfil?.username) {
          setUsernamePerfil(dadosPerfil.username);
        } else if (session.user.user_metadata?.username) {
          setUsernamePerfil(session.user.user_metadata.username);
        }
      } else {
        const jaViuAviso = localStorage.getItem('icmlyrics_aviso_local_visto');
        if (!jaViuAviso) {
          setAvisoLocalOpen(true);
        }
      }
    }
    checarSessaoEPopup();
  }, []);

  useEffect(() => {
    localStorage.setItem('icmlyrics_perfil', perfil);
    localStorage.setItem('icmlyrics_instrumento', instrumento);
    localStorage.setItem('icmlyrics_cifra_padrao', cifraPadrao);
    localStorage.setItem('icmlyrics_fonte', tamanhoFonte);
    localStorage.setItem('icmlyrics_keep_awake', manterTelaAcesa);
    localStorage.setItem('icmlyrics_tema', tema);
  }, [perfil, instrumento, cifraPadrao, tamanhoFonte, manterTelaAcesa, tema]);

  const fecharAvisoLocal = () => {
    localStorage.setItem('icmlyrics_aviso_local_visto', 'true');
    setAvisoLocalOpen(false);
  };

  const handleLogoutCompleto = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro no Supabase Logout:", err);
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
    navigate("/");
  };

  const instAtual = INSTRUMENTOS.find(i => i.id === instrumento);
  const nomeExibicao = usernamePerfil || usuarioLogado?.user_metadata?.full_name || localStorage.getItem('icmlyrics_user') || 'Visitante';

  return (
    <div className={`min-h-screen p-4 md:p-6 font-sans pb-32 transition-colors duration-300 ${eEscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {avisoLocalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-xs p-5 rounded-2xl shadow-2xl border ${
            eEscuro 
              ? 'bg-slate-900 border-slate-800 text-slate-100' 
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={fecharAvisoLocal}
              className={`absolute top-3 right-3 p-1.5 rounded-xl transition-colors ${
                eEscuro 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Seus dados estão apenas aqui! 📲</h4>
                <p className={`text-xs leading-relaxed ${eEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                  Sem login, suas preferências e anotações ficam salvas **só neste aparelho** e podem ser perdidas se você limpar os dados do navegador.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className={`flex items-center justify-between mb-6 pb-4 border-b ${eEscuro ? 'border-slate-800/80' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className={`p-2.5 rounded-xl transition-all active:scale-95 ${
              eEscuro 
                ? 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800' 
                : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm border border-slate-200'
            }`}
            aria-label="Voltar ao dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <h1 className="text-xl font-bold tracking-tight">Configurações</h1>
            </div>
            <p className={`text-xs ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              Personalize sua experiência de louvor
            </p>
          </div>
        </div>

        {!usuarioLogado && (
          <button
            onClick={() => navigate("/login")}
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
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner ${
                eEscuro ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-600 text-white'
              }`}>
                <User className="w-7 h-7" />
              </div>
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-slate-900 rounded-full ${usuarioLogado ? 'bg-emerald-500' : 'bg-amber-500'}`} title={usuarioLogado ? 'Conectado' : 'Modo Offline/Local'} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{nomeExibicao}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {usuarioLogado ? 'Conta Conectada' : 'Modo Local'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                {perfil === 'voz' ? 'Perfil: Voz (Abre Letra)' : `Instrumento: ${instAtual?.nome}`}
              </p>
            </div>
          </div>
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
              <span className={`text-[10px] block opacity-80 ${perfil === 'voz' ? 'text-blue-100' : 'text-slate-500'}`}>Abre a letra direto</span>
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
              <span className={`text-[10px] block opacity-80 ${perfil === 'instrumento' ? 'text-blue-100' : 'text-slate-500'}`}>Abre a cifra direto</span>
            </div>
          </button>
        </div>

        {perfil === 'instrumento' && (
          <div className={`p-4 rounded-2xl shadow-md border space-y-4 animate-in fade-in slide-in-from-top-2 ${eEscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div>
              <label className={`block text-xs font-semibold mb-2 ${eEscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                Selecione seu Instrumento Principal:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INSTRUMENTOS.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => { setInstrumento(inst.id); mostrarToast(`Instrumento: ${inst.nome}`); }}
                    className={`flex items-center p-3 rounded-xl border text-left transition-all ${
                      instrumento === inst.id
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/50'
                        : eEscuro ? 'border-slate-800 hover:bg-slate-800/60 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{inst.nome}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`pt-3 border-t ${eEscuro ? 'border-slate-800' : 'border-slate-100'}`}>
              <label className={`block text-xs font-semibold mb-2 ${eEscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                Cifra padrão ao abrir o louvor:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCifraPadrao('cifra1')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    cifraPadrao === 'cifra1'
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : eEscuro ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cifra 1 (Padrão/Teclado)
                </button>
                <button
                  onClick={() => setCifraPadrao('cifra2')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    cifraPadrao === 'cifra2'
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : eEscuro ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cifra 2 (Violão/Simplificada)
                </button>
              </div>
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
                <span className="block font-medium text-xs">Manter Tela Acesa no Culto</span>
                <span className={`block text-[11px] ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
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
                <span className="block font-medium text-xs">Tamanho do Texto (Letras / Cifras)</span>
                <span className={`block text-[11px] ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ajuste a escala da letra para facilitar a leitura no suporte
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
                      : eEscuro ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
              <span className="font-medium text-xs">Aparência Escura</span>
            </div>
            <button 
              onClick={() => setTema(eEscuro ? 'claro' : 'escuro')}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${eEscuro ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${eEscuro ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className={`rounded-2xl shadow-md border ${eEscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <button 
            onClick={() => navigate('/backup')} 
            className={`w-full flex items-center justify-between p-4 transition-colors text-left group rounded-2xl ${eEscuro ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${eEscuro ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-medium text-xs">Gerenciar Meus Dados & Backups</span>
                <span className={`block text-[11px] ${eEscuro ? 'text-slate-400' : 'text-slate-500'}`}>Exportar ou restaurar preferências offline</span>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${eEscuro ? 'text-slate-600' : 'text-slate-400'}`} />
          </button>
        </div>
      </section>

      {usuarioLogado && (
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
      )}

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-base font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Deseja realmente sair?
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            Sua sessão atual e a sincronização com as listas da nuvem serão encerradas neste aparelho.
          </p>

          <div className="flex items-start gap-2.5 py-3 mt-2 border-t border-b border-slate-100 select-none">
            <input 
              type="checkbox" 
              id="limpar_favoritos_logout" 
              checked={limparFavoritos}
              onChange={(e) => setLimparFavoritos(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
            />
            <label htmlFor="limpar_favoritos_logout" className="text-xs font-medium text-slate-600 cursor-pointer leading-tight">
              Apagar favoritos e cache salvo neste aparelho.
            </label>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setLogoutOpen(false)} 
              className="h-9 text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
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