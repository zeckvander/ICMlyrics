import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Loader2, Star, Menu, ArrowLeft, Upload, ChevronDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SongCard from "@/components/louvores/SongCard";
import LouvorForm from "@/components/louvores/LouvorForm";
import DrawerMenu from "@/components/louvores/DrawerMenu";
import { getFavorites } from "@/lib/favorites";
import { TEMAS_PADRAO } from "@/data/louvores_coletanea_tema";
import { supabase } from "@/lib/supabaseClient";
import imagemFundo from "../assets/Tromb_mundo.jpg";

// Função para remover acentos e pontuações (.,!?- etc.)
const normalizarTexto = (texto) =>
  String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"¡!¿]/g, "") // Remove pontuações
    .trim();

export default function Louvor() {
  const navigate = useNavigate();
  const [louvores, setLouvores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [admin, setAdmin] = useState(false); 
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [favTrigger, setFavTrigger] = useState(0);

  // ESTADO DE PAGINAÇÃO DOS CARDS NA TELA (Inicia exibindo 50)
  const [visibleCount, setVisibleCount] = useState(50);

  const [search, setSearch] = useState(() => sessionStorage.getItem("louvor_search") || "");
  const [filterCategoria, setFilterCategoria] = useState(() => sessionStorage.getItem("louvor_categoria") || "all");
  const [filterTema, setFilterTema] = useState(() => sessionStorage.getItem("louvor_tema") || "all");
  const [showFavsOnly, setShowFavsOnly] = useState(() => sessionStorage.getItem("louvor_favs_only") === "true");

  const musico = localStorage.getItem("icmlyrics_user") || localStorage.getItem("icmlyrics_user_nuvem") || "";

  // 1. DESATIVA A RESTAURAÇÃO AUTOMÁTICA DE SCROLL NATIVA DO NAVEGADOR
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // 2. VALIDAÇÃO DE SESSÃO ADMIN
  useEffect(() => {
    const verificarSessaoAdmin = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          setAdmin(true);
        } else {
          setAdmin(false);
        }
      } catch (err) {
        console.error("Erro ao validar sessão:", err);
        setAdmin(false);
      }
    };
    verificarSessaoAdmin();
  }, []);

  // 3. FUNÇÃO PARA VOLTAR AO DASHBOARD E LIMPAR OS FILTROS DA NAVEGAÇÃO
  const handleVoltar = () => {
    sessionStorage.removeItem("louvor_search");
    sessionStorage.removeItem("louvor_categoria");
    sessionStorage.removeItem("louvor_tema");
    sessionStorage.removeItem("louvor_favs_only");
    sessionStorage.removeItem("louvor_scroll_position");
    navigate("/dashboard", { replace: true });
  };

  // 4. SCROLL LISTENER: GUARDA POSIÇÃO E CARREGA MAIS 50 CARDS AO ROLAR ATÉ O FIM
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      sessionStorage.setItem("louvor_scroll_position", window.scrollY.toString());

      // Se chegar perto do final da página, expande mais 50 cards
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
        setVisibleCount((prev) => prev + 50);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 5. GUARDA OS FILTROS NO SESSIONSTORAGE E RESETA A PAGINAÇÃO
  useEffect(() => {
    sessionStorage.setItem("louvor_search", search);
    sessionStorage.setItem("louvor_categoria", filterCategoria);
    sessionStorage.setItem("louvor_tema", filterTema);
    sessionStorage.setItem("louvor_favs_only", String(showFavsOnly));

    // Reseta para 50 cards sempre que alterar um filtro ou busca
    setVisibleCount(50);
  }, [search, filterCategoria, filterTema, showFavsOnly]);

  // Se a categoria mudar, valida se o tema atual pertence a ela; se não, reseta para "all"
  useEffect(() => {
    if (filterTema !== "all") {
      const existeNoPadrao = TEMAS_PADRAO.some(t => 
        t.tema === filterTema && (filterCategoria === "all" || t.categoria === filterCategoria)
      );
      const existeNoBanco = louvores.some(l => {
        const temNumero = l.numero !== null && l.numero !== undefined && String(l.numero).trim() !== "";
        return !temNumero && l.tema === filterTema && (filterCategoria === "all" || l.categoria === filterCategoria);
      });

      if (!existeNoPadrao && !existeNoBanco) {
        setFilterTema("all");
      }
    }
  }, [filterCategoria, louvores]);

  // Geração dinâmica dos temas disponíveis
  const temasDisponiveis = useMemo(() => {
    let filtrados = TEMAS_PADRAO;
    if (filterCategoria !== "all") {
      filtrados = TEMAS_PADRAO.filter(t => t.categoria === filterCategoria);
    }
    const temasSet = new Set(filtrados.map(t => t.tema));

    louvores.forEach(l => {
      const temNumero = l.numero !== null && l.numero !== undefined && String(l.numero).trim() !== "";
      if (!temNumero && l.tema) {
        if (filterCategoria === "all" || l.categoria === filterCategoria) {
          temasSet.add(l.tema);
        }
      }
    });

    return [...temasSet];
  }, [filterCategoria, louvores]);

  // 6. FUNÇÃO PARA BUSCAR OS LOUVORES DO BANCO (CARREGAMENTO INTELIGENTE)
  const carregarLouvores = async () => {
    setLoading(true);
    const termo = search.trim();

    // Se houver busca, traz a letra_musica para filtrar. Se não, busca só os campos leves.
    const colunas = termo 
      ? 'id, numero, nome, categoria, ritmo, tema, letra_musica' 
      : 'id, numero, nome, categoria, ritmo, tema';

    let todosOsLouvores = [];
    let buscarMais = true;
    let inicio = 0;
    const limitePorPagina = 1000;

    while (buscarMais) {
      let query = supabase.from('louvores').select(colunas);

      if (termo) {
        query = query.or(`nome.ilike.%${termo}%,letra_musica.ilike.%${termo}%,numero.ilike.%${termo}%`);
      }

      const { data, error } = await query
        .order('id', { ascending: true })
        .range(inicio, inicio + limitePorPagina - 1);

      if (error) {
        console.error("Erro no Supabase:", error.message);
        break;
      }

      if (data && data.length > 0) {
        todosOsLouvores = [...todosOsLouvores, ...data];
        inicio += limitePorPagina;

        if (data.length < limitePorPagina) {
          buscarMais = false;
        }
      } else {
        buscarMais = false;
      }
    }

    setLouvores(todosOsLouvores);
    setLoading(false);
  };

  // Executa o carregamento com um pequeno delay (debounce de 300ms) quando digita
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarLouvores();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // 7. RESTAURA A POSIÇÃO DE ROLAGEM DEPOIS QUE OS CARDS FORAM RENDERIZADOS
  useEffect(() => {
    if (!loading && louvores.length > 0) {
      const pos = sessionStorage.getItem("louvor_scroll_position");
      if (pos) {
        const timer = setTimeout(() => {
          window.scrollTo({ top: parseInt(pos, 10), behavior: "instant" });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, louvores]);

  const verificarAcessoAdmin = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return !!user && !error;
    } catch {
      return false;
    }
  };

  const handleCreate = async (form) => {
    if (!(await verificarAcessoAdmin())) return alert("Acesso negado");
    setSaving(true);

    const { id, ...dadosParaSalvar } = form;

    if (!dadosParaSalvar.numero || String(dadosParaSalvar.numero).trim() === "") {
      dadosParaSalvar.numero = null;
    }

    const { error } = await supabase.from('louvores').insert([dadosParaSalvar]);
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else { 
      setSheetOpen(false); 
      carregarLouvores();
    }
    setSaving(false);
  };

  const dispararDownload = (blob, nome) => { 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = nome; 
    a.click(); 
    URL.revokeObjectURL(url); 
  };
  
  const exportarBackupJson = () => dispararDownload(new Blob([JSON.stringify(louvores, null, 2)], { type: "application/json" }), "backup_louvores.json");
  
  const exportarBackupCsv = () => {
    const colunas = ["numero", "nome", "categoria", "ritmo", "tema"];
    const csv = "\uFEFF" + [colunas.join(";"), ...louvores.map(l => colunas.map(c => `"${String(l[c] || "").replace(/"/g, '""')}"`).join(";"))].join("\n");
    dispararDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "backup_louvores.csv");
  };
  
  const exportarBackupXlsx = () => {
    const colunas = ["numero", "nome", "categoria", "ritmo", "tema"];
    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Backup"><Table><Row>`;
    colunas.forEach(c => xml += `<Cell><Data ss:Type="String">${c}</Data></Cell>`);
    xml += `</Row>`;
    louvores.forEach(l => {
      xml += `<Row>`;
      colunas.forEach(c => xml += `<Cell><Data ss:Type="String">${l[c] || ""}</Data></Cell>`);
      xml += `</Row>`;
    });
    xml += `</Table></Worksheet></Workbook>`;
    dispararDownload(new Blob([xml], { type: "application/vnd.ms-excel" }), "backup_louvores.xls");
  };

  const handleImportJson = async (e) => {
    if (!(await verificarAcessoAdmin())) return alert("Acesso negado");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const { error } = await supabase.from('louvores').insert(JSON.parse(ev.target.result));
      if (error) {
        alert("Erro: " + error.message);
      } else {
        carregarLouvores();
      }
    };
    reader.readAsText(file);
  };

  // --- LÓGICA DE FILTRAGEM E ORDENAÇÃO ---
  const termoBruto = (search || "").trim();
  const termoNormalizado = normalizarTexto(search);
  const buscaNum = termoBruto.toLowerCase();

  const filtered = louvores.filter((l) => {
    const temNumero = l.numero !== null && l.numero !== undefined && String(l.numero).trim() !== "";
    
    let temaDoLouvor = "Sem Tema";
    if (temNumero) {
      const padrao = TEMAS_PADRAO.find(t => 
        parseInt(t.numero, 10) === parseInt(l.numero, 10) && t.categoria === l.categoria
      );
      if (padrao) temaDoLouvor = padrao.tema;
    } else {
      temaDoLouvor = l.tema || "Sem Tema";
    }

    // BUSCA NORMALIZADA NO FRONT
    const numStr = temNumero ? String(l.numero).trim().toLowerCase() : "";
    const matchNumero = numStr ? numStr.startsWith(buscaNum) : false;
    const matchNome = normalizarTexto(l.nome).includes(termoNormalizado);
    const matchLetra = l.letra_musica ? normalizarTexto(l.letra_musica).includes(termoNormalizado) : false;

    const matchSearch = !termoBruto || matchNumero || matchNome || matchLetra;

    const matchCategoria = showFavsOnly || filterCategoria === "all" || l.categoria === filterCategoria;
    const matchTema = showFavsOnly || filterTema === "all" || temaDoLouvor === filterTema;
    const matchFav = !showFavsOnly || getFavorites(musico).includes(String(l.id));

    return matchSearch && matchCategoria && matchTema && matchFav;
  }).sort((a, b) => {
    if (buscaNum) {
      const numA = (a.numero !== null && a.numero !== undefined) ? String(a.numero).trim().toLowerCase() : "";
      const numB = (b.numero !== null && b.numero !== undefined) ? String(b.numero).trim().toLowerCase() : "";

      const exatoA = numA === buscaNum;
      const exatoB = numB === buscaNum;

      if (exatoA && !exatoB) return -1;
      if (!exatoA && exatoB) return 1;
    }

    const obterPeso = (item) => {
      const temNumero = item.numero !== null && item.numero !== undefined && String(item.numero).trim() !== "";
      
      if (item.categoria === "Coletânea" && temNumero) return 1;
      if (item.categoria === "Cias" && temNumero) return 2;
      if (item.categoria === "Cias" && !temNumero) return 3;
      if (item.categoria === "Avulsos") return 4;
      return 5;
    };

    const pesoA = obterPeso(a);
    const pesoB = obterPeso(b);

    if (pesoA !== pesoB) return pesoA - pesoB;

    if (pesoA === 1 || pesoA === 2) {
      return (parseInt(a.numero, 10) || 0) - (parseInt(b.numero, 10) || 0);
    }

    return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
  });

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url('${imagemFundo}')`, filter: "blur(6px) brightness(1.8)", opacity: 0.25 }} />
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 z-50 p-3 bg-slate-900 text-white rounded-full shadow-lg">
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleVoltar}><ArrowLeft className="w-6 h-6" /></button>
          <button onClick={() => setDrawerOpen(true)}><Menu className="w-6 h-6" /></button>
          <div><h1 className="text-xl font-bold">Louvores</h1></div>
        </div>
      </div>
      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} onAdminLogout={() => setAdmin(false)} />
      
      <div className="px-4 -mt-3 space-y-3">
        {/* Barra de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            id="busca-louvor" 
            name="q" 
            autoComplete="off"
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar por nome, número ou letra..." 
            className="pl-9 bg-white border-0 shadow-sm rounded-xl h-11" 
          />
        </div>
        
        {/* Filtros */}
        <div className="flex gap-2">
          {/* Categoria Select */}
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger id="categoria-select" className="w-full bg-white border-0 shadow-sm rounded-xl h-10">
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

          {/* Tema Select */}
          <Select value={filterTema} onValueChange={setFilterTema}>
            <SelectTrigger id="tema-select" className="w-full bg-white border-0 shadow-sm rounded-xl h-10">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">Tema</SelectItem>
              {temasDisponiveis.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Favoritos Toggle */}
          {(getFavorites(musico).length > 0 || showFavsOnly) && (
            <Button size="icon" variant={showFavsOnly ? "default" : "outline"} className="rounded-xl h-10 w-10 shrink-0 bg-white border-0 shadow-sm relative" onClick={() => setShowFavsOnly(!showFavsOnly)}>
              <Star className={`w-5 h-5 ${showFavsOnly ? "fill-amber-400 text-amber-400" : "text-slate-400"}`} />
              {getFavorites(musico).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm">
                  {getFavorites(musico).length}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Quantidade direta de louvores */}
        {!loading && louvores.length > 0 && (
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
            <span>{filtered.length} {filtered.length === 1 ? "louvor" : "louvores"}</span>
          </div>
        )}
        
        {/* Painel de Admin */}
        {admin && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl shadow-sm">
                  Exportar <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl">
                <DropdownMenuItem onClick={exportarBackupJson}>JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={exportarBackupCsv}>CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={exportarBackupXlsx}>XLS</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <label className="cursor-pointer bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <Upload className="w-5 h-5 text-slate-500"/>
              <input type="file" id="import-json" name="file-import" className="hidden" onChange={handleImportJson}/>
            </label>
            
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button className="rounded-xl"><Plus /></Button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="rounded-t-2xl max-h-[92vh] overflow-y-auto"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <LouvorForm onSubmit={handleCreate} saving={saving}/>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Listagem com limitação de 50 cards por página */}
        {loading ? (
          <Loader2 className="animate-spin mx-auto mt-10" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <p className="text-slate-500 font-medium">Nenhum louvor encontrado</p>
            <Button variant="outline" onClick={() => { setSearch(""); setShowFavsOnly(false); }} className="rounded-xl">Voltar</Button>
          </div>
        ) : (
          <div className="space-y-2 pb-8">
            {/* Renderiza apenas até visibleCount (50, 100, 150...) */}
            {filtered.slice(0, visibleCount).map((l) => (
              <SongCard 
                key={l.id} 
                louvor={l} 
                isAdmin={admin} 
                isFavorited={getFavorites(musico).includes(String(l.id))} 
                onToggleFav={() => setFavTrigger(prev => prev + 1)} 
              />
            ))}

            {/* Indicador e botão manual de carregar mais */}
            {visibleCount < filtered.length && (
              <div className="text-center py-4">
                <Button 
                  variant="ghost" 
                  className="text-slate-500 font-normal text-xs rounded-xl"
                  onClick={() => setVisibleCount((prev) => prev + 50)}
                >
                  Exibindo {visibleCount} de {filtered.length} (Toque para carregar mais)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}