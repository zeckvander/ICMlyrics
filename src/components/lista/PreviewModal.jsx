import React, { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, Check } from "lucide-react";
import ListaPreview from "./ListaPreview";
import html2canvas from "html2canvas";

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function gerarTexto(rows, dataCulto) {
  let txt = "Folha de Louvores ICM\n";
  txt += `Data: ${formatDate(dataCulto)}\n`;
  rows.forEach((r) => {
    if (r.type === "divider") {
      if (r.text?.trim()) txt += `\n${r.text}\n`;
    } else {
      const num = r.numero ? `[${r.numero}]` : "";
      const nome = (r.nome || "").toUpperCase();
      txt += `${num} - ${nome}\n`;
    }
  });
  return txt.trim();
}

export default function PreviewModal({ open, onOpenChange, mode, rows, dataCulto }) {
  const previewRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const texto = gerarTexto(rows, dataCulto);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: null });
    const link = document.createElement("a");
    link.download = "lista-louvores.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloading(false);
  };

  const handleShare = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: null });
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "louvores.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Louvores", text: texto });
      } else {
        handleDownload();
      }
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center py-2">
          <ListaPreview ref={previewRef} rows={rows} dataCulto={dataCulto} />
        </div>
        <div className="flex gap-2 mt-2">
          <Button onClick={handleDownload} disabled={downloading} className="flex-1">
            <Download className="w-4 h-4" /> Baixar Imagem
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1">
            <Share2 className="w-4 h-4" /> Compartilhar
          </Button>
        </div>
        {mode === "image-text" && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Texto para WhatsApp</span>
              <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 text-xs">
                {copied ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
              </Button>
            </div>
            <pre className="bg-slate-50 rounded-lg p-3 text-xs whitespace-pre-wrap font-sans text-slate-700 max-h-48 overflow-y-auto">{texto}</pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}