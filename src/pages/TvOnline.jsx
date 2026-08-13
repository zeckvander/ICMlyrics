import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Tv, Play, Pause, Volume2, VolumeX, 
  Maximize, RefreshCw 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Hls from "hls.js";

export default function TvOnline() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);

  const [tvs, setTvs] = useState([]);
  const [tvSelecionada, setTvSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(true);
  
  const [reproduzindo, setReproduzindo] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [erroStream, setErroStream] = useState(false);

  const buscarTvs = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from("tvs_online")
        .select("*")
        .order("number", { ascending: true });

      if (!error && data && data.length > 0) {
        setTvs(data);
        setTvSelecionada(data[0]);
      } else {
        const canalPadrao = {
          id: 1,
          nome: "TV Web Maanaim",
          url_stream: "https://cpbr.appflux.com.br:2000/hls/maranatalive1/maranatalive1.m3u8",
          categoria: "Igreja Cristã Maranata"
        };
        setTvs([canalPadrao]);
        setTvSelecionada(canalPadrao);
      }
    } catch (err) {
      console.error("Erro ao buscar canais de TV:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarTvs();
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  const prepararVideo = (tv) => {
    if (!tv?.url_stream || !videoRef.current) return;
    setErroStream(false);
    setReproduzindo(false);

    const url = tv.url_stream;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && url.includes(".m3u8")) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setErroStream(true);
          setReproduzindo(false);
        }
      });
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = url;
    } else {
      videoRef.current.src = url;
    }
  };

  useEffect(() => {
    if (tvSelecionada) {
      prepararVideo(tvSelecionada);
    }
  }, [tvSelecionada]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (reproduzindo) {
      videoRef.current.pause();
      setReproduzindo(false);
    } else {
      videoRef.current
        .play()
        .then(() => setReproduzindo(true))
        .catch((err) => {
          console.error("Erro ao reproduzir:", err);
          setErroStream(true);
        });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const novoMute = !isMuted;
    setIsMuted(novoMute);
    videoRef.current.muted = novoMute;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleSelecionarEReproduzir = (tv) => {
    if (tvSelecionada?.id === tv.id) {
      togglePlay();
    } else {
      setTvSelecionada(tv);
      setReproduzindo(false);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current
            .play()
            .then(() => setReproduzindo(true))
            .catch((err) => console.error("Erro ao dar play:", err));
        }
      }, 200);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="text-slate-300 hover:text-white transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Tv className="w-5 h-5 text-red-500" /> TV Web
              </h1>
              <p className="text-slate-400 text-xs">Transmissão ao vivo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4 flex-1">
        <div className="space-y-3 animate-in fade-in duration-200">
          
          {/* Player de Vídeo */}
          <div 
            ref={containerRef}
            className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-200 shadow-sm group"
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
              onPlay={() => setReproduzindo(true)}
              onPause={() => setReproduzindo(false)}
              onClick={togglePlay}
            />

            {/* Overlay de Erro */}
            {erroStream && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-20">
                <p className="text-xs font-medium text-slate-300 mb-3">Sinal indisponível ou interrompido</p>
                <button
                  onClick={() => { prepararVideo(tvSelecionada); togglePlay(); }}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Recarregar
                </button>
              </div>
            )}

            {/* Tela de Inicio (Sem Autoplay) */}
            {!reproduzindo && !erroStream && (
              <div 
                onClick={togglePlay}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer z-10 transition-colors hover:bg-black/30"
              >
                <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform mb-2">
                  <Play className="w-6 h-6 ml-1 fill-current" />
                </div>
                <span className="text-xs font-medium text-slate-200">Clique para assistir ao vivo</span>
              </div>
            )}

            {/* Overlay de Controles Rápido ao Tocar / Mouse Over */}
            {reproduzindo && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="text-white p-1 hover:text-red-400">
                    <Pause className="w-5 h-5" />
                  </button>
                  <button onClick={toggleMute} className="text-slate-300 p-1 hover:text-white">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 accent-red-500 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                <button onClick={toggleFullscreen} className="text-slate-300 p-1 hover:text-white">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Lista de Canais (Padronizada com RadiosOnline) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transmissão</p>

            {carregando ? (
              <p className="text-center text-slate-400 text-xs py-6">Carregando canais...</p>
            ) : tvs.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6 uppercase font-bold tracking-wider">
                Nenhum canal cadastrado
              </p>
            ) : (
              tvs.map((tv) => {
                const estaAtiva = tvSelecionada?.id === tv.id;
                const tocandoEsta = estaAtiva && reproduzindo;
                return (
                  <div
                    key={tv.id}
                    className={`w-full p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                      estaAtiva
                        ? "bg-red-50 border-red-200 text-red-900 font-bold" 
                        : "bg-slate-50 border-slate-100 text-slate-700"
                    }`}
                  >
                    <button
                      onClick={() => handleSelecionarEReproduzir(tv)}
                      className="flex-1 text-left flex items-center gap-2.5 truncate pr-2"
                    >
                      <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                        <Tv className="w-3.5 h-3.5" />
                      </span>
                      <div className="truncate">
                        <p className="truncate text-slate-900 font-bold">{tv.nome}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{tv.categoria || "Ao Vivo"}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleSelecionarEReproduzir(tv)}
                        className={`p-2 rounded-lg transition-colors ${
                          tocandoEsta
                            ? "bg-red-600 text-white"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                        title={tocandoEsta ? "Pausar Canal" : "Assistir Canal"}
                      >
                        {tocandoEsta ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}