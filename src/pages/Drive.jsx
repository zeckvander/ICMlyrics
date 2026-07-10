import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Plus, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DrawerMenu from "@/components/louvores/DrawerMenu";

const STORAGE_KEY = "icmlyrics_drive_links";
const genId = () => Math.random().toString(36).slice(2, 9);

export default function Drive() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [links, setLinks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");

  const save = (newLinks) => {
    setLinks(newLinks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
  };

  const addLink = (e) => {
    e.preventDefault();
    if (!titulo.trim() || !url.trim()) return;
    save([...links, { id: genId(), titulo: titulo.trim(), url: url.trim() }]);
    setTitulo("");
    setUrl("");
  };

  const removeLink = (id) => save(links.filter((l) => l.id !== id));

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Topbar com Seta e Hambúrguer juntos à esquerda */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="text-slate-300 hover:text-white transition-colors"
            title="Voltar para o Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setDrawerOpen(true)} 
            className="text-slate-300 hover:text-white transition-colors p-1 mr-1"
            title="Menu Lateral"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-xl font-bold tracking-tight">Drive</h1>
            <p className="text-slate-400 text-xs">Links gerais</p>
          </div>
        </div>
      </div>

      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="px-4 -mt-3 space-y-4">
        <form onSubmit={addLink} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Partitura Geral" />
          </div>
          <div>
            <Label>Link</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." type="url" />
          </div>
          <Button type="submit" size="sm" className="w-full"><Plus className="w-4 h-4" /> Adicionar Link</Button>
        </form>

        {links.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">Nenhum link adicionado</p>
        ) : (
          <div className="space-y-2">
            {links.map((l) => (
              <div key={l.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-2">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1 min-w-0">
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span className="truncate font-medium text-slate-700">{l.titulo}</span>
                </a>
                <button onClick={() => removeLink(l.id)} className="text-slate-300 hover:text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}