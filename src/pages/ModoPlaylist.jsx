import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ListMusic, MessageSquare, MapPin, Clock, ExternalLink, Link2, Music, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CategoriaBadge from "@/components/louvores/CategoriaBadge";
import CifraImageTab from "@/components/louvores/CifraImageTab";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { TEMAS_PADRAO } from "@/data/louvores_coletanea_tema";
import { supabase } from "@/lib/supabaseClient";

export default function ModoPlaylist() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [playlist, setPlaylist] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [listaInfo, setListaInfo] = useState(null);

  const [tema] = useState(() => localStorage.getItem('icmlyrics_tema') || 'escuro');
  const eEscuro = tema === 'escuro';

  const [tamanhoFonte] = useState(() => localStorage.getItem('icmlyrics_fonte') || 'md');

  const perfil = localStorage.getItem('icmlyrics_perfil') || 'instrumento';
  const cifraPadrao = localStorage.getItem('icmlyrics_cifra_padrao') || 'cifra1';
  const abaPadrao = perfil === 'voz' ? 'letra' : cifraPadrao;

  const musico = localStorage.getItem("icmlyrics_user") || "";

  useEffect(() => {
    let wakeLock = null;

    const solicitarWakeLock = async () => {
      const manterAcesa = localStorage.getItem('icmlyrics_keep_awake') === 'true';
      if (manterAcesa && 'wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.error(err);
        }
      }
    };

    solicitarWakeLock();

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await solicitarWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const carregarPlaylistCompleta = async () => {
      setLoading(true);

      const state = location.state;
      const listaRecebida = state?.lista || (state?.lista_itens || state?.rows || state?.itens ? state : null);

      if (listaRecebida) {
        setListaInfo(listaRecebida);
        const itensBrutos = listaRecebida.lista_itens || listaRecebida.rows || listaRecebida.itens || listaRecebida.louvores || [];

        const idsValidos = [];
        const numerosValidos = [];
        const nomesValidos = [];

        itensBrutos.forEach((item) => {
          if (item.tipo === "divider" || item.type === "divider") return;

          const possibleId = item.louvor_id || item.id_louvor || (item.louvores && item.louvores.id) || item.id;
          if (possibleId !== null && possibleId !== undefined && !isNaN(possibleId) && !String(possibleId).startsWith("item_") && !String(possibleId).startsWith("local_")) {
            idsValidos.push(Number(possibleId));
          }

          const possibleNumero = item.numero ?? item.louvor_numero;
          if (possibleNumero !== null && possibleNumero !== undefined && !isNaN(possibleNumero) && String(possibleNumero).trim() !== "") {
            numerosValidos.push(Number(possibleNumero));
          }

          const possibleNome = item.nome || item.text || item.buscaLouvor;
          if (possibleNome && typeof possibleNome === "string" && possibleNome.trim() !== "") {
            nomesValidos.push(possibleNome.trim());
          }
        });

        let louvoresBanco = [];
        if (idsValidos.length > 0 || numerosValidos.length > 0 || nomesValidos.length > 0) {
          try {
            const filters = [];

            if (idsValidos.length > 0) {
              filters.push(`id.in.(${idsValidos.join(",")})`);
            }
            if (numerosValidos.length > 0) {
              filters.push(`numero.in.(${numerosValidos.join(",")})`);
            }
            if (nomesValidos.length > 0) {
              const escapedNomes = nomesValidos.map((n) => `"${n.replace(/"/g, '""')}"`).join(",");
              filters.push(`nome.in.(${escapedNomes})`);
            }

            if (filters.length > 0) {
              const { data, error } = await supabase
                .from("louvores")
                .select("*")
                .or(filters.join(","));

              if (!error && data) {
                louvoresBanco = data;
              }
            }
          } catch (err) {
            console.error("Erro ao carregar louvores da playlist:", err);
          }
        }

        const itensProcessados = itensBrutos.map((item, idx) => {
          const baseItem = {
            id: item.id || `item_${idx}`,
            type: item.tipo || item.type || "louvor",
            observacao: item.observacao || "",
            text: item.texto_secao || item.text || ""
          };

          if (baseItem.type === "divider") {
            return baseItem;
          }

          const rawId = item.louvor_id || item.id_louvor || (item.louvores && item.louvores.id) || item.id;
          const numId = rawId && !isNaN(rawId) && !String(rawId).startsWith("item_") && !String(rawId).startsWith("local_") ? Number(rawId) : null;
          const numNumero = item.numero !== null && item.numero !== undefined && !isNaN(item.numero) ? Number(item.numero) : null;
          const strNome = (item.nome || item.text || item.buscaLouvor || "").trim().toLowerCase();

          const louvorData = louvoresBanco.find((l) => {
            if (numId !== null && Number(l.id) === numId) return true;
            if (numNumero !== null && Number(l.numero) === numNumero) return true;
            if (strNome && l.nome && l.nome.trim().toLowerCase() === strNome) return true;
            return false;
          }) || (Array.isArray(item.louvores) ? item.louvores[0] : item.louvores) || item.louvor || {};

          return {
            ...baseItem,
            ...louvorData,
            numero: louvorData.numero ?? item.numero ?? "",
            nome: louvorData.nome || item.nome || item.text || item.buscaLouvor || "",
            categoria: louvorData.categoria || item.categoria || "Coletânea",
            tom: louvorData.mapa_musica || louvorData.tom || item.mapa_musica || item.tom || "N/A",
            andamento: louvorData.bpm_compasso || louvorData.andamento || item.bpm_compasso || item.andamento || "N/A",
            ritmo: louvorData.ritmo || item.ritmo || "",
            letra_musica: louvorData.letra_musica || louvorData.letra || item.letra_musica || item.letra || "Nenhuma letra.",
          };
        });

        setPlaylist(itensProcessados);
      }
      setLoading(false);
    };

    carregarPlaylistCompleta();
  }, [location.state]);

  const itemAtual = playlist[activeIndex];
  const isDivider = itemAtual && itemAtual.type === "divider";

  useEffect(() => {
    if (itemAtual && !isDivider && itemAtual.id && !String(itemAtual.id).startsWith("item_")) {
      setFav(isFavorite(musico, itemAtual.id));
    }
  }, [itemAtual, musico, isDivider]);

  const handleRetroceder = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const handleAvancar = () => {
    if (activeIndex < playlist.length - 1) setActiveIndex(activeIndex + 1);
  };

  const getTemaReal = (numero, categoria) => {
    if (!numero || !categoria) return null;
    const item = TEMAS_PADRAO.find(
      (t) => t.numero === String(numero) && t.categoria === categoria
    );
    return item ? item.tema : null;
  };

  const formatarDiaSemana = (texto) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .split(" ")
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(" ");
  };

  const formatarCabecalhoCulto = (info) => {
    if (!info) return "Cronograma do Culto";
    
    let dataFormatada = "";
    if (info.data_culto) {
      try {
        const [ano, mes, dia] = info.data_culto.split("T")[0].split("-");
        if (ano && mes && dia) {
          dataFormatada = `${dia}/${mes}`;
        }
      } catch {
        dataFormatada = info.data_culto;
      }
    }

    const diaSemanaFormatado = info.dia_semana ? formatarDiaSemana(info.dia_semana) : "";
    
    if (dataFormatada && diaSemanaFormatado) {
      return `${dataFormatada} - ${diaSemanaFormatado}`;
    }
    return dataFormatada || diaSemanaFormatado || "Cronograma do Culto";
  };

  const getTamanhoFonteClass = () => {
    switch (tamanhoFonte) {
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg font-medium';
      case 'xl': return 'text-xl font-bold';
      default: return 'text-base';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${eEscuro ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-800'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-2" />
        <p className="text-sm text-slate-500">Carregando playlist do culto...</p>
      </div>
    );
  }

  if (playlist.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${eEscuro ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-800'}`}>
        <p className="text-center text-slate-500 mb-4">Nenhum item encontrado nesta playlist.</p>
        <Button variant="outline" onClick={() => navigate("/historico-listas")} className={eEscuro ? 'border-slate-800 hover:bg-slate-900 text-slate-300' : ''}>
          Voltar para o Histórico
        </Button>
      </div>
    );
  }

  const temaReal = !isDivider ? getTemaReal(itemAtual.numero, itemAtual.categoria) : null;

  const linksValidos = !isDivider ? [
    { label: "Partitura voz", url: itemAtual.link_referencia },
    { label: "Instrumentos", url: itemAtual.instrumentos },
    { label: "Soprano", url: itemAtual.soprano },
    { label: "Contralto", url: itemAtual.contralto },
    { label: "Tenor", url: itemAtual.tenor },
    { label: "Baixo", url: itemAtual.baixo }
  ].filter((l) => l.url && l.url.trim() !== "") : [];

  const cabecalhoDataTexto = formatarCabecalhoCulto(listaInfo);
  const tipoCulto = listaInfo?.tipo_culto;

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-300 ${eEscuro ? 'bg-slate-950' : 'bg-slate-50'} flex flex-col justify-between`}>
      <div>
        <div className="bg-slate-900 text-white px-4 pt-8 pb-6">
          {isDivider ? (
            <div className="py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Momento do Culto</span>
              <h1 className="text-2xl font-bold uppercase mt-1">{itemAtual.text || "Seção"}</h1>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {itemAtual.numero && !String(itemAtual.numero).startsWith("local_") && (
                    <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded">#{itemAtual.numero}</span>
                  )}
                  <CategoriaBadge categoria={itemAtual.categoria} />
                </div>

                <div className="flex items-center gap-1">
                  {!isDivider && itemAtual.id && !String(itemAtual.id).startsWith("item_") && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-white/60 hover:text-amber-400 h-9 w-9" 
                      onClick={() => setFav(toggleFavorite(musico, itemAtual.id))}
                    >
                      <Star className={`w-5 h-5 ${fav ? "fill-amber-400 text-amber-400" : ""}`} />
                    </Button>
                  )}

                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`relative p-2 rounded-lg transition-colors flex items-center justify-center ${
                      sidebarOpen ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                    title="Cronograma do Culto"
                  >
                    <ListMusic className="w-5 h-5" />
                    <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-slate-900 shadow-sm">
                      {playlist.length}
                    </span>
                  </button>
                </div>
              </div>

              <h1 className="text-xl font-bold truncate mt-1">{itemAtual.nome}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400 flex-wrap">
                {itemAtual.ritmo && <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5" />{itemAtual.ritmo}</span>}
                {temaReal && <span className="flex items-center gap-1"><span className="text-blue-400">•</span> {temaReal}</span>}
                {itemAtual.observacao && <span className="text-amber-400 italic">Obs: {itemAtual.observacao}</span>}
              </div>
            </div>
          )}
        </div>

        {!isDivider && (
          <div className="px-4 -mt-3 space-y-4 max-w-3xl mx-auto">
            <div className={`rounded-xl shadow-sm border p-3 space-y-3 ${eEscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tom</p>
                    <p className={`text-sm font-semibold ${eEscuro ? 'text-slate-100' : 'text-slate-800'}`}>{itemAtual.tom || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Andamento</p>
                    <p className={`text-sm font-semibold ${eEscuro ? 'text-slate-100' : 'text-slate-800'}`}>{itemAtual.andamento || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              {linksValidos.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${eEscuro ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}>
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-blue-600" />
                        <span className={`text-sm font-semibold ${eEscuro ? 'text-blue-400' : 'text-blue-700'}`}>Links</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${eEscuro ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>{linksValidos.length}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className={`sm:max-w-md ${eEscuro ? 'bg-slate-900 text-slate-100 border-slate-800' : ''}`}>
                    <DialogHeader><DialogTitle className={eEscuro ? 'text-slate-100' : ''}>Links (Google Drive)</DialogTitle></DialogHeader>
                    <div className="flex flex-col gap-2 py-4">
                      {linksValidos.map((linkItem, i) => (
                        <a key={i} href={linkItem.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3 border rounded-lg text-sm transition-colors ${eEscuro ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                          {linkItem.label} <ExternalLink className="w-4 h-4 text-blue-500" />
                        </a>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className={`rounded-xl shadow-sm border overflow-hidden ${eEscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <Tabs defaultValue={abaPadrao} className="w-full">
                <TabsList className={`w-full rounded-none border-b ${eEscuro ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}>
                  <TabsTrigger value="letra" className={`flex-1 text-xs ${eEscuro ? 'data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400' : ''}`}>Letra</TabsTrigger>
                  <TabsTrigger value="cifra1" className={`flex-1 text-xs ${eEscuro ? 'data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400' : ''}`}>Cifra 1</TabsTrigger>
                  <TabsTrigger value="cifra2" className={`flex-1 text-xs ${eEscuro ? 'data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400' : ''}`}>Cifra 2</TabsTrigger>
                </TabsList>
                <TabsContent value="letra" className="p-4 m-0 pb-6">
                  <p className={`${getTamanhoFonteClass()} whitespace-pre-wrap leading-relaxed ${eEscuro ? 'text-slate-200' : 'text-slate-700'}`}>{itemAtual.letra_musica}</p>
                </TabsContent>
                <TabsContent value="cifra1" className="p-4 m-0 pb-6">
                  <CifraImageTab louvorId={itemAtual.id} field="cifra1_imagem" imageUrl={itemAtual.cifra1_imagem} />
                </TabsContent>
                <TabsContent value="cifra2" className="p-4 m-0 pb-6">
                  <CifraImageTab louvorId={itemAtual.id} field="cifra2_imagem" imageUrl={itemAtual.cifra2_imagem} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {isDivider && (
          <div className={`max-w-xl mx-auto mt-12 p-12 rounded-3xl border text-center shadow-sm ${eEscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-4 ${eEscuro ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/50' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className={`text-2xl font-black tracking-tight uppercase ${eEscuro ? 'text-slate-100' : 'text-slate-900'}`}>{itemAtual.text || "Seção"}</h2>
          </div>
        )}
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className={`w-80 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 ${eEscuro ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
            <div className={`p-4 border-b flex items-start justify-between ${eEscuro ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                {tipoCulto && (
                  <h3 className="text-base font-extrabold text-indigo-400 uppercase tracking-tight">
                    {tipoCulto}
                  </h3>
                )}
                <p className={`font-bold ${eEscuro ? 'text-slate-100' : 'text-slate-900'} ${tipoCulto ? "text-sm mt-0.5" : "text-base"}`}>
                  {cabecalhoDataTexto}
                </p>
              </div>
              <Button variant="ghost" size="sm" className={`h-7 w-7 p-0 ${eEscuro ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`} onClick={() => setSidebarOpen(false)}>✕</Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {playlist.map((item, index) => {
                const itemIsDivider = item.type === "divider";
                const isSelected = index === activeIndex;

                let badgeLabel = "—";
                const catLower = (item.categoria || "").toLowerCase();
                if (catLower.includes("avulso")) {
                  badgeLabel = "Avulso";
                } else if (catLower.includes("cias") || catLower.includes("culto infantil")) {
                  badgeLabel = "Cias";
                } else if (item.categoria) {
                  badgeLabel = item.categoria;
                }

                return (
                  <button
                    key={item.id || index}
                    onClick={() => { setActiveIndex(index); setSidebarOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                      isSelected
                        ? itemIsDivider ? "bg-indigo-600 text-white font-bold" : (eEscuro ? "bg-slate-800 text-white font-bold" : "bg-slate-900 text-white font-bold")
                        : (eEscuro ? "text-slate-300 hover:bg-slate-800/60" : "text-slate-600 hover:bg-slate-100")
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? "bg-white/20 text-white" : (eEscuro ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500")
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      {itemIsDivider ? (
                        <p className="text-sm font-bold tracking-wide uppercase truncate">✨ {item.text || "Seção"}</p>
                      ) : (
                        <>
                          <p className="text-xs truncate font-medium opacity-75">
                            {item.numero && !String(item.numero).startsWith("local_") ? `Nº ${item.numero}` : badgeLabel}
                          </p>
                          <p className="text-sm truncate mt-0.5">{item.nome}</p>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={`p-3 ${eEscuro ? 'bg-slate-950 border-t border-slate-800' : 'bg-slate-50'}`}>
              <Button 
                onClick={() => navigate("/historico-listas")}
                className="w-full justify-center gap-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 shadow-sm"
              >
                Voltar ao Histórico de Listas
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={`sticky bottom-0 border-t px-4 py-3 mt-8 flex items-center justify-between gap-4 z-40 shadow-lg ${eEscuro ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur-md`}>
        <span className="text-xs font-semibold text-slate-500 tracking-wider hidden sm:inline">
          Etapa {activeIndex + 1} de {playlist.length}
        </span>

        <div className="flex gap-3 w-full sm:w-auto justify-center">
          <Button
            onClick={handleRetroceder}
            disabled={activeIndex === 0}
            variant="outline"
            className={`h-10 px-5 rounded-xl flex-1 sm:flex-none disabled:opacity-30 ${eEscuro ? 'border-slate-800 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>

          <Button
            onClick={handleAvancar}
            disabled={activeIndex === playlist.length - 1}
            className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 h-10 px-5 rounded-xl min-w-[120px] flex-1 sm:flex-none"
          >
            Avançar <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}