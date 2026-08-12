import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Mic, Play, Pause, Square,
  Volume2, VolumeX, Headphones, Trash2, Link as LinkIcon, Plus, Wind 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

const R2_BASE = "https://pub-55a3ef1c05ef41b8abe84ad12fe61214.r2.dev/equipe-audios/exercicio-voz";

const LISTA_INICIAL_AUDIOS = [
  {
    id: "r2-1",
    nome: "00 - Vibração Lábios",
    categoria: "aquecimento",
    url: `${R2_BASE}/aquecimento/00-Vibra%C3%A7%C3%A3o%20L%C3%A1bios.mp3`
  },
  {
    id: "r2-2",
    nome: "01 - MMMM",
    categoria: "aquecimento",
    url: `${R2_BASE}/aquecimento/01-MMMM.mp3`
  },
  {
    id: "r2-3",
    nome: "02 - ZZZZ",
    categoria: "aquecimento",
    url: `${R2_BASE}/aquecimento/02-ZZZZ.mp3`
  },
  {
    id: "r2-4",
    nome: "03 - RRRR",
    categoria: "aquecimento",
    url: `${R2_BASE}/aquecimento/03-RRRR.mp3`
  },
  {
    id: "r2-5",
    nome: "04 - EEEE",
    categoria: "aquecimento",
    url: `${R2_BASE}/aquecimento/04-EEEE.mp3`
  },
  {
    id: "r2-6",
    nome: "05 - II - IÊ - IÓ - IÚ - IÁ",
    categoria: "aquecimento",
    url: `${R2_BASE}/aquecimento/05-II%20-%20I%C3%8A%20-%20I%C3%93%20-%20I%C3%9A%20-%20I%C3%81.mp3`
  },
  {
    id: "r2-7",
    nome: "06 - AAAA",
    categoria: "aquecimento",
    url: `${R2_BASE}/aquecimento/06-AAAA.mp3`
  },
  {
    id: "r2-8",
    nome: "07 - IOOO",
    categoria: "aquecimento",
    url: `${R2_BASE}/aquecimento/07-IOOO.mp3`
  },
  {
    id: "r2-9",
    nome: "01 - Respiração",
    categoria: "respiracao",
    url: `${R2_BASE}/respiracao/01-Respira%C3%A7%C3%A3o.mp3`
  }
];

