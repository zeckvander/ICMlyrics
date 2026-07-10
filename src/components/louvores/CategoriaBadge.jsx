import React from "react";

const categoriaConfig = {
  "Avulsos": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "Cias": { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  "Coletânea": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export default function CategoriaBadge({ categoria }) {
  const config = categoriaConfig[categoria] || { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {categoria || "Sem categoria"}
    </span>
  );
}