import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { ArrowLeft, Plus, Image, FileText, Cloud, Save, Printer, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListaRow from "@/components/lista/ListaRow";
import PreviewModal from "@/components/lista/PreviewModal";

import { supabase } from "@/lib/supabaseClient"; 

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const genId = () => Math.random().toString(36).slice(2, 9);

const emptyRow = (categoriaPadrao = "--") => ({ 
  id: genId(), 
  type: "louvor", 
  categoria: categoriaPadrao, 
  buscaLouvor: "", 
  observacao: "", 
  nome: "", 
  numero: "" 
});

export default function NovaLista() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const veioDoHistorico = location.state?.veioDoHistorico;

  useEffect(() => {
    const tema = localStorage.getItem("icmlyrics_tema");
    if (tema === "escuro") {
      document.documentElement.classList.add("dark");
    } else if (tema === "claro") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const [dataCulto, setDataCulto] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const d = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${d}`;
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const calendarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [tipoCulto, setTipoCulto] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [showTema, setShowTema] = useState(false);
  const [showResponsavel, setShowResponsavel] = useState(false);
  const [nomeIgreja, setNomeIgreja] = useState("");
  const [carregandoIgreja, setCarregandoIgreja] = useState(false);

  const [rows, setRows] = useState([
    emptyRow("--"),
    emptyRow("--"),
    emptyRow("--")
  ]);

  const [modal, setModal] = useState({ open: false, mode: "image" });
  const [modalImprimir, setModalImprimir] = useState({ open: false, etapa: "pergunta" });
  const [dadosPreview, setDadosPreview] = useState({
    rows: [],
    dataCulto: "",
    tipoCulto: "",
    responsavel: ""
  });

  const [louvoresDB, setLouvoresDB] = useState([]);
  const [listaSalvaId, setListaSalvaId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const usuarioNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const senhaNuvem = localStorage.getItem("icmlyrics_senha_nuvem") || "";
  const temNuvem = usuarioNuvem.trim() !== "";

  const carregarNomeIgreja = async () => {
    setCarregandoIgreja(true);
    const usuarioAtual = usuarioNuvem || usuarioLocal;

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
        setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioAtual);
      } finally {
        setCarregandoIgreja(false);
      }
    } else {
      setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioLocal || "Modo Local");
      setCarregandoIgreja(false);
    }
  };

  useEffect(() => {
    carregarNomeIgreja();
  }, [temNuvem, usuarioNuvem, usuarioLocal]);

  useEffect(() => {
    async function fetchLouvores() {
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
        
        setLouvoresDB(todosOsLouvores);
        
      } catch (error) {
        console.error(error.message);
      }
    }
    
    fetchLouvores();
  }, []);

  useEffect(() => {
    if (location.state?.listaParaReimprimir) {
      const listaantiga = location.state.listaParaReimprimir;
      if (listaantiga.rows) setRows(listaantiga.rows);
      if (listaantiga.dataCulto) setDataCulto(listaantiga.dataCulto);
      
      const tipoCarregado = listaantiga.tipo_culto || listaantiga.tipoCulto;
      const responsavelCarregado = listaantiga.responsavel;

      if (tipoCarregado) {
        setTipoCulto(tipoCarregado);
        setShowTema(true);
      }
      if (responsavelCarregado) {
        setResponsavel(responsavelCarregado);
        setShowResponsavel(true);
      }
      
      if (location.state?.dispararImpressao) {
        setDadosPreview({
          rows: listaantiga.rows || [],
          dataCulto: listaantiga.dataCulto || "",
          tipoCulto: tipoCarregado || "",
          responsavel: responsavelCarregado || ""
        });
        setModal({ open: true, mode: "image" });
      }
    }
  }, [location.state]);

  useEffect(() => {
    setListaSalvaId(null);
  }, [rows, dataCulto, tipoCulto, responsavel]);

  const diaSemana = dataCulto ? DIAS[new Date(dataCulto + "T00:00:00").getDay()] : "";

  const resetForm = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const d = String(hoje.getDate()).padStart(2, "0");
    setDataCulto(`${ano}-${mes}-${d}`);
    setTipoCulto("");
    setResponsavel("");
    setShowTema(false);
    setShowResponsavel(false);
    setRows([
      emptyRow("--"),
      emptyRow("--"),
      emptyRow("--")
    ]);
    setListaSalvaId(null);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...rows];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setRows(reordered);
  };

  const updateRow = (updated) => setRows((rs) => rs.map((r) => r.id === updated.id ? updated : r));
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  
  const addRow = () => setRows((rs) => [...rs, emptyRow("--")]);
  const addSection = () => setRows((rs) => [...rs, { id: genId(), type: "divider", text: "" }]);

  const salvarListaHibrida = async () => {
    if (listaSalvaId) return listaSalvaId;
    setSalvando(true);

    const linhasValidas = rows.filter(
      r => r.type === "divider" || r.buscaLouvor || r.nome || r.numero || r.id_louvor_db
    );

    if (temNuvem) {
      try {
        const { count, error: erroCount } = await supabase
          .from("listas")
          .select("*", { count: "exact", head: true })
          .eq("acesso_usuario", usuarioNuvem);

        if (!erroCount && count !== null && count >= 12) {
          alert("Limite de 12 listas atingido! Exclua uma lista anterior para criar uma nova.");
          setSalvando(false);
          return null;
        }

        const payloadLista = {
          data_culto: dataCulto,
          dia_semana: diaSemana,
          tipo_culto: tipoCulto || null,      
          responsavel: responsavel || null,    
          acesso_usuario: usuarioNuvem,
        };

        if (senhaNuvem.trim() !== "") {
          payloadLista.acesso_senha = senhaNuvem;
        }

        const { data: novaLista, error: erroLista } = await supabase
          .from("listas")
          .insert([payloadLista])
          .select()
          .single();

        if (erroLista) throw erroLista;

        const listaId = novaLista.id;

        const itensParaInserir = linhasValidas.map((row, index) => ({
          lista_id: listaId,
          ordem: index,
          tipo: row.type,
          louvor_id: row.type === "louvor" ? (row.id_louvor_db || null) : null,
          observacao: row.type === "louvor" ? (row.observacao || null) : null,
          texto_secao: row.type === "divider" ? (row.text || row.nome || null) : null
        }));

        if (itensParaInserir.length > 0) {
          const { error: erroItens } = await supabase
            .from("lista_itens")
            .insert(itensParaInserir);
          
          if (erroItens) throw erroItens;
        }

        setListaSalvaId(listaId);
        setSalvando(false);
        return listaId;
      } catch (error) {
        alert(`Atenção: Não foi possível salvar na nuvem (${error.message}). A lista será salva apenas neste dispositivo.`);
      }
    }

    try {
      const localListas = localStorage.getItem("icmlyrics_historico_listas");
      const historicoAtual = localListas ? JSON.parse(localListas) : [];

      if (historicoAtual.length >= 12) {
        alert("Limite de 12 listas atingido localmente! Exclua uma lista anterior para criar uma nova.");
        setSalvando(false);
        return null;
      }

      const novaListaLocal = {
        id: genId(),
        dataCulto,
        diaSemana,
        tipo_culto: tipoCulto,
        responsavel,
        rows: linhasValidas
      };

      const novoHistorico = [novaListaLocal, ...historicoAtual];
      
      localStorage.setItem("icmlyrics_historico_listas", JSON.stringify(novoHistorico));
      setListaSalvaId(novaListaLocal.id);
      return novaListaLocal.id;
    } catch (e) {
      return null;
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarClick = async () => {
    const idSalvo = await salvarListaHibrida();
    if (idSalvo) {
      setDadosPreview({
        rows: [...rows],
        dataCulto,
        tipoCulto,
        responsavel
      });
      setModalImprimir({ open: true, etapa: "pergunta" });
    }
  };

  const handleFinalizarSemImprimir = () => {
    setModalImprimir({ open: false, etapa: "pergunta" });
    resetForm();
  };

  const handleEscolherFormatoPreview = (mode) => {
    setModalImprimir({ open: false, etapa: "pergunta" });
    setModal({ open: true, mode });
    resetForm();
  };

  const [yStr, mStr, dStr] = dataCulto.split("-");
  const selYear = parseInt(yStr, 10);
  const selMonth = parseInt(mStr, 10) - 1;
  const selDay = parseInt(dStr, 10);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const formatDisplayDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8 transition-colors duration-200">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between border-b border-transparent dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(veioDoHistorico ? "/historico-listas" : "/dashboard")} 
            className="text-slate-300 hover:text-white transition-colors p-1"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Nova Lista</h1>
            <p className="text-slate-400 text-xs">Crie uma nova lista</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right max-w-[180px]">
          {temNuvem && (
            <span className="text-[11px] font-bold text-slate-300 uppercase truncate w-full">
              {nomeIgreja}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                carregarNomeIgreja();
              }}
              className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <Cloud className={`w-3 h-3 ${temNuvem ? "text-emerald-400" : "text-slate-400"} ${carregandoIgreja ? "animate-spin" : ""}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data do Culto</label>
            <div className="flex flex-row gap-3 mt-1">
              <div className="relative flex-1" ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => {
                    setViewDate(new Date(selYear, selMonth, 1));
                    setShowCalendar(!showCalendar);
                  }}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-left text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between shadow-sm"
                >
                  <span>{formatDisplayDate(dataCulto)}</span>
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                </button>

                {showCalendar && (
                  <div className="absolute top-12 left-0 z-50 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl space-y-3 select-none">
                    <div className="flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 capitalize">
                        {MESES[viewDate.getMonth()]} de {viewDate.getFullYear()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400">
                      <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-7" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const isSelected =
                          viewDate.getFullYear() === selYear &&
                          viewDate.getMonth() === selMonth &&
                          dayNum === selDay;

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => {
                              const y = viewDate.getFullYear();
                              const m = String(viewDate.getMonth() + 1).padStart(2, "0");
                              const d = String(dayNum).padStart(2, "0");
                              setDataCulto(`${y}-${m}-${d}`);
                              setShowCalendar(false);
                            }}
                            className={`h-7 w-7 rounded-lg text-xs font-medium flex items-center justify-center transition-colors mx-auto ${
                              isSelected
                                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold shadow"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex items-end pb-0.5">
                {diaSemana && (
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200 leading-none bg-slate-100 dark:bg-slate-800 px-2.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full text-center">
                    {diaSemana}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(showTema || showResponsavel) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {showTema && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Culto</label>
                  <Input 
                    type="text" 
                    placeholder="Ex: Ceia, Vigília, ESF..." 
                    value={tipoCulto} 
                    onChange={(e) => setTipoCulto(e.target.value)} 
                    className="h-9 mt-1 text-sm bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500" 
                  />
                </div>
              )}
              {showResponsavel && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Louvor</label>
                  <Input 
                    type="text" 
                    placeholder="Responsável louvor" 
                    value={responsavel} 
                    onChange={(e) => setResponsavel(e.target.value)} 
                    className="h-9 mt-1 text-sm bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500" 
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="lista">
            {(provided) =>
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {rows.map((row, i) =>
                  <ListaRow key={row.id} row={row} index={i} onChange={updateRow} onRemove={() => removeRow(row.id)} louvores={louvoresDB} />
                )}
                {provided.placeholder}
              </div>
            }
          </Droppable>
        </DragDropContext>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addRow} 
            className="h-8 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> louvor
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addSection} 
            className="h-8 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Seção
          </Button>
          <Button 
            variant={showTema ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowTema(!showTema)} 
            className={`h-8 text-xs ${
              showTema 
                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                : "bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
            }`}
          >
            Tema
          </Button>
          <Button 
            variant={showResponsavel ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowResponsavel(!showResponsavel)} 
            className={`h-8 text-xs ${
              showResponsavel 
                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                : "bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
            }`}
          >
            Louvor
          </Button>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button 
            onClick={handleSalvarClick} 
            className="w-full h-10 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold rounded-xl flex items-center justify-center border border-transparent dark:border-slate-700" 
            disabled={salvando}
          >
            <Save className="w-4 h-4 mr-2" /> {salvando ? "A salvar..." : "Salvar Lista"}
          </Button>
        </div>
      </div>

      {modalImprimir.open && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-xl space-y-4 text-center">
            {modalImprimir.etapa === "pergunta" ? (
              <>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Lista Salva com Sucesso!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Deseja imprimir ou gerar imagem da lista agora?</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleFinalizarSemImprimir}
                    className="flex-1 h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Não
                  </Button>
                  <Button
                    onClick={() => setModalImprimir({ open: true, etapa: "opcoes" })}
                    className="flex-1 h-10 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white"
                  >
                    Sim
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Escolha o Formato</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Como deseja gerar a imagem da sua lista?</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => handleEscolherFormatoPreview("image")}
                    className="w-full h-10 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center justify-center gap-2"
                  >
                    <Image className="w-4 h-4" /> Gerar Imagem
                  </Button>
                  <Button
                    onClick={() => handleEscolherFormatoPreview("image-text")}
                    className="w-full h-10 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Imagem e Texto
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleFinalizarSemImprimir}
                    className="w-full h-8 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 mt-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <PreviewModal 
        open={modal.open} 
        onOpenChange={(o) => setModal({ ...modal, open: o })} 
        mode={modal.mode} 
        rows={dadosPreview.rows} 
        dataCulto={dadosPreview.dataCulto}
        tipoCulto={dadosPreview.tipoCulto}
        responsavel={dadosPreview.responsavel}
      />
    </div>
  );
}