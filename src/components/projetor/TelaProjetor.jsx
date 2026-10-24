import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";

export default function TelaProjetor() {
  const [conteudoAtivo, setConteudoAtivo] = useState({
    tipo: "espera", // 'espera', 'louvor', 'biblia', 'aviso'
    titulo: "ICMlyrics",
    texto: "Aguardando projeção...",
    verso: null
  });

  // URL para onde o QR Code do telão vai apontar (o telemóvel da congregação)
  const urlAoVivo = `${window.location.origin}/ao-vivo`;

  useEffect(() => {
    // 1. Buscar estado inicial na tabela do Supabase
    const carregarEstadoInicial = async () => {
      const { data, error } = await supabase
        .from("projecao_ativa")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      
      if (data && !error) {
        setConteudoAtivo(data);
      }
    };

    carregarEstadoInicial();

    // 2. Subscrever às alterações em tempo real via WebSocket do Supabase
    const channel = supabase
      .channel("canal_projecao")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projecao_ativa", filter: "id=eq.1" },
        (payload) => {
          if (payload.new) {
            setConteudoAtivo(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden select-none">
      
      {/* CONTEÚDO PRINCIPAL DA PROJEÇÃO */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-6xl">
        {conteudoAtivo.tipo === "espera" ? (
          <div className="space-y-4 animate-pulse">
            <h1 className="text-5xl font-black tracking-widest text-slate-300">ICMlyricS</h1>
            <p className="text-lg text-slate-500">{conteudoAtivo.texto}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <span className="text-sm font-mono uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full text-emerald-400">
              {conteudoAtivo.titulo}
            </span>
            <p className="text-4xl md:text-6xl font-bold leading-relaxed whitespace-pre-wrap drop-shadow-lg">
              {conteudoAtivo.texto}
            </p>
          </div>
        )}
      </div>

      {/* RODAPÉ / TCKER DE AVISOS (SE HOUVER) */}
      {conteudoAtivo.avisoUrgente && (
        <div className="absolute bottom-0 w-full bg-emerald-900/90 text-emerald-100 py-3 px-6 text-center text-xl font-bold shadow-lg">
          📢 {conteudoAtivo.avisoUrgente}
        </div>
      )}

      {/* QR CODE DISCRETO NO CANTO INFERIOR PARA A CONGREGAÇÃO */}
      <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-3">
        <div className="bg-white p-1.5 rounded-xl">
          <QRCodeSVG value={urlAoVivo} size={50} />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Acompanhe ao vivo</p>
          <p className="text-xs font-extrabold text-emerald-400">Aponte a câmara</p>
        </div>
      </div>

    </div>
  );
}