export default function AquecimentoVocal() {
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState("user");
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";

  useEffect(() => {
    const validarAcesso = async () => {
      try {
        const roleSalva = localStorage.getItem("icmlyrics_role") || "user";

        if (roleSalva === "super_admin" || userNuvem === "admin_geral") {
          setUserRole("super_admin");
          return;
        }

        if (!userNuvem.trim()) {
          setUserRole("user");
          return;
        }

        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("role")
          .eq("usuario", userNuvem.trim())
          .maybeSingle();

        if (!error && data) {
          const roleDoBanco = data.role?.toLowerCase() || "";
          if (roleDoBanco === "super_admin" || roleDoBanco === "super_adm") {
            setUserRole("super_admin");
          } else if (
            roleDoBanco === "church_admin" || 
            roleDoBanco === "adm_local" || 
            roleSalva === "church_admin"
          ) {
            setUserRole("church_admin");
          } else {
            setUserRole("user");
          }
        } else {
          setUserRole(roleSalva);
        }
      } catch (err) {
        setUserRole(localStorage.getItem("icmlyrics_role") || "user");
      }
    };

    validarAcesso();
  }, [userNuvem, usuarioLocal]);

  const podeCriar = userRole === "super_admin" || userRole === "church_admin";

  const audioRef = useRef(null);
  const [reproduzindo, setReproduzindo] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracaoTotal, setDuracaoTotal] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [mostrarVolume, setMostrarVolume] = useState(false);

  const [rotinasAquecimento, setRotinasAquecimento] = useState(LISTA_INICIAL_AUDIOS);
  const [exercicioSelecionado, setExercicioSelecionado] = useState(LISTA_INICIAL_AUDIOS[0]);
  const [audioAtual, setAudioAtual] = useState(LISTA_INICIAL_AUDIOS[0]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("aquecimento");
  
  const [novaRotina, setNovaRotina] = useState({ nome: "", url: "", categoria: "aquecimento" });

  const qtdAquecimento = rotinasAquecimento.filter(r => (r.categoria || "aquecimento") === "aquecimento").length;
  const qtdRespiracao = rotinasAquecimento.filter(r => (r.categoria || "aquecimento") === "respiracao").length;

  const formatarTempo = (segundos) => {
    if (isNaN(segundos) || !segundos) return "00:00";
    const mins = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const handleVolumeAdjustEnd = () => {
    setMostrarVolume(false);
  };

  const togglePlayPrincipal = async () => {
    if (!audioRef.current || !audioAtual?.url) return;

    try {
      if (reproduzindo) {
        audioRef.current.pause();
        setReproduzindo(false);
      } else {
        await audioRef.current.play();
        setReproduzindo(true);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
      }
    }
  };

  const handlePlayExercicio = async (rotina) => {
    setExercicioSelecionado(rotina);

    if (audioAtual?.id === rotina.id) {
      if (reproduzindo) {
        audioRef.current?.pause();
        setReproduzindo(false);
      } else {
        try {
          await audioRef.current?.play();
          setReproduzindo(true);
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      setAudioAtual(rotina);
      setTimeout(async () => {
        if (audioRef.current) {
          try {
            audioRef.current.pause();
            audioRef.current.src = rotina.url;
            audioRef.current.load();
            await audioRef.current.play();
            setReproduzindo(true);
          } catch (error) {
            console.error(error);
          }
        }
      }, 50);
    }
  };

  const handleStopExercicio = (rotina) => {
    if (audioAtual?.id === rotina.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setTempoAtual(0);
      setReproduzindo(false);
    }
  };

  const handleAdicionarRotina = (e) => {
    e.preventDefault();
    if (!podeCriar) return alert("Apenas administradores podem adicionar rotinas.");
    if (!novaRotina.nome.trim() || !novaRotina.url.trim()) {
      return alert("Preencha o Nome e a URL do áudio.");
    }

    const itemNovo = {
      id: `add-${Date.now()}`,
      nome: novaRotina.nome.trim(),
      url: novaRotina.url.trim(),
      categoria: novaRotina.categoria || "aquecimento"
    };

    setRotinasAquecimento((prev) => [...prev, itemNovo]);
    if (!exercicioSelecionado) {
      setExercicioSelecionado(itemNovo);
      setAudioAtual(itemNovo);
    }
    setNovaRotina({ nome: "", url: "", categoria: "aquecimento" });
  };

  const handleDeletarRotina = (id) => {
    if (!podeCriar) return alert("Apenas administradores podem excluir.");
    if (!window.confirm("Deseja realmente remover este exercício?")) return;

    const listaAtualizada = rotinasAquecimento.filter((r) => r.id !== id);
    setRotinasAquecimento(listaAtualizada);

    if (exercicioSelecionado?.id === id) {
      setExercicioSelecionado(listaAtualizada[0] || null);
    }
    if (audioAtual?.id === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setAudioAtual(listaAtualizada[0] || null);
      setReproduzindo(false);
    }
  };

  const exerciciosExibidos = rotinasAquecimento.filter((r) => {
    return (r.categoria || "aquecimento") === categoriaFiltro;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md">
        <div className="flex items-center mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/painel-equipe")} 
              className="text-slate-300 hover:text-white transition-colors"
              aria-label="Voltar ao Painel da Equipe"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-400" /> Preparação Vocal
              </h1>
              <p className="text-slate-400 text-xs">Aquecimento de voz e exercícios R2</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4 flex-1">
        <div className="space-y-3 animate-in fade-in duration-200">
          <audio
            ref={audioRef}
            src={audioAtual?.url}
            onTimeUpdate={() => setTempoAtual(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuracaoTotal(audioRef.current?.duration || 0)}
            onEnded={() => setReproduzindo(false)}
          />

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Headphones className="w-8 h-8" />
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              {exercicioSelecionado ? exercicioSelecionado.nome : "Nenhum áudio selecionado"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Siga as orientações e vocalize junto com o áudio.</p>

            <div className="bg-slate-900 text-white p-4 rounded-2xl mt-4 flex items-center justify-between shadow-md relative">
              <button 
                onClick={togglePlayPrincipal}
                disabled={!audioAtual?.url}
                className="w-12 h-12 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg"
              >
                {reproduzindo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div className="flex-1 mx-4">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-200"
                    style={{ 
                      width: duracaoTotal > 0 ? `${(tempoAtual / duracaoTotal) * 100}%` : "0%" 
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>{formatarTempo(tempoAtual)}</span>
                  <span>{formatarTempo(duracaoTotal)}</span>
                </div>
              </div>

              <div className="relative flex items-center">
                {!mostrarVolume ? (
                  <button 
                    onClick={() => setMostrarVolume(true)}
                    className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
                    title="Ajustar Volume"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                ) : (
                  <div className="absolute bottom-0 right-0 bg-slate-800 border border-slate-700 p-2.5 rounded-2xl shadow-2xl flex flex-col items-center gap-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[10px] text-purple-400 font-bold">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                    <div className="h-24 w-6 flex items-center justify-center my-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        onMouseUp={handleVolumeAdjustEnd}
                        onTouchEnd={handleVolumeAdjustEnd}
                        className="w-20 h-1.5 accent-purple-500 bg-slate-700 rounded-lg cursor-pointer -rotate-90 origin-center"
                      />
                    </div>
                    <button
                      onClick={() => setMostrarVolume(false)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Fechar"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {podeCriar && (
            <form onSubmit={handleAdicionarRotina} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adicionar Novo Exercício</p>
              <div className="space-y-2">
                <Input 
                  placeholder="Nome do Exercício"
                  value={novaRotina.nome}
                  onChange={(e) => setNovaRotina({ ...novaRotina, nome: e.target.value })}
                  className="h-9 text-xs"
                />
                <div className="relative">
                  <Input 
                    placeholder="URL Pública do Áudio (R2)"
                    value={novaRotina.url}
                    onChange={(e) => setNovaRotina({ ...novaRotina, url: e.target.value })}
                    className="h-9 text-xs pl-8"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNovaRotina({ ...novaRotina, categoria: "aquecimento" })}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      novaRotina.categoria === "aquecimento"
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Aquecimento
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovaRotina({ ...novaRotina, categoria: "respiracao" })}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      novaRotina.categoria === "respiracao"
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Respiração
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-1.5 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Áudio
              </Button>
            </form>
          )}

          <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1">
            <button
              onClick={() => setCategoriaFiltro("aquecimento")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                categoriaFiltro === "aquecimento"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mic className="w-3.5 h-3.5" /> Aquecimento ({qtdAquecimento})
            </button>
            <button
              onClick={() => setCategoriaFiltro("respiracao")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                categoriaFiltro === "respiracao"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wind className="w-3.5 h-3.5" /> Respiração ({qtdRespiracao})
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exercícios Disponíveis</p>

            {exerciciosExibidos.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6 uppercase font-bold tracking-wider">
                Nenhum exercício nesta categoria
              </p>
            ) : (
              exerciciosExibidos.map((rotina) => (
                <div
                  key={rotina.id}
                  className={`w-full p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                    exercicioSelecionado?.id === rotina.id
                      ? "bg-purple-50 border-purple-200 text-purple-900 font-bold" 
                      : "bg-slate-50 border-slate-100 text-slate-700"
                  }`}
                >
                  <button
                    onClick={() => setExercicioSelecionado(rotina)}
                    className="flex-1 text-left flex items-center gap-2 truncate pr-2"
                  >
                    <span className={`px-1.5 py-0.5 text-[9px] rounded uppercase font-bold ${
                      (rotina.categoria || "aquecimento") === "respiracao" 
                        ? "bg-cyan-100 text-cyan-800" 
                        : "bg-purple-100 text-purple-800"
                    }`}>
                      {(rotina.categoria || "aquecimento") === "respiracao" ? "Resp" : "Vocal"}
                    </span>
                    <span className="truncate">{rotina.nome}</span>
                  </button>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handlePlayExercicio(rotina)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        audioAtual?.id === rotina.id && reproduzindo
                          ? "bg-purple-600 text-white"
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      }`}
                      title="Tocar / Pausar"
                    >
                      {audioAtual?.id === rotina.id && reproduzindo ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleStopExercicio(rotina)}
                      className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                      title="Parar"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {podeCriar && (
                      <button
                        onClick={() => handleDeletarRotina(rotina.id)}
                        className="ml-1 p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                        title="Excluir exercício"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}