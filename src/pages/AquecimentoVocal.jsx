import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Mic, Play, Pause, 
  Volume2, Headphones, Trash2, Link as LinkIcon, Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function AquecimentoVocal() {
  const navigate = useNavigate();

  // Estados de Usuário / Permissões
  const [userRole, setUserRole] = useState("user");
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";

  // Validação de permissões
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
        console.error("Erro ao validar permissões:", err);
        setUserRole(localStorage.getItem("icmlyrics_role") || "user");
      }
    };

    validarAcesso();
  }, [userNuvem, usuarioLocal]);

  const podeCriar = userRole === "super_admin" || userRole === "church_admin";

  // ==========================================
  // ESTADOS DO AQUECIMENTO VOCAL (PLAYER REAL COM CLOUDFLARE R2)
  // ==========================================
  const audioRef = useRef(null);
  const [reproduzindo, setReproduzindo] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracaoTotal, setDuracaoTotal] = useState(0);

  const [rotinasAquecimento, setRotinasAquecimento] = useState([
    {
      id: 1,
      nome: "00 - Vibração Lábios",
      url: "https://pub-55a3ef1c05ef41b8abe84ad12fe61214.r2.dev/equipe-audios/exercicio-voz/aquecimento/00-Vibra%C3%A7%C3%A3o%20L%C3%A1bios.mp3"
    },
    {
      id: 2,
      nome: "01 - MMMM",
      url: "https://pub-55a3ef1c05ef41b8abe84ad12fe61214.r2.dev/equipe-audios/exercicio-voz/aquecimento/01-MMMM.mp3"
    },
    {
      id: 3,
      nome: "02 - ZZZZ",
      url: "https://pub-55a3ef1c05ef41b8abe84ad12fe61214.r2.dev/equipe-audios/exercicio-voz/aquecimento/02-ZZZZ.mp3"
    }
  ]);

  const [exercicioSelecionado, setExercicioSelecionado] = useState(rotinasAquecimento[0] || null);
  const [novaRotina, setNovaRotina] = useState({ nome: "", url: "" });

  const formatarTempo = (segundos) => {
    if (isNaN(segundos) || !segundos) return "00:00";
    const mins = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const togglePlay = async () => {
    if (!audioRef.current || !exercicioSelecionado?.url) return;

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
        console.error("Erro ao alternar play/pause:", error);
      }
    }
  };

  const handleSelecionarExercicio = async (rotina) => {
    setExercicioSelecionado(rotina);

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = rotina.url;
        audioRef.current.load();
        await audioRef.current.play();
        setReproduzindo(true);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Erro ao tocar áudio:", error);
        }
      }
    }
  };

  const handleAdicionarRotina = (e) => {
    e.preventDefault();
    if (!podeCriar) return alert("Apenas administradores podem adicionar rotinas.");
    if (!novaRotina.nome.trim() || !novaRotina.url.trim()) {
      return alert("Preencha o Nome e a URL do áudio.");
    }

    const item = {
      id: Date.now(),
      nome: novaRotina.nome.trim(),
      url: novaRotina.url.trim()
    };

    setRotinasAquecimento([...rotinasAquecimento, item]);
    if (!exercicioSelecionado) setExercicioSelecionado(item);
    setNovaRotina({ nome: "", url: "" });
  };

  const handleDeletarRotina = (idx) => {
    if (!podeCriar) return alert("Apenas administradores podem excluir.");
    setRotinasAquecimento(rotinasAquecimento.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      
      {/* Cabeçalho Limpo (Sem Abas e Sem Tags) */}
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

      {/* Conteúdo Principal */}
      <div className="px-4 mt-4 space-y-4 flex-1">
        
        <div className="space-y-3 animate-in fade-in duration-200">
          
          {/* Elemento de Áudio Oculto */}
          <audio
            ref={audioRef}
            src={exercicioSelecionado?.url}
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

            {/* Player Real */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl mt-4 flex items-center justify-between shadow-md">
              <button 
                onClick={togglePlay}
                disabled={!exercicioSelecionado?.url}
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

              <Volume2 className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          {podeCriar && (
            <form onSubmit={handleAdicionarRotina} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adicionar Áudio do R2</p>
              <div className="space-y-2">
                <Input 
                  placeholder="Nome do Exercício"
                  value={novaRotina.nome}
                  onChange={(e) => setNovaRotina({ ...novaRotina, nome: e.target.value })}
                  className="h-9 text-xs"
                />
                <div className="relative">
                  <Input 
                    placeholder="URL Pública do R2"
                    value={novaRotina.url}
                    onChange={(e) => setNovaRotina({ ...novaRotina, url: e.target.value })}
                    className="h-9 text-xs pl-8"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              <Button type="submit" className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-1.5 rounded-xl">
                <Plus className="w-3.5 h-3.5" /> Cadastrar Áudio
              </Button>
            </form>
          )}

          {/* Lista de Rotinas */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exercícios Disponíveis</p>
            {rotinasAquecimento.map((rotina, i) => (
              <div
                key={rotina.id || i}
                className={`w-full p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                  exercicioSelecionado?.id === rotina.id
                    ? "bg-purple-50 border-purple-200 text-purple-900 font-bold" 
                    : "bg-slate-50 border-slate-100 text-slate-700"
                }`}
              >
                <button
                  onClick={() => handleSelecionarExercicio(rotina)}
                  className="flex-1 text-left flex items-center justify-between pr-2"
                >
                  <span className="truncate max-w-[220px]">{rotina.nome}</span>
                  <Play className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                </button>

                {podeCriar && (
                  <button
                    onClick={() => handleDeletarRotina(i)}
                    className="ml-2 p-1 text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}