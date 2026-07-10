import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ListMusic, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ModoPlaylist() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [playlist, setPlaylist] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Recupera a lista enviada pelo Histórico através do estado da rota
    if (location.state?.lista?.rows) {
      // Agora pegamos TUDO (louvores e dividers de seção) para manter a ordem real do culto
      setPlaylist(location.state.lista.rows);
    }
  }, [location.state]);

  const handleRetroceder = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleAvancar = () => {
    if (activeIndex < playlist.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  if (playlist.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
        <p className="text-center text-slate-400 mb-4">Nenhum item encontrado nesta playlist.</p>
        <Button variant="secondary" onClick={() => navigate("/historico-listas")}>
          Voltar para o Histórico
        </Button>
      </div>
    );
  }

  const itemAtual = playlist[activeIndex];
  const isDivider = itemAtual.type === "divider";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Topbar Fixa */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/historico-listas")} 
            className="text-slate-400 hover:text-white transition-colors p-1"
            title="Voltar para o Histórico"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Modo Tocar (Playlist)</h1>
            <p className="text-[10px] text-slate-500">Culto de {location.state?.lista?.diaSemana || ""}</p>
          </div>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-2 rounded-lg transition-colors ${sidebarOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Alternar Lista Lateral"
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Painel Central */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          
          {isDivider ? (
            /* VISUAL QUANDO FOR SEÇÃO (Ex: Palavra, Oração) */
            <div className="space-y-4 animate-fade-in bg-slate-900/40 p-12 rounded-3xl border border-slate-800/60 max-w-xl w-full">
              <div className="w-16 h-16 bg-indigo-950 text-indigo-400 border border-indigo-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  Momento do Culto
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight pt-2 uppercase">
                  {itemAtual.text || "Seção"}
                </h1>
              </div>
            </div>
          ) : (
            /* VISUAL QUANDO FOR LOUVOR */
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-3 py-1 rounded-full">
                {itemAtual.categoria || "Louvor"}
              </span>
              
              {itemAtual.numero && !String(itemAtual.numero).startsWith("local_") && (
                <h2 className="text-4xl md:text-5xl font-black text-slate-400 tracking-tight pt-2">
                  Nº {itemAtual.numero}
                </h2>
              )}
              
              <h1 className="text-2xl md:text-4xl font-extrabold text-white max-w-2xl px-4 leading-tight">
                {itemAtual.nome || itemAtual.buscaLouvor}
              </h1>

              {itemAtual.observacao && (
                <p className="text-sm md:text-base text-amber-400 italic bg-amber-950/20 border border-amber-900/30 px-4 py-2 rounded-xl inline-block mt-4">
                  Obs: {itemAtual.observacao}
                </p>
              )}
            </div>
          )}

          {/* Indicador de Progresso (X de Y) */}
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Etapa {activeIndex + 1} de {playlist.length}
          </p>
        </div>

        {/* Sidebar Lateral Direita (Lista de Reprodução) */}
        <div 
          className={`bg-slate-900 border-l border-slate-800 w-80 flex flex-col transition-all duration-300 shrink-0 absolute right-0 top-0 bottom-0 md:relative z-20 ${
            sidebarOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none w-0 md:w-0"
          }`}
        >
          <div className="p-3 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cronograma do Culto</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {playlist.map((item, index) => {
              const itemIsDivider = item.type === "divider";
              const isSelected = index === activeIndex;

              return (
                <button
                  key={item.id || index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                    isSelected
                      ? itemIsDivider 
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/20"
                        : "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/20"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected 
                      ? "bg-white/20 text-white" 
                      : itemIsDivider ? "bg-indigo-950/60 text-indigo-400 border border-indigo-900/40" : "bg-slate-800 text-slate-500"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    {itemIsDivider ? (
                      <p className="text-sm font-bold tracking-wide uppercase truncate">✨ {item.text || "Seção"}</p>
                    ) : (
                      <>
                        <p className="text-xs truncate font-medium opacity-80">
                          {item.numero && !String(item.numero).startsWith("local_") ? `Nº ${item.numero}` : '—'}
                        </p>
                        <p className="text-sm truncate mt-0.5">{item.nome || item.buscaLouvor}</p>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barra de Controle de Navegação Inferior */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-4 flex items-center justify-center gap-4 z-10">
        <Button
          onClick={handleRetroceder}
          disabled={activeIndex === 0}
          variant="outline"
          className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 h-11 px-4 rounded-xl"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Voltar
        </Button>

        <Button
          onClick={handleAvancar}
          disabled={activeIndex === playlist.length - 1}
          className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 h-11 px-4 rounded-xl min-w-[120px]"
        >
          Avançar <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}