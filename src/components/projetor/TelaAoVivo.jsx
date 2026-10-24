import React, { useState, useEffect } from "react";
import { Type, Sun, Moon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function TelaAoVivo() {
  const [conteudo, setConteudo] = useState({
    tipo: "espera",
    titulo: "ICMlyrics",
    texto: "Acompanhe as letras em tempo real..."
  });

  const [tamanhoFonte, setTamanhoFonte] = useState("md"); // 'sm', 'md', 'lg'
  const [temaEscuro, setTemaEscuro] = useState(true);

  useEffect(() => {
    // 1. Carregar estado atual
    const carregarEstado = async () => {
      const { data } = await supabase
        .from("projecao_ativa")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (data) setConteudo(data);
    };

    carregarEstado();

    // 2. Escutar eventos do Supabase Realtime
    const channel = supabase
      .channel("canal_ao_vivo")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projecao_ativa", filter: "id=eq.1" },
        (payload) => {
          if (payload.new) setConteudo(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getTamanhoClasse = () => {
    switch (tamanhoFonte) {
      case "sm": return "text-lg";
      case "lg": return "text-3xl font-extrabold";
      default: return "text-2xl font-bold";
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col justify-between ${
      temaEscuro ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* BARRA SUPERIOR DE ACESSIBILIDADE */}
      <div className={`p-4 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 ${
        temaEscuro ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-500">Ao Vivo</span>
        </div>

        {/* CONTROLES DE FONTE E TEMA */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTamanhoFonte(tamanhoFonte === "sm" ? "md" : tamanhoFonte === "md" ? "lg" : "sm")}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 ${
              temaEscuro ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
            }`}
          >
            <Type className="w-4 h-4 text-emerald-500" />
            <span className="uppercase">{tamanhoFonte}</span>
          </button>

          <button
            onClick={() => setTemaEscuro(!temaEscuro)}
            className={`p-2 rounded-xl border ${
              temaEscuro ? "bg-slate-800 border-slate-700 text-amber-400" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            {temaEscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ÁREA CENTRAL DE EXIBIÇÃO DA LETRA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        {conteudo.titulo && (
          <span className={`text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full ${
            temaEscuro ? "bg-white/10 text-emerald-400" : "bg-slate-200 text-emerald-700"
          }`}>
            {conteudo.titulo}
          </span>
        )}

        <p className={`${getTamanhoClasse()} leading-relaxed whitespace-pre-wrap transition-all`}>
          {conteudo.texto}
        </p>
      </div>

      {/* RODAPÉ INFORMATIVO */}
      <div className={`p-4 text-center border-t text-[10px] uppercase font-mono tracking-wider ${
        temaEscuro ? "border-slate-900 text-slate-600" : "border-slate-200 text-slate-400"
      }`}>
        ICMlyrics • Acompanhamento Congregacional
      </div>

    </div>
  );
}