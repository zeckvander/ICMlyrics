import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, Share2, Calendar, User, Tag } from "lucide-react";
import { toBlob, toPng } from "html-to-image";

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export default function PreviewModal({ 
  open, 
  onOpenChange, 
  rows = [], 
  dataCulto, 
  tipoCulto, 
  responsavel,
  item,        
  ...rest 
}) {
  const [copied, setCopied] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const previewRef = useRef(null);

  const dadosHistorico = item || rest.culto || rest.dados || rest.registro || {};

  const dataFinal = dataCulto || dadosHistorico.data_culto || dadosHistorico.dataCulto || dadosHistorico.data;
  const cultoFinal = tipoCulto || dadosHistorico.tipo_culto || dadosHistorico.tipoCulto || dadosHistorico.tema || dadosHistorico.tipo;
  const responsavelFinal = responsavel || dadosHistorico.responsavel || dadosHistorico.lider || dadosHistorico.responsavelLouvor;
  const rowsFinal = rows.length > 0 ? rows : (dadosHistorico.rows || dadosHistorico.louvores || dadosHistorico.itens || []);

  const formatarData = (dataStr) => {
    if (!dataStr) return "";
    const partes = dataStr.split("T")[0].split("-");
    if (partes.length === 3) {
      const [ano, mes, dia] = partes;
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  };

  const diaSemana = dataFinal ? DIAS[new Date(dataFinal.split("T")[0] + "T00:00:00").getDay()] : "";

  const getCategoriaInfo = (row) => {
    const cat = (row.categoria || row.tipo || "").trim().toUpperCase();
    const isCias = cat.includes("CIAS");
    const isAvulso = cat.includes("AVULSO") || cat === "AV";
    return { isCias, isAvulso };
  };

  const obterIdentificador = (row) => {
    if (row.numero) return String(row.numero);
    const { isCias, isAvulso } = getCategoriaInfo(row);
    if (isAvulso) return "AV";
    if (isCias) return "CIAS";
    return "";
  };

  const obterNomeFormatado = (row) => {
    let nome = row.nome || row.buscaLouvor || "";
    const { isCias } = getCategoriaInfo(row);
    if (isCias && row.numero) {
      if (!nome.toUpperCase().includes("(CIAS)")) {
        nome += " (CIAS)";
      }
    }
    return nome;
  };

  const gerarTextoCompartilhamento = () => {
    let texto = `Louvores`;
    if (dataFinal) texto += `\n${formatarData(dataFinal)}${diaSemana ? ` — ${diaSemana}` : ""}`;
    if (cultoFinal) texto += `\nCulto: ${cultoFinal}`;
    if (responsavelFinal) texto += `\nResponsável: ${responsavelFinal}`;
    
    texto += `\n\n-----------\n`;

    rowsFinal.forEach((row) => {
      if (row.type === "divider") {
        const nomeSecao = (row.text || row.nome || "Seção").toUpperCase();
        texto += `-- ${nomeSecao}\n`;
      } else {
        const num = obterIdentificador(row);
        const nome = obterNomeFormatado(row);
        const obs = row.observacao ? ` (${row.observacao})` : "";
        
        if (num || nome) {
          // Alinha todos os identificadores considerando o espaço de 4 caracteres ("CIAS")
          const numFormatado = num ? num.padEnd(4, ' ') : '';
          texto += `${numFormatado}${num ? ' - ' : ''}${nome}${obs}\n`;
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
    if (!previewRef.current) return;
    try {
      setLoadingImg(true);
      const blob = await toBlob(previewRef.current, { cacheBust: true, pixelRatio: 2 });
      if (!blob) {
        setLoadingImg(false);
        return;
      }
      const file = new File([blob], `lista-culto-${dataFinal || "geral"}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Lista de Louvores",
            text: textoFormatado,
            files: [file],
          });
          setLoadingImg(false);
          return;
        } catch (err) {
          if (err.name !== "AbortError") console.log("Erro ao compartilhar arquivo:", err);
        }
      }

      if (navigator.share) {
        await navigator.share({
          title: "Lista de Louvores",
          text: textoFormatado,
        });
      } else {
        handleCopyText();
      }
      setLoadingImg(false);
    } catch (error) {
      console.error("Erro ao gerar imagem para compartilhamento:", error);
      setLoadingImg(false);
      handleCopyText();
    }
  };

  const handleDownloadImage = async () => {
    if (!previewRef.current) return;
    try {
      setLoadingImg(true);
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `lista-culto-${dataFinal || "geral"}.png`;
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
                  {dataFinal && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" /> 
                      <span>{formatarData(dataFinal)} {diaSemana && `- ${diaSemana}`}</span>
                    </span>
                  )}
                  {cultoFinal && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700 uppercase tracking-wider text-[10px]">
                      <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" /> 
                      <span>{cultoFinal}</span>
                    </span>
                  )}
                </div>
                {responsavelFinal && (
                  <div className="pt-1 text-xs text-slate-300 flex items-center justify-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 
                    <span>Responsável: <span className="text-white font-semibold">{responsavelFinal}</span></span>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-2.5 text-sm">
                {rowsFinal.map((row, idx) => {
                  if (row.type === "divider") {
                    return (
                      <div key={row.id || idx} className="font-bold text-slate-700 text-center uppercase tracking-wider bg-slate-100 py-1.5 px-3 rounded-lg mt-4 mb-2 text-xs border border-slate-200">
                        {row.text || row.nome || "Seção"}
                      </div>
                    );
                  }
                  const nomeLouvor = obterNomeFormatado(row);
                  if (!nomeLouvor && !row.numero) return null;
                  
                  const identificador = obterIdentificador(row);

                  return (
                    <div key={row.id || idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2.5">
                        {identificador && (
                          <span 
                            style={{ width: '52px' }} 
                            className="inline-flex items-center justify-center bg-slate-100 text-slate-800 font-bold py-1 rounded text-xs border border-slate-200 text-center shrink-0"
                          >
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
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyText} className="flex-1">
              {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copiado!" : "Copiar Texto"}
            </Button>
            {navigator.share && (
              <Button variant="outline" onClick={handleShare} disabled={loadingImg} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" /> {loadingImg ? "Aguarde..." : "Compartilhar"}
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