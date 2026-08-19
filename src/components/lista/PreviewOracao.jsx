import React, { useState, useRef } from "react";
import { X, Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";

export default function PreviewOracao({
  open,
  onOpenChange,
  periodo,
  agendamentosAgrupados = []
}) {
  const [gerando, setGerando] = useState(false);
  const printRef = useRef(null);

  if (!open) return null;

  const preenchidos = agendamentosAgrupados.length;
  const totalSlotsPossiveis = periodo?.intervalo_minutos === 15 ? 96 : 48;
  const faltantes = Math.max(0, totalSlotsPossiveis - preenchidos);

  const dataAtualFormatada = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const handleBaixarImagem = async () => {
    if (!printRef.current) return;
    try {
      setGerando(true);
      const dataUrl = await toPng(printRef.current, { cacheBust: true, quality: 0.95, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `escala-oracao-${periodo?.motivo ? periodo.motivo.toLowerCase().replace(/\s+/g, '-') : 'relatorio'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
      alert("Não foi possível gerar a imagem.");
    } finally {
      setGerando(false);
    }
  };

  const handleCompartilhar = async () => {
    if (!printRef.current) return;
    try {
      setGerando(true);
      const dataUrl = await toPng(printRef.current, { cacheBust: true, quality: 0.95, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "escala-oracao.png", { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Escala de Oração",
          text: `Escala de Oração: ${periodo?.motivo || ""}`
        });
      } else {
        handleBaixarImagem();
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Erro ao compartilhar:", err);
        handleBaixarImagem();
      }
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden p-4 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">Visualizar Relatório de Oração</h2>
            <p className="text-xs text-slate-400">Pré-visualização pronta para exportação</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 rounded-xl border border-slate-200 flex justify-center">
          <div 
            ref={printRef}
            className="w-[600px] bg-white p-6 rounded-lg shadow-sm font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-slate-800"
          >
            <div style={{ backgroundColor: "#ffffff", color: "#0f172a", padding: "20px", borderRadius: "16px", textAlign: "center", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "#e11d48", backgroundColor: "#fff1f2", padding: "4px 12px", borderRadius: "9999px", border: "1px solid #fecdd3", display: "inline-block", marginBottom: "10px" }}>
                {periodo?.nome_igreja || "Relatório de Oração"}
              </span>
              <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", margin: "0 0 8px 0" }}>
                {periodo?.motivo || "Período de Oração"}
              </h1>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
                <span>📅</span>
                <span>
                  {periodo?.data_inicio ? periodo.data_inicio.split("-").reverse().join("/") : ""} a {periodo?.data_fim ? periodo.data_fim.split("-").reverse().join("/") : ""}
                </span>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                  <th style={{ padding: "8px 12px", border: "1px solid #0f172a", width: "110px", fontWeight: "600" }}>Horário</th>
                  <th style={{ padding: "8px 12px", border: "1px solid #0f172a", fontWeight: "600" }}>Membro(s) / Participante(s)</th>
                </tr>
              </thead>
              <tbody>
                {agendamentosAgrupados.length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ padding: "16px", textAlign: "center", color: "#94a3b8", border: "1px solid #cbd5e1" }}>
                      Nenhum agendamento registrado.
                    </td>
                  </tr>
                ) : (
                  agendamentosAgrupados.map((group, idx) => (
                    <tr key={group.horario} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                      <td style={{ padding: "8px 12px", border: "1px solid #cbd5e1", fontWeight: "600", color: "#334155", whiteSpace: "nowrap" }}>
                        {group.horario}
                      </td>
                      <td style={{ padding: "8px 12px", border: "1px solid #cbd5e1", color: "#0f172a" }}>
                        {group.pessoas.map((p, pIdx) => (
                          <span key={p.id}>
                            {p.nome_membro}{pIdx < group.pessoas.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", fontSize: "10px", color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: "10px", fontWeight: "600" }}>
              <div>
                <span>Preenchidos: {preenchidos}</span>
                <span style={{ margin: "0 8px", color: "#cbd5e1" }}>|</span>
                <span>Faltantes: {faltantes}</span>
              </div>
              <div>
                <span>Gerado em: {dataAtualFormatada}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 shrink-0">
          <Button
            onClick={handleBaixarImagem}
            disabled={gerando}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs h-10 font-semibold gap-1.5 cursor-pointer shadow-sm"
          >
            {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Baixar Imagem
          </Button>

          <Button
            onClick={handleCompartilhar}
            disabled={gerando}
            variant="outline"
            className="w-full bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl text-xs h-10 font-semibold gap-1.5 cursor-pointer shadow-2xs"
          >
            {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 text-slate-600" />}
            Compartilhar
          </Button>
        </div>

      </div>
    </div>
  );
}