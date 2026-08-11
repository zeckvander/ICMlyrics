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
  const dataBruta = dataCulto || dadosHistorico.data_culto || dadosHistorico.dataCulto || dadosHistorico.data;
  
  let cultoRaw = tipoCulto || dadosHistorico.tipo_culto || dadosHistorico.tipoCulto || dadosHistorico.tipo || "";
  if (cultoRaw.toUpperCase().includes("EVENTO GERAL") || cultoRaw.toUpperCase() === "CULTO") {
    cultoRaw = ""; 
  }
  const cultoFinal = cultoRaw;

  const louvorFinal = louvor || responsavel || dadosHistorico.louvor || dadosHistorico.responsavel || dadosHistorico.lider || "";
  const palavraFinal = palavra || dirigente || dadosHistorico.palavra || dadosHistorico.dirigente || dadosHistorico.ministro || "";
  
  const rowsRaw = rows.length > 0 
    ? rows 
    : (dadosHistorico.rows || dadosHistorico.escalados || ESCALA_PADRAO);

  const rowsFinal = rowsRaw.map((row) => {
    const nome = row.nome || row.musico || row.nome_musico || row.integrante || "";
    const detalhe = row.detalhe || row.instrumento || row.voz || row.papel || "";
    const funcao = row.funcao || row.categoria || row.classificacao || "";
    return { nome, detalhe, funcao };
  });

  const extrairDataValida = (str) => {
    if (!str) return "";
    const matchISO = String(str).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (matchISO) return `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}`;
    const matchBR = String(str).match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (matchBR) return `${matchBR[3]}-${matchBR[2]}-${matchBR[1]}`;
    return str.split("T")[0];
  };

  const dataLimpa = extrairDataValida(dataBruta);

  const formatarData = (dataStr) => {
    if (!dataStr) return "";
    const partes = dataStr.split("-");
    if (partes.length === 3) {
      const [ano, mes, dia] = partes;
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  };

  const obterDiaSemana = (dataStr) => {
    if (!dataStr) return "";
    const partes = dataStr.split("-");
    if (partes.length === 3) {
      const dataObj = new Date(`${partes[0]}-${partes[1]}-${partes[2]}T00:00:00`);
      return DIAS[dataObj.getDay()] || "";
    }
    return "";
  };

  const diaSemanaFinal = obterDiaSemana(dataLimpa);
  const dataFormatadaExibicao = formatarData(dataLimpa);

  const gerarTextoCompartilhamento = () => {
    let texto = `*GRUPO DE LOUVOR*`;
    if (dataLimpa) texto += `\n📅 *Data:* ${dataFormatadaExibicao}${diaSemanaFinal ? ` — ${diaSemanaFinal}` : ""}`;
    if (cultoFinal) texto += `\n🏷️ *Tipo de Culto:* ${cultoFinal}`;
    if (louvorFinal) texto += `\n👤 *Louvor:* ${louvorFinal}`;
    if (palavraFinal) texto += `\n🎤 *Palavra:* ${palavraFinal}`;
    
    texto += `\n\n-----------------------------------\n*INTEGRANTES ESCALADOS:*\n\n`;

    const validRows = rowsFinal.filter(r => r.nome.trim() !== "");
    const maxLength = validRows.reduce((max, r) => Math.max(max, r.nome.length), 0);

    validRows.forEach(({ nome, detalhe, funcao }) => {
      // Uso de espaço sem quebra (\u00A0) para o WhatsApp não apagar os espaços ao colar
      const diff = maxLength - nome.length;
      const espacos = "\u00A0".repeat(Math.max(0, diff));
      texto += `• *${nome}*${espacos} | ${detalhe}${funcao && funcao !== detalhe ? ` (${funcao})` : ""}\n`;
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
      const file = new File([blob], `escala-louvor-${dataLimpa || "geral"}.png`, { type: "image/png" });

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
      link.download = `escala-louvor-${dataLimpa || "geral"}.png`;
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
                  {dataLimpa && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" /> 
                      <span>{dataFormatadaExibicao} {diaSemanaFinal && `- ${diaSemanaFinal}`}</span>
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
                    {rowsFinal.map(({ nome, detalhe, funcao }, idx) => {
                      if (!nome) return null;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2 font-semibold text-slate-800">{nome}</td>
                          <td className="py-2 px-2 text-slate-700 font-medium">{funcao}</td>
                          <td className="py-2 px-2 text-right text-slate-700 font-medium">{detalhe}</td>
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