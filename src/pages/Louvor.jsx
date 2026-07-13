import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Music2, Loader2, Star, Menu, ArrowLeft, Upload, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SongCard from "@/components/louvores/SongCard";
import LouvorForm from "@/components/louvores/LouvorForm";
import DrawerMenu from "@/components/louvores/DrawerMenu";
import { getFavorites } from "@/lib/favorites";
import { isAdmin } from "@/lib/adminAuth";
import { TEMAS_PADRAO } from "@/data/louvores_coletanea_tema";
import { supabase } from "@/lib/supabaseClient";

export default function Louvor() {
  const navigate = useNavigate();
  const [louvores, setLouvores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterTema, setFilterTema] = useState("all");
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [admin, setAdmin] = useState(() => isAdmin());
  const musico = localStorage.getItem("icmlyrics_musico") || "";

  useEffect(() => {
    loadLouvores();
  }, []);

  const loadLouvores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('louvores')
      .select('*')
      .order('numero', { ascending: true });
    
    if (error) console.error("Erro ao buscar:", error);
    else setLouvores(data || []);
    setLoading(false);
  };

  const handleCreate = async (form) => {
    setSaving(true);
    const { error } = await supabase.from('louvores').insert([form]);
    if (error) alert("Erro ao salvar: " + error.message);
    else {
      setSheetOpen(false);
      loadLouvores();
    }
    setSaving(false);
  };

  const dispararDownload = (blob, nomeArquivo) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportarBackupJson = () => {
    const blob = new Blob([JSON.stringify(louvores, null, 2)], { type: "application/json" });
    dispararDownload(blob, "backup_louvores.json");
  };

  const exportarBackupCsv = () => {
    if (louvores.length === 0) return;
    const colunas = Object.keys(louvores[0]);
    const linhaCabecalho = colunas.join(";");
    const linhasDados = louvores.map(hino => colunas.map(col => `"${String(hino[col] || "").replace(/"/g, '""')}"`).join(";"));
    const conteudoCsv = "\uFEFF" + [linhaCabecalho, ...linhasDados].join("\n");
    const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });
    dispararDownload(blob, "backup_louvores.csv");
  };

  const exportarBackupXlsx = () => {
    if (louvores.length === 0) return;
    const colunas = Object.keys(louvores[0]);
    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Backup"><Table><Row>`;
    colunas.forEach(col => xml += `<Cell><Data ss:Type="String">${col}</Data></Cell>`);
    xml += `</Row>`;
    louvores.forEach(hino => {
      xml += `<Row>`;
      colunas.forEach(col => xml += `<Cell><Data ss:Type="String">${hino[col] || ""}</Data></Cell>`);
      xml += `</Row>`;
    });
    xml += `</Table></Worksheet></Workbook>`;
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    dispararDownload(blob, "backup_louvores.xlsx");
  };

  const handleImportJson = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonImportado = JSON.parse(e.target.result);
        const { error } = await supabase.from('louvores').insert(jsonImportado);
        if (error) alert("Erro ao importar: " + error.message);
        else loadLouvores();
      } catch (err) { alert("Erro ao processar JSON."); }
    };
    reader.readAsText(file);
  };

  const filtered = louvores.filter((l) => {
    const temaDoLouvor = l.tema || TEMAS_PADRAO.find(t => t.numero === String(l.numero))?.tema || "Sem Tema";
    const matchSearch = l.nome?.toLowerCase().includes(search.toLowerCase()) || String(l.numero)?.includes(search);
    const matchCategoria = filterCategoria === "all" || l.categoria === filterCategoria;
    const matchTema = filterTema === "all" || temaDoLouvor === filterTema;
    const matchFav = !showFavsOnly || getFavorites(musico).includes(l.id);
    return matchSearch && matchCategoria && matchTema && matchFav;
  }).sort((a, b) => {
    const aHasNum = a.numero && String(a.numero).trim() !== "";
    const bHasNum = b.numero && String(b.numero).trim() !== "";
    if (aHasNum && !bHasNum) return -1;
    if (!aHasNum && bHasNum) return 1;
    if (aHasNum && bHasNum) {
      const aNum = parseInt(a.numero, 10);
      const bNum = parseInt(b.numero, 10);
      return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : String(a.numero).localeCompare(String(b.numero), undefined, { numeric: true });
    }
    return (a.nome || "").localeCompare(b.nome || "");
  });

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a481d7fe9eb48ac49865419/e38148603_trombetas.png')", filter: "blur(6px) brightness(1.8)", opacity: 0.25 }} />
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-slate-300 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6" /></button>
          <button onClick={() => setDrawerOpen(true)} className="text-slate-300 hover:text-white transition-colors p-1 mr-1"><Menu className="w-6 h-6" /></button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Louvores</h1>
            <p className="text-slate-400 text-xs">Gerenciamento de Louvor</p>
          </div>
        </div>
      </div>
      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} onAdminLogout={() => setAdmin(false)} />
      <div className="px-4 -mt-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou número..." className="pl-9 bg-white border-0 shadow-sm rounded-xl h-11" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-1/2 bg-white border-0 shadow-sm rounded-xl h-10 text-sm">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Categoria</SelectItem>
              <SelectItem value="Avulsos">Avulsos</SelectItem>
              <SelectItem value="Cias">Cias</SelectItem>
              <SelectItem value="Coletânea">Coletânea</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTema} onValueChange={setFilterTema}>
            <SelectTrigger className="w-1/2 bg-white border-0 shadow-sm rounded-xl h-10 text-sm">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">Tema</SelectItem>
              <SelectItem value="Contra-capa">Contra-capa</SelectItem>
              {["Clamor", "Invocação e Comunhão", "Dedicação", "Morte, Ressureição e Salvação", "Consolo e Encorajamento", "Santificação e Derramamento do Espírito Santo", "Volta de Jesus e Eternidade", "Louvor", "Salmos de Louvor", "Grupo de Louvor", "Corinhos"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant={showFavsOnly ? "default" : "outline"} className="rounded-xl h-10 w-10 shrink-0" onClick={() => setShowFavsOnly((v) => !v)}><Star className={`w-5 h-5 ${showFavsOnly ? "fill-current" : ""}`} /></Button>
          {admin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-10 px-3 text-sm font-medium gap-1 shadow-sm"><Download className="w-4 h-4" /><span>Exportar</span><ChevronDown className="w-3 h-3 text-slate-400" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl p-1">
                  <DropdownMenuItem onClick={exportarBackupJson}>Formato .JSON</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportarBackupCsv}>Formato .CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportarBackupXlsx}>Formato .XLSX</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <label className="flex items-center justify-center rounded-xl h-10 w-10 shrink-0 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer shadow-sm"><Upload className="w-5 h-5" /><input type="file" accept=".json" className="hidden" onChange={handleImportJson} /></label>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}><SheetTrigger asChild><Button size="icon" className="rounded-xl h-10 w-10 shrink-0"><Plus className="w-5 h-5" /></Button></SheetTrigger><SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto"><LouvorForm onSubmit={handleCreate} onCancel={() => setSheetOpen(false)} saving={saving} /></SheetContent></Sheet>
            </>
          )}
        </div>
        <p className="text-xs text-slate-400 font-medium">{filtered.length} {filtered.length === 1 ? "louvor" : "louvores"}</p>
        {loading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : filtered.length === 0 ? <div className="text-center py-16"><Music2 className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 text-sm">Nenhum louvor encontrado</p></div> : <div className="space-y-2 pb-8">{filtered.map((l) => <SongCard key={l.id} louvor={l} />)}</div>}
      </div>
    </div>
  );
}