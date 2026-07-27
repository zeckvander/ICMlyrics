import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Trash2, 
  Music, 
  ChevronRight, 
  Loader2,
  Search,
  Star,
  Plus,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CategoriaBadge from "@/components/louvores/CategoriaBadge";
import { supabase } from "@/lib/supabaseClient";

export default function ListaRepertorio() {
  const navigate = useNavigate();
  const { id: listaId } = useParams();

  const [loading, setLoading] = useState(true);

  const [nomeListaAtual, setNomeListaAtual] = useState("");
  const [louvoresLista, setLouvoresLista] = useState([]);
  const [busca, setBusca] = useState("");
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");
  const [favoritos, setFavoritos] = useState([]);

  const [modalAdicionarOpen, setModalAdicionarOpen] = useState(false);
  const [todosLouvores, setTodosLouvores] = useState([]);
  const [buscaAdicionar, setBuscaAdicionar] = useState("");
  const [carregandoLouvores, setCarregandoLouvores] = useState(false);

  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioAtual = localStorage.getItem("icmlyrics_user") || "usuario_geral";
  const chaveFavoritos = `icmlyrics_repertorio_favoritos_${usuarioAtual}`;

  const roleSalva = localStorage.getItem("icmlyrics_role") || "user";
  const podeCriar = roleSalva === "super_admin" || roleSalva === "church_admin" || userNuvem === "admin_geral";

  useEffect(() => {
    const salvos = localStorage.getItem(chaveFavoritos);
    if (salvos) {
      try { setFavoritos(JSON.parse(salvos)); } catch (e) {}
    }
  }, [chaveFavoritos]);

  useEffect(() => {
    if (listaId) {
      carregarDetalhesLista();
    }
  }, [listaId]);

  const carregarDetalhesLista = async () => {
    setLoading(true);
    try {
      const { data: listaData } = await supabase
        .from('listas_repertorio')
        .select('*')
        .eq('id', listaId)
        .single();

      if (listaData) {
        setNomeListaAtual(listaData.nome);
      }

      const { data: itensData, error: itensError } = await supabase
        .from('itens_repertorio')
        .select(`
          id,
          ordem,
          tom_especial,
          louvores (
            id,
            numero,
            nome,
            categoria,
            tema,
            cifra_tom_original
          )
        `)
        .eq('lista_id', listaId)
        .order('ordem', { ascending: true });

      if (!itensError && itensData) {
        const mapeados = itensData.map(item => ({
          ...item.louvores,
          cifra_tom_original: item.tom_especial || item.louvores?.cifra_tom_original,
          item_lista_id: item.id,
          ordem: item.ordem ?? 0
        })).filter(l => l !== null);

        setLouvoresLista(mapeados);
      }
    } catch (err) {
      console.error("Erro ao carregar lista:", err);
    } finally {
      setLoading(false);
    }
  };

  const carregarTodosLouvoresParaAdicao = async () => {
    setCarregandoLouvores(true);
    try {
      const { data, error } = await supabase
        .from('louvores')
        .select('id, numero, nome, categoria, cifra_tom_original')
        .order('numero', { ascending: true, nullsLast: true });

      if (!error && data) {
        setTodosLouvores(data);
      }
    } catch (err) {
      console.error("Erro ao buscar louvores:", err);
    } finally {
      setCarregandoLouvores(false);
    }
  };

  const handleAbrirModalAdicionar = () => {
    if (!podeCriar) return alert("Você não tem permissão para adicionar itens.");
    setModalAdicionarOpen(true);
    carregarTodosLouvoresParaAdicao();
  };

  const handleAdicionarLouvorNaLista = async (louvorId) => {
    if (!podeCriar) return;
    try {
      const proximaOrdem = louvoresLista.length + 1;
      const { error } = await supabase
        .from('itens_repertorio')
        .insert([{
          lista_id: listaId,
          louvor_id: louvorId,
          ordem: proximaOrdem
        }]);

      if (error) {
        alert("Erro ao adicionar louvor: " + error.message);
      } else {
        carregarDetalhesLista();
      }
    } catch (err) {
      console.error("Erro ao inserir na lista:", err);
    }
  };

  const handleRemoverDaLista = async (itemListaId, e) => {
    e.stopPropagation();
    if (!podeCriar) {
      return alert("Você não tem permissão para remover itens desta lista.");
    }

    if (window.confirm("Deseja remover este louvor desta lista?")) {
      const { error } = await supabase
        .from('itens_repertorio')
        .delete()
        .eq('id', itemListaId);

      if (error) {
        alert("Erro ao remover: " + error.message);
      } else {
        carregarDetalhesLista();
      }
    }
  };

  // Função para mudar a ordem do louvor para cima ou para baixo
  const handleMudarOrdem = async (index, direcao, e) => {
    e.stopPropagation();
    if (!podeCriar) return;

    const novoIndiceDestino = direcao === 'subir' ? index - 1 : index + 1;

    if (novoIndiceDestino < 0 || novoIndiceDestino >= louvoresLista.length) return;

    const listaCopia = [...louvoresLista];
    const itemAtual = listaCopia[index];
    const itemTroca = listaCopia[novoIndiceDestino];

    listaCopia[index] = itemTroca;
    listaCopia[novoIndiceDestino] = itemAtual;

    const atualizacoes = listaCopia.map((item, idx) => ({
      id: item.item_lista_id,
      ordem: idx + 1
    }));

    setLouvoresLista(listaCopia);

    for (const atualizacao of atualizacoes) {
      await supabase
        .from('itens_repertorio')
        .update({ ordem: atualizacao.ordem })
        .eq('id', atualizacao.id);
    }
  };

  const toggleFavorito = (id, e) => {
    e.stopPropagation();
    let novos;
    if (favoritos.includes(id)) {
      novos = favoritos.filter(f => f !== id);
    } else {
      novos = [...favoritos, id];
    }
    setFavoritos(novos);
    localStorage.setItem(chaveFavoritos, JSON.stringify(novos));
  };

  const handleIrParaLouvor = (louvorId) => {
    localStorage.setItem("icmlyrics_retorno_repertorio", `/repertorio/lista/${listaId}`);
    navigate(`/louvor/${louvorId}`);
  };

  const formatarNomeLouvor = (item) => {
    const nomeBase = item.nome || "";
    const cat = (item.categoria || "").trim().toLowerCase();

    if (cat === "coletânea" || cat === "coletanea" || cat === "cias") {
      return item.numero ? `${item.numero} - ${nomeBase}` : nomeBase;
    }

    return nomeBase;
  };

  const louvoresFiltrados = louvoresLista.filter((item) => {
    const nomeMusica = item.nome || "";
    const numeroStr = item.numero ? String(item.numero) : "";
    const tomStr = item.cifra_tom_original || "";

    const textoMatch = 
      nomeMusica.toLowerCase().includes(busca.toLowerCase()) || 
      numeroStr.includes(busca) ||
      tomStr.toLowerCase().includes(busca.toLowerCase());
    
    const categoriaMatch = 
      categoriaSelecionada === "todos" || 
      item.categoria === categoriaSelecionada;

    return textoMatch && categoriaMatch;
  });

  const louvoresDisponiveisFiltrados = todosLouvores.filter((item) => {
    const jaNaLista = louvoresLista.some((l) => l.id === item.id);
    if (jaNaLista) return false;

    const nomeMusica = item.nome || "";
    const numeroStr = item.numero ? String(item.numero) : "";
    const textoMatch = 
      nomeMusica.toLowerCase().includes(buscaAdicionar.toLowerCase()) || 
      numeroStr.includes(buscaAdicionar);

    return textoMatch;
  });

  const categorias = [
    { id: "todos", label: "Todos" },
    { id: "Cias", label: "Cias" },
    { id: "Coletânea", label: "Coletânea" },
    { id: "Avulsos", label: "Avulsos" }
  ];

  return (
    <div className="min-h-screen bg-white pb-28 flex flex-col">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-8 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 truncate">
            <button 
              onClick={() => navigate("/repertorio")} 
              className="text-white hover:text-slate-300 transition-colors shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold tracking-wide truncate">{nomeListaAtual || "Carregando..."}</h1>
          </div>
          <button
            onClick={() => {
              setMostrarBusca(!mostrarBusca);
              if (mostrarBusca) {
                setBusca("");
                setCategoriaSelecionada("todos");
              }
            }}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              mostrarBusca ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
            title="Pesquisar e filtrar"
          >
            {mostrarBusca ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mostrarBusca && (
        <div className="px-4 -mt-6 relative z-10 animate-fadeIn space-y-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              placeholder="Buscar por nome, número ou tom..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl shadow-md border border-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>

          <div className="overflow-x-auto no-scrollbar pb-1">
            <div className="flex gap-2">
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSelecionada(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shadow-sm ${
                    categoriaSelecionada === cat.id
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-6 divide-y divide-slate-100 flex-1">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-slate-400" />
          </div>
        ) : louvoresFiltrados.length > 0 ? (
          louvoresFiltrados.map((item, index) => {
            const isFavorito = favoritos.includes(item.id);
            const nomeFormatado = formatarNomeLouvor(item);
            return (
              <div 
                key={item.id}
                onClick={() => handleIrParaLouvor(item.id)}
                className="py-3 flex items-center justify-between cursor-pointer group hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {nomeFormatado}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="scale-75 origin-left">
                        <CategoriaBadge categoria={item.categoria} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {podeCriar && (
                    <div className="flex flex-col gap-0.5 mr-1">
                      <button
                        onClick={(e) => handleMudarOrdem(index, 'subir', e)}
                        disabled={index === 0}
                        className="p-0.5 text-slate-400 hover:text-slate-900 disabled:opacity-25 transition-colors"
                        title="Subir na lista"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleMudarOrdem(index, 'descer', e)}
                        disabled={index === louvoresLista.length - 1}
                        className="p-0.5 text-slate-400 hover:text-slate-900 disabled:opacity-25 transition-colors"
                        title="Descer na lista"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {podeCriar && (
                    <button
                      onClick={(e) => handleRemoverDaLista(item.item_lista_id, e)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                      title="Remover desta lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => toggleFavorito(item.id, e)}
                    className="p-1.5 text-slate-300 hover:text-amber-500 transition-colors"
                  >
                    <Star className={`w-4 h-4 ${isFavorito ? "text-amber-400 fill-amber-400" : ""}`} />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors ml-1" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-4">
            <Music className="w-5 h-5 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">Nenhum louvor nesta lista</p>
          </div>
        )}
      </div>

      {podeCriar && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleAbrirModalAdicionar}
            className="w-12 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title="Adicionar louvor à lista"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      <Dialog open={modalAdicionarOpen} onOpenChange={setModalAdicionarOpen}>
        <DialogContent className="max-w-md rounded-xl p-5 border-slate-100 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-semibold text-sm">
              Adicionar Louvor à Lista
            </DialogTitle>
          </DialogHeader>

          <div className="my-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <Input 
                placeholder="Pesquisar louvor por nome ou número..." 
                value={buscaAdicionar} 
                onChange={(e) => setBuscaAdicionar(e.target.value)} 
                className="h-9 pl-9 text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[50vh] divide-y divide-slate-100 pr-1 mt-1">
            {carregandoLouvores ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin w-6 h-6 text-slate-400" />
              </div>
            ) : louvoresDisponiveisFiltrados.length > 0 ? (
              louvoresDisponiveisFiltrados.map((louvor) => {
                const nomeFormatadoModal = formatarNomeLouvor(louvor);
                return (
                  <div 
                    key={louvor.id}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {nomeFormatadoModal}
                        </h4>
                        <p className="text-[10px] text-slate-400">{louvor.categoria || "Geral"}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAdicionarLouvorNaLista(louvor.id)}
                      className="h-7 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[11px] shrink-0"
                    >
                      Adicionar
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <p className="text-xs text-slate-500">Nenhum louvor encontrado ou todos já foram adicionados.</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button 
              variant="outline" 
              onClick={() => setModalAdicionarOpen(false)}
              className="w-full h-8 text-xs border-slate-200"
            >
              Concluir / Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}