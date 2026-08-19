import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Music2, ListPlus, Radio, Gauge, Mic, History, LogOut, 
  BookOpen, Cloud, Link2, Link2Off, Eye, EyeOff, MessageSquare, 
  AlertTriangle, Database, Megaphone, ListMusic, Sparkles, Settings, Users 
} from "lucide-react";
import { useTools } from "@/components/tools/ToolsProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import bannerImg from "../assets/Tromb_mundo.jpg";

import { supabase } from "@/lib/supabaseClient";

const CHAVE_MESTRA_SUPER_ADMIN = "icm_master_2026";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { openMetronomo, openAfinador } = useTools();
  const musico = localStorage.getItem("icmlyrics_user") || "Usuário";

  const [configOpen, setConfigOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false); 
  const [modalNovidadesOpen, setModalNovidadesOpen] = useState(false);

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [conectarComoAdmin, setConectarComoAdmin] = useState(false);
  const [nomeAdmin, setNomeAdmin] = useState("");
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [erroAuth, setErroAuth] = useState("");
  const [carregandoAuth, setCarregandoAuth] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);
  
  const [nuvemAtiva, setNuvemAtiva] = useState(false);
  const [userRole, setUserRole] = useState("user");

  const [limparFavoritos, setLimparFavoritos] = useState(false);

  // Contador de novidades não lidas
  const [novidades, setNovidades] = useState({
    avisos: 0,
    repertorio: 0
  });

  const SEU_TELEGRAM_LINK = "https://t.me/Ezequielvander"; 

  // 1. Validação de Sessão / Nuvem
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const chaveRecebida = queryParams.get("master");

    if (chaveRecebida === CHAVE_MESTRA_SUPER_ADMIN) {
      localStorage.setItem("icmlyrics_user_nuvem", "admin_geral");
      localStorage.setItem("icmlyrics_role", "super_admin");

      setUsuario("admin_geral");
      setUserRole("super_admin");
      setNuvemAtiva(true);

      navigate(location.pathname, { replace: true });
      return;
    }

    const validarSessaoSegura = async () => {
      const userSalvo = localStorage.getItem("icmlyrics_user_nuvem") || "";
      const roleSalva = localStorage.getItem("icmlyrics_role") || "user";

      if (!userSalvo.trim()) {
        handleDesconectarSilencioso();
        return;
      }

      if (roleSalva === "super_admin" || userSalvo === "admin_geral") {
        setUsuario(userSalvo);
        setUserRole("super_admin");
        setNuvemAtiva(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("role")
          .eq("usuario", userSalvo)
          .maybeSingle();

        if (error || !data) {
          handleDesconectarSilencioso();
          return;
        }

        let roleFinal = "user";
        if (roleSalva === "church_admin" || data.role === "church_admin") {
          roleFinal = "church_admin";
        } else if (data.role === "super_admin") {
          roleFinal = "super_admin";
        }

        localStorage.setItem("icmlyrics_role", roleFinal);
        setUsuario(userSalvo);
        setUserRole(roleFinal);
        setNuvemAtiva(true);
      } catch (err) {
        console.error("Erro na validação de segurança:", err);
        handleDesconectarSilencioso();
      }
    };

    validarSessaoSegura();
  }, [location]);

  // 2. Consulta de Novidades (Avisos + Repertório)
  useEffect(() => {
    const verificarNovidades = async () => {
      try {
        const lastSeenAvisos = localStorage.getItem("icmlyrics_last_seen_avisos") || "1970-01-01T00:00:00.000Z";
        const lastSeenRepertorio = localStorage.getItem("icmlyrics_last_seen_repertorio") || "1970-01-01T00:00:00.000Z";

        let novosAvisosCount = 0;
        let novosRepertorioCount = 0;

        // --- AVISOS ---
        let queryAvisos = supabase
          .from("avisos")
          .select("*", { count: "exact", head: true })
          .gt("created_at", lastSeenAvisos);

        if (nuvemAtiva && usuario) {
          queryAvisos = queryAvisos.or(`nuvem.eq.${usuario},nuvem.eq.todos,tipo.eq.global`);
        } else {
          queryAvisos = queryAvisos.or(`nuvem.eq.todos,tipo.eq.global`);
        }

        const { count: countAvisos, error: errAvisos } = await queryAvisos;
        if (!errAvisos && countAvisos) novosAvisosCount = countAvisos;

        // --- REPERTÓRIO ---
        let queryRepertorio = supabase
          .from("listas_repertorio")
          .select("*", { count: "exact", head: true })
          .gt("data_criacao", lastSeenRepertorio);

        if (nuvemAtiva && usuario) {
          queryRepertorio = queryRepertorio.or(`nuvem.eq.${usuario},nuvem.eq.admin_geral`);
        } else {
          queryRepertorio = queryRepertorio.or(`nuvem.eq.admin_geral,nuvem.is.null`);
        }

        const { count: countRepertorio, error: errRepertorio } = await queryRepertorio;
        if (!errRepertorio && countRepertorio) novosRepertorioCount = countRepertorio;

        setNovidades({
          avisos: novosAvisosCount,
          repertorio: novosRepertorioCount
        });

        const totalNovidades = novosAvisosCount + novosRepertorioCount;
        const jaViuModalNessaSessao = sessionStorage.getItem("icmlyrics_modal_novidades_visto");

        if (totalNovidades > 0 && !jaViuModalNessaSessao) {
          setModalNovidadesOpen(true);
          sessionStorage.setItem("icmlyrics_modal_novidades_visto", "true");
        }
      } catch (err) {
        console.error("Erro ao verificar novidades:", err);
      }
    };

    verificarNovidades();
  }, [nuvemAtiva, usuario]);

  const normalizarTexto = (texto) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const obterNomeRole = (role) => {
    switch(role) {
      case "super_admin":
        return "Admin Geral";
      case "church_admin":
        return "Admin da Igreja";
      default:
        return "Membro"; 
    }
  };

  const handleConectar = async () => {
    setErroAuth("");

    if (!usuario.trim() || !senha.trim()) {
      setErroAuth("Preencha o usuário e a senha para conectar.");
      return;
    }

    if (conectarComoAdmin && (!nomeAdmin.trim() || !senhaAdmin.trim())) {
      setErroAuth("Preencha o nome e a senha do administrador local.");
      return;
    }

    setCarregandoAuth(true);

    try {
      const { data, error } = await supabase
        .from("igrejas_autorizadas")
        .select("id, role, responsavel, senha_adm")
        .eq("usuario", usuario.trim())
        .eq("senha", senha.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErroAuth("Usuário ou senha incorretos.");
        setCarregandoAuth(false);
        return;
      }

      let roleFinal = "user";

      if (data.role === "super_admin") {
        roleFinal = "super_admin"; 
      } 
      else if (conectarComoAdmin) {
        const responsavelBanco = normalizarTexto(data.responsavel);
        const nomeDigitado = normalizarTexto(nomeAdmin);
        
        if (
          responsavelBanco === nomeDigitado && 
          String(data.senha_adm).trim() === String(senhaAdmin).trim()
        ) {
          roleFinal = "church_admin"; 
        } else {
          setErroAuth("Nome ou senha do administrador local inválidos.");
          setCarregandoAuth(false);
          return;
        }
      } else if (data.role === "church_admin") {
        roleFinal = "church_admin";
      }

      sessionStorage.removeItem("icmlyrics_modal_novidades_visto");

      localStorage.setItem("icmlyrics_user_nuvem", usuario.trim());
      localStorage.setItem("icmlyrics_role", roleFinal);
      
      setUserRole(roleFinal);
      setNuvemAtiva(true);
      setConfigOpen(false);
    } catch (error) {
      console.error("Erro na autenticação:", error.message);
      setErroAuth("Erro ao conectar. Verifique sua conexão.");
    } finally {
      setCarregandoAuth(false);
    }
  };

  const handleLogoutCompleto = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao registrar encerramento no Supabase:", err);
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

    setUsuario("");
    setSenha("");
    setNomeAdmin("");
    setSenhaAdmin("");
    setUserRole("user");
    setNuvemAtiva(false);
    setLogoutOpen(false);
    setLimparFavoritos(false);

    navigate("/");
  };

  const handleDesconectar = () => {
    handleDesconectarSilencioso();
    setConfigOpen(false);
  };

  const handleDesconectarSilencioso = () => {
    localStorage.removeItem("icmlyrics_user_nuvem");
    localStorage.removeItem("icmlyrics_role");
    sessionStorage.removeItem("icmlyrics_modal_novidades_visto");
    setUsuario("");
    setSenha("");
    setNomeAdmin("");
    setSenhaAdmin("");
    setUserRole("user");
    setNuvemAtiva(false);
  };

  const handleNavegarComLeitura = (path, modulo) => {
    const agora = new Date().toISOString();
    if (modulo === "avisos") {
      localStorage.setItem("icmlyrics_last_seen_avisos", agora);
      setNovidades(prev => ({ ...prev, avisos: 0 }));
    } else if (modulo === "repertorio") {
      localStorage.setItem("icmlyrics_last_seen_repertorio", agora);
      setNovidades(prev => ({ ...prev, repertorio: 0 }));
    }
    navigate(path);
  };

  const formatarSobrescrito = (num) => {
    const mapa = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(num).split('').map(n => mapa[n] || n).join('');
  };

  const atalhos = [
    { label: "Louvores", icon: Music2, path: "/louvor", color: "bg-teal-500" },
    { label: "Nova Lista", icon: ListPlus, path: "/nova-lista", color: "bg-amber-500" },
    { label: "Histórico de Listas", icon: History, path: "/historico-listas", color: "bg-indigo-500" },
    { label: "Avisos", icon: Megaphone, path: "/avisos", color: "bg-orange-500", count: novidades.avisos, key: "avisos" },
    { label: "Bíblia", icon: BookOpen, path: "/biblia", color: "bg-emerald-600" },
    { label: "Repertório", icon: ListMusic, path: "/repertorio", color: "bg-pink-500", count: novidades.repertorio, key: "repertorio" },
    { label: "Painel da Equipe", icon: Users, path: "/painel-equipe", color: "bg-violet-600" },
    { label: "Culto", icon: Sparkles, color: "bg-amber-600", onClick: () => navigate("/culto") }
  ];

  const ferramentas = [
    { label: "Metrônomo", icon: Gauge, color: "bg-purple-500", onClick: openMetronomo },
    { label: "Afinador", icon: Mic, color: "bg-rose-500", onClick: openAfinador },
    { label: "Rádio e Tv Online", icon: Radio, path: "/radios-online", color: "bg-red-600" },
    { label: "Perfil", icon: Settings, color: "bg-slate-700", onClick: () => navigate("/perfil") } 
  ];
  return (
    <div className="min-h-screen bg-slate-50 pb-28 relative flex flex-col justify-between">
      <div>
        <div className="bg-slate-900 text-white relative overflow-hidden min-h-[180px] flex flex-col justify-end">
          <img src={bannerImg} alt="ICMlyrics Banner" className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-0" />
          <div className="px-4 pb-8 pt-20 relative z-10 flex justify-between items-end">
            <div>
              <h2 className="font-bold text-3xl opacity-90 drop-shadow-md text-[hsl(var(--background))]">
                Olá, {musico.split(" ")[0]}!
              </h2>
              <p className="text-slate-200 text-sm mt-0.5 drop-shadow">
                Boas-vindas ao ICM<span className="text-amber-400 font-semibold">lyrics</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setConfigOpen(true)} 
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full shadow-md transition-all backdrop-blur-sm"
                title="Configurações de Sincronização"
              >
                <Cloud className={`h-5 w-5 transition-colors ${nuvemAtiva ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"}`} />
              </button>
              
              <button 
                onClick={() => setLogoutOpen(true)} 
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-colors" 
                aria-label="Sair do Aplicativo"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-6 relative z-20">
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {atalhos.map((a) => {
                const temNovidade = a.count > 0;
                return (
                  <button 
                    key={a.label} 
                    onClick={() => {
                      if (a.onClick) {
                        a.onClick();
                      } else if (a.path) {
                        handleNavegarComLeitura(a.path, a.key);
                      }
                    }} 
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    {temNovidade && (
                      <span className="absolute top-2 right-2 flex items-center justify-center bg-rose-600 text-white font-extrabold text-[11px] h-5 min-w-[20px] px-1.5 rounded-full border-2 border-white shadow-sm animate-pulse">
                        {formatarSobrescrito(a.count)}
                      </span>
                    )}

                    <div className={`w-11 h-11 rounded-xl ${a.color} flex items-center justify-center relative`}>
                      <a.icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                        {a.label}
                      </span>
                      {temNovidade && (
                        <span className="text-rose-600 font-bold text-xs">
                          {formatarSobrescrito(a.count)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Ferramentas</p>
            <div className="grid grid-cols-2 gap-3">
              {ferramentas.map((f) => (
                <button 
                  key={f.label} 
                  onClick={() => {
                    if (f.onClick) {
                      f.onClick();
                    } else if (f.path) {
                      navigate(f.path);
                    }
                  }} 
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                >
                  <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-8 pb-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center justify-between text-xs text-slate-500">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700">Dúvidas, problemas ou sugestão?</span>
            <span className="text-[10px] text-slate-400">Solicite novos acessos ou suporte técnico</span>
          </div>
          <a href={SEU_TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold transition-colors">
            <MessageSquare className="w-4 h-4" /> Suporte
          </a>
        </div>
      </div>

      {/* Modal de Alerta de Novidades */}
      <Dialog open={modalNovidadesOpen} onOpenChange={setModalNovidadesOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Você tem novas atualizações!
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Há novos conteúdos postados desde o seu último acesso. Confira o que há de novo:
          </p>

          <div className="space-y-2.5 my-3">
            {novidades.avisos > 0 && (
              <div 
                onClick={() => {
                  setModalNovidadesOpen(false);
                  handleNavegarComLeitura("/avisos", "avisos");
                }}
                className="bg-orange-50 border border-orange-100 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-orange-100/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500 text-white rounded-xl">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-950">Novos Avisos</p>
                    <p className="text-[10px] text-orange-700">
                      {novidades.avisos} {novidades.avisos === 1 ? 'novo aviso publicado' : 'novos avisos publicados'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-orange-600 bg-white px-2 py-0.5 rounded-full border border-orange-200">
                  {formatarSobrescrito(novidades.avisos)}
                </span>
              </div>
            )}

            {novidades.repertorio > 0 && (
              <div 
                onClick={() => {
                  setModalNovidadesOpen(false);
                  handleNavegarComLeitura("/repertorio", "repertorio");
                }}
                className="bg-pink-50 border border-pink-100 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-pink-100/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-pink-500 text-white rounded-xl">
                    <ListMusic className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-pink-950">Novo no Repertório</p>
                    <p className="text-[10px] text-pink-700">
                      {novidades.repertorio} {novidades.repertorio === 1 ? 'nova lista criada' : 'novas listas criadas'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-pink-600 bg-white px-2 py-0.5 rounded-full border border-pink-200">
                  {formatarSobrescrito(novidades.repertorio)}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setModalNovidadesOpen(false)}
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
            >
              Entendido, vou dar uma olhada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Sincronização */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Cloud className={`w-5 h-5 ${nuvemAtiva ? "text-emerald-500" : "text-indigo-500"}`} />
              Sincronização na Nuvem
            </DialogTitle>
          </DialogHeader>

          {nuvemAtiva ? (
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Sincronização Ativa!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Seu aplicativo está conectado como <span className="font-semibold text-slate-700">@{usuario || ""}</span>.
                </p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                  <span>Nível: {obterNomeRole(userRole)}</span>
                </div>
              </div>
              <Button 
                onClick={handleDesconectar} 
                variant="destructive"
                className="w-full h-10 mt-2 font-semibold text-xs gap-2"
              >
                <Link2Off className="w-4 h-4" /> Desconectar Conta
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 leading-relaxed">
                Insira os dados fornecidos para sincronizar e liberar acessos.
              </p>

              {erroAuth && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2 rounded-lg font-medium">
                  {erroAuth}
                </div>
              )}

              <div className="space-y-3 my-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Usuário</label>
                  <Input 
                    placeholder="Ex: ICMPE" 
                    value={usuario || ""} 
                    onChange={(e) => setUsuario(e.target.value)} 
                    className="h-9 mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Senha</label>
                  <div className="relative mt-1">
                    <Input 
                      type={mostrarSenha ? "text" : "password"} 
                      placeholder="Digite sua senha" 
                      value={senha || ""} 
                      onChange={(e) => setSenha(e.target.value)} 
                      className="h-9 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 px-1 select-none">
                  <input 
                    type="checkbox" 
                    id="conectar_como_adm" 
                    checked={conectarComoAdmin}
                    onChange={(e) => setConectarComoAdmin(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="conectar_como_adm" className="text-xs font-semibold text-slate-600 cursor-pointer">
                    Entrar como Administrador Local da Igreja
                  </label>
                </div>

                {conectarComoAdmin && (
                  <div className="pt-2 mt-2 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div>
                      <label className="text-[10px] font-bold text-amber-600 uppercase">Nome do Responsável</label>
                      <Input 
                        placeholder="Ex: Diácono João" 
                        value={nomeAdmin || ""} 
                        onChange={(e) => setNomeAdmin(e.target.value)} 
                        className="h-9 mt-1 text-sm"
                        disabled={carregandoAuth}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-600 uppercase">Senha de ADM Local</label>
                      <div className="relative mt-1">
                        <Input 
                          type={mostrarSenhaAdmin ? "text" : "password"} 
                          placeholder="Senha secundária da igreja" 
                          value={senhaAdmin || ""} 
                          onChange={(e) => setSenhaAdmin(e.target.value)} 
                          className="h-9 pr-10 text-sm"
                          disabled={carregandoAuth}
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenhaAdmin(!mostrarSenhaAdmin)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {mostrarSenhaAdmin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="mt-2">
                <Button 
                  onClick={handleConectar} 
                  disabled={carregandoAuth}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs gap-2"
                >
                  <Link2 className="w-4 h-4" /> {carregandoAuth ? "Conectando..." : "Conectar à Nuvem"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Logout */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-base font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Deseja realmente sair?
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            Sua sessão atual e a sincronização com as listas da nuvem serão encerradas neste dispositivo.
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
              Apagar favoritos salvos neste aparelho.
            </label>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setLogoutOpen(false)} 
              className="h-9 text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleLogoutCompleto} 
              className="h-9 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
            >
              Confirmar e Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}