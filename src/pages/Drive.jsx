import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, ExternalLink, Trash2, 
  Search, Cloud, Globe, Shield, Loader2, Pencil 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

export default function Drive() {
  const navigate = useNavigate();

  const [links, setLinks] = useState([]);
  const [busca, setBusca] = useState("");
  const [nomeLink, setNomeLink] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const [linkEditandoId, setLinkEditandoId] = useState(null);

  const [carregandoLinks, setCarregandoLinks] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);

  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [userRole, setUserRole] = useState("user");

  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const userName = localStorage.getItem("icmlyrics_user") || "Usuário";

  const formatarUrl = (url) => {
    if (!url) return "#";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  };

  useEffect(() => {
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

        if (!userNuvem.trim()) {
          setUserRole("user");
          setNomeIgreja("Modo Offline");
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
  }, [userNuvem]);

  const buscarLinksDoBanco = async () => {
    setCarregandoLinks(true);
    try {
      const { data, error } = await supabase
        .from("drive")
        .select("*");

      if (!error && data) {
        setLinks(
          data.filter(
            (item) =>
              item.acesso_usuario === "global" ||
              item.acesso_usuario?.toLowerCase() === userNuvem.toLowerCase()
          )
        );
      }
    } catch (err) {
      console.error("Erro ao buscar links do drive:", err);
    } finally {
      setCarregandoLinks(false);
    }
  };

  useEffect(() => {
    buscarLinksDoBanco();
  }, [userNuvem]);

  const isSuper = userRole === "super_admin";
  const podeCriar = userRole === "super_admin" || userRole === "church_admin";

  const podeModificarLink = (item) => {
    if (isSuper) return true;
    if (userRole === "church_admin") {
      return item.acesso_usuario?.toLowerCase() === userNuvem.toLowerCase();
    }
    return false;
  };

  const handleSalvarLink = async (e) => {
    e.preventDefault();
    if (!nomeLink.trim() || !urlLink.trim()) {
      return alert("Preencha o título e o link.");
    }

    setSalvando(true);
    try {
      if (linkEditandoId) {
        const linkExistente = links.find((l) => l.id === linkEditandoId);
        if (linkExistente && !podeModificarLink(linkExistente)) {
          alert("Você não tem permissão para editar este link.");
          setSalvando(false);
          return;
        }

        const { error } = await supabase
          .from("drive")
          .update({
            nome_link: nomeLink.trim(),
            link: urlLink.trim(),
          })
          .eq("id", linkEditandoId);

        if (error) throw error;
      } else {
        const categoriaTarget = isSuper ? "global" : userNuvem.toLowerCase();
        const quantidadeAtual = links.filter((item) =>
          categoriaTarget === "global"
            ? item.acesso_usuario === "global"
            : item.acesso_usuario?.toLowerCase() === categoriaTarget
        ).length;

        if (quantidadeAtual >= 4) {
          setSalvando(false);
          return alert("Limite atingido! Não é possível acrescentar mais de 4 links nesta seção.");
        }

        const { error } = await supabase
          .from("drive")
          .insert([
            {
              nome_link: nomeLink.trim(),
              link: urlLink.trim(),
              acesso_usuario: isSuper ? "global" : userNuvem,
              responsavel: userName,
            },
          ]);

        if (error) throw error;
      }

      setNomeLink("");
      setUrlLink("");
      setLinkEditandoId(null);
      await buscarLinksDoBanco();
    } catch (err) {
      console.error("Erro ao salvar link:", err);
      alert(`Erro ao salvar: ${err.message || "Tente novamente."}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleIniciarEdicao = (item) => {
    if (!podeModificarLink(item)) {
      return alert("Você não tem permissão para editar este link.");
    }
    setLinkEditandoId(item.id);
    setNomeLink(item.nome_link || "");
    setUrlLink(item.link || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletarLink = async (item) => {
    if (!podeModificarLink(item)) {
      return alert("Você não tem permissão para excluir este link.");
    }
    if (!window.confirm("Deseja realmente excluir este link?")) return;

    try {
      const { error } = await supabase.from("drive").delete().eq("id", item.id);
      if (error) throw error;
      buscarLinksDoBanco();
    } catch (err) {
      console.error("Erro ao deletar link:", err);
      alert("Erro ao excluir link.");
    }
  };

  const linksFiltrados = links.filter((l) =>
    (l.nome_link || "").toLowerCase().includes(busca.toLowerCase())
  );

  const linksNuvem = linksFiltrados
    .filter((l) => l.acesso_usuario !== "global")
    .sort((a, b) => (a.nome_link || "").localeCompare(b.nome_link || ""))
    .slice(0, 4);

  const linksGerais = linksFiltrados
    .filter((l) => l.acesso_usuario === "global")
    .sort((a, b) => Number(a.id) - Number(b.id))
    .slice(0, 4);

  const CardLink = ({ item }) => {
    const podeEditar = podeModificarLink(item);
    return (
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-between gap-2 hover:border-slate-200 transition-all">
        <a 
          href={formatarUrl(item.link)} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2.5 text-blue-600 hover:underline flex-1 min-w-0"
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
          <span className="truncate font-medium text-slate-800 text-xs">{item.nome_link}</span>
        </a>

        {podeEditar && (
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => handleIniciarEdicao(item)} 
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
              title="Editar link"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => handleDeletarLink(item)} 
              className="p-1 hover:bg-rose-50 rounded text-slate-300 hover:text-rose-500 transition-colors"
              title="Excluir link"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="text-slate-300 hover:text-white transition-colors p-1"
            title="Voltar para o Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-xl font-bold tracking-tight">Drive</h1>
            <p className="text-slate-400 text-xs">Links gerais</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right max-w-[180px]">
          {carregandoValidacao ? (
            <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
          ) : !userNuvem.trim() ? (
            <Cloud className="w-6 h-6 text-slate-400" />
          ) : (
            <>
              <span className="text-[11px] font-bold text-slate-300 uppercase truncate w-full">
                {nomeIgreja}
              </span>
              <div className="flex items-center gap-1.5">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    buscarLinksDoBanco();
                  }}
                  className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
                  title="Clique para atualizar/sincronizar"
                >
                  <Cloud className={`w-3 h-3 text-emerald-400 ${carregandoLinks ? "animate-spin" : ""}`} />
                </div>

                <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">
                  {isSuper ? (
                    <Globe className="w-2.5 h-2.5 text-amber-400" />
                  ) : (
                    <Shield className="w-2.5 h-2.5 text-indigo-400" />
                  )}
                  {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-5 max-w-md mx-auto">
        <div className="relative shadow-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar link..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>

        {podeCriar && (
          <form onSubmit={handleSalvarLink} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-slate-900" />
              {linkEditandoId ? "Editando Link" : "Novo Link"}
            </h3>

            <div>
              <Label className="text-xs">Título do Link</Label>
              <Input 
                value={nomeLink} 
                onChange={(e) => setNomeLink(e.target.value)} 
                placeholder="Ex: Partitura Geral" 
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input 
                value={urlLink} 
                onChange={(e) => setUrlLink(e.target.value)} 
                placeholder="https://drive.google.com/..." 
                type="url" 
                className="text-xs mt-1"
              />
            </div>

            <div className="flex gap-2 pt-1">
              {linkEditandoId && (
                <Button 
                  type="button" 
                  variant="outline"
                  size="sm" 
                  onClick={() => {
                    setLinkEditandoId(null);
                    setNomeLink("");
                    setUrlLink("");
                  }}
                  className="w-1/3 text-xs"
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" size="sm" disabled={salvando} className="flex-1 bg-slate-900 hover:bg-slate-800 text-xs font-bold">
                {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                {linkEditandoId ? "Salvar Alterações" : "Adicionar Link"}
              </Button>
            </div>
          </form>
        )}

        {carregandoLinks ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : linksFiltrados.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-8 uppercase font-bold tracking-wider">
            {busca ? "Nenhum link encontrado" : "Nenhum link cadastrado"}
          </p>
        ) : (
          <div className="space-y-6">
            {linksNuvem.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-indigo-500" />
                    {nomeIgreja}
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                    {linksNuvem.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {linksNuvem.map((l) => (
                    <CardLink key={l.id} item={l} />
                  ))}
                </div>
              </div>
            )}

            {linksGerais.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    Drives sugeridos
                  </span>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-100">
                    {linksGerais.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {linksGerais.map((l) => (
                    <CardLink key={l.id} item={l} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}