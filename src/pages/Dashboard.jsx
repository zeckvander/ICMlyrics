import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Music2, ListPlus, FolderOpen, Gauge, Mic, History, LogOut, BookOpen, Cloud, Link2, Link2Off, Eye, EyeOff, MessageSquare, AlertTriangle } from "lucide-react";
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
  const { openMetronomo, openAfunador } = useTools();
  const musico = localStorage.getItem("icmlyrics_user") || "Usuário";

  // Estados dos Modais
  const [configOpen, setConfigOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false); 

  // Estados de Autenticação na Nuvem
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [conectarComoAdmin, setConectarComoAdmin] = useState(false);
  const [nomeAdmin, setNomeAdmin] = useState("");
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [erroAuth, setErroAuth] = useState("");
  const [carregandoAuth, setCarregandoAuth] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);
  
  // Estados do Perfil Conectado
  const [nuvemAtiva, setNuvemAtiva] = useState(false);
  const [userRole, setUserRole] = useState("user");

  // Opção de limpar dados locais no Logout
  const [limparFavoritos, setLimparFavoritos] = useState(false);

  const SEU_WHATSAPP_LINK = "https://wa.me/5527999999999"; 

  // 1. Captura da URL da chave mestra do Super Admin
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
    }
  }, [location, navigate]);

  // 2. Validação de Segurança no Carregamento do App
  useEffect(() => {
    const validarSessaoSegura = async () => {
      const userSalvo = localStorage.getItem("icmlyrics_user_nuvem") || "";
      const roleSalva = localStorage.getItem("icmlyrics_role") || "user";

      if (!userSalvo.trim()) {
        handleDesconectarSilencioso();
        return;
      }

      // AJUSTE CORRETO: Se for o admin mestre local ou um admin autenticado via Supabase Auth com role super_admin
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
        
        if (roleSalva === "church_admin") {
          roleFinal = "church_admin";
        } else if (data.role === "super_admin") {
          roleFinal = "super_admin";
        } else if (data.role === "church_admin") {
          roleFinal = "church_admin";
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
  }, [configOpen]);

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
        return "Admin Geral 👑";
      case "church_admin":
        return "Admin da Igreja ⚙️";
      default:
        return "Membro/Usuário Comum 👤"; 
    }
  };

  // Login Seguro
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
        .eq("senha", presidential.trim())
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

  // Execução Final do Logout Seguro com Limpeza Completa e Dinâmica por Usuário
  const handleLogoutCompleto = async () => {
    if (limparFavoritos) {
      const usuarioAtual = localStorage.getItem("icmlyrics_user");
      
      if (usuarioAtual) {
        localStorage.removeItem(`icmlyrics_favoritos_${usuarioAtual}`);
        localStorage.removeItem(`icmlyrics_biblia_favoritos_${usuarioAtual}`);
        localStorage.removeItem(`icmlyrics_biblia_versao_favorita_${usuarioAtual}`);
      }
    }

    localStorage.removeItem("icmlyrics_user");
    localStorage.removeItem("icmlyrics_user_nuvem");
    localStorage.removeItem("icmlyrics_role");

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao registrar encerramento no Supabase:", err);
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
    setUsuario("");
    setSenha("");
    setNomeAdmin("");
    setSenhaAdmin("");
    setUserRole("user");
    setNuvemAtiva(false);
  };

  const atalhos = [
    { label: "Louvores", icon: Music2, path: "/louvor", color: "bg-teal-500" },
    { label: "Nova Lista", icon: ListPlus, path: "/nova-lista", color: "bg-amber-500" },
    { label: "Histórico de Listas", icon: History, path: "/historico-listas", color: "bg-indigo-500" },
    { label: "Drive", icon: FolderOpen, path: "/drive", color: "bg-blue-500" },
    { label: "Bíblia", icon: BookOpen, path: "/biblia", color: "bg-emerald-600" }
  ];

  const ferramentas = [
    { label: "Metrônomo", icon: Gauge, color: "bg-purple-500", onClick: openMetronomo },
    { label: "Afinador", icon: Mic, color: "bg-rose-500", onClick: openAfunador }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-28 relative flex flex-col justify-between">
      <div>
        {/* Banner do Cabeçalho */}
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

        {/* Atalhos e Ferramentas */}
        <div className="px-4 -mt-4 space-y-6 relative z-20">
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {atalhos.map((a) =>
                <button 
                  key={a.label} 
                  onClick={a.onClick ? a.onClick : () => navigate(a.path)} 
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                >
                  <div className={`w-11 h-11 rounded-xl ${a.color} flex items-center justify-center`}>
                    <a.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center leading-tight">{a.label}</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Ferramentas</p>
            <div className="grid grid-cols-2 gap-3">
              {ferramentas.map((f) =>
                <button key={f.label} onClick={f.onClick} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                  <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{f.label}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-8 pb-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center justify-between text-xs text-slate-500">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700">Dúvidas ou problemas?</span>
            <span className="text-[10px] text-slate-400">Solicite novos acessos ou suporte técnico</span>
          </div>
          <a href={SEU_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold transition-colors">
            <MessageSquare className="w-4 h-4" /> Suporte
          </a>
        </div>
      </div>

      {/* MODAL 1: Sincronização */}
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
                    placeholder="Ex: icmhlp" 
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

      {/* MODAL 2: CONFIRMAÇÃO DE LOGOUT */}
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