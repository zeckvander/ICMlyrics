import React, { forwardRef } from "react";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const ListaPreview = forwardRef(({ rows, dataCulto }, ref) => {
  return (
    <div
      ref={ref}
      className="w-[340px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 text-slate-800 font-sans"
    >
      {/* Cabeçalho */}
      <div className="bg-[#0f172a] text-white p-5 text-center">
        <h2 className="text-lg font-bold tracking-wide">Louvores</h2>
        <p className="text-amber-400 text-xs font-medium mt-0.5">
          {formatDate(dataCulto)}
        </p>
      </div>

      {/* Lista de Louvores */}
      <div className="p-4 space-y-3">
        {rows.map((row, idx) => {
          if (row.type === "divider") {
            return (
              <div
                key={row.id || idx}
                className="my-3 py-2 px-3 bg-rose-50/80 text-slate-700 text-xs font-semibold text-center rounded-lg border border-rose-100"
              >
                {row.text || row.nome || "Seção"}
              </div>
            );
          }

          const numStr = String(row.numero || "").trim();
          // Se não tem número preenchido ou a categoria for Avulsos, considera AV automaticamente
          const isAvulso = !row.numero || numStr === "" || row.categoria === "Avulsos" || numStr.startsWith("local_");
          const isCias = row.categoria === "Cias" || row.categoria === "CIAS";
          const nomeLouvor = (row.nome || row.buscaLouvor || "").toUpperCase();

          return (
            <div key={row.id || idx} className="flex items-center gap-3 text-xs font-semibold text-slate-700">
              {/* Coluna do Número / AV */}
              <span className="w-8 text-slate-400 font-bold text-right shrink-0">
                {isAvulso ? "AV" : row.numero}
              </span>

              {/* Nome do Louvor e indicação CIAS */}
              <span className="flex-1 truncate">
                {nomeLouvor} {isCias ? "(CIAS)" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ListaPreview.displayName = "ListaPreview";

export default ListaPreview;