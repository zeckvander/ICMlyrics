import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music2, ListPlus, FolderOpen, Gauge, Mic, History, LogOut, BookOpen } from "lucide-react";
import { useTools } from "@/components/tools/ToolsProvider";
import BibliaPanel from "@/components/tools/BibliaPanel";
import bannerImg from "../assets/Tromb_mundo.jpg";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isBibliaOpen, setIsBibliaOpen] = useState(false);
  const { openMetronomo, openAfinador } = useTools();
  const musico = localStorage.getItem("icmtools_musico") || "Músico";

  const atalhos = [
    { label: "Louvores", icon: Music2, path: "/louvor", color: "bg-teal-500" },
    { label: "Nova Lista", icon: ListPlus, path: "/nova-lista", color: "bg-amber-500" },
    { label: "Histórico de Listas", icon: History, path: "/historico-listas", color: "bg-indigo-500" },
    { label: "Drive", icon: FolderOpen, path: "/drive", color: "bg-blue-500" },
    { label: "Bíblia", icon: BookOpen, path: null, onClick: () => setIsBibliaOpen(true), color: "bg-emerald-600" }
  ];

  const ferramentas = [
    { label: "Metrônomo", icon: Gauge, color: "bg-purple-500", onClick: openMetronomo },
    { label: "Afinador", icon: Mic, color: "bg-rose-500", onClick: openAfinador }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      <div className="bg-slate-900 text-white relative overflow-hidden min-h-[180px] flex flex-col justify-end">
        <img src={bannerImg} alt="ICMlyrics Banner" className="absolute inset-0 w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-0" />
        <div className="px-4 pb-8 pt-20 relative z-10 flex justify-between items-end">
          <div>
            <h2 className="font-bold text-3xl opacity-90 drop-shadow-md text-[hsl(var(--background))]">
              Olá, {musico.split(" ")[0]}!
            </h2>
            <p className="text-slate-200 text-sm mt-0.5 drop-shadow">
              Boas-vindas ao ICM<span className="text-amber-400 font-semibold">lyrics</span>
            </p>
          </div>
          <button onClick={() => navigate("/")} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-colors" aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-6 relative z-20">
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {atalhos.map((a) =>
              <button key={a.label} onClick={a.onClick ? a.onClick : () => navigate(a.path)} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${a.color} flex items-center justify-center`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">{a.label}</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Ferramentas</p>
          <div className="grid grid-cols-2 gap-3">
            {ferramentas.map((f) =>
              <button key={f.label} onClick={f.onClick} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">{f.label}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isBibliaOpen && <BibliaPanel onClose={() => setIsBibliaOpen(false)} />}
    </div>
  );
}