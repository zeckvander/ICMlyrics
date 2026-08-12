import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Radio, Play, Pause, 
  Volume2, VolumeX, Trash2, Link as LinkIcon, Plus, Signal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function RadiosOnline() {
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState("user");
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";

  // Estados do Player
  const audioRef = useRef(null);
  const [reproduzindo, setReproduzindo] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [mostrarVolume, setMostrarVolume] = useState(false);

  // Estados do Banco e Seleção
  const [radios, setRadios] = useState([]);
  const [radioSelecionada, setRadioSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(true);
  
  const [novaRadio, setNovaRadio] = useState({ nome: "", url: "", categoria: "Gospel" });

  // Validar acessos de administrador
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

  // Carregar Rádios do Supabase
  const buscarRadios = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from("radios_online")
        .select("*")
        .order('number', { ascending: true });

      if (!error && data && data.length > 0) {
        setRadios(data);
        setRadioSelecionada(data[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar rádios:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarRadios();
  }, []);

  const podeCriar = userRole === "super_admin" || userRole === "church_admin";

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
    if (!audioRef.current || !radioSelecionada?.url_stream) return;

    try {
      if (reproduzindo) {
        audioRef.current.pause();
        setReproduzindo(false);
      } else {
        await audioRef.current.play();
        setReproduzindo(true);
      }
    } catch (error) {
      console.error("Erro ao reproduzir a rádio:", error);
    }
  };

  const handleSelecionarEReproduzir = async (radio) => {
    setRadioSelecionada(radio);
    setReproduzindo(false);

    setTimeout(async () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = radio.url_stream;
          audioRef.current.load();
          await audioRef.current.play();
          setReproduzindo(true);
        } catch (error) {
          console.error("Erro ao trocar de estação:", error);
        }
      }
    }, 100);
  };

  const handleAdicionarRadio = async (e) => {
    e.preventDefault();
    if (!podeCriar) return alert("Apenas administradores podem adicionar rádios.");
    if (!novaRadio.nome.trim() || !novaRadio.url.trim()) {
      return alert("Preencha o Nome e a URL do áudio/stream da rádio.");
    }

    try {
      const novaEstacao = {
        nome: novaRadio.nome.trim(),
        url_stream: novaRadio.url.trim(),
        categoria: novaRadio.categoria || "Gospel"
      };

      const { data, error } = await supabase
        .from("radios_online")
        .insert([novaEstacao])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setRadios((prev) => [...prev, data[0]]);
        if (!radioSelecionada) setRadioSelecionada(data[0]);
      }

      setNovaRadio({ nome: "", url: "", categoria: "Gospel" });
      alert("Rádio cadastrada com sucesso!");
    } catch (error) {
      alert("Erro ao cadastrar rádio no Supabase: " + error.message);
    }
  };

  const handleDeletarRadio = async (id) => {
    if (!podeCriar) return alert("Apenas administradores podem excluir.");
    if (!window.confirm("Deseja realmente remover esta rádio?")) return;

    try {
      const { error } = await supabase
        .from("radios_online")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const listaAtualizada = radios.filter((r) => r.id !== id);
      setRadios(listaAtualizada);

      if (radioSelecionada?.id === id) {
        if (audioRef.current) audioRef.current.pause();
        setRadioSelecionada(listaAtualizada[0] || null);
        setReproduzindo(false);
      }
    } catch (error) {
      alert("Erro ao excluir rádio: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      {/* Cabeçalho */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md">
        <div className="flex items-center mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/painel-equipe")} 
              className="text-slate-300 hover:text-white transition-colors"
              aria-label="Voltar ao Painel"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-500" /> Rádios Online
              </h1>
              <p className="text-slate-400 text-xs">Transmita rádios ao vivo direto no player</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4 flex-1">
        <div className="space-y-3 animate-in fade-in duration-200">
          
          <audio
            ref={audioRef}
            src={radioSelecionada?.url_stream}
            onEnded={() => setReproduzindo(false)}
          />

          {/* Card Principal da Rádio Ativa */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Radio className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {radioSelecionada ? radioSelecionada.nome : "Nenhuma rádio selecionada"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {radioSelecionada?.categoria || "Estação de Rádio"}
            </p>

            {/* Player Estilo Barra */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl mt-4 flex items-center justify-between shadow-md relative">
              
              {/* Botão Play / Pause */}
              <button 
                onClick={togglePlayPrincipal}
                disabled={!radioSelecionada?.url_stream}
                className="w-12 h-12 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg"
              >
                {reproduzindo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              {/* Indicador AO VIVO */}
              <div className="flex-1 mx-4 flex items-center justify-center gap-2 bg-slate-800/80 py-2.5 rounded-xl border border-slate-700/50">
                <Signal className={`w-4 h-4 ${reproduzindo ? "text-red-500 animate-pulse" : "text-slate-500"}`} />
                <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
                  {reproduzindo ? "Ao Vivo" : "Pronto para Transmitir"}
                </span>
                {reproduzindo && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>

              {/* Botão de Volume / Slider que substitui o ícone no local correto */}
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
                    <span className="text-[10px] text-red-400 font-bold">
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
                        className="w-20 h-1.5 accent-red-500 bg-slate-700 rounded-lg cursor-pointer -rotate-90 origin-center"
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
                        <Volume2 className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Form para adicionar rádios (se for Admin) */}
          {podeCriar && (
            <form onSubmit={handleAdicionarRadio} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cadastrar Nova Rádio</p>
              <div className="space-y-2">
                <Input 
                  placeholder="Nome da Rádio"
                  value={novaRadio.nome}
                  onChange={(e) => setNovaRadio({ ...novaRadio, nome: e.target.value })}
                  className="h-9 text-xs"
                />
                <div className="relative">
                  <Input 
                    placeholder="URL do Stream da Rádio (.mp3 / stream)"
                    value={novaRadio.url}
                    onChange={(e) => setNovaRadio({ ...novaRadio, url: e.target.value })}
                    className="h-9 text-xs pl-8"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-9 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1.5 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Rádio
              </Button>
            </form>
          )}

          {/* Lista de Rádios */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estações Disponíveis</p>

            {carregando ? (
              <p className="text-center text-slate-400 text-xs py-6">Carregando rádios do Supabase...</p>
            ) : radios.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6 uppercase font-bold tracking-wider">
                Nenhuma rádio cadastrada
              </p>
            ) : (
              radios.map((radio) => {
                const estaAtiva = radioSelecionada?.id === radio.id;
                const tocandoEsta = estaAtiva && reproduzindo;

                return (
                  <div
                    key={radio.id}
                    className={`w-full p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                      estaAtiva
                        ? "bg-red-50 border-red-200 text-red-900 font-bold" 
                        : "bg-slate-50 border-slate-100 text-slate-700"
                    }`}
                  >
                    <button
                      onClick={() => handleSelecionarEReproduzir(radio)}
                      className="flex-1 text-left flex items-center gap-2.5 truncate pr-2"
                    >
                      <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                        <Radio className="w-3.5 h-3.5" />
                      </span>
                      <div className="truncate">
                        <p className="truncate text-slate-900 font-bold">{radio.nome}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{radio.categoria || "Gospel"}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleSelecionarEReproduzir(radio)}
                        className={`p-2 rounded-lg transition-colors ${
                          tocandoEsta
                            ? "bg-red-600 text-white"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                        title="Ouvir Estação"
                      >
                        {tocandoEsta ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </button>

                      {podeCriar && (
                        <button
                          onClick={() => handleDeletarRadio(radio.id)}
                          className="ml-1 p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                          title="Excluir Rádio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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