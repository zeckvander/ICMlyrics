import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Trash2, Play, Calendar, Music, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import DrawerMenu from "@/components/louvores/DrawerMenu";
// Importa o seu componente de Modal original
import PreviewModal from "@/components/lista/PreviewModal"; 

export default function HistoricoListas() {
  const navigate = useNavigate();
  const [listas, setListas] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Estados para controlar o popup idêntico ao da Nova Lista
  const [modalOpen, setModalOpen] = useState(false);
  const [dadosModal, setDadosModal] = useState({ rows: [], dataCulto: "" });

  useEffect(() => {
    try {
      const localListas = localStorage.getItem("icmlyrics_historico_listas");
      if (localListas) {
        setListas(JSON.parse(localListas));
      }
    } catch (e) {
      console.error("Erro ao carregar histórico", e);
    }
  }, []);

  const handleDeletarLista = (id) => {
    if (window.confirm("Deseja realmente excluir esta lista do histórico?")) {
      const atualizadas = listas.filter((l) => l.id !== id);
      setListas(atualizadas);
      localStorage.setItem("icmlyrics_historico_listas", JSON.stringify(atualizadas));
    }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  // Função que ativa o Popup idêntico ao da Nova Lista
  const handleAbrirReimpressao = (lista) => {
    setDadosModal({
      rows: lista.rows || [],
      dataCulto: lista.dataCulto || ""
    });
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Topbar */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setDrawerOpen(true)} 
            className="text-slate-300 hover:text-white transition-colors p-1 mr-1"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-xl font-bold tracking-tight">Histórico de Listas</h1>
            <p className="text-slate-400 text-xs">Consulte ou toque listas passadas</p>
          </div>
        </div>
      </div>

      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Listagem do Histórico */}
      <div className="p-4 space-y-4 -mt-3">
        {listas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma lista salva ainda.</p>
            <button onClick={() => navigate("/nova-lista")} className="mt-4 bg-indigo-600 text-white px-4 py-2 text-sm rounded-xl font-medium">
              Criar Nova Lista
            </button>
          </div>
        ) : (
          listas.map((lista) => (
            <div key={lista.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">
                    {formatarData(lista.dataCulto)}
                  </span>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {lista.diaSemana}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeletarLista(lista.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 pl-1">
                {lista.rows.map((row, index) => (
                  <div key={row.id || index} className="text-sm text-slate-600 flex items-center gap-2">
                    {row.type === "divider" ? (
                      <span className="text-xs font-bold tracking-wide text-indigo-500 uppercase mt-1">
                        ✦ {row.text || "Seção"}
                      </span>
                    ) : (
                      <>
                        <Music className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-500 w-9">
                          {row.numero && !String(row.numero).startsWith("local_") ? row.numero : "—"}
                        </span>
                        <span className="truncate text-slate-700">{row.nome}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 pt-1 w-full">
                <Button 
                  onClick={() => navigate("/modo-playlist", { state: { lista: lista } })}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs font-semibold"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Playlist
                </Button>

                {/* Abre o mesmo popup da Nova Lista */}
                <Button 
                  onClick={() => handleAbrirReimpressao(lista)}
                  variant="outline"
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 gap-2 h-9 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" /> Reimprimir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* O POPUP OFICIAL REUTILIZADO DO SEU COMPONENTE */}
      <PreviewModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        mode="image" // Define o modo padrão de imagem do seu modal
        rows={dadosModal.rows} 
        dataCulto={dadosModal.dataCulto} 
      />
    </div>
  );
}