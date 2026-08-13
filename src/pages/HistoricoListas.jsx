import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Trash2, Calendar, Music, Printer, Cloud, Edit3, Plus, X, Check, Play, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PreviewModal from "@/components/lista/PreviewModal";
import { supabase } from "@/lib/supabaseClient";

const normalizarTexto = (texto) =>
  String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"¡!¿]/g, "") 
    .trim();

const buscarELimitarLouvores = (listaLouvores, queryText, limite = 5) => {
  const termoBruto = (queryText || "").trim();
  if (!termoBruto) return [];

  const termoNormalizado = normalizarTexto(queryText);
  const buscaNum = termoBruto.toLowerCase();

  return listaLouvores
    .filter((l) => {
      const numStr = l.numero !== null && l.numero !== undefined ? String(l.numero).trim().toLowerCase() : "";
      const matchNumero = numStr ? numStr.startsWith(buscaNum) : false;
      const matchNome = normalizarTexto(l.nome).includes(termoNormalizado);
      return matchNumero || matchNome;
    })
    .slice(0, limite);
};

export default function HistoricoListas() {
  const navigate = useNavigate();
  const location = useLocation();

  const [listas, setListas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [louvores, setLouvores] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState("image");
  const [listaParaPreview, setListaParaPreview] = useState(null);

  const [listaSelecionada, setListaSelecionada] = useState(null);
  const [buscaEdicao, setBuscaEdicao] = useState("");
  const [sugestoesEdicao, setSugestoesEdicao] = useState([]);
  const [observacaoEdicao, setObservacaoEdicao] = useState("");
  const [modoAdicao, setModoAdicao] = useState("louvor");
  const [textoSecao, setTextoSecao] = useState("");

  const usuarioNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const temNuvem = usuarioNuvem.trim() !== "";

  const carregarLouvores = async () => {
    try {
      let todosOsLouvores = [];
      let buscarMais = true;
      let inicio = 0;
      const limitePorPagina = 1000;

      while (buscarMais) {
        const { data, error } = await supabase
          .from("louvores")
          .select("id, numero, nome, categoria")
          .order("id", { ascending: true })
          .range(inicio, inicio + limitePorPagina - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          todosOsLouvores = [...todosOsLouvores, ...data];
          inicio += limitePorPagina;

          if (data.length < limitePorPagina) {
            buscarMais = false;
          }
        } else {
          buscarMais = false;
        }
      }
      setLouvores(todosOsLouvores);
    } catch (error) {
      console.error(error.message);
    }
  };

  const carregarListas = async () => {
    setLoading(true);
    if (temNuvem) {
      try {
        const { data, error } = await supabase
          .from("listas")
          .select(`
            *,
            lista_itens (
              id,
              ordem,
              tipo,
              observacao,
              texto_secao,
              louvor_id,
              louvores ( id, numero, nome, categoria )
            )
          `)
          .eq("acesso_usuario", usuarioNuvem)
          .order("created_at", { ascending: false });

        if (!error && data) {
          const listasFormatadas = data.map((l) => {
            const itensOrdenados = (l.lista_itens || []).sort((a, b) => a.ordem - b.ordem);
            const rows = itensOrdenados.map((item) => {
              if (item.tipo === "divider") {
                return {
                  id: item.id || Math.random().toString(36).slice(2, 9),
                  type: "divider",
                  text: item.texto_secao || ""
                };
              } else {
                return {
                  id: item.id || Math.random().toString(36).slice(2, 9),
                  type: "louvor",
                  id_louvor_db: item.louvor_id,
                  numero: item.louvores?.numero || "",
                  nome: item.louvores?.nome || "",
                  categoria: item.louvores?.categoria || "--",
                  observacao: item.observacao || ""
                };
              }
            });

            return {
              id: l.id,
              dataCulto: l.data_culto,
              diaSemana: l.dia_semana,
              tipo_culto: l.tipo_culto,
              responsavel: l.responsavel,
              rows: rows,
              origem: "nuvem"
            };
          });
          setListas(listasFormatadas);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const local = localStorage.getItem("icmlyrics_historico_listas");
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setListas(parsed.map((item) => ({ ...item, origem: "local" })));
        } catch (e) {
          setListas([]);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarListas();
    carregarLouvores();
  }, [temNuvem, usuarioNuvem]);

  useEffect(() => {
    if (buscaEdicao.trim() && modoAdicao === "louvor") {
      setSugestoesEdicao(buscarELimitarLouvores(louvores, buscaEdicao, 5));
    } else {
      setSugestoesEdicao([]);
    }
  }, [buscaEdicao, louvores, modoAdicao]);

  const excluirLista = async (id, origem) => {
    if (!window.confirm("Deseja realmente excluir esta lista?")) return;

    if (origem === "nuvem") {
      try {
        await supabase.from("lista_itens").delete().eq("lista_id", id);
        const { error } = await supabase.from("listas").delete().eq("id", id);
        if (error) throw error;
        setListas((prev) => prev.filter((l) => l.id !== id));
      } catch (e) {
        alert("Erro ao excluir lista da nuvem.");
      }
    } else {
      const novaLista = listas.filter((l) => l.id !== id);
      setListas(novaLista);
      localStorage.setItem("icmlyrics_historico_listas", JSON.stringify(novaLista));
    }
  };

  const abrirPreview = (lista, mode) => {
    setListaParaPreview(lista);
    setPreviewMode(mode);
    setPreviewOpen(true);
  };

  const abrirEdicao = (lista) => {
    setListaSelecionada(JSON.parse(JSON.stringify(lista)));
    setBuscaEdicao("");
    setObservacaoEdicao("");
    setTextoSecao("");
    setModoAdicao("louvor");
  };

  const adicionarItemNaEdicao = (louvorObj = null) => {
    if (!listaSelecionada) return;

    if (modoAdicao === "louvor") {
      if (!louvorObj) return;
      const novoItem = {
        id: Math.random().toString(36).slice(2, 9),
        type: "louvor",
        id_louvor_db: louvorObj.id,
        numero: louvorObj.numero,
        nome: louvorObj.nome,
        categoria: louvorObj.categoria || "--",
        observacao: observacaoEdicao.trim()
      };
      setListaSelecionada((prev) => ({
        ...prev,
        rows: [...prev.rows, novoItem]
      }));
      setBuscaEdicao("");
      setObservacaoEdicao("");
      setSugestoesEdicao([]);
    } else {
      if (!textoSecao.trim()) return;
      const novaSecao = {
        id: Math.random().toString(36).slice(2, 9),
        type: "divider",
        text: textoSecao.trim()
      };
      setListaSelecionada((prev) => ({
        ...prev,
        rows: [...prev.rows, novaSecao]
      }));
      setTextoSecao("");
    }
  };

  const removerItemEdicao = (idItem) => {
    setListaSelecionada((prev) => ({
      ...prev,
      rows: prev.rows.filter((r) => r.id !== idItem)
    }));
  };

  const moverItemEdicao = (index, direcao) => {
    if (!listaSelecionada) return;
    const novosRows = [...listaSelecionada.rows];
    const targetIndex = index + direcao;

    if (targetIndex < 0 || targetIndex >= novosRows.length) return;

    const temp = novosRows[index];
    novosRows[index] = novosRows[targetIndex];
    novosRows[targetIndex] = temp;

    setListaSelecionada((prev) => ({
      ...prev,
      rows: novosRows
    }));
  };

  const handleSalvarEdicao = async () => {
    if (!listaSelecionada) return;
    setLoading(true);

    if (listaSelecionada.origem === "nuvem") {
      try {
        await supabase
          .from("listas")
          .update({
            data_culto: listaSelecionada.dataCulto,
            dia_semana: listaSelecionada.diaSemana,
            tipo_culto: listaSelecionada.tipo_culto || null,
            responsavel: listaSelecionada.responsavel || null
          })
          .eq("id", listaSelecionada.id);

        await supabase.from("lista_itens").delete().eq("lista_id", listaSelecionada.id);

        const itensParaInserir = listaSelecionada.rows.map((row, index) => ({
          lista_id: listaSelecionada.id,
          ordem: index,
          tipo: row.type,
          louvor_id: row.type === "louvor" ? (row.id_louvor_db || null) : null,
          observacao: row.type === "louvor" ? (row.observacao || null) : null,
          texto_secao: row.type === "divider" ? (row.text || null) : null
        }));

        if (itensParaInserir.length > 0) {
          await supabase.from("lista_itens").insert(itensParaInserir);
        }

        await carregarListas();
        setListaSelecionada(null);
      } catch (e) {
        alert("Erro ao salvar alterações da lista na nuvem.");
      }
    } else {
      const historicoAtual = listas.map((l) => (l.id === listaSelecionada.id ? listaSelecionada : l));
      setListas(historicoAtual);
      localStorage.setItem("icmlyrics_historico_listas", JSON.stringify(historicoAtual));
      setListaSelecionada(null);
    }
    setLoading(false);
  };

  const handleReimprimir = (lista, e) => {
    if (e) e.stopPropagation();
    navigate("/nova-lista", {
      state: {
        listaParaReimprimir: lista,
        dispararImpressao: true
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Histórico de Listas</h1>
            <p className="text-slate-400 text-xs">Suas últimas listas salvas (Máx. 12)</p>
          </div>
        </div>

        {temNuvem && (
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-slate-300">Nuvem</span>
          </div>
        )}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">
            Carregando histórico...
          </div>
        ) : listas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-slate-600 font-medium text-sm">Nenhuma lista encontrada.</p>
            <Button onClick={() => navigate("/nova-lista")} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
              Criar Nova Lista
            </Button>
          </div>
        ) : (
          listas.map((lista) => {
            const dataFmt = lista.dataCulto
              ? new Date(lista.dataCulto + "T00:00:00").toLocaleDateString("pt-BR")
              : "";

            return (
              <div key={lista.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3 hover:border-slate-200 transition-all">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                        {lista.diaSemana || "Culto"}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{dataFmt}</span>
                    </div>

                    {(lista.tipo_culto || lista.responsavel) && (
                      <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-slate-600">
                        {lista.tipo_culto && (
                          <span className="font-semibold text-slate-800">Culto: {lista.tipo_culto}</span>
                        )}
                        {lista.responsavel && (
                          <span className="text-slate-500">| Louvor: {lista.responsavel}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEdicao(lista)}
                      title="Editar Lista"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => excluirLista(lista.id, lista.origem)}
                      title="Excluir Lista"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {lista.rows && lista.rows.map((row) => (
                    <div key={row.id} className="text-xs flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50/70">
                      {row.type === "divider" ? (
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          --- {row.text} ---
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-slate-700 min-w-[30px]">
                              {row.numero ? `${row.numero}.` : "-"}
                            </span>
                            <span className="text-slate-800 font-medium truncate">{row.nome}</span>
                          </div>
                          {row.observacao && (
                            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                              {row.observacao}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-100">
                  <Button
                    onClick={() => abrirPreview(lista, "image")}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  >
                    Imagem
                  </Button>
                  <Button
                    onClick={() => abrirPreview(lista, "image-text")}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  >
                    Imagem + Texto
                  </Button>
                  <Button
                    onClick={(e) => handleReimprimir(lista, e)}
                    size="sm"
                    className="h-8 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Reenviar
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        mode={previewMode}
        rows={listaParaPreview?.rows || []}
        dataCulto={listaParaPreview?.dataCulto || ""}
        tipoCulto={listaParaPreview?.tipo_culto || ""}
        responsavel={listaParaPreview?.responsavel || ""}
      />

      {listaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl overflow-hidden p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">Editar Lista</h2>
                <p className="text-xs text-slate-400">Altere louvores, seções ou observações</p>
              </div>
              <button
                onClick={() => setListaSelecionada(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Data</label>
                  <input
                    type="date"
                    value={listaSelecionada.dataCulto || ""}
                    onChange={(e) =>
                      setListaSelecionada((prev) => ({ ...prev, dataCulto: e.target.value }))
                    }
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-1.5 mt-0.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Culto</label>
                  <input
                    type="text"
                    placeholder="Ex: Ceia"
                    value={listaSelecionada.tipo_culto || ""}
                    onChange={(e) =>
                      setListaSelecionada((prev) => ({ ...prev, tipo_culto: e.target.value }))
                    }
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-1.5 mt-0.5 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  Itens da Lista ({listaSelecionada.rows.length})
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {listaSelecionada.rows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moverItemEdicao(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moverItemEdicao(idx, 1)}
                          disabled={idx === listaSelecionada.rows.length - 1}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 px-2 truncate">
                        {row.type === "divider" ? (
                          <span className="font-bold text-slate-500 uppercase text-[10px]">
                            [Seção] {row.text}
                          </span>
                        ) : (
                          <div className="truncate">
                            <span className="font-bold text-slate-800 mr-1.5">
                              {row.numero ? `${row.numero}.` : ""}
                            </span>
                            <span className="text-slate-700">{row.nome}</span>
                            {row.observacao && (
                              <span className="ml-2 text-[10px] text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-medium">
                                {row.observacao}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removerItemEdicao(row.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Adicionar Novo Item</span>

                {modoAdicao === "louvor" ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar louvor por nº ou nome..."
                        value={buscaEdicao}
                        onChange={(e) => setBuscaEdicao(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                      />
                      {sugestoesEdicao.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-36 overflow-y-auto">
                          {sugestoesEdicao.map((sug) => (
                            <div
                              key={sug.id}
                              onClick={() => adicionarItemNaEdicao(sug)}
                              className="p-2 text-xs hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between"
                            >
                              <span className="font-bold text-slate-800">
                                {sug.numero} - {sug.nome}
                              </span>
                              <span className="text-[10px] text-slate-400">{sug.categoria}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Observação (Ex: Coral, Tonalidade G...)"
                      value={observacaoEdicao}
                      onChange={(e) => setObservacaoEdicao(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da Seção (Ex: LOUVORES ESPECIAIS)"
                      value={textoSecao}
                      onChange={(e) => setTextoSecao(e.target.value)}
                      className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => adicionarItemNaEdicao()}
                      className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Adicionar
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setModoAdicao("louvor")}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                      modoAdicao === "louvor"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Louvor
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoAdicao("divider")}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                      modoAdicao === "divider"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Seção
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100 shrink-0">
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
    </div>
  );
}