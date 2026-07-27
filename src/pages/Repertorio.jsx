import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Music, 
  ChevronRight, 
  FolderPlus,
  Loader2,
  Search,
  Star,
  Globe, 
  Shield, 
  Cloud,
  CloudOff,
  Calendar,
  FileText,
  Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";

export default function ListaRepertorio() {
  const navigate = useNavigate();
  const { id: listaId } = useParams();

  const [loading, setLoading] = useState(true);

  const [listas, setListas] = useState([]);
  const [modalNovaListaOpen, setModalNovaListaOpen] = useState(false);
  
  // Novos campos para informações adicionais da lista
  const [nomeNovaLista, setNomeNovaLista] = useState("");
  const [dataNovaLista, setDataNovaLista] = useState("");
  const [obsNovaLista, setObsNovaLista] = useState("");
  const [statusNovaLista, setStatusNovaLista] = useState("planejada");

  const [nomeListaAtual, setNomeListaAtual] = useState("");
  const [dataListaAtual, setDataListaAtual] = useState("");
  const [obsListaAtual, setObsListaAtual] = useState("");
  const [statusListaAtual, setStatusListaAtual] = useState("");

  const [louvoresLista, setLouvoresLista] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");
  const [favoritos, setFavoritos] = useState([]);

  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");

  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioAtual = localStorage.getItem("icmlyrics_user") || "usuario_geral";
  const chaveFavoritos = `icmlyrics_repertorio_favoritos_${usuarioAtual}`;

  const estaNaNuvem = Boolean(userNuvem.trim());

  useEffect(() => {
    if (!estaNaNuvem) {
      setCarregandoValidacao(false);
      setLoading(false);
      setListas([]);
      return;
    }

    const validarAcesso = async () => {
      try {
        setCarregandoValidacao(true);
        const roleSalva = localStorage.getItem("icmlyrics_role") || "user";

        if (roleSalva === "super_admin" || userNuvem === "admin_geral") {
          setUserRole("super_admin");
          setNomeIgreja(userNuvem || "Administração Geral");
          setCarregandoValidacao(false);
          return;
        }

        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("role, nome_igreja")
          .eq("usuario", userNuvem.trim())
          .maybeSingle();

        if (!error && data) {
          const roleDoBanco = data.role?.toLowerCase() || "";
          if (roleDoBanco === "super_admin" || roleDoBanco === "super_adm") {
            setUserRole("super_admin");
          } else if (
            roleDoBanco === "church_admin" || 
            roleDoBanco === "adm_local" || 
            roleSalva === "church_admin"
          ) {
            setUserRole("church_admin");
          } else {
            setUserRole("user");
          }
          setNomeIgreja(data.nome_igreja || userNuvem);
        } else {
          setUserRole(roleSalva);
          setNomeIgreja(userNuvem);
        }
      } catch (err) {
        console.error("Erro ao validar permissões:", err);
        setUserRole(localStorage.getItem("icmlyrics_role") || "user");
      } finally {
        setCarregandoValidacao(false);
      }
    };

    validarAcesso();

    const salvos = localStorage.getItem(chaveFavoritos);
    if (salvos) {
      try { setFavoritos(JSON.parse(salvos)); } catch (e) {}
    }
  }, [userNuvem, chaveFavoritos, estaNaNuvem]);

  const podeCriar = userRole === "super_admin" || userRole === "church_admin";
  const isSuper = userRole === "super_admin";

  const podeModificarLista = (lista) => {
    if (isSuper) return true;
    if (userRole === "church_admin") {
      return lista.nuvem?.toLowerCase() === userNuvem.toLowerCase();
    }
    return false;
  };

  useEffect(() => {
    if (!estaNaNuvem) return;

    if (listaId) {
      carregarDetalhesLista();
    } else {
      carregarListas();
    }
  }, [listaId, userNuvem, estaNaNuvem]);

  const carregarListas = async () => {
    if (!estaNaNuvem) return;
    setLoading(true);
    try {
      let query = supabase
        .from('listas_repertorio')
        .select('*')
        .order('id', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar listas:", error.message);
      } else {
        const listasFiltradas = (data || []).filter(l => {
          if (isSuper) return true;
          if (!l.nuvem) return true; 
          return l.nuvem.toLowerCase() === userNuvem.toLowerCase() || l.tipo === "global";
        });
        setListas(listasFiltradas);
      }
    } catch (err) {
      console.error("Erro ao carregar listas:", err);
    } finally {
      setLoading(false);
    }
  };

  const carregarDetalhesLista = async () => {
    if (!estaNaNuvem) return;
    setLoading(true);
    try {
      const { data: listaData } = await supabase
        .from('listas_repertorio')
        .select('*')
        .eq('id', listaId)
        .single();

      if (listaData) {
        setNomeListaAtual(listaData.nome);
        setDataListaAtual(listaData.data_evento || "");
        setObsListaAtual(listaData.observacoes || "");
        setStatusListaAtual(listaData.status || "planejada");
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
            ritmo,
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
          item_lista_id: item.id
        })).filter(l => l !== null);

        setLouvoresLista(mapeados);
      }
    } catch (err) {
      console.error("Erro ao carregar lista:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarLista = async () => {
    if (!estaNaNuvem) return;
    if (!podeCriar) {
      return alert("Você não tem permissão para criar listas.");
    }
    if (!nomeNovaLista.trim()) {
      alert("Digite um nome para a lista.");
      return;
    }

    const { error } = await supabase
      .from('listas_repertorio')
      .insert([{ 
        nome: nomeNovaLista.trim(),
        data_evento: dataNovaLista || null,
        observacoes: obsNovaLista.trim() || null,
        status: statusNovaLista || "planejada",
        nuvem: isSuper ? "todos" : userNuvem,
        tipo: isSuper ? "global" : "local",
        autor: usuarioAtual,
        nome_igreja: nomeIgreja
      }]);

    if (error) {
      console.error("Detalhes do erro do Supabase:", error);
      alert("Erro ao criar lista: " + error.message);
    } else {
      setNomeNovaLista("");
      setDataNovaLista("");
      setObsNovaLista("");
      setStatusNovaLista("planejada");
      setModalNovaListaOpen(false);
      carregarListas();
    }
  };

  const handleExcluirLista = async (lista, e) => {
    e.stopPropagation();
    if (!podeModificarLista(lista)) {
      return alert("Você não tem permissão para excluir esta lista.");
    }

    if (window.confirm("Deseja realmente apagar esta lista e todos os seus itens?")) {
      const { error } = await supabase
        .from('listas_repertorio')
        .delete()
        .eq('id', lista.id);

      if (error) {
        alert("Erro ao excluir lista: " + error.message);
      } else {
        carregarListas();
      }
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

  if (!estaNaNuvem) {
    return (
      <div className="min-h-screen bg-white pb-28 flex flex-col">
        <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-white hover:text-slate-300 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold tracking-wide">Listas de Repertório</h1>
          </div>
        </div>

        <div className="text-center py-24 px-4 flex-1 flex flex-col items-center justify-center">
          <CloudOff className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700">Desconectado da nuvem</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            É necessário estar conectado a uma nuvem para visualizar e gerenciar as listas de repertório.
          </p>
        </div>
      </div>
    );
  }

  if (listaId) {
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

    const categorias = [
      { id: "todos", label: "Todos" },
      { id: "Cias", label: "Cias" },
      { id: "Coletânea", label: "Coletânea" },
      { id: "Avulsos", label: "Avulsos" }
    ];

    return (
      <div className="min-h-screen bg-white pb-28 flex flex-col">
        <div className="bg-slate-900 text-white px-4 pt-12 pb-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate("/repertorio")} 
                className="text-white hover:text-slate-300 transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold tracking-wide truncate max-w-[200px]">{nomeListaAtual || "Carregando..."}</h1>
            </div>

            <div className="flex items-center gap-2 text-right">
              <span className="text-[10px] font-bold text-slate-300 uppercase truncate max-w-[120px]">
                {nomeIgreja}
              </span>
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">
                {isSuper ? <Globe className="w-2.5 h-2.5 text-amber-400" /> : <Shield className="w-2.5 h-2.5 text-indigo-400" />}
                {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
              </span>
            </div>
          </div>

          {(dataListaAtual || obsListaAtual) && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1.5 text-xs text-slate-300">
              {dataListaAtual && (
                <div className="flex items-center gap-1.5 text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Data do Culto/Evento: <strong>{new Date(dataListaAtual + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></span>
                </div>
              )}
              {obsListaAtual && (
                <div className="flex items-start gap-1.5 text-slate-300">
                  <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="italic">Obs: {obsListaAtual}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 -mt-3 relative z-10">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              placeholder="Buscar por nome, número ou tom..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl shadow-md border border-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>
        </div>

        <div className="px-4 mt-5 overflow-x-auto no-scrollbar border-b border-slate-100 pb-3">
          <div className="flex gap-1.5">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaSelecionada(cat.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                  categoriaSelecionada === cat.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-2 divide-y divide-slate-100 flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin w-8 h-8 text-slate-400" />
            </div>
          ) : louvoresFiltrados.length > 0 ? (
            louvoresFiltrados.map((item) => {
              const isFavorito = favoritos.includes(item.id);
              return (
                <div 
                  key={item.id}
                  onClick={() => navigate(`/louvor/${item.id}`)}
                  className="py-3 flex items-center justify-between cursor-pointer group hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs">
                      {item.cifra_tom_original || "-"}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900">
                        {item.numero ? `${item.numero} - ` : ""}{item.nome}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">{item.categoria}</span>
                        {item.ritmo && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">{item.ritmo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28 flex flex-col">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-white hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold tracking-wide">Listas de Repertório</h1>
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          {carregandoValidacao ? (
            <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
          ) : (
            <>
              <span className="text-[11px] font-bold text-slate-300 uppercase truncate max-w-[150px]">
                {nomeIgreja}
              </span>
              <div className="flex items-center gap-1.5">
                <div 
                  onClick={(e) => { e.stopPropagation(); carregarListas(); }}
                  className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
                  title="Atualizar"
                >
                  <Cloud className={`w-3 h-3 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
                </div>
                <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">
                  {isSuper ? <Globe className="w-2.5 h-2.5 text-amber-400" /> : <Shield className="w-2.5 h-2.5 text-indigo-400" />}
                  {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-4 mt-6 flex-1">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-slate-400" />
          </div>
        ) : listas.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {listas.map((lista) => {
              const temPermissaoExcluir = podeModificarLista(lista);
              return (
                <div 
                  key={lista.id}
                  onClick={() => navigate(`/repertorio/lista/${lista.id}`)}
                  className="py-4 flex items-center justify-between cursor-pointer group hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <FolderPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {lista.nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lista.data_evento && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(lista.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {lista.observacoes && (
                          <span className="text-[11px] text-slate-400 italic truncate max-w-[150px]">
                            • {lista.observacoes}
                          </span>
                        )}
                        {!lista.data_evento && !lista.observacoes && (
                          <span className="text-[11px] text-slate-400">Toque para ver os louvores</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {temPermissaoExcluir && (
                      <button
                        onClick={(e) => handleExcluirLista(lista, e)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        title="Excluir Lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <Music className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">Nenhuma lista de repertório criada</p>
            {podeCriar && (
              <p className="text-[11px] text-slate-400 mt-1">Crie sua primeira lista usando o botão de mais abaixo.</p>
            )}
          </div>
        )}
      </div>

      {podeCriar && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => setModalNovaListaOpen(true)}
            className="w-12 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      <Dialog open={modalNovaListaOpen} onOpenChange={setModalNovaListaOpen}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-xl p-5 border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-semibold text-sm">
              Nova Lista de Repertório
            </DialogTitle>
          </DialogHeader>

          <div className="my-3 flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Nome da Lista *</label>
              <Input 
                placeholder="Ex: Culto de Domingo, Ensaio de Cias..." 
                value={nomeNovaLista} 
                onChange={(e) => setNomeNovaLista(e.target.value)} 
                className="h-9 mt-1 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Data do Evento / Culto</label>
              <Input 
                type="date"
                value={dataNovaLista} 
                onChange={(e) => setDataNovaLista(e.target.value)} 
                className="h-9 mt-1 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Observações / Anotações</label>
              <Textarea 
                placeholder="Ex: Culto de jovens, focar em louvores alegres..." 
                value={obsNovaLista} 
                onChange={(e) => setObsNovaLista(e.target.value)} 
                className="mt-1 text-xs bg-slate-50 border-slate-200 resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setModalNovaListaOpen(false)}
              className="h-8 text-xs border-slate-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCriarLista}
              className="h-8 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs"
            >
              Criar Lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}