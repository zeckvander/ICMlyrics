import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Globe, Shield, 
  Loader2, X, ChevronDown, ChevronUp, Pencil, Cloud, ExternalLink, Music,
  Calendar, Users, ArrowRight, Eye
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
export default function Avisos() {
  const navigate = useNavigate();

  const [avisos, setAvisos] = useState([]);
  const [assuntoAviso, setAssuntoAviso] = useState("");
  const [novoAviso, setNovoAviso] = useState("");
  const [repertorioId, setRepertorioId] = useState(null);
  const [repertorioSelecionado, setRepertorioSelecionado] = useState(null);
  const [escalaSelecionada, setEscalaSelecionada] = useState(null);
  const [linksForm, setLinksForm] = useState([{ texto: "", url: "" }]);
  const [avisoEditandoId, setAvisoEditandoId] = useState(null);
  const [carregandoAvisos, setCarregandoAvisos] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [avisoExpandido, setAvisoExpandido] = useState(null);
  const [listaExpandida, setListaExpandida] = useState(false);
  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");
  const [modalEscalaOpen, setModalEscalaOpen] = useState(false);
  const [escalas, setEscalas] = useState([]);
  const [carregandoEscalas, setCarregandoEscalas] = useState(false);
  const [modalRepertorioOpen, setModalRepertorioOpen] = useState(false);
  const [repertorios, setRepertorios] = useState([]);
  const [carregandoRepertorios, setCarregandoRepertorios] = useState(false);
  const [modalInfoEscalaOpen, setModalInfoEscalaOpen] = useState(false);
  const [modalInfoRepertorioOpen, setModalInfoRepertorioOpen] = useState(false);
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const userName = localStorage.getItem("icmlyrics_user") || "Usuário";
  const formatarUrl = (url) => {
    if (!url) return "#";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  };
  const formatarData = (dataStr) => {
    if (!dataStr) return "";
    const partes = dataStr.split("T")[0].split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };
  const formatarDataComDiaSemana = (dataRaw) => {
    if (!dataRaw) return "Data não definida";
    const strData = dataRaw.split("T")[0];
    const partes = strData.split("-");
    if (partes.length !== 3) return formatarData(dataRaw);
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    const dataObj = new Date(ano, mes, dia);
    const diasSemana = [
      "domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"
    ];
    const diaFormatado = String(dia).padStart(2, "0");
    const mesFormatado = String(mes + 1).padStart(2, "0");
    const nomeDia = diasSemana[dataObj.getDay()] || "";
    return `${diaFormatado}/${mesFormatado}/${ano}${nomeDia ? ` - ${nomeDia}` : ""}`;
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
  useEffect(() => {
    const dadosTemporarios = localStorage.getItem('icmlyrics_aviso_pendente');

    if (dadosTemporarios) {
      try {
        const dados = JSON.parse(dadosTemporarios);
        const assuntoFinal = dados.titulo || dados.assunto || "";
        const mensagemFinal = dados.mensagem || dados.texto || dados.observacao || "";
        const linksFinais = dados.links || [];
        const repId = dados.repertorio_id || null;

        if (assuntoFinal) setAssuntoAviso(assuntoFinal);
        if (mensagemFinal) setNovoAviso(mensagemFinal);
        if (repId) {
          setRepertorioId(repId);
          supabase.from("listas_repertorio").select("*").eq("id", repId).maybeSingle().then(({ data }) => {
            if (data) setRepertorioSelecionado(data);
          });
        }
        if (linksFinais.length > 0) {
          const linksMapeados = linksFinais.map(l => ({
            texto: l.titulo || l.texto || "",
            url: l.url || ""
          }));
          setLinksForm(linksMapeados);
        }
      } catch (e) {
        console.error("Erro ao processar dados pendentes do repertório:", e);
      } finally {
        localStorage.removeItem('icmlyrics_aviso_pendente');
      }
    }
  }, []);
  const podeCriar = userRole === "super_admin" || userRole === "church_admin";
  const isSuper = userRole === "super_admin";

  const podeModificarAviso = (aviso) => {
    if (isSuper) return true;
    if (userRole === "church_admin") {
      return (
        aviso.tipo !== "global" &&
        aviso.nuvem?.toLowerCase() === userNuvem.toLowerCase()
      );
    }
    return false;
  };
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
  const buscarEscalas = async () => {
    setCarregandoEscalas(true);
    try {
      let queryEquipe = supabase.from("escala_equipe").select("*");
      if (nomeIgreja && nomeIgreja !== "Carregando..." && nomeIgreja !== "Modo Offline") {
        queryEquipe = queryEquipe.eq("nome_igreja", nomeIgreja);
      }
      const { data: equipeData, error: equipeError } = await queryEquipe;
      const { data: listasData, error: listasError } = await supabase
        .from("listas")
        .select("*")
        .order("created_at", { ascending: false });

      if (!listasError && !equipeError && listasData && equipeData) {
        const escalasExistentes = listasData.map(lista => {
          const membrosDaLista = equipeData.filter(m => m.lista_id === lista.id);
          return {
            ...lista,
            membros: membrosDaLista
          };
        }).filter(lista => lista.membros.length > 0);
        setEscalas(escalasExistentes);
      }
    } catch (err) {
      console.error("Erro ao buscar escalas:", err);
    } finally {
      setCarregandoEscalas(false);
    }
  };
  const buscarRepertorios = async () => {
    setCarregandoRepertorios(true);
    try {
      const { data, error } = await supabase
        .from("listas_repertorio")
        .select("*")
        .order("data_evento", { ascending: false });

      if (!error && data) {
        setRepertorios(data);
      }
    } catch (err) {
      console.error("Erro ao buscar repertórios:", err);
    } finally {
      setCarregandoRepertorios(false);
    }
  };
  const handleSalvarAviso = async () => {
    if (!assuntoAviso.trim() || !novoAviso.trim()) {
      return alert("Assunto e texto são obrigatórios.");
    }
    setSalvando(true);
    try {
      if (avisoEditandoId) {
        const avisoExistente = avisos.find((a) => a.id === avisoEditandoId);
        if (avisoExistente && !podeModificarAviso(avisoExistente)) {
          alert("Você não tem permissão para editar este aviso.");
          setSalvando(false);
          return;
        }
        const { error: errorAviso } = await supabase
          .from("avisos")
          .update({
            assunto: assuntoAviso.trim(),
            texto: novoAviso.trim(),
            repertorio_id: repertorioId || null,
          })
          .eq("id", avisoEditandoId);
        if (errorAviso) throw errorAviso;
        const { error: errDel } = await supabase.from("avisos_links").delete().eq("aviso_id", avisoEditandoId);
        if (errDel) throw errDel;
        const linksParaSalvar = linksForm
          .filter((l) => l.url.trim() !== "")
          .map((l) => ({
            aviso_id: avisoEditandoId,
            titulo_link: l.texto.trim() || "Link",
            url: l.url.trim(),
          }));
        if (linksParaSalvar.length > 0) {
          const { error: errIns } = await supabase.from("avisos_links").insert(linksParaSalvar);
          if (errIns) throw errIns;
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
              repertorio_id: repertorioId || null,
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
          const { error: errIns } = await supabase.from("avisos_links").insert(linksParaSalvar);
          if (errIns) throw errIns;
        }
      }
      setAvisoEditandoId(null);
      setAssuntoAviso("");
      setNovoAviso("");
      setRepertorioId(null);
      setRepertorioSelecionado(null);
      setEscalaSelecionada(null);
      setLinksForm([{ texto: "", url: "" }]);
      await buscarAvisosDoBanco();
    } catch (err) {
      console.error("Erro ao salvar aviso:", err);
      alert(`Erro ao salvar: ${err.message || "Tente novamente."}`);
    } finally {
      setSalvando(false);
    }
  };
  const handleDeletarAviso = async (aviso) => {
    if (!podeModificarAviso(aviso)) {
      return alert("Você não tem permissão para excluir avisos do Super Admin.");
    }
    if (!window.confirm("Deseja realmente excluir este aviso?")) return;
    try {
      const { error } = await supabase.from("avisos").delete().eq("id", aviso.id);
      if (error) throw error;
      buscarAvisosDoBanco();
    } catch (err) {
      console.error("Erro ao deletar aviso:", err);
      alert("Erro ao excluir aviso.");
    }
  };
  const handleIniciarEdicao = (aviso) => {
    if (!podeModificarAviso(aviso)) {
      return alert("Você não tem permissão para editar este aviso.");
    }
    setAvisoEditandoId(aviso.id);
    setAssuntoAviso(aviso.assunto || "");
    setNovoAviso(aviso.texto || "");
    setRepertorioId(aviso.repertorio_id || null);
    if (aviso.repertorio_id) {
      supabase.from("listas_repertorio").select("*").eq("id", aviso.repertorio_id).maybeSingle().then(({ data }) => {
        if (data) setRepertorioSelecionado(data);
      });
    } else {
      setRepertorioSelecionado(null);
    }
    if (aviso.avisos_links && aviso.avisos_links.length > 0) {
      setLinksForm(aviso.avisos_links.map((l) => ({ texto: l.titulo_link || "", url: l.url || "" })));
    } else {
      setLinksForm([{ texto: "", url: "" }]);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Mural</h1>
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
                    buscarAvisosDoBanco();
                  }}
                  className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
                  title="Clique para atualizar/sincronizar"
                >
                  <Cloud className={`w-3 h-3 text-emerald-400 ${carregandoAvisos ? "animate-spin" : ""}`} />
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
      <div className="p-4 space-y-6 max-w-md mx-auto mt-2">
        {podeCriar && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-slate-900" />
                {avisoEditandoId ? "Editando Aviso" : "Novo Aviso"}
              </h3>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setModalEscalaOpen(true);
                    buscarEscalas();
                  }}
                  className="text-[10px] font-bold text-slate-900 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3 h-3 text-slate-900" />
                  Escala
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalRepertorioOpen(true);
                    buscarRepertorios();
                  }}
                  className="text-[10px] font-bold text-slate-900 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Music className="w-3 h-3 text-slate-900" />
                  Repertório
                </button>

                <button
                  type="button"
                  onClick={() => setLinksForm([...linksForm, { texto: "", url: "" }])}
                  className="text-[10px] font-bold text-slate-900 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  + link
                </button>
              </div>
            </div>

            <input
              value={assuntoAviso}
              onChange={(e) => setAssuntoAviso(e.target.value)}
              placeholder="Assunto do aviso"
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <textarea
              value={novoAviso}
              onChange={(e) => setNovoAviso(e.target.value)}
              placeholder="Escreva a mensagem do aviso..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none h-32 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <div className="space-y-2">
              {linksForm.map((link, idx) => (
                <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-200 relative">
                  {linksForm.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLinksForm(linksForm.filter((_, i) => i !== idx))}
                      className="absolute right-2 top-2 p-1 hover:bg-slate-200 rounded-full cursor-pointer"
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
            {(repertorioSelecionado || escalaSelecionada) && (
              <div className="space-y-2 pt-1">
                {repertorioSelecionado && (
                  <div 
                    onClick={() => setModalInfoRepertorioOpen(true)}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Music className="w-4 h-4 text-slate-900 shrink-0" />
                      <span className="truncate font-semibold">Repertório: {repertorioSelecionado.nome || "Lista"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-900 font-bold shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </div>
                  </div>
                )}

                {escalaSelecionada && (
                  <div 
                    onClick={() => setModalInfoEscalaOpen(true)}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Calendar className="w-4 h-4 text-slate-900 shrink-0" />
                      <span className="truncate font-semibold">
                        Escala: {formatarDataComDiaSemana(escalaSelecionada.data_culto || escalaSelecionada.data || escalaSelecionada.created_at)}
                        {(() => {
                          const tipoEvento = (escalaSelecionada.tipo_culto || escalaSelecionada.evento || escalaSelecionada.titulo || escalaSelecionada.assunto || "").toLowerCase();
                          const ehCeiaOuCasamento = tipoEvento.includes("ceia") || tipoEvento.includes("casamento");
                          return ehCeiaOuCasamento ? ` - ${tipoEvento}` : "";
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-900 font-bold shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              {avisoEditandoId && (
                <button
                  type="button"
                  onClick={() => {
                    setAvisoEditandoId(null);
                    setAssuntoAviso("");
                    setNovoAviso("");
                    setRepertorioId(null);
                    setRepertorioSelecionado(null);
                    setEscalaSelecionada(null);
                    setLinksForm([{ texto: "", url: "" }]);
                  }}
                  disabled={salvando}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={handleSalvarAviso}
                disabled={salvando}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {avisoEditandoId ? "Salvar Alterações" : "Publicar Aviso"}
              </button>
            </div>
          </div>
        )}
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
            <>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    {avisos[0].assunto}
                  </h3>
                  {avisos[0].repertorio_id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/repertorio/lista/${avisos[0].repertorio_id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      <Music className="w-3.5 h-3.5" />
                      Repertório
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap mb-3">
                  {avisos[0].texto}
                </p>
                {avisos[0].avisos_links?.map((link, i) => (
                  <a
                    key={i}
                    href={formatarUrl(link.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-900 font-bold text-xs underline mt-1 mr-3"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {link.titulo_link}
                  </a>
                ))}
              </div>
              {avisos.length > 1 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setListaExpandida(!listaExpandida)}
                    className="w-full flex justify-between items-center px-1 py-1 text-slate-500 hover:text-slate-800 cursor-pointer"
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
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-800 uppercase">
                            {aviso.assunto}
                          </h3>
                          {aviso.repertorio_id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/repertorio/lista/${aviso.repertorio_id}`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                            >
                              <Music className="w-3.5 h-3.5" />
                              Repertório
                            </button>
                          )}
                        </div>
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
                                href={formatarUrl(link.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-slate-900 underline mt-2 font-semibold block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
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
                    {temPermissaoEdicao ? (
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIniciarEdicao(aviso);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Editar aviso"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletarAviso(aviso);
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Excluir aviso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Globe className="w-3 h-3" />
                        Global
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap pr-16 mb-1">
                      <h3 className="text-sm font-bold text-slate-800 uppercase">
                        {aviso.assunto}
                      </h3>
                      {aviso.repertorio_id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/repertorio/lista/${aviso.repertorio_id}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                        >
                          <Music className="w-3.5 h-3.5" />
                          Repertório
                        </button>
                      )}
                    </div>

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
                            href={formatarUrl(link.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-slate-900 underline mt-2 font-semibold block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
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
      {modalEscalaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-800">Selecione uma Escala</h3>
              </div>
              <button
                onClick={() => setModalEscalaOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-slate-50">
              {carregandoEscalas ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                </div>
              ) : escalas.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6 bg-white border border-dashed border-slate-200 rounded-xl">
                  Nenhuma escala cadastrada no momento.
                </p>
              ) : (
                <div className="space-y-3">
                  {escalas.map((escala) => {
                    const dataFormatada = formatarDataComDiaSemana(escala.data_culto || escala.data || escala.created_at);
                    const tipoEvento = (escala.tipo_culto || escala.evento || escala.titulo || escala.assunto || "").toLowerCase();
                    const ehCeiaOuCasamento = tipoEvento.includes("ceia") || tipoEvento.includes("casamento");
                    return (
                      <div
                        key={escala.id}
                        onClick={() => {
                          setEscalaSelecionada(escala);
                          setModalEscalaOpen(false);
                        }}
                        className="p-4 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-all shadow-sm flex flex-col gap-2 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 capitalize">{dataFormatada}</p>
                            {ehCeiaOuCasamento && (
                              <p className="text-[11px] text-slate-900 font-semibold capitalize mt-0.5">
                                {tipoEvento}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0 transition-colors" />
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {escala.membros.map((m, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold">
                              {m.nome}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setModalEscalaOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalRepertorioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-800">Selecione um Repertório</h3>
              </div>
              <button
                onClick={() => setModalRepertorioOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-slate-50">
              {carregandoRepertorios ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                </div>
              ) : repertorios.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6 bg-white border border-dashed border-slate-200 rounded-xl">
                  Nenhum repertório cadastrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {repertorios.map((rep) => (
                    <div
                      key={rep.id}
                      onClick={() => {
                        setRepertorioId(rep.id);
                        setRepertorioSelecionado(rep);
                        setModalRepertorioOpen(false);
                      }}
                      className="p-4 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-all shadow-sm flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {rep.nome || "Lista sem título"}
                        </p>
                        {rep.data_evento && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Data: {formatarDataComDiaSemana(rep.data_evento)}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setModalRepertorioOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalInfoEscalaOpen && escalaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-800">Informações da Escala</h3>
              </div>
              <button
                onClick={() => setModalInfoEscalaOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 bg-slate-50">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
                <p className="text-[11px] text-slate-400 uppercase font-bold">Data e Dia</p>
                <p className="text-xs font-bold text-slate-800 capitalize">
                  {formatarDataComDiaSemana(escalaSelecionada.data_culto || escalaSelecionada.data || escalaSelecionada.created_at)}
                </p>
                {(() => {
                  const tipoEvento = (escalaSelecionada.tipo_culto || escalaSelecionada.evento || escalaSelecionada.titulo || escalaSelecionada.assunto || "").toLowerCase();
                  const ehCeiaOuCasamento = tipoEvento.includes("ceia") || tipoEvento.includes("casamento");
                  return ehCeiaOuCasamento ? (
                    <p className="text-xs text-slate-900 font-semibold capitalize pt-1">
                      Tema: {tipoEvento}
                    </p>
                  ) : null;
                })()}
              </div>

              {escalaSelecionada.membros && escalaSelecionada.membros.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <p className="text-[11px] text-slate-400 uppercase font-bold">Membros na Escala</p>
                  <div className="flex flex-wrap gap-1.5">
                    {escalaSelecionada.membros.map((m, idx) => (
                      <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded-lg uppercase font-semibold">
                        {m.nome} {m.funcao ? `(${m.funcao})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setEscalaSelecionada(null);
                  setModalInfoEscalaOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Remover Vínculo
              </button>
              <button
                onClick={() => setModalInfoEscalaOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalInfoRepertorioOpen && repertorioSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-800">Informações do Repertório</h3>
              </div>
              <button
                onClick={() => setModalInfoRepertorioOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 bg-slate-50">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
                <p className="text-[11px] text-slate-400 uppercase font-bold">Repertório</p>
                <p className="text-xs font-bold text-slate-800">
                  {repertorioSelecionado.nome || "Lista sem título"}
                </p>
                {repertorioSelecionado.data_evento && (
                  <p className="text-xs text-slate-600 pt-1">
                    Data: {formatarDataComDiaSemana(repertorioSelecionado.data_evento)}
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setRepertorioId(null);
                  setRepertorioSelecionado(null);
                  setModalInfoRepertorioOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Remover Vínculo
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const idRep = repertorioSelecionado.id;
                    setModalInfoRepertorioOpen(false);
                    navigate(`/repertorio/lista/${idRep}`);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Ver Completo
                </button>
                <button
                  onClick={() => setModalInfoRepertorioOpen(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}