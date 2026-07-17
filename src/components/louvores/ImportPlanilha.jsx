import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";

export default function ImportPlanilha({ onImported }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("importing");
    setMessage("Processando planilha...");
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const records = results.data.map((row) => ({
            numero: row.numero || "",
            nome: row.nome || "Sem nome",
            categoria: row.categoria || "Avulsos",
            ritmo: row.ritmo || null,
            cifra_tom_original: row.cifra_tom_original || null,
            letra_musica: row.letra_musica || null,
          }));

          const { error } = await supabase.from('louvores').insert(records);

          if (error) throw error;

          setStatus("done");
          setMessage(`${records.length} louvores importados com sucesso!`);
          onImported?.();
        } catch (err) {
          setStatus("error");
          setMessage("Erro ao salvar no banco: " + err.message);
        }
      },
      error: () => {
        setStatus("error");
        setMessage("Erro ao ler o arquivo CSV.");
      }
    });
  };

  const reset = () => { setStatus("idle"); setMessage(""); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-700">
        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
        <h2 className="text-lg font-bold">Importar Planilha (CSV)</h2>
      </div>

      {status === "idle" && (
        <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
          <Upload className="w-8 h-8 text-slate-400" />
          <span className="text-sm text-slate-500 font-medium">Toque para escolher um arquivo .CSV</span>
          <input type="file" className="hidden" accept=".csv" onChange={handleFile} />
        </label>
      )}

      {status === "importing" && (
        <div className="flex flex-col items-center gap-3 p-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-600">{message}</p>
        </div>
      )}

      {status === "done" && (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          <p className="text-sm font-medium text-slate-700">{message}</p>
          <Button size="sm" onClick={reset}>Importar outro</Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm text-red-600">{message}</p>
          <Button size="sm" variant="outline" onClick={reset}>Tentar novamente</Button>
        </div>
      )}
    </div>
  );
}