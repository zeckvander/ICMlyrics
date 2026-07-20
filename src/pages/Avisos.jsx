import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Globe, Shield, 
  Loader2, X, ChevronDown, ChevronUp, Pencil 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Avisos() {
  const navigate = useNavigate();

  // Estados dos Avisos
  const [avisos, setAvisos] = useState([]);
  const [assuntoAviso, setAssuntoAviso] = useState("");
  const [novoAviso, setNovoAviso] = useState("");
  const [linksForm, setLinksForm] = useState([{ texto: "", url: "" }]);
  const [avisoEditandoId, setAvisoEditandoId] = useState(null);
  const [carregandoAvisos, setCarregandoAvisos] = useState(true);
  const [avisoExpandido, setAvisoExpandido] = useState(null);
  const [listaExpandida, setListaExpandida] = useState(false);

  // Estados de Usuário / Igreja
  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");

  // Identificadores locais
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const userName = localStorage.getItem("icmlyrics_user") || "Usuário";

  // 1. VALIDAÇÃO DE PERMISSÕES
  useEffect(() => {
    const validarAcesso = async () => {
      try {
        setCarregandoValidacao(true);

        const roleSalva = localStorage.getItem("icmlyrics_role") || "user";

        // Prioridade 1: Super Admin (chave mestra / login geral / storage)
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

        // Prioridade 2: Consulta na tabela igrejas_autorizadas
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

  const podeCriar = userRole === "super_admin" || userRole === "church_admin";
  const isSuper = userRole === "super_admin";

  // Função auxiliar para verificar permissão sobre um aviso específico
  const podeModificarAviso = (aviso) => {
    if (isSuper) return true; // Super Admin altera/exclui tudo
    if (userRole === "church_admin") {
      // Adm local só modifica o que for do seu tipo local e da sua nuvem
      return (
        aviso.tipo !== "global" &&
        aviso.nuvem?.toLowerCase() === userNuvem.toLowerCase()
      );
    }
    return false;
  };

  // 2. BUSCA AVISOS NO SUPABASE
  const buscarAvisosDoBanco = async () => {
    setCarregandoAvisos(true);
    try {
      const { data, error } = await supabase
        .from("avisos")
        .select(`*, avisos_links(titulo_link, url)`)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAvisos(
          data.filter(
            (a) => a.tipo === "global" || a.nuvem?.toLowerCase() === userNuvem.toLowerCase()
          )
        );
      }
    } catch (err) {
      console.error("Erro ao buscar avisos:", err);
    } finally {
      setCarregandoAvisos(false);
    }
  };

  useEffect(() => {
    buscarAvisosDoBanco();
  }, [userNuvem]);

  // 3. SALVAR OU EDITAR AVISO
  const handleSalvarAviso = async () => {
    if (!assuntoAviso.trim() || !novoAviso.trim()) {
      return alert("Assunto e texto são obrigatórios.");
    }

    try {
      if (avisoEditandoId) {
        // Valida se tem permissão antes de salvar a edição
        const avisoExistente = avisos.find((a) => a.id === avisoEditandoId);
        if (avisoExistente && !podeModificarAviso(avisoExistente)) {
          return alert("Você não tem permissão para editar este aviso.");
        }

        const { error: errorAviso } = await supabase
          .from("avisos")
          .update({
            assunto: assuntoAviso.trim(),
            texto: novoAviso.trim(),
          })
          .eq("id", avisoEditandoId);

        if (errorAviso) throw errorAviso;

        await supabase.from("avisos_links").delete().eq("aviso_id", avisoEditandoId);

        const linksParaSalvar = linksForm
          .filter((l) => l.url.trim() !== "")
          .map((l) => ({
            aviso_id: avisoEditandoId,
            titulo_link: l.texto.trim() || "Link",
            url: l.url.trim(),
          }));

        if (linksParaSalvar.length > 0) {
          await supabase.from("avisos_links").insert(linksParaSalvar);
        }
      } else {
        const { data: avisoCriado, error: errorCriar } = await supabase
          .from("avisos")
          .insert([
            {
              assunto: assuntoAviso.trim(),
              texto: novoAviso.trim(),
              tipo: isSuper ? "global" : "local",
              nuvem: isSuper ? "todos" : userNuvem,
              autor: userName,
              nome_igreja: nomeIgreja,
            },
          ])
          .select()
          .single();

        if (errorCriar) throw errorCriar;

        const linksParaSalvar = linksForm
          .filter((l) => l.url.trim() !== "")
          .map((l) => ({
            aviso_id: avisoCriado.id,
            titulo_link: l.texto.trim() || "Link",
            url: l.url.trim(),
          }));

        if (linksParaSalvar.length > 0) {
          await supabase.from("avisos_links").insert(linksParaSalvar);
        }
      }

      setAvisoEditandoId(null);
      setAssuntoAviso("");
      setNovoAviso("");
      setLinksForm([{ texto: "", url: "" }]);
      buscarAvisosDoBanco();
    } catch (err) {
      console.error("Erro ao salvar aviso:", err);
      alert(`Erro ao salvar: ${err.message || "Tente novamente."}`);
    }
  };

  // 4. DELETAR AVISO
  const handleDeletarAviso = async (aviso) => {
    if (!podeModificarAviso(aviso)) {
      return alert("Você não tem permissão para excluir avisos do Super Admin.");
    }

    if (!window.confirm("Deseja realmente excluir este aviso?")) return;
    try {
      await supabase.from("avisos").delete().eq("id", aviso.id);
      buscarAvisosDoBanco();
    } catch (err) {
      console.error("Erro ao deletar aviso:", err);
    }
  };

  // 5. INICIAR EDIÇÃO
  const handleIniciarEdicao = (aviso) => {
    if (!podeModificarAviso(aviso)) {
      return alert("Você não tem permissão para editar este aviso.");
    }

    setAvisoEditandoId(aviso.id);
    setAssuntoAviso(aviso.assunto || "");
    setNovoAviso(aviso.texto || "");
    if (aviso.avisos_links && aviso.avisos_links.length > 0) {
      setLinksForm(aviso.avisos_links.map((l) => ({ texto: l.titulo_link || "", url: l.url || "" })));
    } else {
      setLinksForm([{ texto: "", url: "" }]);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Cabeçalho */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Mural</h1>
        </div>

        {/* Indicador do Nível de Permissão */}
        <div className="flex flex-col items-end gap-1 text-right max-w-[180px]">
          {carregandoValidacao ? (
            <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
          ) : (
            <span className="text-[11px] font-bold text-slate-300 uppercase truncate w-full">
              {nomeIgreja}
            </span>
          )}
          <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-400">
            {isSuper ? (
              <Globe className="w-2.5 h-2.5 text-amber-400" />
            ) : (
              <Shield className="w-2.5 h-2.5 text-indigo-400" />
            )}
            {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto mt-2">
        {/* ÁREA DE CRIAÇÃO/EDIÇÃO */}
        {podeCriar && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                {avisoEditandoId ? "Editando Aviso" : "Novo Aviso"}
              </h3>
              <button
                onClick={() => setLinksForm([...linksForm, { texto: "", url: "" }])}
                className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                + Adicionar Link
              </button>
            </div>

            <input
              value={assuntoAviso}
              onChange={(e) => setAssuntoAviso(e.target.value)}
              placeholder="Assunto do aviso"
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <textarea
              value={novoAviso}
              onChange={(e) => setNovoAviso(e.target.value)}
              placeholder="Escreva a mensagem do aviso..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none h-32 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Links anexos */}
            <div className="space-y-2">
              {linksForm.map((link, idx) => (
                <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-200 relative">
                  {linksForm.length > 1 && (
                    <button
                      onClick={() => setLinksForm(linksForm.filter((_, i) => i !== idx))}
                      className="absolute right-2 top-2 p-1 hover:bg-slate-200 rounded-full"
                    >
                      <X className="w-3 h-3 text-rose-500" />
                    </button>
                  )}
                  <input
                    placeholder="Título do link (ex: Inscrição)"
                    className="w-full p-1.5 text-[10px] bg-transparent border-b border-slate-200 outline-none font-medium"
                    value={link.texto}
                    onChange={(e) => {
                      const novos = [...linksForm];
                      novos[idx].texto = e.target.value;
                      setLinksForm(novos);
                    }}
                  />
                  <input
                    placeholder="URL (https://...)"
                    className="w-full p-1.5 text-[10px] bg-transparent outline-none text-slate-600"
                    value={link.url}
                    onChange={(e) => {
                      const novos = [...linksForm];
                      novos[idx].url = e.target.value;
                      setLinksForm(novos);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              {avisoEditandoId && (
                <button
                  onClick={() => {
                    setAvisoEditandoId(null);
                    setAssuntoAviso("");
                    setNovoAviso("");
                    setLinksForm([{ texto: "", url: "" }]);
                  }}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleSalvarAviso}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                {avisoEditandoId ? "Salvar Alterações" : "Publicar Aviso"}
              </button>
            </div>
          </div>
        )}

        {/* LISTAGEM DE AVISOS */}
        <div className="space-y-4">
          {carregandoAvisos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : avisos.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-wider">
              Nenhum aviso no mural
            </div>
          ) : !podeCriar ? (
            /* VISÃO DO MEMBRO / USUÁRIO COMUM */
            <>
              {/* Card do aviso mais recente (Texto "Último Aviso" removido) */}
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm">
                <h3 className="text-sm font-bold text-indigo-950 uppercase mb-2">
                  {avisos[0].assunto}
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap mb-3">
                  {avisos[0].texto}
                </p>
                {avisos[0].avisos_links?.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-indigo-700 font-bold text-xs underline mt-1 mr-3"
                  >
                    {link.titulo_link}
                  </a>
                ))}
              </div>

              {/* Mensagens Anteriores */}
              {avisos.length > 1 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setListaExpandida(!listaExpandida)}
                    className="w-full flex justify-between items-center px-1 py-1 text-slate-500 hover:text-slate-800"
                  >
                    <span className="text-xs font-bold uppercase">Mensagens Anteriores</span>
                    {listaExpandida ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {listaExpandida &&
                    avisos.slice(1).map((aviso) => (
                      <div
                        key={aviso.id}
                        className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-slate-200 transition-all"
                        onClick={() =>
                          setAvisoExpandido(avisoExpandido === aviso.id ? null : aviso.id)
                        }
                      >
                        <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">
                          {aviso.assunto}
                        </h3>
                        <div className="text-xs text-slate-600">
                          <p
                            className={`whitespace-pre-wrap ${
                              avisoExpandido === aviso.id ? "" : "line-clamp-2"
                            }`}
                          >
                            {aviso.texto}
                          </p>
                          {avisoExpandido === aviso.id &&
                            aviso.avisos_links?.map((link, i) => (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-indigo-600 underline mt-2 font-semibold"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {link.titulo_link}
                              </a>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          ) : (
            /* VISÃO DO ADMINISTRADOR */
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase px-1 block">
                Gerenciar Avisos ({avisos.length})
              </span>

              {avisos.map((aviso) => {
                const temPermissaoEdicao = podeModificarAviso(aviso);

                return (
                  <div
                    key={aviso.id}
                    className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative cursor-pointer hover:border-slate-200 transition-all"
                    onClick={() =>
                      setAvisoExpandido(avisoExpandido === aviso.id ? null : aviso.id)
                    }
                  >
                    {/* Botões de Ação apenas se o Admin tiver permissão para este aviso */}
                    {temPermissaoEdicao ? (
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIniciarEdicao(aviso);
                          }}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                          title="Editar aviso"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletarAviso(aviso);
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                          title="Excluir aviso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Tag indicativa para aviso Global do Super Admin */
                      <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Globe className="w-3 h-3" />
                        Global
                      </div>
                    )}

                    <h3 className="text-sm font-bold text-slate-800 uppercase pr-16 mb-1">
                      {aviso.assunto}
                    </h3>

                    <div className="text-xs text-slate-600 pr-12">
                      <p
                        className={`whitespace-pre-wrap ${
                          avisoExpandido === aviso.id ? "" : "line-clamp-3"
                        }`}
                      >
                        {aviso.texto}
                      </p>
                      {avisoExpandido === aviso.id &&
                        aviso.avisos_links?.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-indigo-600 underline mt-2 font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {link.titulo_link}
                          </a>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}