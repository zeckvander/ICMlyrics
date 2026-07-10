import React, { forwardRef } from "react";

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getDiaSemana(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return DIAS[d.getDay()];
}

const ListaPreview = forwardRef(({ rows, dataCulto }, ref) => {
  const visibleRows = rows.filter((r) => r.type === "louvor" || (r.type === "divider" && r.text?.trim()));

  return (
    <div ref={ref} className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ width: 380 }}>
      <div className="bg-slate-900 px-6 py-4 text-center">
        <h2 className="text-xl font-bold text-white tracking-wide">Louvores</h2>
        {dataCulto && (
          <p className="text-amber-400 text-sm mt-1">
            {formatDate(dataCulto)}{getDiaSemana(dataCulto) ? ` — ${getDiaSemana(dataCulto)}` : ""}
          </p>
        )}
      </div>
      <div className="px-5 py-4 space-y-1.5">
        {visibleRows.map((r) => {
          if (r.type === "divider") {
            return (
              <div key={r.id} className="bg-rose-50 text-center font-semibold text-slate-800 text-sm w-full" style={{ padding: "14px 0", lineHeight: "1.4" }}>
                {r.text}
              </div>
            );
          }
          return (
            <div key={r.id} className="flex items-baseline gap-2 text-sm">
              {r.numero && <span className="font-mono text-slate-500 w-8 shrink-0">{r.numero}</span>}
              <span className="font-semibold text-slate-800 flex-1 uppercase">{r.nome}</span>
              {r.observacao && <span className="text-xs text-slate-400 italic">{r.observacao}</span>}
            </div>
          );
        })}
        {visibleRows.length === 0 && <p className="text-center text-slate-300 text-sm py-4">Nenhum louvor adicionado</p>}
      </div>
    </div>
  );
});

export default ListaPreview;