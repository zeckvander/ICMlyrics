import React from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Home, ListPlus, Music2, FolderOpen, LogOut, History } from "lucide-react";
import { logoutAdmin } from "@/lib/adminAuth";

export default function DrawerMenu({ open, onOpenChange, onAdminLogout }) {
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleLogout = () => {
    logoutAdmin();
    onOpenChange(false);
    onAdminLogout?.();
    localStorage.removeItem("icmtools_musico");
    navigate("/");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <div className="bg-slate-900 text-white p-6">
          <h2 className="text-lg font-bold">ICM<span className="text-amber-400">lyrics</span></h2>
          <p className="text-xs text-slate-400 mt-1">Menu</p>
        </div>
        
        <div className="py-2 flex-1">
          <button onClick={() => handleNav("/dashboard")} className="flex items-center gap-3 w-full px-6 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
            <Home className="w-5 h-5 text-slate-400" /> Início
          </button>
          
          <button onClick={() => handleNav("/historico-listas")} className="flex items-center gap-3 w-full px-6 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
            <History className="w-5 h-5 text-slate-400" /> Histórico de Listas
          </button>
          
          <button onClick={() => handleNav("/inicio")} className="flex items-center gap-3 w-full px-6 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
            <Music2 className="w-5 h-5 text-slate-400" /> Louvores
          </button>
          
          <button onClick={() => handleNav("/nova-lista")} className="flex items-center gap-3 w-full px-6 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
            <ListPlus className="w-5 h-5 text-slate-400" /> Nova Lista
          </button>
          
          <button onClick={() => handleNav("/drive")} className="flex items-center gap-3 w-full px-6 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
            <FolderOpen className="w-5 h-5 text-slate-400" /> Drive
          </button>
        </div>
        
        <div className="border-t border-slate-100 py-2">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}