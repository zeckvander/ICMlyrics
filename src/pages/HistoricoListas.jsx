import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Trash2, Calendar, Music, Printer, Cloud, CloudOff, Edit3, Plus, GripVertical, X, Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import DrawerMenu from "@/components/louvores/DrawerMenu";
import PreviewModal from "@/components/lista/PreviewModal";
import { supabase } from "@/lib/supabaseClient";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function HistoricoListas() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listas, setListas] = useState([]);

  // Credenciais
  const usuario = localStorage.getItem("icmlyrics_user_nuvem") || localStorage.getItem("icmlyrics_user") || "";
  const temNuvem = usuario.trim() !== "";

  // Estado da lista selecionada para edição/visualização
  const [listaSelecionada, setListaSelecionada] = useState(null);
  const [rows, setRows] = useState([]);
  const [dataCulto, setDataCulto] = useState("");
  const [tipoCulto, setTipoCulto] = useState("");
  const [responsavel, setResponsavel] = useState("");

  // Banco de louvores para autocomplete
  const [todosLouvoresBanco, setTodosLouvoresBanco] = useState([]);

  // Estado para aba ativa no modal (1: Informações, 2: Louvores)
  const [abaAtiva, setAbaAtiva] = useState(1);

  // Estado para adicionar novo item na edição
  const [modoAdicao, setModoAdicao] = useState(null); // 'louvor' | 'divider' | null
  const [novoNome, setNovoNome] = useState("");
  const [novoTextoSecao, setNovoTextoSecao] = useState("");

  // Modal de Pré-visualização
  const [previewOpen, setPreviewOpen] = useState(false);

  const carregarBancoLouvores = async () => {
    if (todosLouvoresBanco.length > 0) return;
    try {
      const { data, error } = await supabase
        .from("louvores")
        .select("id, numero, nome, categoria, letra_musica")
        .order("nome", { ascending: true });
      if (error) throw error;
      setTodosLouvoresBanco(data || []);
    } catch (e) {
      console.error("Erro ao carregar banco de louvores:", e);
    }
  };

  const carregarListas = async () => {
    setLoading(true);
    if (temNuvem) {
      try {
        const { data, error } = await supabase
          .from("listas")
          .select("*, lista_itens(*, louvores(*))")
          .eq("acesso_usuario", usuario)
          .order("data_culto", { ascending: false });

        if (error) throw error;
        setListas(data || []);
      } catch (e) {
        console.error("Erro ao carregar do Supabase:", e);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const local = JSON.parse(localStorage.getItem("icmlyrics_historico_listas") || "[]");
        setListas(local);
      } catch (e) {
        console.error("Erro ao carregar local:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    carregarBancoLouvores();
    carregarListas();
  }, []);

  const calcularDiaSemana = (dataStr) => {
    if (!dataStr) return "";
    const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const dataObj = new Date(dataStr.split("T")[0] + "T00:00:00");
    return DIAS[dataObj.getDay()] || "";
  };

  const formatarDataBR = (dataStr) => {
    if (!dataStr) return "";
    const partes = dataStr.split("T")[0].split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  const abrirEdicaoLista = (lista) => {
    setListaSelecionada(lista);
    setDataCulto(lista.data_culto || lista.dataCulto || "");
    setTipoCulto(lista.tipo_culto || lista.tipoCulto || "");
    setResponsavel(lista.responsavel || "");
    setAbaAtiva(1);
    setModoAdicao(null);

    const itensBrutos = lista.lista_itens || lista.rows || [];
    const itensFormatados = itensBrutos.map((item, idx) => ({
      id: item.id || `item_${idx}`,
      type: item.tipo || item.type || "louvor",
      numero: item.louvores?.numero || item.numero || "",
      nome: item.louvores?.nome || item.nome || item.text || "",
      categoria: item.louvores?.categoria || item.categoria || "Coletânea",
      observacao: item.observacao || "",
      letra_musica: item.louvores?.letra_musica || item.letra_musica || "",
      id_louvor_db: item.louvores?.id || item.louvor_id || item.id_louvor_db || null,
      text: item.texto_secao || item.text || "",
      isEditing: false
    }));

    setRows(itensFormatados);
  };

  const handleAbrirReimpressao = (lista) => {
    setDataCulto(lista.data_culto || lista.dataCulto || "");
    setTipoCulto(lista.tipo_culto || lista.tipoCulto || "");
    setResponsavel(lista.responsavel || "");
    
    const itensBrutos = lista.lista_itens || lista.rows || [];
    const itensFormatados = itensBrutos.map((item, idx) => ({
      id: item.id || `item_${idx}`,
      type: item.tipo || item.type || "louvor",
      numero: item.louvores?.numero || item.numero || "",
      nome: item.louvores?.nome || item.nome || item.text || "",
      categoria: item.louvores?.categoria || item.categoria || "Coletânea",
      observacao: item.observacao || "",
      letra_musica: item.louvores?.letra_musica || item.letra_musica || "",
      text: item.texto_secao || item.text || ""
    }));

    setRows(itensFormatados);
    setPreviewOpen(true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(rows);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setRows(items);
  };

  const handleAdicionarSecao = () => {
    if (!novoTextoSecao.trim()) {
      alert("Informe o título da seção.");
      return;
    }
    const novoItem = {
      id: `local_new_${Date.now()}`,
      type: "divider",
      text: novoTextoSecao.trim(),
      observacao: "",
      isEditing: false
    };
    setRows([...rows, novoItem]);
    setNovoTextoSecao("");
    setModoAdicao(null);
  };

  const handleSalvarEdicao = async () => {
    if (rows.length === 0) {
      alert("A lista precisa ter pelo menos um item.");
      return;
    }

    const diaSemana = calcularDiaSemana(dataCulto);
    setLoading(true);

    if (temNuvem && listaSelecionada?.id) {
      try {
        const { error: errCabecalho } = await supabase
          .from("listas")
          .update({
            data_culto: dataCulto,
            dia_semana: diaSemana,
            tipo_culto: tipoCulto,
            responsavel: responsavel
          })
          .eq("id", listaSelecionada.id);

        if (errCabecalho) throw errCabecalho;

        await supabase.from("lista_itens").delete().eq("lista_id", listaSelecionada.id);

        const itensParaInserir = rows.map((row, index) => ({
          lista_id: listaSelecionada.id,
          ordem: index + 1,
          tipo: row.type || "louvor",
          observacao: row.observacao || null,
          texto_secao: row.type === "divider" ? row.text : null,
          louvor_id: row.id_louvor_db || null
        }));

        const { error: errItens } = await supabase.from("lista_itens").insert(itensParaInserir);
        if (errItens) throw errItens;

        setListaSelecionada(null);
        carregarListas();
      } catch (e) {
        alert(`Erro ao atualizar: ${e.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const historico = JSON.parse(localStorage.getItem("icmlyrics_historico_listas") || "[]");
        const atualizado = historico.map(l => {
          if (l.id === listaSelecionada.id) {
            return {
              ...l,
              dataCulto,
              diaSemana,
              tipoCulto,
              responsavel,
              rows: rows.map(r => ({
                id: r.id,
                type: r.type,
                categoria: r.categoria,
                observacao: r.observacao,
                text: r.text,
                nome: r.nome,
                numero: r.numero,
                letra_musica: r.letra_musica,
                id_louvor_db: r.id_louvor_db
              }))
            };
          }
          return l;
        });
        localStorage.setItem("icmlyrics_historico_listas", JSON.stringify(atualizado));
        setListaSelecionada(null);
        carregarListas();
      } catch (e) {
        alert(`Erro ao atualizar localmente: ${e.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExcluirLista = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta lista?")) return;
    setLoading(true);
    if (temNuvem) {
      try {
        await supabase.from("lista_itens").delete().eq("lista_id", id);
        const { error } = await supabase.from("listas").delete().eq("id", id);
        if (error) throw error;
        alert("Lista excluída com sucesso!");
        carregarListas();
      } catch (e) {
        alert(`Erro ao excluir: ${e.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const historico = JSON.parse(localStorage.getItem("icmlyrics_historico_listas") || "[]");
        const filtrado = historico.filter(l => l.id !== id);
        localStorage.setItem("icmlyrics_historico_listas", JSON.stringify(filtrado));
        alert("Lista excluída localmente!");
        carregarListas();
      } catch (e) {
        alert(`Erro ao excluir: ${e.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Nova função para apagar todas as listas da nuvem
  const handleExcluirTodasNuvem = async () => {
    if (!window.confirm("Tem certeza que deseja excluir TODAS as listas salvas na nuvem? Esta ação não pode ser desfeita.")) return;
    setLoading(true);
    try {
      // 1. Buscar os IDs de todas as listas do usuário
      const { data: listasUser, error: errFetch } = await supabase
        .from("listas")
        .select("id")
        .eq("acesso_usuario", usuario);

      if (errFetch) throw errFetch;

      if (listasUser && listasUser.length > 0) {
        const ids = listasUser.map(l => l.id);

        // 2. Apagar os itens dessas listas
        const { error: errItens } = await supabase
          .from("lista_itens")
          .delete()
          .in("lista_id", ids);

        if (errItens) throw errItens;

        // 3. Apagar as listas do usuário
        const { error: errListas } = await supabase
          .from("listas")
          .delete()
          .eq("acesso_usuario", usuario);

        if (errListas) throw errListas;
      }

      alert("Todas as listas da nuvem foram apagadas com sucesso!");
      carregarListas();
    } catch (e) {
      alert(`Erro ao apagar todas as listas: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Tela 1: Histórico Geral */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button onClick={() => setDrawerOpen(true)} className="text-slate-300 hover:text-white transition-colors p-1 mr-1">
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Histórico</h1>
            <p className="text-slate-400 text-xs">Listas passadas do culto</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {temNuvem && listas.length > 0 && (
            <button
              onClick={handleExcluirTodasNuvem}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Apagar todas as listas da nuvem"
            >
              <Trash2 className="w-3.5 h-3.5" /> Apagar Todas
            </button>
          )}
          {temNuvem ? (
            <Cloud className="w-5 h-5 text-emerald-400 drop-shadow ml-1" title={`Conectado (${usuario})`} />
          ) : (
            <CloudOff className="w-5 h-5 text-slate-500" title="Modo local" />
          )}
        </div>
      </div>

      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="space-y-3">
          {listas.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8 bg-white rounded-2xl border border-dashed border-slate-200">
              Nenhuma lista encontrada no histórico.
            </p>
          ) : (
            listas.map((lista) => {
              const dataFormatada = formatarDataBR(lista.data_culto || lista.dataCulto || "");
              const diaSemana = lista.dia_semana || lista.diaSemana || "";
              const tema = lista.tipo_culto || lista.tipoCulto || "";
              const resp = lista.responsavel || "";
              const itensLista = lista.lista_itens || lista.rows || [];

              return (
                <div key={lista.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{dataFormatada}</span>
                      <span className="text-xs text-slate-500 font-medium">{diaSemana}</span>
                      <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {temNuvem ? "NUVEM" : "LOCAL"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEdicaoLista(lista)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Editar lista"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExcluirLista(lista.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Excluir lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {(tema || resp) && (
                    <div className="bg-slate-50 px-3 py-2 rounded-xl text-xs text-slate-700 flex items-center gap-3">
                      {tema && <span><strong>Culto:</strong> {tema}</span>}
                      {resp && <span><strong>Responsável:</strong> {resp}</span>}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {itensLista.map((item, idx) => {
                      const tipo = item.tipo || item.type || "louvor";
                      const num = item.louvores?.numero || item.numero || "";
                      const nomeBanco = item.louvores?.nome || item.nome || item.text || "";
                      const cat = item.louvores?.categoria || item.categoria || "Coletânea";
                      const textoSecao = item.texto_secao || item.text || nomeBanco;

                      const ehCias = cat === "Cias" || cat === "CIAS" || cat === "cias";
                      const nomeExibicao = ehCias && !nomeBanco.toLowerCase().includes("(cias)") ? `${nomeBanco} (Cias)` : nomeBanco;

                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                          {tipo === "divider" ? (
                            <span className="font-bold text-indigo-600 uppercase tracking-wide">✦ {textoSecao}</span>
                          ) : (
                            <div className="flex items-center gap-2.5 truncate w-full">
                              <Music className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] text-center w-12 flex-shrink-0">
                                {num || cat}
                              </span>
                              <span className="truncate text-slate-800 font-medium">{nomeExibicao}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      onClick={() => navigate("/modo-playlist", { state: { lista: lista } })}
                      className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 font-semibold gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Playlist
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAbrirReimpressao(lista)}
                      className="w-1/2 bg-white hover:bg-slate-100 text-slate-800 border-slate-200 rounded-xl text-xs h-9 font-semibold gap-2"
                    >
                      <Printer className="w-3.5 h-3.5" /> Reimprimir
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      {listaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Editar Lista do Culto</h2>
              <button 
                onClick={() => setListaSelecionada(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas do Modal */}
            <div className="flex border-b border-slate-200 flex-shrink-0">
              <button
                onClick={() => setAbaAtiva(1)}
                className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 ${
                  abaAtiva === 1 
                    ? "border-indigo-600 text-indigo-600" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                1. Informações do Culto
              </button>
              <button
                onClick={() => setAbaAtiva(2)}
                className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 ${
                  abaAtiva === 2 
                    ? "border-indigo-600 text-indigo-600" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                2. Louvores / Itens ({rows.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {abaAtiva === 1 ? (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Data do Culto</label>
                    <input 
                      type="date"
                      value={dataCulto}
                      onChange={(e) => setDataCulto(e.target.value)}
                      className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Tipo de Culto (Tema)</label>
                    <input 
                      type="text"
                      value={tipoCulto}
                      onChange={(e) => setTipoCulto(e.target.value)}
                      className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Responsável</label>
                    <input 
                      type="text"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                      className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1 flex flex-col">
                  {/* Painel de Adição de Louvor por Busca/Autocomplete */}
                  {modoAdicao === 'louvor' && (
                    <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-indigo-900">Adicionar Louvor</p>
                        <button onClick={() => setModoAdicao(null)} className="text-slate-400 hover:text-slate-600 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={novoNome}
                          onChange={(e) => setNovoNome(e.target.value)}
                          placeholder="Digite o nome ou número do louvor..."
                          autoFocus
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {novoNome.trim() !== "" && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                            {todosLouvoresBanco
                              .filter(l => 
                                (l.nome && l.nome.toLowerCase().includes(novoNome.toLowerCase())) ||
                                (l.numero && String(l.numero).toLowerCase().includes(novoNome.toLowerCase())) ||
                                (l.categoria && l.categoria.toLowerCase().includes(novoNome.toLowerCase()))
                              )
                              .slice(0, 10)
                              .map((louvor) => (
                                <div
                                  key={louvor.id}
                                  onClick={() => {
                                    const novoItem = {
                                      id: `local_new_${Date.now()}`,
                                      type: "louvor",
                                      numero: louvor.numero || "",
                                      nome: louvor.nome || "",
                                      categoria: louvor.categoria || "Coletânea",
                                      observacao: "",
                                      letra_musica: louvor.letra_musica || "",
                                      id_louvor_db: louvor.id,
                                      isEditing: false
                                    };
                                    setRows([...rows, novoItem]);
                                    setNovoNome("");
                                    setModoAdicao(null);
                                  }}
                                  className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-none flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-12 text-center flex-shrink-0">
                                      {louvor.numero || "—"}
                                    </span>
                                    <span className="text-slate-800 font-medium truncate">
                                      {louvor.nome} {louvor.categoria === "Cias" || louvor.categoria === "CIAS" ? "(Cias)" : ""}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                    Selecionar
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {modoAdicao === 'divider' && (
                    <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-indigo-900">Adicionar Nova Seção</p>
                        <button onClick={() => setModoAdicao(null)} className="text-slate-400 hover:text-slate-600 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={novoTextoSecao}
                          onChange={(e) => setNovoTextoSecao(e.target.value)}
                          placeholder="Ex: Louvores de Adoração..."
                          autoFocus
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <Button
                        onClick={handleAdicionarSecao}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-semibold rounded-lg mt-1"
                      >
                        Adicionar Seção
                      </Button>
                    </div>
                  )}

                  <p className="text-xs font-semibold text-slate-600 pt-1">Arraste para reordenar ou clique no lápis para editar:</p>

                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="modal-historico-rows">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {rows.map((row, index) => {
                            const termoBusca = (row.nome || "").toLowerCase();
                            const resultadosBusca = termoBusca.trim() === "" || !row.isEditing || row.type === 'divider' ? [] : todosLouvoresBanco.filter(l => 
                              (l.nome && l.nome.toLowerCase().includes(termoBusca)) ||
                              (l.numero && String(l.numero).toLowerCase().includes(termoBusca)) ||
                              (l.categoria && l.categoria.toLowerCase().includes(termoBusca)) ||
                              (l.letra_musica && l.letra_musica.toLowerCase().includes(termoBusca))
                            ).slice(0, 10);

                            const ehCiasModal = row.categoria === "Cias" || row.categoria === "CIAS" || row.categoria === "cias";
                            const nomeExibicaoModal = ehCiasModal && !(row.nome || "").toLowerCase().includes("(cias)") ? `${row.nome} (Cias)` : row.nome;

                            return (
                              <Draggable key={row.id || index} draggableId={String(row.id || index)} index={index}>
                                {(providedDraggable, snapshot) => (
                                  <div 
                                    ref={providedDraggable.innerRef}
                                    {...providedDraggable.draggableProps}
                                    className={`bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all relative ${
                                      snapshot.isDragging ? "opacity-70 border-indigo-400 bg-indigo-50/30 shadow-md" : ""
                                    }`}
                                  >
                                    {row.isEditing ? (
                                      <div className="space-y-2 relative">
                                        {row.type === 'divider' ? (
                                          <div className="flex items-center gap-2">
                                            <div {...providedDraggable.dragHandleProps} className="flex-shrink-0 cursor-grab text-slate-400">
                                              <GripVertical className="w-4 h-4" />
                                            </div>
                                            <input
                                              type="text"
                                              value={row.text}
                                              onChange={(e) => {
                                                const novasRows = [...rows];
                                                novasRows[index].text = e.target.value;
                                                setRows(novasRows);
                                              }}
                                              placeholder="Nome da Seção"
                                              autoFocus
                                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600 uppercase"
                                            />
                                            <button
                                              onClick={() => {
                                                const novasRows = [...rows];
                                                novasRows[index].isEditing = false;
                                                setRows(novasRows);
                                              }}
                                              className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                                              title="Salvar alteração da seção"
                                            >
                                              <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                const novasRows = [...rows];
                                                novasRows[index].text = novasRows[index].originalText || "";
                                                novasRows[index].isEditing = false;
                                                setRows(novasRows);
                                              }}
                                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                              title="Cancelar"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="space-y-2 relative">
                                            <div className="flex items-center gap-2">
                                              <div {...providedDraggable.dragHandleProps} className="flex-shrink-0 cursor-grab text-slate-400">
                                                <GripVertical className="w-4 h-4" />
                                              </div>
                                              <div className="bg-slate-100 text-slate-600 font-semibold px-2 py-1.5 rounded-lg text-xs w-12 text-center border border-slate-200 flex-shrink-0">
                                                {row.numero || "—"}
                                              </div>

                                              <div className="relative flex-1">
                                                <input
                                                  type="text"
                                                  value={row.nome}
                                                  onChange={(e) => {
                                                    const novasRows = [...rows];
                                                    novasRows[index].nome = e.target.value;
                                                    setRows(novasRows);
                                                  }}
                                                  placeholder="Nome ou Número do Louvor"
                                                  autoFocus
                                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                {resultadosBusca.length > 0 && (
                                                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                                                    {resultadosBusca.map((louvor) => (
                                                      <div
                                                        key={louvor.id}
                                                        onClick={() => {
                                                          const novasRows = [...rows];
                                                          novasRows[index] = {
                                                            ...novasRows[index],
                                                            nome: louvor.nome,
                                                            numero: louvor.numero,
                                                            categoria: louvor.categoria || "Coletânea",
                                                            letra_musica: louvor.letra_musica || "",
                                                            id_louvor_db: louvor.id,
                                                            isEditing: false
                                                          };
                                                          setRows(novasRows);
                                                        }}
                                                        className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-none flex items-center justify-between text-xs"
                                                      >
                                                        <div className="flex items-center gap-2 truncate">
                                                          <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-12 text-center flex-shrink-0">
                                                            {louvor.numero || "—"}
                                                          </span>
                                                          <span className="text-slate-800 font-medium truncate">
                                                            {louvor.nome} {louvor.categoria === "Cias" || louvor.categoria === "CIAS" ? "(Cias)" : ""}
                                                          </span>
                                                        </div>
                                                        <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                                          Selecionar
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>

                                              <button
                                                onClick={() => {
                                                  const novasRows = [...rows];
                                                  novasRows[index].nome = novasRows[index].originalNome || "";
                                                  novasRows[index].numero = novasRows[index].originalNumero || "";
                                                  novasRows[index].categoria = novasRows[index].originalCategoria || "Coletânea";
                                                  novasRows[index].observacao = novasRows[index].originalObservacao || "";
                                                  novasRows[index].id_louvor_db = novasRows[index].originalIdLouvorDb || null;
                                                  novasRows[index].isEditing = false;
                                                  setRows(novasRows);
                                                }}
                                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                                title="Cancelar edição"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </div>
                                            <div>
                                              <input
                                                type="text"
                                                value={row.observacao || ""}
                                                onChange={(e) => {
                                                  const novasRows = [...rows];
                                                  novasRows[index].observacao = e.target.value;
                                                  setRows(novasRows);
                                                }}
                                                placeholder="Observação (opcional)"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2.5 truncate pr-2">
                                          <div {...providedDraggable.dragHandleProps} className="cursor-grab text-slate-400 flex-shrink-0">
                                            <GripVertical className="w-4 h-4" />
                                          </div>
                                          {row.type === "divider" ? (
                                            <span className="font-bold text-indigo-600 uppercase tracking-wide">✦ {row.text || "Seção"}</span>
                                          ) : (
                                            <div className="flex items-center gap-2.5 truncate">
                                              <Music className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] text-center w-12 flex-shrink-0">
                                                {row.numero || (row.categoria === "Avulsos" ? "Av" : (row.categoria || "—"))}
                                              </span>
                                              <span className="truncate text-slate-800 font-medium">{nomeExibicaoModal}</span>
                                              {row.observacao && (
                                                <span className="text-[10px] text-slate-400 italic">({row.observacao})</span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <button
                                            onClick={() => {
                                              const novasRows = [...rows];
                                              if (row.type === 'divider') {
                                                novasRows[index].originalText = novasRows[index].text;
                                              } else {
                                                novasRows[index].originalNome = novasRows[index].nome;
                                                novasRows[index].originalNumero = novasRows[index].numero;
                                                novasRows[index].originalCategoria = novasRows[index].categoria;
                                                novasRows[index].originalObservacao = novasRows[index].observacao;
                                                novasRows[index].originalIdLouvorDb = novasRows[index].id_louvor_db;
                                                novasRows[index].nome = "";
                                                novasRows[index].numero = "";
                                              }
                                              novasRows[index].isEditing = true;
                                              setRows(novasRows);
                                            }}
                                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Editar item"
                                          >
                                            <Edit3 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              const novasRows = rows.filter((_, i) => i !== index);
                                              setRows(novasRows);
                                            }}
                                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                                            title="Remover item"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {/* Botões de Ação embaixo, divididos em 50% cada */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => setModoAdicao(modoAdicao === 'louvor' ? null : 'louvor')}
                      className={`w-1/2 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        modoAdicao === 'louvor' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> louvor
                    </button>
                    <button
                      onClick={() => setModoAdicao(modoAdicao === 'divider' ? null : 'divider')}
                      className={`w-1/2 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        modoAdicao === 'divider' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Seção
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ações do Rodapé do Modal */}
            <div className="flex gap-3 pt-2 border-t border-slate-100 flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setListaSelecionada(null)}
                className="w-1/2 bg-white hover:bg-slate-100 text-slate-700 border-slate-200 rounded-xl text-xs h-10 font-semibold"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvarEdicao}
                disabled={loading}
                className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs h-10 font-semibold gap-2"
              >
                <Check className="w-4 h-4" /> {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>

          </div>
        </div>
      )}

      <PreviewModal 
        open={previewOpen} 
        onOpenChange={setPreviewOpen} 
        mode="image" 
        rows={rows} 
        dataCulto={dataCulto} 
        tipoCulto={tipoCulto}       
        responsavel={responsavel}  
      />
    </div>
  );
}