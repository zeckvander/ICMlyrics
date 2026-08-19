import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HeartHandshake, Clock, User, CheckCircle2, Loader2, Calendar, Users, ChevronDown, ChevronUp, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import PreviewOracao from "@/components/lista/PreviewOracao";

export default function ListaOracao() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [periodo, setPeriodo] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [temHistorico, setTemHistorico] = useState(false);

  // Estados do Modal de Preview
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
      setTemHistorico(true);
    }
  }, []);

  const [escalaAberta, setEscalaAberta] = useState(false);
  const [intervalo, setIntervalo] = useState(30);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [nomeMembro, setNomeMembro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let nomeExtraido = "";
    const rawUser = localStorage.getItem("icmlyrics_user");

    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        nomeExtraido = parsed.nome || parsed.name || parsed.username || rawUser;
      } catch (e) {
        nomeExtraido = rawUser;
      }
    } else {
      nomeExtraido = 
        localStorage.getItem("icmlyrics_nome_membro") || 
        localStorage.getItem("icmlyrics_user_nuvem") || 
        "";
    }

    if (nomeExtraido) {
      const nomeFormatado = String(nomeExtraido)
        .replace(/^"|"$/g, "")
        .replace(/_/g, " ");
      setNomeMembro(nomeFormatado);
    }
  }, []);

  useEffect(() => {
    carregarDadosPeriodo();
  }, [id]);

  useEffect(() => {
    setHorarioSelecionado("");
  }, [intervalo]);

  const gerarHorarios = (minutosStep) => {
    const lista = [];
    const totalMinutosDia = 24 * 60;
    
    for (let i = 0; i < totalMinutosDia; i += minutosStep) {
      const hInicio = String(Math.floor(i / 60)).padStart(2, "0");
      const mInicio = String(i % 60).padStart(2, "0");
      
      const fim = (i + minutosStep) % totalMinutosDia;
      const hFim = String(Math.floor(fim / 60)).padStart(2, "0");
      const mFim = String(fim % 60).padStart(2, "0");

      lista.push(`${hInicio}:${mInicio} - ${hFim}:${mFim}`);
    }
    return lista;
  };

  const listaHorariosFormatados = gerarHorarios(intervalo);

  const carregarDadosPeriodo = async () => {
    try {
      setCarregando(true);
      
      const { data: dataPeriodo, error: errPeriodo } = await supabase
        .from("oracao")
        .select("*")
        .eq("id", id)
        .single();

      if (errPeriodo) throw errPeriodo;
      setPeriodo(dataPeriodo);

      const { data: dataAgendados, error: errAgendados } = await supabase
        .from("agendamentos_oracao")
        .select("*")
        .eq("oracao_id", id)
        .order("horario", { ascending: true });

      if (!errAgendados && dataAgendados) {
        setAgendamentos(dataAgendados);
      }
    } catch (err) {
      console.error("Erro ao carregar agendamento:", err);
    } finally {
      setCarregando(false);
    }
  };

  const handleAgendar = async (e) => {
    e.preventDefault();
    if (!horarioSelecionado || !nomeMembro.trim()) {
      return alert("Selecione um horário e informe seu nome.");
    }

    setSalvando(true);
    try {
      const payload = {
        oracao_id: id,
        horario: horarioSelecionado,
        nome_membro: nomeMembro.trim()
      };

      const { data, error } = await supabase
        .from("agendamentos_oracao")
        .insert([payload])
        .select();

      if (error) throw error;

      setSucesso(true);
      if (data) setAgendamentos((prev) => [...prev, data[0]]);

      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      console.error("Erro ao agendar horário:", err);
      alert("Erro ao realizar o agendamento.");
    } finally {
      setSalvando(false);
    }
  };

  const agendamentosAgrupados = agendamentos.reduce((acc, ag) => {
    const chave = ag.horario || "Horário Não Definido";
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(ag);
    return acc;
  }, {});

  const listaEscalaAgrupada = Object.keys(agendamentosAgrupados).map((horarioKey) => ({
    horario: horarioKey,
    pessoas: agendamentosAgrupados[horarioKey]
  }));

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
      </div>
    );
  }

  if (!periodo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm w-full border border-slate-100">
          <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Período de Oração não encontrado</h3>
          <p className="text-xs text-slate-400 mt-1">Verifique se o link está correto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-12 flex flex-col items-center justify-center font-['Inter',sans-serif]">
      <div className="w-full max-w-md space-y-4">
        
        {temHistorico && (
          <div className="flex justify-start">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          </div>
        )}

        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md text-center space-y-2">
          <span className="text-[10px] font-bold tracking-wider text-rose-400 uppercase bg-slate-800 px-3 py-1 rounded-full border border-slate-700 inline-block">
            {periodo.nome_igreja || "Relógio de Oração"}
          </span>
          <h2 className="text-lg font-bold">{periodo.motivo}</h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 pt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {periodo.data_inicio ? periodo.data_inicio.split("-").reverse().join("/") : ""} a {periodo.data_fim ? periodo.data_fim.split("-").reverse().join("/") : ""}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Escolha seu Horário</h3>
            
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setIntervalo(15)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  intervalo === 15 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                15 min
              </button>
              <button
                type="button"
                onClick={() => setIntervalo(30)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  intervalo === 30 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                30 min
              </button>
            </div>
          </div>
          
          <form onSubmit={handleAgendar} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Seu Nome</label>
              <div className="relative">
                <Input 
                  type="text"
                  value={nomeMembro}
                  onChange={(e) => setNomeMembro(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="h-9 text-xs pl-8 bg-white border-slate-200 font-medium"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Horário de Oração ({intervalo} minutos)
              </label>
              <select
                value={horarioSelecionado}
                onChange={(e) => setHorarioSelecionado(e.target.value)}
                className="w-full h-9 text-xs bg-white border border-slate-200 rounded-md px-3 font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">-- Selecione o horário --</option>
                {listaHorariosFormatados.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={salvando}
              className="w-full h-10 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-sm transition-all"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Agendamento"}
            </Button>

            {sucesso && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-100 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Horário agendado com sucesso!</span>
              </div>
            )}
          </form>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div 
            onClick={() => setEscalaAberta(!escalaAberta)}
            className="flex justify-between items-center cursor-pointer select-none border-b border-slate-100 pb-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-500" />
                Escala Oração
              </h4>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                {agendamentos.length} {agendamentos.length === 1 ? "agendamento" : "agendamentos"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {agendamentos.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewOpen(true);
                  }}
                  title="Visualizar e Exportar Relatório"
                  className="flex items-center justify-center w-7 h-7 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                {escalaAberta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {escalaAberta && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 pt-1">
              {listaEscalaAgrupada.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum horário agendado ainda.</p>
              ) : (
                listaEscalaAgrupada.map((group) => (
                  <div 
                    key={group.horario}
                    className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs gap-2 transition-all hover:bg-slate-100/60"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800 pr-2">
                      {group.pessoas.map((p, idx) => (
                        <React.Fragment key={p.id}>
                          <span>{p.nome_membro}</span>
                          {idx < group.pessoas.length - 1 && (
                            <span className="text-slate-300 font-normal">,</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    <span className="text-[11px] font-medium bg-white text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {group.horario}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pré-visualização e Exportação */}
      <PreviewOracao
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        periodo={periodo}
        agendamentosAgrupados={listaEscalaAgrupada}
      />
    </div>
  );
}