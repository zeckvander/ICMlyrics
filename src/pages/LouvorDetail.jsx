import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Pencil, Trash2, Music, MapPin, Loader2, Star, Link2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CategoriaBadge from "@/components/louvores/CategoriaBadge";
import LouvorForm from "@/components/louvores/LouvorForm";
import CifraImageTab from "@/components/louvores/CifraImageTab";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { TEMAS_PADRAO } from "@/data/louvores_coletanea_tema";
import { supabase } from "@/lib/supabaseClient";

export default function LouvorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [louvor, setLouvor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fav, setFav] = useState(false);
  const [admin, setAdmin] = useState(false);
  
  const [tamanhoFonte, setTamanhoFonte] = useState(() => localStorage.getItem('icmlyrics_fonte') || 'md');
  const [tema, setTema] = useState(() => localStorage.getItem('icmlyrics_tema') || 'escuro');
  const eEscuro = tema === 'escuro';

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

  useEffect(() => { loadLouvor(); }, [id]);
  useEffect(() => { if (louvor) setFav(isFavorite(musico, louvor.id)); }, [louvor, musico]);

  useEffect(() => {
    const verificarSessao = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          setAdmin(true);
        } else {
          setAdmin(false);
        }
      } catch (err) {
        setAdmin(false);
      }
    };
    verificarSessao();
  }, []);

  const loadLouvor = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('louvores')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) console.error(error);
    else setLouvor(data);
    setLoading(false);
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    const { error } = await supabase
      .from('louvores')
      .update(form)
      .eq('id', louvor.id);
    
    if (error) alert("Erro ao atualizar: " + error.message);
    else {
      setEditOpen(false);
      loadLouvor();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const confirmar = window.confirm(`Deseja realmente excluir o louvor "${louvor?.nome}"?`);
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('louvores')
        .delete()
        .eq('id', louvor.id);

      if (error) {
        alert("Erro ao excluir: " + error.message);
      } else {
        alert("Louvor excluído com sucesso!");
        handleVoltar();
      }
    } catch (err) {
      alert("Erro na conexão com o servidor.");
    }
  };

  const handleVoltar = () => {
    const rotaRetorno = localStorage.getItem("icmlyrics_retorno_repertorio");
    
    if (rotaRetorno) {
      localStorage.removeItem("icmlyrics_retorno_repertorio"); 
      navigate(rotaRetorno);
    } else {
      navigate("/louvor");
    }
  };

  const getTemaReal = (numero, categoria) => {
    if (!numero || !categoria) return null;
    
    const item = TEMAS_PADRAO.find(
      t => t.numero === String(numero) && t.categoria === categoria
    );
    return item ? item.tema : null;
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

  if (loading) return (
    <div className={`flex items-center justify-center min-h-screen ${eEscuro ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

  if (!louvor) return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-3 ${eEscuro ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-400'}`}>
      <p>Louvor não encontrado</p>
      <Button variant="outline" onClick={handleVoltar} className={eEscuro ? 'border-slate-800 hover:bg-slate-900 text-slate-300' : ''}>Voltar</Button>
    </div>
  );

  const temaReal = getTemaReal(louvor.numero, louvor.categoria);
  
  const linksValidos = [
    { label: "Partitura voz", url: louvor.link_referencia },
    { label: "Instrumentos", url: louvor.instrumentos },
    { label: "Soprano", url: louvor.soprano },
    { label: "Contralto", url: louvor.contralto },
    { label: "Tenor", url: louvor.tenor },
    { label: "Baixo", url: louvor.baixo }
  ].filter(l => l.url && l.url.trim() !== "");

  return (
    <div className={`min-h-screen pb-8 transition-colors duration-300 ${eEscuro ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6">
        <button onClick={handleVoltar} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {louvor.numero && <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded">#{louvor.numero}</span>}
              <CategoriaBadge categoria={louvor.categoria} />
            </div>
            <h1 className="text-xl font-bold truncate">{louvor.nome}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400 flex-wrap">
              {louvor.ritmo && <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5" />{louvor.ritmo}</span>}
              {temaReal && <span className="flex items-center gap-1"><span className="text-blue-400">•</span> {temaReal}</span>}
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0 items-center">
            <Button size="icon" variant="ghost" className="text-white/60 hover:text-amber-400" onClick={() => setFav(toggleFavorite(musico, louvor.id))}>
              <Star className={`w-5 h-5 ${fav ? "fill-amber-400 text-amber-400" : ""}`} />
            </Button>
            
            {admin && (
              <>
                <Button size="icon" variant="ghost" className="text-white/60 hover:text-amber-400" onClick={() => setEditOpen(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-white/60 hover:text-red-500" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        <div className={`rounded-xl shadow-sm border p-3 space-y-3 ${eEscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tom</p>
                <p className={`text-sm font-semibold ${eEscuro ? 'text-slate-100' : 'text-slate-800'}`}>{louvor.mapa_musica || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Andamento</p>
                <p className={`text-sm font-semibold ${eEscuro ? 'text-slate-100' : 'text-slate-800'}`}>{louvor.bpm_compasso || "N/A"}</p>
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
                  {linksValidos.map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3 border rounded-lg text-sm transition-colors ${eEscuro ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                      {item.label} <ExternalLink className="w-4 h-4 text-blue-500" />
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
            <TabsContent value="letra" className="p-4 m-0">
              <p className={`${getTamanhoFonteClass()} whitespace-pre-wrap leading-relaxed ${eEscuro ? 'text-slate-200' : 'text-slate-700'}`}>{louvor.letra_musica || "Nenhuma letra."}</p>
            </TabsContent>
            <TabsContent value="cifra1" className="p-4 m-0"><CifraImageTab louvorId={louvor.id} field="cifra1_imagem" imageUrl={louvor.cifra1_imagem} onUploaded={loadLouvor} /></TabsContent>
            <TabsContent value="cifra2" className="p-4 m-0"><CifraImageTab louvorId={louvor.id} field="cifra2_imagem" imageUrl={louvor.cifra2_imagem} onUploaded={loadLouvor} /></TabsContent>
          </Tabs>
        </div>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent 
          side="bottom" 
          className={`rounded-t-2xl max-h-[92vh] overflow-y-auto ${eEscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : ''}`}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <LouvorForm initial={louvor} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} saving={saving} />
        </SheetContent>
      </Sheet>
    </div>
  );
}