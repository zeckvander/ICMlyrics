import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Music, ChevronRight, Star } from "lucide-react";
import CategoriaBadge from "@/components/louvores/CategoriaBadge";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

export default function SongCard({ louvor, onToggleFav }) {
  const musico = localStorage.getItem("icmlyrics_user") || "";
  const [fav, setFav] = useState(() => isFavorite(musico, louvor.id));

  useEffect(() => {
    const handleStorageChange = () => setFav(isFavorite(musico, louvor.id));
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [louvor.id, musico]);

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const novoStatus = toggleFavorite(musico, louvor.id);
    setFav(novoStatus);
    if (onToggleFav) onToggleFav(louvor.id, novoStatus);
  };

  return (
    <div className="flex items-center gap-1 p-2 pr-2 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all active:scale-[0.98]">
      <Link to={`/louvor/${louvor.id}`} className="flex items-center gap-3 flex-1 min-w-0 p-2">
        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
          <span className="text-sm font-bold">{louvor.numero || "#"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{louvor.nome}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <CategoriaBadge categoria={louvor.categoria} />
            {louvor.ritmo && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Music className="w-3 h-3" />
                {louvor.ritmo}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </Link>

      <button
        onClick={handleFav}
        className="p-2 shrink-0 text-slate-300 hover:text-amber-400 transition-colors"
        aria-label="Favoritar"
      >
        <Star className={`w-5 h-5 ${fav ? "fill-amber-400 text-amber-400" : ""}`} />
      </button>
    </div>
  );
}