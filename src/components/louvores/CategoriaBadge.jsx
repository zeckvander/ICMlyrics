import React from "react";

const categoriaConfig = {
  "Avulsos": { 
    bg: "bg-blue-100 dark:bg-blue-950/50", 
    text: "text-blue-700 dark:text-blue-300", 
    dot: "bg-blue-500 dark:bg-blue-400" 
  },
  "Cias": { 
    bg: "bg-purple-100 dark:bg-purple-950/50", 
    text: "text-purple-700 dark:text-purple-300", 
    dot: "bg-purple-500 dark:bg-purple-400" 
  },
  "Coletânea": { 
    bg: "bg-emerald-100 dark:bg-emerald-950/50", 
    text: "text-emerald-700 dark:text-emerald-300", 
    dot: "bg-emerald-500 dark:bg-emerald-400" 
  },
};

export default function CategoriaBadge({ categoria }) {
  const config = categoriaConfig[categoria] || { 
    bg: "bg-slate-100 dark:bg-slate-800", 
    text: "text-slate-500 dark:text-slate-400", 
    dot: "bg-slate-400 dark:bg-slate-500" 
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {categoria || "Sem categoria"}
    </span>
  );
}