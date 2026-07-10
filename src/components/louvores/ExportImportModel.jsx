import React, { useState, useRef } from "react";
import { Download, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExportImportModel({ onImported }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState(null);
  
  // CORREÇÃO: Referência mecânica para disparar o clique no input oculto
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setStatus(null);
    try {
      // CORREÇÃO: Agora busca os dados locais do localStorage (padrão do seu app)
      const data = JSON.parse(localStorage.getItem("icm_louvores") || "[]");
      
      const model = data.map((l) => ({
        numero: l.numero || "",
        nome: l.nome || "",
        categoria: l.categoria || "Avulsos",
        ritmo: l.ritmo || "",
        mapa_musica: l.mapa_musica || "",
        bpm_compasso: l.bpm_compasso || "",
        instrumentos: l.instrumentos || "",
        link_referencia: l.link_referencia || "",
        soprano: l.soprano || "",
        contralto: l.contralto || "",
        tenor: l.tenor || "",
        baixo: l.baixo || "",
        sugestoes_ensaio: l.sugestoes_ensaio || "",
        cifra_tom_original: l.cifra_tom_original || "",
        cifra_tom_alternativo: l.cifra_tom_alternativo || "",
        letra_musica: l.letra_musica || "",
      }));

      const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modelo_louvores.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus({ type: "success", msg: `${model.length} louvores exportados!` });
    } catch (e) {
      setStatus({ type: "error", msg: "Erro ao exportar." });
    }
    setExporting(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setStatus(null);
    try {
      const text = await file.text();
      const records = JSON.parse(text);
      if (!Array.isArray(records)) throw new Error("Formato inválido");
      
      const valid = records.filter((r) => r.nome);
      const cleaned = valid.map((r) => ({
        id: r.id || "local_" + Date.now() + Math.random().toString(36).substr(2, 5),
        numero: r.numero || "",
        nome: r.nome,
        categoria: r.categoria || "Avulsos",
        ritmo: r.ritmo || "",
        mapa_musica: r.mapa_musica || "",
        bpm_compasso: r.bpm_compasso || "",
        instrumentos: r.instrumentos || "",
        link_referencia: r.link_referencia || "",
        soprano: r.soprano || "",
        contralto: r.contralto || "",
        tenor: r.tenor || "",
        baixo: r.baixo || "",
        sugestoes_ensaio: r.sugestoes_ensaio || "",
        cifra_tom_original: r.cifra_tom_original || "",
        cifra_tom_alternativo: r.cifra_tom_alternativo || "",
        letra_musica: r.letra_musica || "",
        created_date: r.created_date || new Date().toISOString()
      }));

      // CORREÇÃO: Agora salva diretamente no localStorage unificando com o banco atual
      const currentLouvores = JSON.parse(localStorage.getItem("icm_louvores") || "[]");
      
      // Evita duplicar hinos que já tenham o mesmo ID ou número/nome idênticos
      const filtradosNovos = cleaned.filter(
        (novo) => !currentLouvores.some((atual) => atual.numero === novo.numero && atual.nome === novo.nome)
      );

      const listaFinal = [...currentLouvores, ...filtradosNovos];
      localStorage.setItem("icm_louvores", JSON.stringify(listaFinal));

      setStatus({ type: "success", msg: `${filtradosNovos.length} novos louvores adicionados!` });
      onImported?.();
    } catch (err) {
      setStatus({ type: "error", msg: "Erro: arquivo JSON inválido." });
    }
    setImporting(false);
    e.target.value = "";
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Gestão de Louvores (Admin)</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="flex-1 bg-white">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
          Exportar JSON
        </Button>
        
        {/* CORREÇÃO: Eliminada a tag <label> conflituosa. O botão gerencia o clique via Ref */}
        <div className="flex-1">
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".json" 
            onChange={handleImport} 
            className="hidden" 
            disabled={importing} 
          />
          <Button 
            variant="outline" 
            size="sm" 
            disabled={importing} 
            className="w-full bg-white"
            onClick={handleButtonClick}
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
            Importar JSON
          </Button>
        </div>
      </div>
      
      {status && (
        <div className={`flex items-center gap-2 text-xs font-medium ${status.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
          {status.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.msg}
        </div>
      )}
    </div>
  );
}