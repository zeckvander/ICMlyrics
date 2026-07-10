import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { ArrowLeft, Menu, Plus, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListaRow from "@/components/lista/ListaRow";
import PreviewModal from "@/components/lista/PreviewModal";
import DrawerMenu from "@/components/louvores/DrawerMenu";

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
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  });

  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, mode: "image" });
  const [louvoresDB, setLouvoresDB] = useState([]);
  const [listaSalvaId, setListaSalvaId] = useState(null);

  // Carrega o banco de dados de louvores cadastrados
  useEffect(() => {
    try {
      const localLouvores = localStorage.getItem("icm_louvores");
      if (localLouvores) {
        setLouvoresDB(JSON.parse(localLouvores));
      } else {
        setLouvoresDB([]);
      }
    } catch (e) {
      setLouvoresDB([]);
    }
  }, []);

  // Monitora se há dados recebidos pelo botão "Reimprimir" do histórico
  useEffect(() => {
    if (location.state?.listaParaReimprimir) {
      const listaantiga = location.state.listaParaReimprimir;
      if (listaantiga.rows) setRows(listaantiga.rows);
      if (listaantiga.dataCulto) setDataCulto(listaantiga.dataCulto);
      
      // Se a instrução pedir impressão imediata, abre o modal direto
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

  const salvarNoStorage = () => {
    if (listaSalvaId) return listaSalvaId;

    try {
      const historicoAtual = localStorage.getItem("icmlyrics_historico_listas");
      const listas = historicoAtual ? JSON.parse(historicoAtual) : [];
      
      const novoId = genId();
      const novaLista = {
        id: novoId,
        dataCulto,
        diaSemana,
        rows: rows.filter(r => r.type === "divider" || r.buscaLouvor || r.nome || r.numero),
        createdAt: new Date().toISOString()
      };

      listas.unshift(novaLista);
      localStorage.setItem("icmlyrics_historico_listas", JSON.stringify(listas));
      
      setListaSalvaId(novoId);
      return novoId;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleGerarPreview = (mode) => {
    salvarNoStorage();
    setModal({ open: true, mode });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="text-slate-300 hover:text-white transition-colors"
            title="Voltar para o Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setDrawerOpen(true)} 
            className="text-slate-300 hover:text-white transition-colors p-1 mr-1"
            title="Menu Lateral"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-xl font-bold tracking-tight">Nova Lista</h1>
            <p className="text-slate-400 text-xs">Crie uma lista para o culto</p>
          </div>
        </div>
      </div>

      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="px-4 -mt-3 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data do Culto</label>
          <div className="flex flex-row gap-3 mt-1">
            <Input 
              type="date" 
              value={dataCulto} 
              onChange={(e) => setDataCulto(e.target.value)} 
              className="h-10 flex-1" 
            />
            <div className="flex-1 flex items-end pb-0.5">
              {diaSemana && (
                <span className="text-base font-bold text-slate-800 leading-none bg-slate-100 px-2.5 py-2.5 rounded-lg border border-slate-200 w-full text-center electoral-badge">
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
            <Button onClick={() => handleGerarPreview("image")} className="flex-1"><Image className="w-4 h-4" /> Gerar Imagem</Button>
            <Button onClick={() => handleGerarPreview("image-text")} variant="secondary" className="flex-1"><FileText className="w-4 h-4" /> Gerar Imagem e Texto</Button>
          </div>
        </div>
      </div>

      <PreviewModal open={modal.open} onOpenChange={(o) => setModal({ ...modal, open: o })} mode={modal.mode} rows={rows} dataCulto={dataCulto} />
    </div>
  );
}