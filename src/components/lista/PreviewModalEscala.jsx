import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, Share2, Calendar, User, Tag, UserCheck } from "lucide-react";
import { toBlob, toPng } from "html-to-image";

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const ESCALA_PADRAO = [
  { nome: "Ezequiel", funcao: "Instrumento", detalhe: "Teclado" },
  { nome: "Nerisvan", funcao: "Instrumento", detalhe: "Violão" },
  { nome: "Eduarda", funcao: "Instrumento", detalhe: "Violão" },
  { nome: "Rodolfo", funcao: "Instrumento", detalhe: "Bateria" },
  { nome: "Karen", funcao: "Instrumento", detalhe: "Violino" },
  { nome: "Lucas", funcao: "Voz", detalhe: "Baixo" },
  { nome: "Jennifer", funcao: "Voz", detalhe: "Contralto" },
  { nome: "Eduarda", funcao: "Voz", detalhe: "Contralto" },
  { nome: "Daniela", funcao: "Vocalista", detalhe: "Soprano" },
  { nome: "Rafaela", funcao: "Voz", detalhe: "Soprano" },
  { nome: "Rosa", funcao: "Voz", detalhe: "Soprano" },
  { nome: "Ivanilda", funcao: "Voz", detalhe: "Soprano" },
  { nome: "Emilly", funcao: "Voz", detalhe: "Soprano" },
  { nome: "Graziela", funcao: "Voz", detalhe: "Soprano" },
  { nome: "Ruan", funcao: "Sonoplastia", detalhe: "Operador de Áudio" },
  { nome: "Kiwison", funcao: "Mídia", detalhe: "Projeção / Slides" },
];

export default function PreviewModalEscala({ 
  open, 
  onOpenChange, 
  rows = [], 
  dataCulto, 
  tipoCulto, 
  responsavel,
  dirigente,
  louvor,
  palavra,
  item,        
  ...rest 
}) {
  const [copied, setCopied] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const previewRef = useRef(null);

  const dadosHistorico = item || rest.culto || rest.dados || rest.registro || {};
  const dataFinal = dataCulto || dadosHistorico.data_culto || dadosHistorico.dataCulto || dadosHistorico.data;
  const cultoFinal = tipoCulto || dadosHistorico.tipo_culto || dadosHistorico.tipoCulto || dadosHistorico.tipo || "Regular";
  const louvorFinal = louvor || responsavel || dadosHistorico.louvor || dadosHistorico.responsavel || dadosHistorico.lider;
  const palavraFinal = palavra || dirigente || dadosHistorico.palavra || dadosHistorico.dirigente || dadosHistorico.ministro;
  
  const rowsFinal = rows.length > 0 
    ? rows 
    : (dadosHistorico.rows || dadosHistorico.escalados || ESCALA_PADRAO);

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

  const gerarTextoCompartilhamento = () => {
    let texto = `*GRUPO DE LOUVOR*`;
    if (dataFinal) texto += `\n📅 *Data:* ${formatarData(dataFinal)}${diaSemana ? ` — ${diaSemana}` : ""}`;
    if (cultoFinal) texto += `\n🏷️ *Tipo de Culto:* ${cultoFinal}`;
    if (louvorFinal) texto += `\n👤 *Louvor:* ${louvorFinal}`;
    if (palavraFinal) texto += `\n🎤 *Palavra:* ${palavraFinal}`;
    
    texto += `\n\n-----------------------------------\n*INTEGRANTES ESCALADOS:*\n\n`;

    rowsFinal.forEach((row) => {
      const nome = row.nome || row.musico || "";
      const instrumentoOuVoz = row.detalhe || row.instrumento || row.categoria || row.funcao || "";
      const funcaoMacro = row.funcao && row.funcao !== instrumentoOuVoz ? row.funcao : (row.categoria || row.classificacao || "");

      if (nome) {
        texto += `• *${nome}* | ${instrumentoOuVoz}${funcaoMacro ? ` (${funcaoMacro})` : ""}\n`;
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
      const file = new File([blob], `escala-louvor-${dataFinal || "geral"}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Escala Grupo de Louvor",
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
          title: "Escala Grupo de Louvor",
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
      link.download = `escala-louvor-${dataFinal || "geral"}.png`;
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
          <DialogTitle>Visualizar Escala</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 my-2 p-2 bg-slate-100 rounded-lg space-y-4">
          <div className="flex justify-center">
            <div 
              ref={previewRef} 
              className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden text-slate-800 border border-slate-200"
            >
              <div className="bg-slate-900 text-white p-5 text-center space-y-2">
                <h2 className="font-bold text-xl tracking-tight">Grupo de Louvor</h2>
                
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
                <div className="pt-1 text-xs text-slate-300 space-y-1">
                  {louvorFinal && (
                    <div className="flex items-center justify-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 
                      <span>Louvor: <span className="text-white font-semibold">{louvorFinal}</span></span>
                    </div>
                  )}
                  {palavraFinal && (
                    <div className="flex items-center justify-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" /> 
                      <span>Palavra: <span className="text-white font-semibold">{palavraFinal}</span></span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                      <th className="py-2 px-2">Nome do Músico</th>
                      <th className="py-2 px-2">Classificação</th>
                      <th className="py-2 px-2 text-right">Instrumento / Voz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rowsFinal.map((row, idx) => {
                      const nome = row.nome || row.musico || "";
                      const instrumentoOuVoz = row.detalhe || row.instrumento || row.categoria || row.funcao || "";
                      const funcaoMacro = row.funcao && row.funcao !== instrumentoOuVoz ? row.funcao : (row.categoria || row.classificacao || "");

                      if (!nome) return null;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2 font-semibold text-slate-800">{nome}</td>
                          <td className="py-2 px-2 text-slate-700 font-medium">
                            {funcaoMacro}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-700 font-medium">{instrumentoOuVoz}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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