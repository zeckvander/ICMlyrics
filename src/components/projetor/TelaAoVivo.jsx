import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

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
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${config.imagem_fundo_url})`,
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

  return (
    <div 
      className="w-screen h-screen overflow-hidden flex flex-col justify-between select-none relative box-border"
      style={{
        fontFamily: config.fonte_familia || "Inter",
        ...obterEstiloFundo()
      }}
    >
      
      <div className="w-full px-10 py-4 bg-blue-900/90 backdrop-blur-md border-b border-blue-700/50 flex items-center justify-center shrink-0 shadow-xl">
        <span className="text-xl md:text-3xl font-black uppercase tracking-wider text-white text-center truncate max-w-full drop-shadow-md">
          {conteudo.titulo || "ICMlyrics"}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-start justify-center px-8 md:px-12 py-8 w-full overflow-hidden box-border">
        <p 
          className={`text-2xl md:text-3xl lg:text-4xl font-bold uppercase whitespace-pre-wrap tracking-wide text-left break-words ${
            eFundoClaro ? "drop-shadow-none" : "drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
          }`}
          style={{ lineHeight: 1.55 }}
        >
          {conteudo.texto || "Aguardando conteúdo..."}
        </p>
      </div>

      {conteudo.avisoUrgente && (
        <div className="w-full bg-amber-600 text-white py-3 px-6 text-center font-extrabold text-lg md:text-xl uppercase tracking-wider shrink-0 shadow-2xl animate-bounce">
          {conteudo.avisoUrgente}
        </div>
      )}

    </div>
  );
}