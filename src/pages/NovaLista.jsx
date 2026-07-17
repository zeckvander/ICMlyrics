import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { ArrowLeft, Menu, Plus, Image, FileText, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListaRow from "@/components/lista/ListaRow";
import PreviewModal from "@/components/lista/PreviewModal";
import DrawerMenu from "@/components/louvores/DrawerMenu";

import { supabase } from "@/lib/supabaseClient"; 

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const genId = () => Math.random().toString(36).slice(2, 9);

const emptyRow = () => ({ id: genId(), type: "louvor", categoria: "Avulsos", buscaLouvor: "", observacao: "", nome: "", numero: "" });

export default function NovaLista() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [dataCulto, setDataCulto] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const d = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${d}`;
  });

  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, mode: "image" });
  const [louvoresDB, setLouvoresDB] = useState([]);
  const [listaSalvaId, setListaSalvaId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Credenciais obtidas silenciosamente do localStorage
  const usuarioNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const senhaNuvem = localStorage.getItem("icmlyrics_senha_nuvem") || "";
  const temNuvem = usuarioNuvem.trim() !== "" && senhaNuvem.trim() !== "";

  useEffect(() => {
    async function fetchLouvores() {
      try {
        const { data, error } = await supabase
          .from("louvores") 
          .select("id, numero, nome, categoria"); 

        if (error) throw error;
        if (data) setLouvoresDB(data);
      } catch (error) {
        console.error("Erro ao buscar louvores:", error.message);
      }
    }
    fetchLouvores();
  }, []);

  useEffect(() => {
    if (location.state?.listaParaReimprimir) {
      const listaantiga = location.state.listaParaReimprimir;
      if (listaantiga.rows) setRows(listaantiga.rows);
      if (listaantiga.dataCulto) setDataCulto(listaantiga.dataCulto);
      
      if (location.state?.dispararImpressao) {
        setModal({ open: true, mode: "image" });
      }
    }
  }, [location.state]);

  useEffect(() => {
    setListaSalvaId(null);
  }, [rows, dataCulto]);

  const diaSemana = dataCulto ? DIAS[new Date(dataCulto + "T00:00:00").getDay()] : "";

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...rows];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setRows(reordered);
  };

  const updateRow = (updated) => setRows((rs) => rs.map((r) => r.id === updated.id ? updated : r));
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const addSection = () => setRows((rs) => [...rs, { id: genId(), type: "divider", text: "" }]);

  const salvarListaHibrida = async () => {
    if (listaSalvaId) return listaSalvaId;
    setSalvando(true);

    const linhasValidas = rows.filter(
      r => r.type === "divider" || r.buscaLouvor || r.nome || r.numero || r.id_louvor_db
    );

    if (temNuvem) {
      try {
        const { data: novaLista, error: erroLista } = await supabase
          .from("listas")
          .insert([
            {
              data_culto: dataCulto,
              dia_semana: diaSemana,
              acesso_usuario: usuarioNuvem,
              acesso_senha: senhaNuvem
            }
          ])
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
        return listaId;
      } catch (error) {
        console.error("Erro ao salvar na nuvem:", error.message);
      }
    }

    // Backup Local se não houver nuvem
    try {
      const novaListaLocal = {
        id: genId(),
        dataCulto,
        diaSemana,
        rows: linhasValidas
      };

      const localListas = localStorage.getItem("icmlyrics_historico_listas");
      const historicoAtual = localListas ? JSON.parse(localListas) : [];
      const novoHistorico = [novaListaLocal, ...historicoAtual];
      
      localStorage.setItem("icmlyrics_historico_listas", JSON.stringify(novoHistorico));
      setListaSalvaId(novaListaLocal.id);
      return novaListaLocal.id;
    } catch (e) {
      console.error("Erro ao salvar localmente", e);
    } finally {
      setSalvando(false);
    }
  };

  const handleGerarPreview = async (mode) => {
    await salvarListaHibrida();
    setModal({ open: true, mode });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Topbar com ícone de Nuvem Discreto no Canto Direito */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button onClick={() => setDrawerOpen(true)} className="text-slate-300 hover:text-white transition-colors p-1 mr-1">
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Nova Lista</h1>
            <p className="text-slate-400 text-xs">Crie uma lista para o culto</p>
          </div>
        </div>

        {/* Ícone Indicador Discreto */}
        <div className="p-2">
          {temNuvem ? (
            <Cloud className="w-5 h-5 text-emerald-400 drop-shadow" title="Sincronizado na Nuvem" />
          ) : (
            <CloudOff className="w-5 h-5 text-slate-500" title="Salvar apenas localmente" />
          )}
        </div>
      </div>

      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="px-4 mt-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data do Culto</label>
          <div className="flex flex-row gap-3 mt-1">
            <Input type="date" value={dataCulto} onChange={(e) => setDataCulto(e.target.value)} className="h-10 flex-1" />
            <div className="flex-1 flex items-end pb-0.5">
              {diaSemana && (
                <span className="text-base font-bold text-slate-800 leading-none bg-slate-100 px-2.5 py-2.5 rounded-lg border border-slate-200 w-full text-center">
                  {diaSemana}
                </span>
              )}
            </div>
          </div>
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
          <Button variant="outline" size="sm" onClick={addRow}><Plus className="w-4 h-4" /> Adicionar louvor</Button>
          <Button variant="outline" size="sm" onClick={addSection}><Plus className="w-4 h-4" /> Adicionar Seção</Button>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button onClick={() => handleGerarPreview("image")} className="flex-1" disabled={salvando}>
              <Image className="w-4 h-4" /> {salvando ? "A processar..." : "Gerar Imagem"}
            </Button>
            <Button onClick={() => handleGerarPreview("image-text")} variant="secondary" className="flex-1" disabled={salvando}>
              <FileText className="w-4 h-4" /> {salvando ? "A processar..." : "Imagem e Texto"}
            </Button>
          </div>
        </div>
      </div>

      <PreviewModal open={modal.open} onOpenChange={(o) => setModal({ ...modal, open: o })} mode={modal.mode} rows={rows} dataCulto={dataCulto} />
    </div>
  );
}