import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, Mic, Music, Calendar, Send, Play, Pause, 
  Volume2, Headphones, Sliders, Radio, Cloud,
  Globe, Shield, Loader2, Plus, Trash2, Pencil, Download, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function PainelEquipe() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("escala");

  // Estados de Usuário / Igreja / Permissões
  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");
  const [carregandoIgreja, setCarregandoIgreja] = useState(false);

  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const temNuvem = userNuvem.trim() !== "";
  const userName = localStorage.getItem("icmlyrics_user") || "Usuário";

  // Validação de permissões idêntica ao Avisos.jsx
  useEffect(() => {
    const validarAcesso = async () => {
      try {
        setCarregandoValidacao(true);

        const roleSalva = localStorage.getItem("icmlyrics_role") || "user";

        if (roleSalva === "super_admin" || userNuvem === "admin_geral") {
          setUserRole("super_admin");
          setNomeIgreja(userNuvem || "Administração Geral");
          setCarregandoValidacao(false);
          return;
        }

        if (!userNuvem.trim()) {
          setUserRole("user");
          setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioLocal || "Modo Local");
          setCarregandoValidacao(false);
          return;
        }

        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("role, nome_igreja")
          .eq("usuario", userNuvem.trim())
          .maybeSingle();

        if (!error && data) {
          const roleDoBanco = data.role?.toLowerCase() || "";

          if (roleDoBanco === "super_admin" || roleDoBanco === "super_adm") {
            setUserRole("super_admin");
          } else if (
            roleDoBanco === "church_admin" || 
            roleDoBanco === "adm_local" || 
            roleSalva === "church_admin"
          ) {
            setUserRole("church_admin");
          } else {
            setUserRole("user");
          }

          setNomeIgreja(data.nome_igreja || userNuvem);
        } else {
          setUserRole(roleSalva);
          setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || userNuvem);
        }
      } catch (err) {
        console.error("Erro ao validar permissões:", err);
        setUserRole(localStorage.getItem("icmlyrics_role") || "user");
      } finally {
        setCarregandoValidacao(false);
      }
    };

    validarAcesso();
  }, [userNuvem, usuarioLocal]);

  const podeCriar = userRole === "super_admin" || userRole === "church_admin";
  const isSuper = userRole === "super_admin";

  const carregarNomeIgreja = async () => {
    setCarregandoIgreja(true);
    const usuarioAtual = userNuvem || usuarioLocal;

    if (temNuvem && usuarioAtual) {
      try {
        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("nome_igreja")
          .eq("usuario", usuarioAtual)
          .maybeSingle();

        if (!error && data && data.nome_igreja) {
          setNomeIgreja(data.nome_igreja);
        } else {
          setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioAtual);
        }
      } catch (e) {
        console.error("Erro ao buscar igreja autorizada:", e);
        setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioAtual);
      } finally {
        setCarregandoIgreja(false);
      }
    } else {
      setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioLocal || "Modo Local");
      setCarregandoIgreja(false);
    }
  };

  // Estados para o Aquecimento Vocal (Player simulado)
  const [reproduzindo, setReproduzindo] = useState(false);
  const [exercicioSelecionado, setExercicioSelecionado] = useState("Respiracao e Apoio (4 min)");
  const [rotinasAquecimento, setRotinasAquecimento] = useState([
    "Respiracao e Apoio (4 min)",
    "Vocalizes em Escala Maior (3 min)",
    "Articulação e Dicção Rápida (3.5 min)",
    "Aquecimento Suave para Coro (5 min)"
  ]);
  const [novaRotina, setNovaRotina] = useState("");

  // Estados para Mapa de Palco
  const [canaisMapa, setCanaisMapa] = useState([
    { canal: "01", funcao: "Voz Principal (Dirigente)", microfone: "Sem Fio 01", retorno: "Fone P1" },
    { canal: "02", funcao: "Voz Apoio (Coro)", microfone: "Com Fio SM58", retorno: "Caixa Chão L" },
    { canal: "03", funcao: "Teclado", microfone: "Linha P10 Estéreo", retorno: "Fone P2" },
    { canal: "04", funcao: "Violão / Instrumento", microfone: "DI Box Ativo", retorno: "Caixa Chão R" },
  ]);
  const [novoCanal, setNovoCanal] = useState({ canal: "", funcao: "", microfone: "", retorno: "" });
  const [editandoCanalIndex, setEditandoCanalIndex] = useState(null);

  // Estados para Escala (Inicia vazia conforme solicitado)
  const [escalaCulto, setEscalaCulto] = useState([]);
  const [formEscala, setFormEscala] = useState({ cargo: "", nome: "" });
  const [editandoEscalaIndex, setEditandoEscalaIndex] = useState(null);

  // Estados para Integração com Histórico de Listas
  const [historicoListas, setHistoricoListas] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [mostrarModalHistorico, setMostrarModalHistorico] = useState(false);
  const [cultoSelecionadoInfo, setCultoSelecionadoInfo] = useState({
    titulo: "Culto / Evento Geral",
    data: "",
    responsavel: "",
    tipo: "Culto Normal"
  });

  // Buscar dados do Histórico de Listas do Supabase
  const buscarHistoricoListas = async () => {
    setCarregandoHistorico(true);
    try {
      const { data, error } = await supabase
        .from("listas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setHistoricoListas(data);
      } else {
        console.warn("Tabela historico_listas não encontrada ou vazia, usando dados simulados/locais.");
      }
    } catch (err) {
      console.error("Erro ao buscar histórico de listas:", err);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const handleImportarDoHistorico = (item) => {
    setCultoSelecionadoInfo({
      titulo: item.titulo || item.assunto || "Culto Especial",
      data: item.data || item.created_at?.split("T")[0] || "",
      responsavel: item.responsavel || item.autor || "Não informado",
      tipo: item.tipo_culto || item.evento || "Culto"
    });

    // Se o histórico trouxer uma escala pré-definida ou membros vinculados
    if (item.escala && Array.isArray(item.escala)) {
      setEscalaCulto(item.escala);
    }

    setMostrarModalHistorico(false);
  };

  // Funções de Gerenciamento da Escala
  const handleAdicionarItemEscala = (e) => {
    e.preventDefault();
    if (!podeCriar) return alert("Apenas administradores podem alterar a escala.");
    if (!formEscala.cargo.trim() || !formEscala.nome.trim()) {
      return alert("Preencha o cargo e o nome do responsável.");
    }

    if (editandoEscalaIndex !== null) {
      const atualizada = [...escalaCulto];
      atualizada[editandoEscalaIndex] = formEscala;
      setEscalaCulto(atualizada);
      setEditandoEscalaIndex(null);
    } else {
      setEscalaCulto([...escalaCulto, formEscala]);
    }
    setFormEscala({ cargo: "", nome: "" });
  };

  const handleDeletarItemEscala = (idx) => {
    if (!podeCriar) return alert("Apenas administradores podem alterar a escala.");
    setEscalaCulto(escalaCulto.filter((_, i) => i !== idx));
  };

  // Estados para Sugestão de Repertório (Aberto para qualquer usuário)
  const [sugestaoMusica, setSugestaoMusica] = useState("");
  const [sugestaoCantor, setSugestaoCantor] = useState("");
  const [listaSugestoes, setListaSugestoes] = useState([
    { musica: "Grandes Coisas", autor: "Fernandinho", sugeridoPor: "João (Teclado)" },
    { musica: "Bondade de Deus", autor: "Isadora Pompeo", sugeridoPor: "Sarah (Vocal)" }
  ]);

  const handleEnviarSugestao = (e) => {
    e.preventDefault();
    if (!sugestaoMusica.trim()) return;
    setListaSugestoes([
      { musica: sugestaoMusica, autor: sugestaoCantor || "Não informado", sugeridoPor: userName },
      ...listaSugestoes
    ]);
    setSugestaoMusica("");
    setSugestaoCantor("");
  };

  // Funções de Gerenciamento restritas a Administradores para Mapa de Palco
  const handleSalvarCanal = () => {
    if (!podeCriar) return alert("Apenas administradores podem gerenciar o mapa de palco.");
    if (!novoCanal.canal || !novoCanal.funcao) return alert("Preencha os campos obrigatórios.");
    
    if (editandoCanalIndex !== null) {
      const atualizados = [...canaisMapa];
      atualizados[editandoCanalIndex] = novoCanal;
      setCanaisMapa(atualizados);
      setEditandoCanalIndex(null);
    } else {
      setCanaisMapa([...canaisMapa, novoCanal]);
    }
    setNovoCanal({ canal: "", funcao: "", microfone: "", retorno: "" });
  };

  const handleDeletarCanal = (idx) => {
    if (!podeCriar) return alert("Apenas administradores podem excluir canais.");
    setCanaisMapa(canaisMapa.filter((_, i) => i !== idx));
  };

  const handleAdicionarRotina = (e) => {
    e.preventDefault();
    if (!podeCriar) return alert("Apenas administradores podem adicionar rotinas de aquecimento.");
    if (!novaRotina.trim()) return;
    setRotinasAquecimento([...rotinasAquecimento, novaRotina.trim()]);
    setNovaRotina("");
  };

  const handleDeletarRotina = (idx) => {
    if (!podeCriar) return alert("Apenas administradores podem excluir rotinas de aquecimento.");
    setRotinasAquecimento(rotinasAquecimento.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      {/* Cabeçalho */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/dashboard")} 
              className="text-slate-300 hover:text-white transition-colors"
              aria-label="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" /> Painel da Equipe
              </h1>
              <p className="text-slate-400 text-xs">Organização, técnica e preparação para o culto</p>
            </div>
          </div>

          {/* Indicador do Usuário/Igreja e Permissões */}
          <div className="flex flex-col items-end gap-1 text-right max-w-[180px]">
            {carregandoValidacao ? (
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
            ) : !temNuvem ? (
              <Cloud className="w-6 h-6 text-slate-400" />
            ) : (
              <>
                <span className="text-[11px] font-bold text-slate-300 uppercase truncate w-full">
                  {nomeIgreja}
                </span>
                <div className="flex items-center gap-1.5">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      carregarNomeIgreja();
                    }}
                    className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
                    title="Clique para atualizar/sincronizar"
                  >
                    <Cloud className={`w-3 h-3 text-emerald-400 ${carregandoIgreja ? "animate-spin" : ""}`} />
                  </div>

                  <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">
                    {isSuper ? (
                      <Globe className="w-2.5 h-2.5 text-amber-400" />
                    ) : (
                      <Shield className="w-2.5 h-2.5 text-indigo-400" />
                    )}
                    {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Abas de Navegação interna */}
        <div className="flex gap-1.5 overflow-x-auto pt-2 no-scrollbar">
          <button
            onClick={() => setAbaAtiva("escala")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              abaAtiva === "escala" 
                ? "bg-violet-600 text-white shadow-sm" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Escala
          </button>

          <button
            onClick={() => setAbaAtiva("mapa")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              abaAtiva === "mapa" 
                ? "bg-violet-600 text-white shadow-sm" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Mapa de Palco
          </button>

          <button
            onClick={() => setAbaAtiva("aquecimento")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              abaAtiva === "aquecimento" 
                ? "bg-violet-600 text-white shadow-sm" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Aquecimento Vocal
          </button>

          <button
            onClick={() => setAbaAtiva("sugestoes")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              abaAtiva === "sugestoes" 
                ? "bg-violet-600 text-white shadow-sm" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Music className="w-3.5 h-3.5" /> Sugestões (Aberto)
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="px-4 mt-4 space-y-4 flex-1">
        
        {/* 1. ESCALA DE LOUVOR (Inicia vazia + Integração com Histórico de Listas) */}
        {abaAtiva === "escala" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            
            {/* Bloco de Informações do Culto / Evento Integrado com Histórico */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">{cultoSelecionadoInfo.tipo}</span>
                  <h3 className="text-sm font-bold text-slate-900">{cultoSelecionadoInfo.titulo}</h3>
                </div>
                {podeCriar && (
                  <Button 
                    onClick={() => {
                      buscarHistoricoListas();
                      setMostrarModalHistorico(true);
                    }}
                    size="sm"
                    className="h-8 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold gap-1 border border-violet-200"
                  >
                    <Download className="w-3.5 h-3.5" /> Puxar do Histórico
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-slate-600 pt-2 border-t border-slate-50">
                <div><span className="text-slate-400">Data:</span> <strong className="text-slate-800">{cultoSelecionadoInfo.data || "Não definida"}</strong></div>
                <div><span className="text-slate-400">Responsável:</span> <strong className="text-slate-800">{cultoSelecionadoInfo.responsavel || "Não definido"}</strong></div>
              </div>
            </div>

            {/* Modal / Seletor de Histórico de Listas */}
            {mostrarModalHistorico && (
              <div className="bg-violet-50 border border-violet-200 p-4 rounded-2xl space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-violet-950 uppercase">Selecionar do Histórico de Listas</h4>
                  <button onClick={() => setMostrarModalHistorico(false)} className="text-xs text-slate-500 hover:text-slate-800 font-bold">Fechar</button>
                </div>
                
                {carregandoHistorico ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-violet-600" /></div>
                ) : historicoListas.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">Nenhum registro encontrado no histórico.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {historicoListas.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        onClick={() => handleImportarDoHistorico(item)}
                        className="bg-white p-2.5 rounded-xl border border-violet-100 flex items-center justify-between text-xs cursor-pointer hover:bg-violet-100/50 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{item.titulo || item.assunto || "Culto / Evento"}</p>
                          <p className="text-[10px] text-slate-400">Resp: {item.responsavel || "Geral"} • {item.data || item.created_at?.split("T")[0]}</p>
                        </div>
                        <span className="text-[10px] bg-violet-600 text-white font-bold px-2 py-1 rounded-lg">Importar</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Formulário para Adicionar Nomes na Escala (Admin) */}
            {podeCriar && (
              <form onSubmit={handleAdicionarItemEscala} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {editandoEscalaIndex !== null ? "Editar Cargo / Nome" : "Adicionar Participante à Escala"}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input 
                    placeholder="Cargo / Função (ex: Regente, Teclado)" 
                    value={formEscala.cargo}
                    onChange={(e) => setFormEscala({ ...formEscala, cargo: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input 
                    placeholder="Nome completo (ex: Ezequiel Vanderley)" 
                    value={formEscala.nome}
                    onChange={(e) => setFormEscala({ ...formEscala, nome: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl">
                    {editandoEscalaIndex !== null ? "Salvar Alteração" : "Adicionar à Escala"}
                  </Button>
                  {editandoEscalaIndex !== null && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditandoEscalaIndex(null);
                        setFormEscala({ cargo: "", nome: "" });
                      }}
                      className="h-8 text-xs"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            )}

            {/* Lista da Escala (Inicia Vazia) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Membros Escalados</span>
              
              {escalaCulto.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  Nenhum participante adicionado na escala ainda. Use o painel acima para incluir.
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {escalaCulto.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">{item.cargo}</span>
                        <span className="font-semibold text-slate-800 text-sm">{item.nome}</span>
                      </div>
                      
                      {podeCriar && (
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setEditandoEscalaIndex(idx);
                              setFormEscala(item);
                            }}
                            className="p-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg transition-colors"
                            title="Editar item"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeletarItemEscala(idx)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            title="Excluir item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-violet-50 border border-violet-100 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-violet-600 text-white rounded-xl">
                <Radio className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-violet-950">Lembrete de Horário</p>
                <p className="text-violet-700 mt-0.5">Passagem de som iniciará pontualmente 45 minutos antes do culto.</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. MAPA DE PALCO / GRID DE CONEXÕES (Admin pode alterar e excluir) */}
        {abaAtiva === "mapa" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {podeCriar && (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adicionar / Editar Canal</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="Canal (ex: 06)" 
                    value={novoCanal.canal} 
                    onChange={(e) => setNovoCanal({ ...novoCanal, canal: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input 
                    placeholder="Função (ex: Violão)" 
                    value={novoCanal.funcao} 
                    onChange={(e) => setNovoCanal({ ...novoCanal, funcao: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input 
                    placeholder="Microfone / DI" 
                    value={novoCanal.microfone} 
                    onChange={(e) => setNovoCanal({ ...novoCanal, microfone: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input 
                    placeholder="Retorno (ex: Fone P2)" 
                    value={novoCanal.retorno} 
                    onChange={(e) => setNovoCanal({ ...novoCanal, retorno: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <Button onClick={handleSalvarCanal} className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl">
                  {editandoCanalIndex !== null ? "Salvar Alterações do Canal" : "Adicionar Canal ao Mapa"}
                </Button>
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Configuração de Canais e Palco</h3>
              
              <div className="space-y-2.5">
                {canaisMapa.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 bg-violet-600 text-white font-bold rounded-lg flex items-center justify-center text-[11px]">
                        {item.canal}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{item.funcao}</p>
                        <p className="text-[10px] text-slate-400">Mic: {item.microfone} • Retorno: {item.retorno}</p>
                      </div>
                    </div>
                    
                    {podeCriar && (
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => {
                            setNovoCanal(item);
                            setEditandoCanalIndex(idx);
                          }}
                          className="p-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg transition-colors"
                          title="Editar canal"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeletarCanal(idx)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                          title="Excluir canal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. AQUECIMENTO VOCAL INTEGRADO (Admin pode gerenciar rotinas) */}
        {abaAtiva === "aquecimento" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Headphones className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{exercicioSelecionado}</h3>
              <p className="text-xs text-slate-400 mt-1">Siga as orientações de respiração e vocalize junto ao player.</p>

              {/* Player Simulado */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl mt-4 flex items-center justify-between shadow-md">
                <button 
                  onClick={() => setReproduzindo(!reproduzindo)}
                  className="w-12 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg"
                >
                  {reproduzindo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex-1 mx-4">
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-violet-500 transition-all duration-300 ${reproduzindo ? "w-2/3 animate-pulse" : "w-0"}`} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{reproduzindo ? "02:15" : "00:00"}</span>
                    <span>04:00</span>
                  </div>
                </div>

                <Volume2 className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            {podeCriar && (
              <form onSubmit={handleAdicionarRotina} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adicionar Nova Rotina</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nome da rotina (ex: Aquecimento Alto - 3 min)"
                    value={novaRotina}
                    onChange={(e) => setNovaRotina(e.target.value)}
                    className="h-9 text-xs flex-1"
                  />
                  <Button type="submit" className="h-9 bg-violet-600 hover:bg-violet-700 text-xs font-semibold">
                    Adicionar
                  </Button>
                </div>
              </form>
            )}

            {/* Lista de Rotinas */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rotinas Disponíveis (3 a 5 min)</p>
              {rotinasAquecimento.map((rotina, i) => (
                <div
                  key={i}
                  className={`w-full p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                    exercicioSelecionado === rotina 
                      ? "bg-violet-50 border-violet-200 text-violet-900 font-bold" 
                      : "bg-slate-50 border-slate-100 text-slate-700"
                  }`}
                >
                  <button
                    onClick={() => {
                      setExercicioSelecionado(rotina);
                      setReproduzindo(true);
                    }}
                    className="flex-1 text-left flex items-center justify-between"
                  >
                    <span>{rotina}</span>
                    <Play className="w-3.5 h-3.5 text-violet-600" />
                  </button>

                  {podeCriar && (
                    <button
                      onClick={() => handleDeletarRotina(i)}
                      className="ml-3 p-1 text-rose-500 hover:text-rose-700 transition-colors"
                      title="Excluir rotina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SUGESTÃO DE REPERTÓRIO (Aberto para qualquer usuário) */}
        {abaAtiva === "sugestoes" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sugerir Hino ou Louvor (Aberto a Todos)</h3>
              
              <form onSubmit={handleEnviarSugestao} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome da Música</label>
                  <Input 
                    placeholder="Ex: Mais Perto Pertinho..." 
                    value={sugestaoMusica}
                    onChange={(e) => setSugestaoMusica(e.target.value)}
                    className="h-9 mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cantor / Grupo Original</label>
                  <Input 
                    placeholder="Ex: Coro / Artista" 
                    value={sugestaoCantor}
                    onChange={(e) => setSugestaoCantor(e.target.value)}
                    className="h-9 mt-1 text-xs"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-9 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold gap-1.5 rounded-xl"
                >
                  <Send className="w-3.5 h-3.5" /> Enviar Sugestão à Liderança
                </Button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sugestões Enviadas pela Equipe</p>
              
              {listaSugestoes.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{item.musica}</p>
                    <p className="text-[10px] text-slate-400">Original: {item.autor} • Sugerido por: {item.sugeridoPor}</p>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-lg border border-amber-100">
                    Em Análise
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}