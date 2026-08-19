import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, HeartHandshake, Calendar, Cloud, Globe, Shield, Loader2, 
  Plus, Trash2, Clock, Share2, CheckCircle2, Bookmark, Send,
  ChevronDown, ChevronUp, Users, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function Oracao() {
  const navigate = useNavigate();

  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [userRole, setUserRole] = useState("user");
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const temNuvem = userNuvem.trim() !== "";
  const isSuper = userRole === "super_admin";

  const [motivoPeriodo, setMotivoPeriodo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [salvandoPeriodo, setSalvandoPeriodo] = useState(false);
  const [periodosList, setPeriodosList] = useState([]);

  const [cardPeriodosAberto, setCardPeriodosAberto] = useState(false);

  const [tabMotivo, setTabMotivo] = useState("geral");
  const [mesRef, setMesRef] = useState(new Date().toISOString().substring(0, 7));
  const [novoMotivoTexto, setNovoMotivoTexto] = useState("");
  const [salvandoMotivo, setSalvandoMotivo] = useState(false);
  const [motivosList, setMotivosList] = useState([]);

  const [linkCopiadoId, setLinkCopiadoId] = useState(null);

  useEffect(() => {
    const validarAcesso = async () => {
      try {
        setCarregandoValidacao(true);
        if (!temNuvem) {
          setCarregandoValidacao(false);
          return;
        }
        const roleSalva = localStorage.getItem("icmlyrics_role") || "user";
        let roleFinal = "user";
        let nomeFinal = userNuvem;

        if (roleSalva === "super_admin" || userNuvem === "admin_geral") {
          roleFinal = "super_admin";
          nomeFinal = userNuvem || "Administração Geral";
        } else {
          const { data, error } = await supabase
            .from("igrejas_autorizadas")
            .select("role, nome_igreja")
            .eq("usuario", userNuvem.trim())
            .maybeSingle();

          if (!error && data) {
            const roleDoBanco = data.role?.toLowerCase() || "";
            if (roleDoBanco === "super_admin" || roleDoBanco === "super_adm") {
              roleFinal = "super_admin";
            } else if (roleDoBanco === "church_admin" || roleDoBanco === "adm_local" || roleSalva === "church_admin") {
              roleFinal = "church_admin";
            }
            nomeFinal = data.nome_igreja || userNuvem;
          } else {
            roleFinal = roleSalva;
            nomeFinal = localStorage.getItem("icmlyrics_nome_igreja") || userNuvem;
          }
        }
        setUserRole(roleFinal);
        setNomeIgreja(nomeFinal);
        
        carregarDados();
      } catch (err) {
        console.error("Erro ao validar acesso:", err);
      } finally {
        setCarregandoValidacao(false);
      }
    };

    validarAcesso();
  }, [userNuvem, temNuvem]);

  const carregarDados = async () => {
    if (!temNuvem) return;
    try {
      const { data: dataPeriodos } = await supabase
        .from("oracao")
        .select("*")
        .eq("acesso_usuario", userNuvem.trim())
        .order("created_at", { ascending: false });

      if (dataPeriodos) setPeriodosList(dataPeriodos);

      const { data: dataMotivos } = await supabase
        .from("motivos_oracao")
        .select("*")
        .eq("acesso_usuario", userNuvem.trim())
        .order("created_at", { ascending: false });

      if (dataMotivos) setMotivosList(dataMotivos);
    } catch (err) {
      console.error("Erro ao carregar registros de oração:", err);
    }
  };

  const handleCriarPeriodo = async (e) => {
    e.preventDefault();
    if (!motivoPeriodo || !dataInicio || !dataFim) {
      return alert("Preencha todos os campos do período de oração.");
    }

    setSalvandoPeriodo(true);
    try {
      const payload = {
        acesso_usuario: userNuvem.trim(),
        nome_igreja: nomeIgreja,
        motivo: motivoPeriodo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        status: "ativo"
      };

      const { data, error } = await supabase
        .from("oracao")
        .insert([payload])
        .select();

      if (error) throw error;

      alert("Período de oração criado com sucesso!");
      setMotivoPeriodo("");
      setDataInicio("");
      setDataFim("");
      if (data) {
        setPeriodosList((prev) => [data[0], ...prev]);
        setCardPeriodosAberto(true);
      }
    } catch (err) {
      console.error("Erro ao criar período de oração:", err);
      alert("Erro ao salvar período.");
    } finally {
      setSalvandoPeriodo(false);
    }
  };

  const handleAdicionarMotivo = async (e) => {
    e.preventDefault();
    if (!novoMotivoTexto.trim()) return;

    setSalvandoMotivo(true);
    try {
      const payload = {
        acesso_usuario: userNuvem.trim(),
        texto: novoMotivoTexto.trim(),
        tipo: tabMotivo,
        mes_referencia: tabMotivo === "mes" ? mesRef : null
      };

      const { data, error } = await supabase
        .from("motivos_oracao")
        .insert([payload])
        .select();

      if (error) throw error;

      setNovoMotivoTexto("");
      if (data) setMotivosList((prev) => [data[0], ...prev]);
    } catch (err) {
      console.error("Erro ao adicionar motivo:", err);
      alert("Erro ao adicionar motivo.");
    } finally {
      setSalvandoMotivo(false);
    }
  };

  const handleExcluirMotivo = async (id) => {
    try {
      const { error } = await supabase.from("motivos_oracao").delete().eq("id", id);
      if (error) throw error;
      setMotivosList((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Erro ao excluir motivo:", err);
    }
  };

  const handleExcluirPeriodo = async (id) => {
    if (!confirm("Deseja realmente remover este período de oração?")) return;
    try {
      const { error } = await supabase.from("oracao").delete().eq("id", id);
      if (error) throw error;
      setPeriodosList((prev) => prev.filter((p) => (p.id || p.id_oracao) !== id));
    } catch (err) {
      console.error("Erro ao excluir período:", err);
    }
  };

  const copiarLinkAgendamento = (periodoId) => {
    const url = `${window.location.origin}/lista-oracao/${periodoId}`;
    navigator.clipboard.writeText(url);
    setLinkCopiadoId(periodoId);
    setTimeout(() => setLinkCopiadoId(null), 2500);
  };

  const motivosFiltrados = motivosList.filter((m) => {
    if (tabMotivo === "geral") return m.tipo === "geral";
    return m.tipo === "mes" && m.mes_referencia === mesRef;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col font-['Inter',sans-serif]">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-5 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/dashboard")} 
              className="text-slate-300 hover:text-white transition-colors cursor-pointer" 
              aria-label="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-400" /> Relógio de Oração
              </h1>
              <p className="text-slate-400 text-xs">Períodos, escalas e motivos de oração</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-right max-w-[180px]">
            {carregandoValidacao ? (
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
            ) : !temNuvem ? (
              <Cloud className="w-6 h-6 text-slate-400" />
            ) : (
              <>
                <span className="text-[11px] font-bold text-slate-300 uppercase truncate w-full">{nomeIgreja}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">
                    {isSuper ? <Globe className="w-2.5 h-2.5 text-slate-300" /> : <Shield className="w-2.5 h-2.5 text-slate-300" />}
                    {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-5 flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {!temNuvem ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center shadow-sm space-y-3 my-auto w-full">
            <Cloud className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Nenhuma Nuvem Conectada</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Você precisa estar conectado a uma nuvem para gerenciar os períodos de oração.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Novo Período
                  </span>
                  <h3 className="text-base font-bold text-slate-900">Criar Período de Oração</h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <form onSubmit={handleCriarPeriodo} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nome da Igreja
                  </label>
                  <Input 
                    type="text"
                    value={nomeIgreja}
                    disabled
                    className="h-9 text-xs bg-slate-50 border-slate-200 text-slate-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Motivo do Período
                  </label>
                  <Input 
                    type="text"
                    value={motivoPeriodo}
                    onChange={(e) => setMotivoPeriodo(e.target.value)}
                    placeholder="Ex: Clamor pela Família e Madrugada"
                    className="h-9 text-xs bg-white border-slate-200 focus:ring-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Início
                    </label>
                    <Input 
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="h-9 text-xs bg-white border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Fim
                    </label>
                    <Input 
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="h-9 text-xs bg-white border-slate-200"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={salvandoPeriodo}
                  className="w-full h-10 text-xs font-bold rounded-xl gap-2 transition-all bg-slate-900 hover:bg-slate-800 text-white shadow-md mt-2 cursor-pointer"
                >
                  {salvandoPeriodo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 text-rose-400" />
                  )}
                  Criar Período de Oração
                </Button>
              </form>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                Após criar o período, você poderá copiar o link de agendamento de horários para compartilhar com os membros.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Intercessão
                  </span>
                  <h3 className="text-base font-bold text-slate-900">Motivos de Oração</h3>
                </div>
                <Bookmark className="w-4 h-4 text-slate-400" />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setTabMotivo("geral")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tabMotivo === "geral" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Motivos Gerais
                </button>
                <button
                  type="button"
                  onClick={() => setTabMotivo("mes")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tabMotivo === "mes" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Mês Específico
                </button>
              </div>

              {tabMotivo === "mes" && (
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                  <Calendar className="w-4 h-4 text-slate-500 ml-1" />
                  <span className="text-xs font-semibold text-slate-700">Mês de Referência:</span>
                  <input 
                    type="month"
                    value={mesRef}
                    onChange={(e) => setMesRef(e.target.value)}
                    className="h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 outline-none font-bold text-slate-800"
                  />
                </div>
              )}

              <form onSubmit={handleAdicionarMotivo} className="flex gap-2">
                <Input 
                  type="text"
                  value={novoMotivoTexto}
                  onChange={(e) => setNovoMotivoTexto(e.target.value)}
                  placeholder={
                    tabMotivo === "geral" 
                      ? "Digite um motivo geral (ex: Pelos enfermos, autoridades...)" 
                      : `Motivo para o mês (${mesRef})`
                  }
                  className="h-9 text-xs bg-white border-slate-200"
                />
                <Button 
                  type="submit" 
                  disabled={salvandoMotivo}
                  className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {salvandoMotivo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </form>

              <div className="space-y-2 pt-1">
                {motivosFiltrados.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhum motivo {tabMotivo === "geral" ? "geral" : "específico"} cadastrado.
                  </p>
                ) : (
                  motivosFiltrados.map((motivo) => (
                    <div 
                      key={motivo.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800"
                    >
                      <span className="font-medium pr-2">{motivo.texto}</span>
                      <button
                        type="button"
                        onClick={() => handleExcluirMotivo(motivo.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Excluir motivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-200">
              <div 
                onClick={() => setCardPeriodosAberto(!cardPeriodosAberto)}
                className="flex items-center justify-between cursor-pointer select-none group"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    HISTÓRICO & LINKS
                  </span>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Períodos Cadastrados
                    {cardPeriodosAberto ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    )}
                  </h3>
                </div>
                <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-3 py-1 rounded-full group-hover:bg-slate-200 transition-colors">
                  {periodosList.length}
                </span>
              </div>

              {cardPeriodosAberto && (
                <div className="pt-4 border-t border-slate-100 mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  {periodosList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Nenhum período de oração registrado ainda.
                    </p>
                  ) : (
                    periodosList.map((p) => {
                      const idPeriodo = p.id || p.id_oracao;
                      return (
                        <div 
                          key={idPeriodo}
                          className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3.5"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">
                                {p.motivo}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {p.data_inicio ? p.data_inicio.split("-").reverse().join("/") : ""} até {p.data_fim ? p.data_fim.split("-").reverse().join("/") : ""}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleExcluirPeriodo(idPeriodo)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              title="Excluir período"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <Button
                            type="button"
                            onClick={() => copiarLinkAgendamento(idPeriodo)}
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border-slate-200 gap-2 rounded-xl shadow-xs cursor-pointer"
                          >
                            {linkCopiadoId === idPeriodo ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-700">Link Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4 text-slate-600" />
                                <span>Copiar Link de Agendamento</span>
                              </>
                            )}
                          </Button>

                          <div className="pt-2 border-t border-slate-200/60 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                                <Users className="w-3.5 h-3.5 text-rose-400" />
                                <span>PARTICIPANTES</span>
                              </div>
                              <Link
                                to={`/lista-oracao/${idPeriodo}`}
                                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline flex items-center gap-1 cursor-pointer"
                              >
                                Página do Agendamento
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </Link>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-dashed border-slate-200 text-center">
                              <p className="text-xs text-slate-400 font-medium">
                                Nenhum participante agendado neste período ainda.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}