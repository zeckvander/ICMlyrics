import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, Share2, Calendar, User, Tag } from "lucide-react";
import html2canvas from "html2canvas";

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export default function PreviewModal({ open, onOpenChange, mode, rows, dataCulto, tipoCulto, responsavel }) {
  const [copied, setCopied] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const previewRef = useRef(null);

  const formatarData = (dataStr) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const diaSemana = dataCulto ? DIAS[new Date(dataCulto + "T00:00:00").getDay()] : "";

  const gerarTextoCompartilhamento = () => {
    let texto = `Louvores`;
    if (dataCulto) texto += `\n${formatarData(dataCulto)}${diaSemana ? ` — ${diaSemana}` : ""}`;
    if (tipoCulto) texto += `\nTema: ${tipoCulto}`;
    if (responsavel) texto += `\nResponsável: ${responsavel}`;
    
    texto += `\n\n-----------\n`;

    rows.forEach((row) => {
      if (row.type === "divider") {
        const nomeSecao = (row.text || row.nome || "Seção").toUpperCase();
        texto += `-- ${nomeSecao}\n`;
      } else {
        const num = row.numero ? `${row.numero}` : (row.categoria === "Avulsos" ? "AV" : "");
        const nome = row.nome || row.buscaLouvor || "";
        const obs = row.observacao ? ` (${row.observacao})` : "";
        if (num || nome) {
          texto += `${num ? `${num} - ` : ""}${nome}${obs}\n`;
        }
      }
    });

    return texto.trim();
  };

  const textoFormatado = gerarTextoCompartilhamento();

  const handleCopyText = () => {
    navigator.clipboard.writeText(textoFormatado);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Lista de Louvores",
          text: textoFormatado,
        });
      } catch (error) {
        console.log("Erro ao compartilhar:", error);
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadImage = async () => {
    if (!previewRef.current) return;
    try {
      setLoadingImg(true);
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `lista-culto-${dataCulto || "geral"}.png`;
      link.click();
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
    } finally {
      setLoadingImg(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Visualizar Lista</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 my-2 p-2 bg-slate-100 rounded-lg space-y-4">
          <div className="flex justify-center">
            <div 
              ref={previewRef} 
              className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden text-slate-800 border border-slate-200"
            >
              <div className="bg-slate-900 text-white p-5 text-center space-y-2">
                <h2 className="font-bold text-xl tracking-tight">Lista de Louvores</h2>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300 font-medium pt-1">
                  {dataCulto && (
                    <span className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> {formatarData(dataCulto)} {diaSemana && `- ${diaSemana}`}
                    </span>
                  )}
                  {tipoCulto && (
                    <span className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700 uppercase tracking-wider text-[10px]">
                      <Tag className="w-3.5 h-3.5 text-amber-400" /> {tipoCulto}
                    </span>
                  )}
                </div>
                {responsavel && (
                  <div className="pt-1 text-xs text-slate-300 flex items-center justify-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-400" /> Responsável: <span className="text-white font-semibold">{responsavel}</span>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-2.5 text-sm">
                {rows.map((row, idx) => {
                  if (row.type === "divider") {
                    return (
                      <div key={row.id || idx} className="font-bold text-slate-700 text-center uppercase tracking-wider bg-slate-100 py-1.5 px-3 rounded-lg mt-4 mb-2 text-xs border border-slate-200">
                        {row.text || row.nome || "Seção"}
                      </div>
                    );
                  }
                  const nomeLouvor = row.nome || row.buscaLouvor;
                  if (!nomeLouvor && !row.numero) return null;
                  const identificador = row.numero ? row.numero : (row.categoria === "Avulsos" ? "AV" : "");

                  return (
                    <div key={row.id || idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2.5">
                        {identificador && (
                          <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-xs border border-slate-200 min-w-[32px] text-center">
                            {identificador}
                          </span>
                        )}
                        <span className="text-slate-700 font-medium uppercase text-xs">{nomeLouvor}</span>
                      </div>
                      {row.observacao && (
                        <span className="text-xs text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded">
                          {row.observacao}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {mode === "image-text" && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Texto para WhatsApp</span>
                <Button size="sm" variant="outline" onClick={handleCopyText} className="h-7 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <textarea 
                readOnly 
                value={textoFormatado} 
                className="w-full h-32 text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-700 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyText} className="flex-1">
              {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copiado!" : "Copiar Texto"}
            </Button>
            {navigator.share && (
              <Button variant="outline" onClick={handleShare} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" /> Compartilhar
              </Button>
            )}
          </div>
          <Button onClick={handleDownloadImage} disabled={loadingImg} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {loadingImg ? "Gerando..." : "Baixar Imagem"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}