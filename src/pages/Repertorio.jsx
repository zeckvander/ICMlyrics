import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  Music, 
  Star, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  ListPlus, 
  Check 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Repertorio() {
  const navigate = useNavigate();
  
  // Estados de busca e filtros
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");
  const [favoritos, setFavoritos] = useState([]);

  // Estados de Permissão (Admin)
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados de Modais e Formulários de Louvor
  const [modalLouvorOpen, setModalLouvorOpen] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [idLouvorEditando, setIdLouvorEditando] = useState(null);
  
  const [formTitulo, setFormTitulo] = useState("");
  const [formTom, setFormTom] = useState("");
  const [formCategoria, setFormCategoria] = useState("Culto Oficial");
  const [formAutor, setFormAutor] = useState("");

  // Estado do Modal de Playlists / Listas
  const [modalPlaylistOpen, setModalPlaylistOpen] = useState(false);
  const [louvorSelecionadoParaPlaylist, setLouvorSelecionadoParaPlaylist] = useState(null);
  const [listasSalvas, setListasSalvas] = useState([]);
  const [listaSelecionadaDestino, setListaSelecionadaDestino] = useState("");

  // Identificador do usuário e perfil
  const usuarioAtual = localStorage.getItem("icmlyrics_user") || "usuario_geral";
  const roleSalva = localStorage.getItem("icmlyrics_role") || "user";
  const chaveFavoritos = `icmlyrics_repertorio_favoritos_${usuarioAtual}`;

  // Lista de Repertório (Simulada/Local)
  const [repertorioLista, setRepertorioLista] = useState([
    {
      id: 1,
      titulo: "Grandes Coisas",
      tom: "G",
      categoria: "Culto Oficial",
      autor: "Projetos Especiais",
      duracao: "4:30"
    },
    {
      id: 2,
      titulo: "O SENHOR é a minha luz",
      tom: "C",
      categoria: "Reunião de Jovens",
      autor: "Coletânea ICM",
      duracao: "3:45"
    },
    {
      id: 3,
      titulo: "Cristo vive em mim",
      tom: "D",
      categoria: "Culto Oficial",
      autor: "Imagens e Louvores",
      duracao: "5:00"
    },
    {
      id: 4,
      titulo: "Rendei graças ao SENHOR",
      tom: "A",
      categoria: "Madrugada",
      autor: "Coletânea ICM",
      duracao: "4:15"
    },
    {
      id: 5,
      titulo: "Breve o Senhor Jesus virá",
      tom: "F",
      categoria: "Escola Bíblica",
      autor: "Hinário",
      duracao: "3:30"
    }
  ]);

  // Verificar se é admin
  useEffect(() => {
    if (roleSalva === "super_admin" || roleSalva === "church_admin") {
      setIsAdmin(true);
    }
  }, [roleSalva]);

  // Carregar favoritos e listas locais
  useEffect(() => {
    const salvos = localStorage.getItem(chaveFavoritos);
    if (salvos) {
      try {
        setFavoritos(JSON.parse(salvos));
      } catch (e) {
        console.error("Erro ao carregar favoritos:", e);
      }
    }

    const historicoListas = localStorage.getItem("icmlyrics_historico_listas");
    if (historicoListas) {
      try {
        setListasSalvas(JSON.parse(historicoListas));
      } catch (e) {
        console.error("Erro ao carregar listas:", e);
      }
    }
  }, [chaveFavoritos]);

  // Alternar favorito
  const toggleFavorito = (id, e) => {
    e.stopPropagation();
    let novosFavoritos;
    if (favoritos.includes(id)) {
      novosFavoritos = favoritos.filter((favId) => favId !== id);
    } else {
      novosFavoritos = [...favoritos, id];
    }
    setFavoritos(novosFavoritos);
    localStorage.setItem(chaveFavoritos, JSON.stringify(novosFavoritos));
  };

  // Abrir Modal para Criar Novo Louvor
  const handleAbrirCriar = () => {
    setModoEdicao(false);
    setIdLouvorEditando(null);
    setFormTitulo("");
    setFormTom("");
    setFormCategoria("Culto Oficial");
    setFormAutor("");
    setModalLouvorOpen(true);
  };

  // Abrir Modal para Editar Louvor Existente
  const handleAbrirEditar = (item, e) => {
    e.stopPropagation();
    setModoEdicao(true);
    setIdLouvorEditando(item.id);
    setFormTitulo(item.titulo);
    setFormTom(item.tom);
    setFormCategoria(item.categoria);
    setFormAutor(item.autor || "");
    setModalLouvorOpen(true);
  };

  // Salvar (Criar ou Atualizar) Louvor
  const handleSalvarLouvor = () => {
    if (!formTitulo.trim() || !formTom.trim()) {
      alert("Preencha ao menos o Título e o Tom do louvor.");
      return;
    }

    if (modoEdicao) {
      setRepertorioLista(prev => prev.map(item => {
        if (item.id === idLouvorEditando) {
          return {
            ...item,
            titulo: formTitulo.trim(),
            tom: formTom.trim().toUpperCase(),
            categoria: formCategoria,
            autor: formAutor.trim() || "Geral"
          };
        }
        return item;
      }));
    } else {
      const novoItem = {
        id: Date.now(),
        titulo: formTitulo.trim(),
        tom: formTom.trim().toUpperCase(),
        categoria: formCategoria,
        autor: formAutor.trim() || "Geral",
        duracao: "4:00"
      };
      setRepertorioLista(prev => [novoItem, ...prev]);
    }

    setModalLouvorOpen(false);
  };

  // Apagar Louvor
  const handleApagarLouvor = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Deseja realmente apagar este louvor do repertório?")) {
      setRepertorioLista(prev => prev.filter(item => item.id !== id));
    }
  };

  // Abrir modal de Playlists
  const handleAbrirPlaylistModal = (item, e) => {
    e.stopPropagation();
    setLouvorSelecionadoParaPlaylist(item);
    setModalPlaylistOpen(true);
  };

  // Adicionar louvor a uma playlist / lista existente
  const handleAdicionarAPlaylist = () => {
    if (!listaSelecionadaDestino) {
      alert("Selecione uma lista de destino.");
      return;
    }
    alert(`Louvor "${louvorSelecionadoParaPlaylist?.titulo}" adicionado à lista com sucesso!`);
    setModalPlaylistOpen(false);
  };

  // Filtrar louvores
  const repertorioFiltrado = repertorioLista.filter((item) => {
    const textoMatch = 
      item.titulo.toLowerCase().includes(busca.toLowerCase()) || 
      item.tom.toLowerCase().includes(busca.toLowerCase());
    
    const categoriaMatch = 
      categoriaSelecionada === "todos" || 
      (categoriaSelecionada === "favoritos" ? favoritos.includes(item.id) : item.categoria === categoriaSelecionada);

    return textoMatch && categoriaMatch;
  });

  const categorias = [
    { id: "todos", label: "Todos" },
    { id: "favoritos", label: "Favoritos ⭐" },
    { id: "Culto Oficial", label: "Culto Oficial" },
    { id: "Reunião de Jovens", label: "Jovens" },
    { id: "Madrugada", label: "Madrugada" },
    { id: "Escola Bíblica", label: "EBD" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      {/* Cabeçalho */}
      <div className="bg-slate-900 text-white px-4 pt-6 pb-6 relative shadow-md">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-slate-200"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold tracking-wide">Repertório de Louvores</h1>
          
          {isAdmin ? (
            <button 
              onClick={handleAbrirCriar}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors border border-slate-700 shadow"
              title="Adicionar Novo Louvor"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative mt-2">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text"
            placeholder="Buscar por título ou tom (ex: G, C)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 text-white placeholder-slate-400 text-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
          />
        </div>
      </div>

      {/* Filtros por Categoria */}
      <div className="px-4 mt-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-2">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaSelecionada(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                categoriaSelecionada === cat.id
                  ? "bg-slate-900 text-white shadow-slate-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Louvores */}
      <div className="px-4 mt-4 space-y-3 flex-1">
        {repertorioFiltrado.length > 0 ? (
          repertorioFiltrado.map((item) => {
            const isFavorito = favoritos.includes(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => navigate(`/louvor/${item.id}`)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm border border-slate-200">
                    {item.tom}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                      {item.titulo}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">{item.categoria}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400">{item.autor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Botão de Playlist */}
                  <button
                    onClick={(e) => handleAbrirPlaylistModal(item, e)}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                    title="Adicionar à Playlist / Lista"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>

                  {/* Controles de Admin (Editar / Apagar) */}
                  {isAdmin && (
                    <>
                      <button
                        onClick={(e) => handleAbrirEditar(item, e)}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        title="Editar Louvor"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleApagarLouvor(item.id, e)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Apagar Louvor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={(e) => toggleFavorito(item.id, e)}
                    className="p-2 text-slate-300 hover:text-amber-400 transition-colors"
                    title="Favoritar"
                  >
                    <Star className={`w-5 h-5 ${isFavorito ? "text-amber-400 fill-amber-400" : ""}`} />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Music className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Nenhum louvor encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente buscar por outro termo ou categoria.</p>
          </div>
        )}
      </div>

      {/* Botão Flutuante de Adicionar para Admins */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleAbrirCriar}
            className="w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title="Adicionar Novo Louvor"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR LOUVOR */}
      <Dialog open={modalLouvorOpen} onOpenChange={setModalLouvorOpen}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold text-base">
              {modoEdicao ? "Editar Louvor" : "Adicionar Novo Louvor"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 my-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Título do Louvor</label>
              <Input 
                placeholder="Ex: Grandes Coisas" 
                value={formTitulo} 
                onChange={(e) => setFormTitulo(e.target.value)} 
                className="h-9 mt-1 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tom</label>
                <Input 
                  placeholder="Ex: G, Am" 
                  value={formTom} 
                  onChange={(e) => setFormTom(e.target.value)} 
                  className="h-9 mt-1 text-sm uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                <select 
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full h-9 mt-1 px-3 bg-white text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Culto Oficial">Culto Oficial</option>
                  <option value="Reunião de Jovens">Jovens</option>
                  <option value="Madrugada">Madrugada</option>
                  <option value="Escola Bíblica">EBD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Autor / Coletânea</label>
              <Input 
                placeholder="Ex: Coletânea ICM" 
                value={formAutor} 
                onChange={(e) => setFormAutor(e.target.value)} 
                className="h-9 mt-1 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 mt-2">
            <Button 
              variant="outline" 
              onClick={() => setModalLouvorOpen(false)}
              className="h-9 text-xs"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarLouvor}
              className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
            >
              Salvar Louvor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADICIONAR A PLAYLIST / LISTA */}
      <Dialog open={modalPlaylistOpen} onOpenChange={setModalPlaylistOpen}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold text-base">
              Adicionar à Playlist / Lista
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-slate-500 mt-1">
            Escolha em qual lista deseja inserir o louvor: <span className="font-semibold text-slate-700">{louvorSelecionadoParaPlaylist?.titulo}</span>
          </p>

          <div className="my-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Selecionar Lista Destino</label>
            <select
              value={listaSelecionadaDestino}
              onChange={(e) => setListaSelecionadaDestino(e.target.value)}
              className="w-full h-10 mt-1 px-3 bg-white text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Selecione uma lista...</option>
              {listasSalvas.length > 0 ? (
                listasSalvas.map((l, index) => (
                  <option key={index} value={l.titulo || index}>
                    {l.titulo || `Lista de ${l.data || "Culto"}`}
                  </option>
                ))
              ) : (
                <option value="culto_domingo">Culto de Domingo (Padrão)</option>
              )}
            </select>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setModalPlaylistOpen(false)}
              className="h-9 text-xs"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAdicionarAPlaylist}
              className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs gap-1.5"
            >
              <Check className="w-4 h-4" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}