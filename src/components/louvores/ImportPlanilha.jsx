import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const RITMO_VALIDOS = ["VALSA", "VALSEADO", "COUNTRY", "BÁSICO", "GUARÂNIA", "BÁSICO II", "MARCHA", "MARCHA MARCIAL", "FOX", "BALADA", "NOVO", "BLUE", "CANÇÃO", "TOADA", "REPIQUE"];
const CATEGORIAS_VALIDAS = ["Avulsos", "Cias", "Coletânea"];

function normalizeCategoria(val) {
  if (!val) return "Avulsos";
  const match = CATEGORIAS_VALIDAS.find((c) => c.toLowerCase() === String(val).trim().toLowerCase());
  return match || "Avulsos";
}

function normalizeRitmo(val) {
  if (!val) return null;
  const match = RITMO_VALIDOS.find((r) => r.toLowerCase() === String(val).trim().toLowerCase());
  return match || null;
}

export default function ImportPlanilha({ onImported }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStatus("importing");
    setMessage("Enviando arquivo...");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setMessage("Extraindo dados da planilha...");
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            numero: { type: "string" },
            nome: { type: "string" },
            ritmo: { type: "string" },
            categoria: { type: "string" },
            cifra_tom_original: { type: "string" },
            cifra_tom_alternativo: { type: "string" },
            letra_musica: { type: "string" },
            instrumentos: { type: "string" },
            soprano: { type: "string" },
            contralto: { type: "string" },
            tenor: { type: "string" },
            baixo: { type: "string" },
          },
        },
      });

      const raw = Array.isArray(result.output) ? result.output : result.output ? [result.output] : [];
      const records = raw
        .filter((r) => r && r.nome)
        .map((r) => {
          const rec = {
            nome: String(r.nome),
            numero: r.numero ? String(r.numero) : "",
            categoria: normalizeCategoria(r.categoria),
          };
          const ritmo = normalizeRitmo(r.ritmo);
          if (ritmo) rec.ritmo = ritmo;
          if (r.cifra_tom_original) rec.cifra_tom_original = String(r.cifra_tom_original);
          if (r.cifra_tom_alternativo) rec.cifra_tom_alternativo = String(r.cifra_tom_alternativo);
          if (r.letra_musica) rec.letra_musica = String(r.letra_musica);
          if (r.instrumentos) rec.instrumentos = String(r.instrumentos);
          if (r.soprano) rec.soprano = String(r.soprano);
          if (r.contralto) rec.contralto = String(r.contralto);
          if (r.tenor) rec.tenor = String(r.tenor);
          if (r.baixo) rec.baixo = String(r.baixo);
          return rec;
        });

      if (records.length === 0) {
        setStatus("error");
        setMessage("Nenhuma música válida encontrada na planilha.");
        return;
      }

      setMessage(`Importando ${records.length} louvores...`);
      await base44.entities.Louvor.bulkCreate(records);
      setStatus("done");
      setMessage(`${records.length} louvores importados com sucesso!`);
      onImported?.();
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Erro ao importar a planilha.");
    }
  };

  const reset = () => {
    setStatus("idle");
    setMessage("");
    setFileName("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-700">
        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
        <h2 className="text-lg font-bold">Importar Planilha</h2>
      </div>
      <p className="text-sm text-slate-500">
        Selecione um arquivo <strong>.CSV</strong> ou <strong>.XLSX</strong>. As colunas serão mapeadas automaticamente para: Número, Nome, Ritmo, Categoria, Cifras, Letra e Instrumentos.
      </p>

      {status === "idle" && (
        <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
          <Upload className="w-8 h-8 text-slate-400" />
          <span className="text-sm text-slate-500 font-medium">Toque para escolher um arquivo</span>
          <span className="text-xs text-slate-400">.csv ou .xlsx</span>
          <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFile} />
        </label>
      )}

      {status === "importing" && (
        <div className="flex flex-col items-center gap-3 p-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-600">{message}</p>
          {fileName && <p className="text-xs text-slate-400">{fileName}</p>}
        </div>
      )}

      {status === "done" && (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          <p className="text-sm font-medium text-slate-700">{message}</p>
          <Button size="sm" onClick={reset}>Importar outra planilha</Button>
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