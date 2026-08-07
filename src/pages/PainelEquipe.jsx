import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, Mic, Music, HardDrive, Calendar, Sliders, Cloud,
  Globe, Shield, Loader2, Trash2, Pencil, Download, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function PainelEquipe() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("escala");
  const [menuDropdownAberto, setMenuDropdownAberto] = useState(false);

  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");
  const [carregandoIgreja, setCarregandoIgreja] = useState(false);

  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const temNuvem = userNuvem.trim() !== "";

  // Estados de Dados do Banco
  const [canaisMapa, setCanaisMapa] = useState([]);
  const [novoCanal, setNovoCanal] = useState({ canal: "", funcao: "", microfone: "", retorno: "" });
  const [editandoCanalId, setEditandoCanalId] = useState(null);

  const [escalaCulto, setEscalaCulto] = useState([]);
  const [formEscala, setFormEscala] = useState({ cargo: "", nome: "" });
  const [editandoEscalaId, setEditandoEscalaId] = useState(null);

  const [historicoListas, setHistoricoListas] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [carregandoEscala, setCarregandoEscala] = useState(false);
  const [mostrarModalHistorico, setMostrarModalHistorico] = useState(false);

  const [cultoSelecionadoInfo, setCultoSelecionadoInfo] = useState({
    id: null,
    titulo: "Culto / Evento Geral",
    data: "",
    responsavel: "",
    tipo: "Culto Normal"
  });

  useEffect(() => {
    const validarAcesso = async () => {
      try {
        setCarregandoValidacao(true);
        const roleSalva = localStorage.getItem("icmlyrics_role") || "user";

        if (roleSalva === "super_admin" || userNuvem === "admin_geral") {
          setUserRole("super_admin");
          const nomeIgrejaDefinido = userNuvem || "Administração Geral";
          setNomeIgreja(nomeIgrejaDefinido);
          carregarMapaPalco(nomeIgrejaDefinido);
          setCarregandoValidacao(false);
          return;
        }

        if (!userNuvem.trim()) {
          setUserRole("user");
          const nomeIgrejaDefinido = localStorage.getItem("icmlyrics_nome_igreja") || usuarioLocal || "Modo Local";
          setNomeIgreja(nomeIgrejaDefinido);
          carregarMapaPalco(nomeIgrejaDefinido);
          setCarregandoValidacao(false);
          return;
        }

        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("role, nome_igreja")
          .eq("usuario", userNuvem.trim())
          .maybeSingle();

        let nomeFinal = userNuvem;

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

          nomeFinal = data.nome_igreja || userNuvem;
          setNomeIgreja(nomeFinal);
        } else {
          setUserRole(roleSalva);
          nomeFinal = localStorage.getItem("icmlyrics_nome_igreja") || userNuvem;
          setNomeIgreja(nomeFinal);
        }

        carregarMapaPalco(nomeFinal);
      } catch (err) {
        console.error("Erro ao validar permissões:", err);
        setUserRole(localStorage.getItem("icmlyrics_role") || "user");
      } finally {
        setCarregandoValidacao(false);
      }
    };

    validarAcesso();
  }, [userNuvem, usuarioLocal]);

  // Carregar Mapa de Palco filtrado pela Igreja
  const carregarMapaPalco = async (igrejaNome) => {
    const igrejaParaBuscar = igrejaNome || nomeIgreja;
    if (!igrejaParaBuscar || igrejaParaBuscar === "Carregando...") return;

    setCarregandoMapa(true);
    try {
      const { data, error } = await supabase
        .from("mapa_palco")
        .select("*")
        .eq("nome_igreja", igrejaParaBuscar)
        .order("canal", { ascending: true });

      if (!error && data) {
        setCanaisMapa(data);
      }
    } catch (err) {
      console.error("Erro ao carregar mapa de palco:", err);
    } finally {
      setCarregandoMapa(false);
    }
  };

  // Carregar Escala do Culto filtrada pela Igreja
  const carregarEscalaEquipe = async (listaId) => {
    if (!listaId) return setEscalaCulto([]);
    setCarregandoEscala(true);
    try {
      const { data, error } = await supabase
        .from("escala_equipe")
        .select("*")
        .eq("lista_id", listaId)
        .eq("nome_igreja", nomeIgreja)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setEscalaCulto(data);
      }
    } catch (err) {
      console.error("Erro ao carregar escala da equipe:", err);
    } finally {
      setCarregandoEscala(false);
    }
  };

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
          carregarMapaPalco(data.nome_igreja);
        } else {
          const nomeSalvo = localStorage.getItem("icmlyrics_nome_igreja") || usuarioAtual;
          setNomeIgreja(nomeSalvo);
          carregarMapaPalco(nomeSalvo);
        }
      } catch (e) {
        console.error("Erro ao buscar igreja autorizada:", e);
      } finally {
        setCarregandoIgreja(false);
      }
    }
  };

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
      }
    } catch (err) {
      console.error("Erro ao buscar histórico de listas:", err);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const handleImportarDoHistorico = (item) => {
    const listaId = item.id;
    setCultoSelecionadoInfo({
      id: listaId,
      titulo: item.titulo || item.assunto || "Culto Especial",
      data: item.data || item.created_at?.split("T")[0] || "",
      responsavel: item.responsavel || item.autor || "Não informado",
      tipo: item.tipo_culto || item.evento || "Culto"
    });

    carregarEscalaEquipe(listaId);
    setMostrarModalHistorico(false);
  };

  // Operações de Banco: Escala
  const handleAdicionarItemEscala = async (e) => {
    e.preventDefault();
    if (!podeCriar) return alert("Apenas administradores podem alterar a escala.");
    if (!formEscala.cargo.trim() || !formEscala.nome.trim()) {
      return alert("Preencha o cargo e o nome do responsável.");
    }
    if (!cultoSelecionadoInfo.id) {
      return alert("Selecione um culto do histórico para vincular a escala.");
    }

    try {
      if (editandoEscalaId) {
        const { error } = await supabase
          .from("escala_equipe")
          .update({ cargo: formEscala.cargo, nome: formEscala.nome })
          .eq("id", editandoEscalaId)
          .eq("nome_igreja", nomeIgreja);

        if (error) throw error;
        setEditandoEscalaId(null);
      } else {
        const { error } = await supabase.from("escala_equipe").insert([
          {
            lista_id: cultoSelecionadoInfo.id,
            cargo: formEscala.cargo,
            nome: formEscala.nome,
            nome_igreja: nomeIgreja,
          },
        ]);

        if (error) throw error;
      }

      setFormEscala({ cargo: "", nome: "" });
      carregarEscalaEquipe(cultoSelecionadoInfo.id);
    } catch (err) {
      console.error("Erro ao salvar membro da escala:", err);
      alert("Erro ao salvar na escala.");
    }
  };

  const handleDeletarItemEscala = async (id) => {
    if (!podeCriar) return alert("Apenas administradores podem alterar a escala.");
    try {
      const { error } = await supabase
        .from("escala_equipe")
        .delete()
        .eq("id", id)
        .eq("nome_igreja", nomeIgreja);

      if (error) throw error;
      carregarEscalaEquipe(cultoSelecionadoInfo.id);
    } catch (err) {
      console.error("Erro ao deletar item da escala:", err);
    }
  };

  // Operações de Banco: Mapa de Palco
  const handleSalvarCanal = async () => {
    if (!podeCriar) return alert("Apenas administradores podem gerenciar o mapa de palco.");
    if (!novoCanal.canal || !novoCanal.funcao) return alert("Preencha os campos obrigatórios.");

    try {
      if (editandoCanalId) {
        const { error } = await supabase
          .from("mapa_palco")
          .update({ ...novoCanal, nome_igreja: nomeIgreja })
          .eq("id", editandoCanalId)
          .eq("nome_igreja", nomeIgreja);

        if (error) throw error;
        setEditandoCanalId(null);
      } else {
        const { error } = await supabase.from("mapa_palco").insert([
          { ...novoCanal, nome_igreja: nomeIgreja }
        ]);
        if (error) throw error;
      }

      setNovoCanal({ canal: "", funcao: "", microfone: "", retorno: "" });
      carregarMapaPalco(nomeIgreja);
    } catch (err) {
      console.error("Erro ao salvar canal:", err);
      alert("Erro ao salvar canal no mapa de palco.");
    }
  };

  const handleDeletarCanal = async (id) => {
    if (!podeCriar) return alert("Apenas administradores podem excluir canais.");
    try {
      const { error } = await supabase
        .from("mapa_palco")
        .delete()
        .eq("id", id)
        .eq("nome_igreja", nomeIgreja);

      if (error) throw error;
      carregarMapaPalco(nomeIgreja);
    } catch (err) {
      console.error("Erro ao deletar canal:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-5 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between mb-4">
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
                      <Shield className="w-2.5 h-2.5 text-violet-400" />
                    )}
                    {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => setAbaAtiva("escala")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                abaAtiva === "escala" 
                  ? "bg-violet-600 text-white shadow-sm" 
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Escala
            </button>

            <button
              onClick={() => setAbaAtiva("mapa")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                abaAtiva === "mapa" 
                  ? "bg-violet-600 text-white shadow-sm" 
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Mapa de Palco
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuDropdownAberto(!menuDropdownAberto)}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white shadow-sm transition-all flex items-center justify-center border border-slate-700/50"
              title="Recursos Adicionais"
            >
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {menuDropdownAberto && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setMenuDropdownAberto(false);
                    navigate("/Aquecimento-Vocal");
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 font-semibold transition-colors"
                >
                  <Mic className="w-3.5 h-3.5 text-violet-400" /> Aquecimento Vocal
                </button>

                <button
                  onClick={() => {
                    setMenuDropdownAberto(false);
                    navigate("/sugestoes");
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 font-semibold transition-colors"
                >
                  <Music className="w-3.5 h-3.5 text-violet-400" /> Sugestões de Hinos
                </button>

                <button
                  onClick={() => {
                    setMenuDropdownAberto(false);
                    navigate("/drive");
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 font-semibold transition-colors"
                >
                  <HardDrive className="w-3.5 h-3.5 text-violet-400" /> Drive de Arquivos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4 flex-1">
        {abaAtiva === "escala" && (
          <div className="space-y-3 animate-in fade-in duration-200">
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
                    {historicoListas.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleImportarDoHistorico(item)}
                        className="bg-white p-2.5 rounded-xl border border-violet-100 flex items-center justify-between text-xs cursor-pointer hover:bg-violet-100/50 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{item.titulo || item.assunto || "Culto / Evento"}</p>
                          <p className="text-[10px] text-slate-400">Resp: {item.responsavel || "Geral"} • {item.data || item.created_at?.split("T")[0]}</p>
                        </div>
                        <span className="text-[10px] bg-violet-600 text-white font-bold px-2 py-1 rounded-lg">Selecionar</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {podeCriar && (
              <form onSubmit={handleAdicionarItemEscala} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {editandoEscalaId ? "Editar Cargo / Nome" : "Adicionar Participante à Escala"}
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
                    {editandoEscalaId ? "Salvar Alteração" : "Adicionar à Escala"}
                  </Button>
                  {editandoEscalaId && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditandoEscalaId(null);
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

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Membros Escalados</span>
              
              {carregandoEscala ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-violet-600" /></div>
              ) : escalaCulto.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  {cultoSelecionadoInfo.id 
                    ? "Nenhum participante adicionado nesta escala ainda."
                    : "Puxe um culto do histórico para visualizar ou adicionar membros à escala."}
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {escalaCulto.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">{item.cargo}</span>
                        <span className="font-semibold text-slate-800 text-sm">{item.nome}</span>
                      </div>
                      
                      {podeCriar && (
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setEditandoEscalaId(item.id);
                              setFormEscala({ cargo: item.cargo, nome: item.nome });
                            }}
                            className="p-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg transition-colors"
                            title="Editar item"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeletarItemEscala(item.id)}
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
          </div>
        )}

        {abaAtiva === "mapa" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {podeCriar && (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {editandoCanalId ? "Editar Canal" : "Adicionar Canal"}
                </h3>
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
                <div className="flex gap-2">
                  <Button onClick={handleSalvarCanal} className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl">
                    {editandoCanalId ? "Salvar Alterações do Canal" : "Adicionar Canal ao Mapa"}
                  </Button>
                  {editandoCanalId && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditandoCanalId(null);
                        setNovoCanal({ canal: "", funcao: "", microfone: "", retorno: "" });
                      }}
                      className="h-8 text-xs"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Configuração de Canais e Palco</h3>
              
              {carregandoMapa ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-violet-600" /></div>
              ) : canaisMapa.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum canal cadastrado no mapa de palco desta igreja.</p>
              ) : (
                <div className="space-y-2.5">
                  {canaisMapa.map((item) => (
                    <div key={item.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 bg-violet-600 text-white font-bold rounded-lg flex items-center justify-center text-[11px]">
                          {item.canal}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">{item.funcao}</p>
                          <p className="text-[10px] text-slate-400">Mic: {item.microfone || "-"} • Retorno: {item.retorno || "-"}</p>
                        </div>
                      </div>
                      
                      {podeCriar && (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => {
                              setNovoCanal({
                                canal: item.canal,
                                funcao: item.funcao,
                                microfone: item.microfone || "",
                                retorno: item.retorno || ""
                              });
                              setEditandoCanalId(item.id);
                            }}
                            className="p-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg transition-colors"
                            title="Editar canal"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeletarCanal(item.id)}
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}