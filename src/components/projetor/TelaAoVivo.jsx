import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Type } from "lucide-react";

export default function TelaAoVivo() {
  const [conteudo, setConteudo] = useState({
    tipo: "espera",
    titulo: "Aguardando...",
    texto: "Aguardando projeção...",
    avisoUrgente: null
  });

  const [config, setConfig] = useState({
    fonte_familia: "Inter",
    tema_modo: "escuro",
    imagem_fundo_url: ""
  });

  const [tamanhoIndex, setTamanhoIndex] = useState(1);

  const ciclosTamanhos = [
    { id: "pequeno", label: "P", classe: "text-base sm:text-2xl md:text-3xl lg:text-4xl" },
    { id: "medio", label: "M", classe: "text-xl sm:text-3xl md:text-4xl lg:text-5xl" },
    { id: "grande", label: "G", classe: "text-2xl sm:text-4xl md:text-5xl lg:text-6xl" },
    { id: "gg", label: "GG", classe: "text-3xl sm:text-5xl md:text-6xl lg:text-7xl" }
  ];

  const alternarTamanho = () => {
    setTamanhoIndex((prev) => (prev + 1) % ciclosTamanhos.length);
  };

  useEffect(() => {
    const carregarTudo = async () => {
      const { data: projData } = await supabase
        .from("projecao_ativa")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (projData) setConteudo(projData);

      const { data: confData } = await supabase
        .from("configuracoes_projecao")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (confData) setConfig(confData);
    };

    carregarTudo();

    const canalProj = supabase
      .channel("canal_projecao_ao_vivo")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projecao_ativa", filter: "id=eq.1" },
        (payload) => {
          if (payload.new) setConteudo(payload.new);
        }
      )
      .subscribe();

    const canalConf = supabase
      .channel("canal_config_ao_vivo")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "configuracoes_projecao", filter: "id=eq.1" },
        (payload) => {
          if (payload.new) setConfig(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalProj);
      supabase.removeChannel(canalConf);
    };
  }, []);

  const eFundoClaro = config.tema_modo === "claro";

  const obterEstiloFundo = () => {
    if (config.tema_modo === "imagem" && config.imagem_fundo_url) {
      return {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.75)), url(${config.imagem_fundo_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#ffffff"
      };
    }
    if (eFundoClaro) {
      return { backgroundColor: "#f8fafc", color: "#0f172a" };
    }
    return { backgroundColor: "#030712", color: "#ffffff" };
  };

  const renderizarTextoComDestaque = (texto) => {
    if (!texto) return null;
    
    const linhas = texto.split("\n");
    return linhas.map((linha, idx) => {
      const linhaTrim = linha.trim();
      
      const matchInstrucao = linhaTrim.match(/^(coro|final|estrofe[\w\s]*|instrumento[\w\s]*|solo[\w\s]*|intro[\w\s]*|interludio[\w\s]*|ponte[\w\s]*)([:\s]*.*)?$/i);

      if (matchInstrucao) {
        const palavraComando = matchInstrucao[1];
        const resto = linhaTrim.substring(palavraComando.length);

        return (
          <span key={idx} className="block font-black">
            <span className="text-amber-300">{palavraComando}</span>
            <span className="text-white">{resto}</span>
          </span>
        );
      }

      return (
        <span key={idx} className="block">
          {linha}
        </span>
      );
    });
  };

  const ehPrimeiroSlideTitulo = !conteudo.texto || conteudo.texto.trim() === "";
  const numeroPalavras = conteudo.titulo ? conteudo.titulo.split(/\s+/).length : 0;
  
  const classeTitulo = numeroPalavras > 6 
    ? "text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wide text-left leading-snug drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] max-w-5xl" 
    : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-normal text-left whitespace-nowrap drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]";

  return (
    <div 
      className="w-screen h-screen overflow-hidden flex flex-col justify-between select-none relative box-border"
      style={{
        fontFamily: config.fonte_familia || "Inter",
        ...obterEstiloFundo()
      }}
    >
      {!ehPrimeiroSlideTitulo && (
        <div className="w-full px-6 sm:px-12 py-3.5 sm:py-5 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-b-2 border-blue-700/80 relative flex items-center justify-between shrink-0 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="italic font-serif text-amber-300 text-lg sm:text-2xl tracking-wide drop-shadow-md">
              
            </span>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 max-w-[60%] truncate">
            <span className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {conteudo.titulo || "ICMlyrics"}
            </span>
          </div>

          <div className="flex md:hidden items-center bg-black/40 rounded-xl p-1 border border-blue-700/60 gap-1 ml-auto">
            <button
              onClick={alternarTamanho}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 shadow flex items-center gap-1.5 cursor-pointer"
            >
              <span>{ciclosTamanhos[tamanhoIndex].label}</span>
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col items-start justify-center pl-4 sm:pl-8 pr-6 py-8 w-full overflow-hidden box-border ${ehPrimeiroSlideTitulo ? "h-full" : ""}`}>
        {ehPrimeiroSlideTitulo ? (
          <h1 
            className={classeTitulo}
            style={{ wordBreak: "normal", overflowWrap: "normal" }}
          >
            {conteudo.titulo}
          </h1>
        ) : (
          <p 
            className={`font-bold uppercase tracking-wide text-left transition-all duration-200 ${ciclosTamanhos[tamanhoIndex].classe} ${
              eFundoClaro ? "drop-shadow-none" : "drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
            }`}
            style={{ 
              lineHeight: 1.55, 
              wordBreak: "break-word", 
              overflowWrap: "break-word" 
            }}
          >
            {renderizarTextoComDestaque(conteudo.texto)}
          </p>
        )}
      </div>

      {conteudo.avisoUrgente && (
        <div className="w-full bg-amber-600 text-white py-3 px-6 text-center font-extrabold text-base sm:text-lg md:text-xl uppercase tracking-wider shrink-0 shadow-2xl animate-bounce">
          {conteudo.avisoUrgente}
        </div>
      )}
    </div>
  );
}