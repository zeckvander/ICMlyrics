import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Music, ChevronRight, FolderPlus, Loader2, Search, Star, Globe, Shield, Cloud, CloudOff, Calendar, Info, Pencil, ExternalLink, Link as LinkIcon, User, Bell } from "lucide-react";
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
  const [modalEditarListaOpen, setModalEditarListaOpen] = useState(false);
  const [modalVisualizarOpen, setModalVisualizarOpen] = useState(false);
  const [listaEditando, setListaEditando] = useState(null);
  const [listaVisualizando, setListaVisualizando] = useState(null);
  
  const dataHoje = new Date().toISOString().split('T')[0];

  const [nomeNovaLista, setNomeNovaLista] = useState("");
  const [dataNovaLista, setDataNovaLista] = useState(dataHoje);
  const [obsNovaLista, setObsNovaLista] = useState("");
  const [statusNovaLista, setStatusNovaLista] = useState("planejada");
  const [linksNovaLista, setLinksNovaLista] = useState([]);

  const [nomeEdicao, setNomeEdicao] = useState("");
  const [dataEdicao, setDataEdicao] = useState("");
  const [obsEdicao, setObsEdicao] = useState("");
  const [statusEdicao, setStatusEdicao] = useState("planejada");
  const [linksEdicao, setLinksEdicao] = useState([]);

  const [nomeListaAtual, setNomeListaAtual] = useState("");
  const [dataListaAtual, setDataListaAtual] = useState("");
  const [obsListaAtual, setObsListaAtual] = useState("");
  const [statusListaAtual, setStatusListaAtual] = useState("");
  const [linksListaAtual, setLinksListaAtual] = useState([]);

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
    if (!estaNaNuvem) { setCarregandoValidacao(false); setLoading(false); setListas([]); return; }
    const validarAcesso = async () => {
      try {
        setCarregandoValidacao(true);
        const roleSalva = localStorage.getItem("icmlyrics_role") || "user";
        if (roleSalva === "super_admin" || userNuvem === "admin_geral") { setUserRole("super_admin"); setNomeIgreja(userNuvem || "Administração Geral"); setCarregandoValidacao(false); return; }
        const { data, error } = await supabase.from("igrejas_autorizadas").select("role, nome_igreja").eq("usuario", userNuvem.trim()).maybeSingle();
        if (!error && data) {
          const roleDoBanco = data.role?.toLowerCase() || "";
          if (roleDoBanco === "super_admin" || roleDoBanco === "super_adm") setUserRole("super_admin");
          else if (roleDoBanco === "church_admin" || roleDoBanco === "adm_local" || roleSalva === "church_admin") setUserRole("church_admin");
          else setUserRole("user");
          setNomeIgreja(data.nome_igreja || userNuvem);
        } else { setUserRole(roleSalva); setNomeIgreja(userNuvem); }
      } catch (err) { console.error("Erro ao validar permissões:", err); setUserRole(localStorage.getItem("icmlyrics_role") || "user");
      } finally { setCarregandoValidacao(false); }
    };
    validarAcesso();
    const salvos = localStorage.getItem(chaveFavoritos);
    if (salvos) try { setFavoritos(JSON.parse(salvos)); } catch (e) {}
  }, [userNuvem, chaveFavoritos, estaNaNuvem]);

  const podeCriar = userRole === "super_admin" || userRole === "church_admin";
  const isSuper = userRole === "super_admin";
  
  const podeModificarLista = (lista) => {
    if (isSuper) return true;
    if (userRole === "church_admin") return lista.nuvem?.toLowerCase() === userNuvem.toLowerCase();
    return false;
  };

  useEffect(() => {
    if (!estaNaNuvem) return;
    if (listaId) carregarDetalhesLista();
    else carregarListas();
  }, [listaId, userNuvem, estaNaNuvem]);

  const carregarListas = async () => {
    if (!estaNaNuvem) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('listas_repertorio').select('*').order('id', { ascending: false });
      if (error) console.error("Erro ao buscar listas:", error.message);
      else {
        const listasFiltradas = (data || []).filter(l => {
          if (isSuper) return true;
          if (!l.nuvem) return true; 
          return l.nuvem.toLowerCase() === userNuvem.toLowerCase() || l.tipo === "global";
        });
        setListas(listasFiltradas);
      }
    } catch (err) { console.error("Erro ao carregar listas:", err);
    } finally { setLoading(false); }
  };

  const carregarDetalhesLista = async () => {
    if (!estaNaNuvem) return;
    setLoading(true);
    try {
      const { data: listaData } = await supabase.from('listas_repertorio').select('*').eq('id', listaId).single();
      if (listaData) { 
        setNomeListaAtual(listaData.nome); 
        setDataListaAtual(listaData.data_evento || ""); 
        setObsListaAtual(listaData.observacoes || ""); 
        setStatusListaAtual(listaData.status || "planejada");
        setLinksListaAtual(listaData.links || []);
      }
      const { data: itensData, error: itensError } = await supabase.from('itens_repertorio').select(`id, ordem, tom_especial, louvores (id, numero, nome, categoria, ritmo, tema, cifra_tom_original)`).eq('lista_id', listaId).order('ordem', { ascending: true });
      if (!itensError && itensData) {
        const mapeados = itensData.map(item => ({ ...item.louvores, cifra_tom_original: item.tom_especial || item.louvores?.cifra_tom_original, item_lista_id: item.id })).filter(l => l !== null);
        setLouvoresLista(mapeados);
      }
    } catch (err) { console.error("Erro ao carregar lista:", err);
    } finally { setLoading(false); }
  };

  const handleCriarLista = async () => {
    if (!estaNaNuvem) return;
    if (!podeCriar) return alert("Você não tem permissão para criar listas.");
    if (!nomeNovaLista.trim()) return alert("Digite um nome para a lista.");
    
    const linksValidos = linksNovaLista.filter(l => l.titulo.trim() || l.url.trim());
    
    const { error } = await supabase.from('listas_repertorio').insert([{ 
      nome: nomeNovaLista.trim(), 
      data_evento: dataNovaLista || null, 
      observacoes: obsNovaLista.trim() || null, 
      status: statusNovaLista || "planejada", 
      links: linksValidos.length > 0 ? linksValidos : null,
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
      setDataNovaLista(new Date().toISOString().split('T')[0]); 
      setObsNovaLista(""); 
      setStatusNovaLista("planejada");
      setLinksNovaLista([]); 
      setModalNovaListaOpen(false); 
      carregarListas(); 
    }
  };

  const abrirModalEdita = (lista, e) => {
    e.stopPropagation();
    if (!podeModificarLista(lista)) return alert("Você não tem permissão para editar esta lista.");
    setListaEditando(lista); 
    setNomeEdicao(lista.nome || ""); 
    setDataEdicao(lista.data_evento || ""); 
    setObsEdicao(lista.observacoes || ""); 
    setStatusEdicao(lista.status || "planejada");
    setLinksEdicao(lista.links ? [...lista.links] : []);
    setModalEditarListaOpen(true);
  };

  const abrirModalVisualiza = (lista, e) => { 
    e.stopPropagation(); 
    setListaVisualizando(lista); 
    setModalVisualizarOpen(true); 
  };

  const handleSalvarEdicao = async () => {
    if (!listaEditando) return;
    if (!nomeEdicao.trim()) return alert("O nome da lista não pode ficar vazio.");
    
    const linksValidos = linksEdicao.filter(l => l.titulo.trim() || l.url.trim());

    const { error } = await supabase.from('listas_repertorio').update({ 
      nome: nomeEdicao.trim(), 
      data_evento: dataEdicao || null, 
      observacoes: obsEdicao.trim() || null, 
      status: statusEdicao || "planejada",
      links: linksValidos.length > 0 ? linksValidos : null 
    }).eq('id', listaEditando.id);
    
    if (error) alert("Erro ao atualizar lista: " + error.message);
    else { 
      setModalEditarListaOpen(false); 
      setListaEditando(null); 
      carregarListas(); 
    }
  };

  const handleExcluirLista = async (lista, e) => {
    e.stopPropagation();
    if (!podeModificarLista(lista)) return alert("Você não tem permissão para excluir esta lista.");
    if (window.confirm("Deseja realmente apagar esta lista e todos os seus itens?")) {
      const { error } = await supabase.from('listas_repertorio').delete().eq('id', lista.id);
      if (error) alert("Erro ao excluir lista: " + error.message);
      else carregarListas();
    }
  };

  const handleRemoverDaLista = async (itemListaId, e) => {
    e.stopPropagation();
    if (!podeCriar) return alert("Você não tem permissão para remover itens desta lista.");
    if (window.confirm("Deseja remover este louvor desta lista?")) {
      const { error } = await supabase.from('itens_repertorio').delete().eq('id', itemListaId);
      if (error) alert("Erro ao remover: " + error.message);
      else carregarDetalhesLista();
    }
  };

  const toggleFavorito = (id, e) => {
    e.stopPropagation();
    const novos = favoritos.includes(id) ? favoritos.filter(f => f !== id) : [...favoritos, id];
    setFavoritos(novos); localStorage.setItem(chaveFavoritos, JSON.stringify(novos));
  };

  if (!estaNaNuvem) {
    return (
      <div className="min-h-screen bg-white pb-28 flex flex-col">
        <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-white hover:text-slate-300 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
            <h1 className="text-xl font-bold tracking-wide">Listas de Repertório</h1>
          </div>
        </div>
        <div className="text-center py-24 px-4 flex-1 flex flex-col items-center justify-center">
          <CloudOff className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700">Desconectado da nuvem</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">É necessário estar conectado a uma nuvem para visualizar e gerenciar as listas de repertório.</p>
        </div>
      </div>
    );
  }

  if (listaId) {
    const louvoresFiltrados = louvoresLista.filter((item) => {
      const nomeMusica = item.nome || ""; const numeroStr = item.numero ? String(item.numero) : ""; const tomStr = item.cifra_tom_original || "";
      const textoMatch = nomeMusica.toLowerCase().includes(busca.toLowerCase()) || numeroStr.includes(busca) || tomStr.toLowerCase().includes(busca.toLowerCase());
      const categoriaMatch = categoriaSelecionada === "todos" || item.categoria === categoriaSelecionada;
      return textoMatch && categoriaMatch;
    });
    const categorias = [{ id: "todos", label: "Todos" }, { id: "Cias", label: "Cias" }, { id: "Coletânea", label: "Coletânea" }, { id: "Avulsos", label: "Avulsos" }];
    return (
      <div className="min-h-screen bg-white pb-28 flex flex-col">
        <div className="bg-slate-900 text-white px-4 pt-12 pb-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/repertorio")} className="text-white hover:text-slate-300 transition-colors" aria-label="Voltar"><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-xl font-bold tracking-wide truncate max-w-[200px]">{nomeListaAtual || "Carregando..."}</h1>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-[10px] font-bold text-slate-300 uppercase truncate max-w-[120px]">{nomeIgreja}</span>
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">{isSuper ? <Globe className="w-2.5 h-2.5 text-amber-400" /> : <Shield className="w-2.5 h-2.5 text-indigo-400" />}{isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}</span>
            </div>
          </div>
          {(dataListaAtual || obsListaAtual || (linksListaAtual && linksListaAtual.length > 0)) && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2 text-xs text-slate-300">
              {dataListaAtual && <div className="flex items-center gap-1.5 text-slate-200"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span>Data do Culto/Evento: <strong>{new Date(dataListaAtual + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></span></div>}
              {obsListaAtual && <div className="flex items-start gap-1.5 text-slate-300"><Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" /><span className="italic">Obs: {obsListaAtual}</span></div>}
              {linksListaAtual && linksListaAtual.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Links Anexos:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {linksListaAtual.map((l, i) => (
                      <a key={i} href={l.url.startsWith('http') ? l.url : `https://${l.url}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded-md transition-colors border border-slate-700">
                        <LinkIcon className="w-3 h-3 text-indigo-400" />
                        <span className="truncate max-w-[150px]">{l.titulo || l.url}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-4 -mt-3 relative z-10">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Search className="w-4 h-4" /></span>
            <input type="text" placeholder="Buscar por nome, número ou tom..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl shadow-md border border-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"/>
          </div>
        </div>
        <div className="px-4 mt-5 overflow-x-auto no-scrollbar border-b border-slate-100 pb-3">
          <div className="flex gap-1.5">{categorias.map((cat) => (<button key={cat.id} onClick={() => setCategoriaSelecionada(cat.id)} className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${categoriaSelecionada === cat.id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{cat.label}</button>))}</div>
        </div>
        <div className="px-4 mt-2 divide-y divide-slate-100 flex-1">
          {loading ? <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div> : louvoresFiltrados.length > 0 ? (
            louvoresFiltrados.map((item) => {
              const isFavorito = favoritos.includes(item.id);
              return (
                <div key={item.id} onClick={() => navigate(`/louvor/${item.id}`)} className="py-3 flex items-center justify-between cursor-pointer group hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs">{item.cifra_tom_original || "-"}</div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900">{item.numero ? `${item.numero} - ` : ""}{item.nome}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5"><span className="text-[10px] text-slate-500">{item.categoria}</span>{item.ritmo && <><span className="text-slate-300">•</span><span className="text-[10px] text-slate-400">{item.ritmo}</span></>}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    {podeCriar && <button onClick={(e) => handleRemoverDaLista(item.item_lista_id, e)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" title="Remover desta lista"><Trash2 className="w-4 h-4" /></button>}
                    <button onClick={(e) => toggleFavorito(item.id, e)} className="p-1.5 text-slate-300 hover:text-amber-500 transition-colors"><Star className={`w-4 h-4 ${isFavorito ? "text-amber-400 fill-amber-400" : ""}`} /></button>
                    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors ml-1" />
                  </div>
                </div>
              );
            })
          ) : <div className="text-center py-16 px-4"><Music className="w-5 h-5 text-slate-300 mx-auto mb-2" /><p className="text-xs font-medium text-slate-600">Nenhum louvor nesta lista</p></div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28 flex flex-col">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-white hover:text-slate-300 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold tracking-wide">Listas de Repertório</h1>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          {carregandoValidacao ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> : (
            <>
              <span className="text-[11px] font-bold text-slate-300 uppercase truncate max-w-[150px]">{nomeIgreja}</span>
              <div className="flex items-center gap-1.5">
                <div onClick={(e) => { e.stopPropagation(); carregarListas(); }} className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors" title="Atualizar"><Cloud className={`w-3 h-3 text-emerald-400 ${loading ? "animate-spin" : ""}`} /></div>
                <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">{isSuper ? <Globe className="w-2.5 h-2.5 text-amber-400" /> : <Shield className="w-2.5 h-2.5 text-indigo-400" />}{isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="px-4 mt-6 flex-1">
        {loading ? <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div> : listas.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {listas.map((lista) => {
              const temPermissao = podeModificarLista(lista);
              return (
                <div key={lista.id} onClick={(e) => abrirModalVisualiza(lista, e)} className="py-4 flex items-center justify-between cursor-pointer group hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center"><FolderPlus className="w-5 h-5" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{lista.nome}</h3>
                        {lista.links && lista.links.length > 0 && (
                          <span className="text-indigo-500 flex items-center gap-0.5 text-xs bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100" title={`${lista.links.length} link(s) anexo(s)`}>
                            <LinkIcon className="w-3 h-3" />
                            <span className="text-[10px] font-medium">{lista.links.length}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {lista.data_evento && <span className="text-[11px] text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{new Date(lista.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                        {lista.autor && <span className="text-[11px] text-slate-400 flex items-center gap-1"><User className="w-3 h-3 text-slate-400" />{lista.autor}</span>}
                        {!lista.data_evento && !lista.autor && (!lista.links || lista.links.length === 0) && <span className="text-[11px] text-slate-400">Toque para ver detalhes</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {temPermissao && <><button onClick={(e) => abrirModalEdita(lista, e)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors" title="Editar Lista"><Pencil className="w-4 h-4" /></button><button onClick={(e) => handleExcluirLista(lista, e)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Excluir Lista"><Trash2 className="w-4 h-4" /></button></>}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : <div className="text-center py-20 px-4"><Music className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-xs font-medium text-slate-600">Nenhuma lista de repertório criada</p>{podeCriar && <p className="text-[11px] text-slate-400 mt-1">Crie sua primeira lista usando o botão de mais abaixo.</p>}</div>}
      </div>

      {podeCriar && (
        <div className="fixed bottom-6 right-6 z-30">
          <button onClick={() => { setNomeNovaLista(""); setDataNovaLista(new Date().toISOString().split('T')[0]); setObsNovaLista(""); setLinksNovaLista([]); setModalNovaListaOpen(true); }} className="w-12 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95"><Plus className="w-5 h-5" /></button>
        </div>
      )}

      {/* MODAL NOVA LISTA */}
      <Dialog open={modalNovaListaOpen} onOpenChange={setModalNovaListaOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-lg w-full max-h-[90vh] rounded-2xl p-6 border-slate-100 flex flex-col">
          <DialogHeader><DialogTitle className="text-slate-900 font-semibold text-base">Nova Lista de Repertório</DialogTitle></DialogHeader>
          <div className="my-4 flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar">
            
            <div className="flex gap-3 w-full">
              <div className="w-[65%]">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Nome da Lista *</label>
                <Input placeholder="Ex: Culto de Domingo..." value={nomeNovaLista} onChange={(e) => setNomeNovaLista(e.target.value)} className="h-10 mt-1 text-xs bg-slate-50 border-slate-200" />
              </div>
              <div className="w-[35%]">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Data do Evento</label>
                <Input type="date" value={dataNovaLista} onChange={(e) => setDataNovaLista(e.target.value)} className="h-10 mt-1 text-xs bg-slate-50 border-slate-200 px-2" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Observações</label>
              <Textarea placeholder="Ex: Culto de jovens..." value={obsNovaLista} onChange={(e) => setObsNovaLista(e.target.value)} className="mt-1 text-xs bg-slate-50 border-slate-200 resize-none h-28" />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Links Anexos</label>
                <button type="button" onClick={() => setLinksNovaLista([...linksNovaLista, { titulo: "", url: "" }])} className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar Link
                </button>
              </div>
              {linksNovaLista.map((link, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Input placeholder="Título do link (ex: Cifra Club)" value={link.titulo} onChange={(e) => { const novos = [...linksNovaLista]; novos[idx].titulo = e.target.value; setLinksNovaLista(novos); }} className="h-7 text-xs bg-white border-slate-200" />
                    <Input placeholder="URL (https://...)" value={link.url} onChange={(e) => { const novos = [...linksNovaLista]; novos[idx].url = e.target.value; setLinksNovaLista(novos); }} className="h-7 text-xs bg-white border-slate-200" />
                  </div>
                  <button type="button" onClick={() => setLinksNovaLista(linksNovaLista.filter((_, i) => i !== idx))} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>
          <DialogFooter className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" onClick={() => setModalNovaListaOpen(false)} className="h-9 text-xs border-slate-200">Cancelar</Button>
              <Button onClick={() => { setModalNovaListaOpen(false); navigate("/avisos"); }} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Criar Aviso
              </Button>
            </div>
            <Button onClick={handleCriarLista} className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs">Criar Lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR LISTA */}
      <Dialog open={modalEditarListaOpen} onOpenChange={setModalEditarListaOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-lg w-full max-h-[90vh] rounded-2xl p-6 border-slate-100 flex flex-col">
          <DialogHeader><DialogTitle className="text-slate-900 font-semibold text-base">Editar Lista</DialogTitle></DialogHeader>
          <div className="my-4 flex flex-col gap-4 flex-1 overflow-y-auto no-scrollbar">
            
            <div className="flex gap-3 w-full">
              <div className="w-[65%]">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Nome da Lista *</label>
                <Input placeholder="Ex: Culto de Domingo..." value={nomeEdicao} onChange={(e) => setNomeEdicao(e.target.value)} className="h-10 mt-1 text-xs bg-slate-50 border-slate-200" />
              </div>
              <div className="w-[35%]">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Data do Evento</label>
                <Input type="date" value={dataEdicao} onChange={(e) => setDataEdicao(e.target.value)} className="h-10 mt-1 text-xs bg-slate-50 border-slate-200 px-2" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Observações</label>
              <Textarea placeholder="Ex: Culto de jovens..." value={obsEdicao} onChange={(e) => setObsEdicao(e.target.value)} className="mt-1 text-xs bg-slate-50 border-slate-200 resize-none h-28" />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Links Anexos</label>
                <button type="button" onClick={() => setLinksEdicao([...linksEdicao, { titulo: "", url: "" }])} className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar Link
                </button>
              </div>
              {linksEdicao.map((link, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Input placeholder="Título do link" value={link.titulo} onChange={(e) => { const novos = [...linksEdicao]; novos[idx].titulo = e.target.value; setLinksEdicao(novos); }} className="h-7 text-xs bg-white border-slate-200" />
                    <Input placeholder="URL (https://...)" value={link.url} onChange={(e) => { const novos = [...linksEdicao]; novos[idx].url = e.target.value; setLinksEdicao(novos); }} className="h-7 text-xs bg-white border-slate-200" />
                  </div>
                  <button type="button" onClick={() => setLinksEdicao(linksEdicao.filter((_, i) => i !== idx))} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>
          <DialogFooter className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalEditarListaOpen(false)} className="h-9 text-xs border-slate-200">Cancelar</Button>
            <Button onClick={handleSalvarEdicao} className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL VISUALIZAR LISTA */}
      <Dialog open={modalVisualizarOpen} onOpenChange={setModalVisualizarOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-lg w-full max-h-[90vh] rounded-2xl p-6 border-slate-100 flex flex-col">
          <DialogHeader><DialogTitle className="text-slate-900 font-semibold text-lg">{listaVisualizando?.nome}</DialogTitle></DialogHeader>
          <div className="my-4 flex flex-col gap-4 text-xs text-slate-600 flex-1 overflow-y-auto">
            {listaVisualizando?.data_evento && <div className="flex items-center gap-2 text-slate-700 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100"><Calendar className="w-4 h-4 text-slate-400" /><span>Data do Evento: {new Date(listaVisualizando.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div>}
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 flex flex-col">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Observações:</p>
              <div className="flex-1 overflow-y-auto max-h-[160px]"><p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-xs">{listaVisualizando?.observacoes || "Nenhuma observação informada."}</p></div>
            </div>

            {listaVisualizando?.links && listaVisualizando.links.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Links Anexos:</p>
                <div className="flex flex-col gap-1.5">
                  {listaVisualizando.links.map((l, i) => (
                    <a key={i} href={l.url.startsWith('http') ? l.url : `https://${l.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 text-slate-700 transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <LinkIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-medium text-xs truncate">{l.titulo || l.url}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
            {podeCriar && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setModalVisualizarOpen(false)} className="h-9 text-xs border-slate-200">Cancelar</Button>
                <Button onClick={() => { setModalVisualizarOpen(false); setNomeNovaLista(""); setDataNovaLista(new Date().toISOString().split('T')[0]); setObsNovaLista(""); setLinksNovaLista([]); setModalNovaListaOpen(true); }} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" /> Criar Aviso
                </Button>
              </div>
            )}
            <Button onClick={() => { const idLista = listaVisualizando?.id; setModalVisualizarOpen(false); navigate(`/repertorio/lista/${idLista}`); }} className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs">Continuar para a Lista</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}