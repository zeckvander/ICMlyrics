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

  const [tipoCulto, setTipoCulto] = useState("");
  const [responsavel, setResponsavel] = useState("");

  // Estados para controlar a visibilidade dos campos opcionais
  const [showTema, setShowTema] = useState(false);
  const [showResponsavel, setShowResponsavel] = useState(false);

  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, mode: "image" });
  const [louvoresDB, setLouvoresDB] = useState([]);
  const [listaSalvaId, setListaSalvaId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const usuarioNuvem = localStorage.getItem("icmlyrics_user_nuvem") || localStorage.getItem("icmlyrics_user") || "";
  const senhaNuvem = localStorage.getItem("icmlyrics_senha_nuvem") || "";
  const temNuvem = usuarioNuvem.trim() !== "";

  useEffect(() => {
    async function fetchLouvores() {
      try {
        const { data, error } = await supabase
          .from("louvores") 
          .select("id, numero, nome, categoria"); 

        if (error) throw error;
        if (data) setLouvoresDB(data);
      } catch (error) {
        console.error("Erro ao buscar louvores do Supabase:", error.message);
      }
    }
    fetchLouvores();
  }, []);

  useEffect(() => {
    if (location.state?.listaParaReimprimir) {
      const listaantiga = location.state.listaParaReimprimir;
      if (listaantiga.rows) setRows(listaantiga.rows);
      if (listaantiga.dataCulto) setDataCulto(listaantiga.dataCulto);
      
      if (listaantiga.tipoCulto) {
        setTipoCulto(listaantiga.tipoCulto);
        setShowTema(true);
      }
      if (listaantiga.responsavel) {
        setResponsavel(listaantiga.responsavel);
        setShowResponsavel(true);
      }
      
      if (location.state?.dispararImpressao) {
        setModal({ open: true, mode: "image" });
      }
    }
  }, [location.state]);

  useEffect(() => {
    setListaSalvaId(null);
  }, [rows, dataCulto, tipoCulto, responsavel]);

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
        const payloadLista = {
          data_culto: dataCulto,
          dia_semana: diaSemana,
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
        console.error("Erro ao salvar na nuvem:", error);
        alert(`Atenção: Não foi possível salvar na nuvem (${error.message}). A lista será salva apenas neste dispositivo.`);
      }
    }

    try {
      const novaListaLocal = {
        id: genId(),
        dataCulto,
        diaSemana,
        tipoCulto,
        responsavel,
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

        <div className="p-2">
          {temNuvem ? (
            <Cloud className="w-5 h-5 text-emerald-400 drop-shadow" title={`Sincronizado na Nuvem (${usuarioNuvem})`} />
          ) : (
            <CloudOff className="w-5 h-5 text-slate-500" title="Sem usuário em cache: salvando apenas localmente" />
          )}
        </div>
      </div>

      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="px-4 mt-4 space-y-4">
        {/* Bloco de Data e Campos Condicionais */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div>
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

          {/* Campos condicionais (só aparecem se ativados) */}
          {(showTema || showResponsavel) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              {showTema && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo / Tema do Culto</label>
                  <Input 
                    type="text" 
                    placeholder="Ex: Santa Ceia, Vigília..." 
                    value={tipoCulto} 
                    onChange={(e) => setTipoCulto(e.target.value)} 
                    className="h-9 mt-1 text-sm" 
                  />
                </div>
              )}
              {showResponsavel && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Responsável</label>
                  <Input 
                    type="text" 
                    placeholder="Nome do responsável" 
                    value={responsavel} 
                    onChange={(e) => setResponsavel(e.target.value)} 
                    className="h-9 mt-1 text-sm" 
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

        {/* 4 Botões compactos na parte inferior */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={addRow} className="h-8 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> louvor
          </Button>
          <Button variant="outline" size="sm" onClick={addSection} className="h-8 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Seção
          </Button>
          <Button 
            variant={showTema ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowTema(!showTema)} 
            className="h-8 text-xs"
          >
            Tema
          </Button>
          <Button 
            variant={showResponsavel ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowResponsavel(!showResponsavel)} 
            className="h-8 text-xs"
          >
            Responsável
          </Button>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button onClick={() => handleGerarPreview("image")} className="flex-1" disabled={salvando}>
              <Image className="w-4 h-4 mr-2" /> {salvando ? "A salvar..." : "Gerar Imagem"}
            </Button>
            <Button onClick={() => handleGerarPreview("image-text")} variant="secondary" className="flex-1" disabled={salvando}>
              <FileText className="w-4 h-4 mr-2" /> {salvando ? "A salvar..." : "Imagem e Texto"}
            </Button>
          </div>
        </div>
      </div>

      <PreviewModal 
        open={modal.open} 
        onOpenChange={(o) => setModal({ ...modal, open: o })} 
        mode={modal.mode} 
        rows={rows} 
        dataCulto={dataCulto}
        tipoCulto={tipoCulto}
        responsavel={responsavel}
      />
    </div>
  );
}