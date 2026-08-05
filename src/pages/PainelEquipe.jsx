import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, Mic, Music, Calendar, Send, Play, Pause, 
  Volume2, Headphones, Sliders, Radio, Cloud,
  Globe, Shield, Loader2, Plus, Trash2, Pencil, Download, Check, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function PainelEquipe() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("escala");

  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");
  const [carregandoIgreja, setCarregandoIgreja] = useState(false);

  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const temNuvem = userNuvem.trim() !== "";
  const userName = localStorage.getItem("icmlyrics_user") || "Usuário";

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
          setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioLocal || "Modo Local");
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
          } else if (roleDoBanco === "church_admin" || roleDoBanco === "adm_local" || roleSalva === "church_admin") {
            setUserRole("church_admin");
          } else {
            setUserRole("user");
          }
          setNomeIgreja(data.nome_igreja || userNuvem);
        } else {
          setUserRole(roleSalva);
          setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || userNuvem);
        }
      } catch (err) {
        console.error("Erro ao validar permissões:", err);
      } finally {
        setCarregandoValidacao(false);
      }
    };
    validarAcesso();
  }, [userNuvem, usuarioLocal]);

  const podeCriar = userRole === "super_admin" || userRole === "church_admin";
  const isSuper = userRole === "super_admin";

  // Estados do Painel
  const [reproduzindo, setReproduzindo] = useState(false);
  const [exercicioSelecionado, setExercicioSelecionado] = useState("Respiracao e Apoio (4 min)");
  const [rotinasAquecimento, setRotinasAquecimento] = useState([
    "Respiracao e Apoio (4 min)", "Vocalizes em Escala Maior (3 min)", "Articulação e Dicção Rápida (3.5 min)"
  ]);
  const [novaRotina, setNovaRotina] = useState("");

  const [canaisMapa, setCanaisMapa] = useState([]);
  const [novoCanal, setNovoCanal] = useState({ canal: "", funcao: "", microfone: "", retorno: "" });
  const [editandoCanalId, setEditandoCanalId] = useState(null);

  const [escalaCulto, setEscalaCulto] = useState([]);
  const [formEscala, setFormEscala] = useState({ cargo: "", nome: "" });
  const [editandoEscalaId, setEditandoEscalaId] = useState(null);

  const [historicoListas, setHistoricoListas] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [salvandoNoBanco, setSalvandoNoBanco] = useState(false);
  const [mostrarModalHistorico, setMostrarModalHistorico] = useState(false);
  const [listaIdAtual, setListaIdAtual] = useState(null);
  const [cultoSelecionadoInfo, setCultoSelecionadoInfo] = useState({
    titulo: "Nenhuma lista selecionada", data: "", responsavel: "", tipo: "Culto / Evento"
  });

  const [listaSugestoes, setListaSugestoes] = useState([]);
  const [sugestaoMusica, setSugestaoMusica] = useState("");
  const [sugestaoCantor, setSugestaoCantor] = useState("");

  // Carregar dados iniciais (Mapa de palco e Sugestões do Supabase)
  useEffect(() => {
    carregarMapaPalco();
    carregarSugestoes();
  }, []);

  const carregarMapaPalco = async () => {
    const { data, error } = await supabase.from("mapa_palco").select("*").order("canal", { ascending: true });
    if (!error && data) setCanaisMapa(data);
  };

  const carregarSugestoes = async () => {
    const { data, error } = await supabase.from("sugestoes_repertorio").select("*").order("created_at", { ascending: false });
    if (!error && data) setListaSugestoes(data);
  };

  const buscarListasDoSupabase = async () => {
    setCarregandoHistorico(true);
    try {
      const { data, error } = await supabase.from("listas").select("*").order("created_at", { ascending: false }).limit(15);
      if (!error && data) setHistoricoListas(data);
    } catch (err) {
      console.error("Erro ao buscar listas:", err);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  // Selecionar lista e carregar escala correspondente da nova tabela
  const handleImportarDaLista = async (item) => {
    setListaIdAtual(item.id);
    setCultoSelecionadoInfo({
      titulo: item.titulo || item.assunto || item.nome || "Culto Especial",
      data: item.data || item.created_at?.split("T")[0] || "",
      responsavel: item.responsavel || item.autor || "Não informado",
      tipo: item.tipo_culto || item.evento || "Culto"
    });

    setMostrarModalHistorico(false);

    // Buscar escala vinculada a este ID na tabela escala_equipe
    const { data, error } = await supabase.from("escala_equipe").select("*").eq("lista_id", item.id);
    if (!error && data) {
      setEscalaCulto(data);
    } else {
      setEscalaCulto([]);
    }
  };

  // Adicionar ou Atualizar item na escala diretamente na nova tabela
  const handleSalvarItemEscala = async (e) => {
    e.preventDefault();
    if (!podeCriar) return alert("Apenas administradores podem alterar a escala.");
    if (!listaIdAtual) return alert("Selecione uma lista do histórico primeiro.");
    if (!formEscala.cargo.trim() || !formEscala.nome.trim()) return alert("Preencha o cargo e o nome.");

    if (editandoEscalaId) {
      const { error } = await supabase.from("escala_equipe").update({
        cargo: formEscala.cargo,
        nome: formEscala.nome
      }).eq("id", editandoEscalaId);

      if (!error) {
        setEscalaCulto(escalaCulto.map(item => item.id === editandoEscalaId ? { ...item, ...formEscala } : item));
        setEditandoEscalaId(null);
      }
    } else {
      const { data, error } = await supabase.from("escala_equipe").insert([{
        lista_id: listaIdAtual,
        cargo: formEscala.cargo,
        nome: formEscala.nome
      }]).select();

      if (!error && data) {
        setEscalaCulto([...escalaCulto, data[0]]);
      }
    }
    setFormEscala({ cargo: "", nome: "" });
  };

  const handleDeletarItemEscala = async (id) => {
    if (!podeCriar) return alert("Apenas administradores.");
    const { error } = await supabase.from("escala_equipe").delete().eq("id", id);
    if (!error) {
      setEscalaCulto(escalaCulto.filter(item => item.id !== id));
    }
  };

  // Gerenciamento de Canais (Mapa de Palco)
  const handleSalvarCanal = async () => {
    if (!podeCriar) return alert("Apenas administradores.");
    if (!novoCanal.canal || !novoCanal.funcao) return alert("Preencha os campos obrigatórios.");

    if (editandoCanalId) {
      const { error } = await supabase.from("mapa_palco").update(novoCanal).eq("id", editandoCanalId);
      if (!error) {
        carregarMapaPalco();
        setEditandoCanalId(null);
      }
    } else {
      const { error } = await supabase.from("mapa_palco").insert([novoCanal]);
      if (!error) carregarMapaPalco();
    }
    setNovoCanal({ canal: "", funcao: "", microfone: "", retorno: "" });
  };

  const handleDeletarCanal = async (id) => {
    if (!podeCriar) return alert("Apenas administradores.");
    const { error } = await supabase.from("mapa_palco").delete().eq("id", id);
    if (!error) carregarMapaPalco();
  };

  // Enviar Sugestões
  const handleEnviarSugestao = async (e) => {
    e.preventDefault();
    if (!sugestaoMusica.trim()) return;

    const novaSugestao = {
      musica: sugestaoMusica,
      autor: sugestaoCantor || "Não informado",
      sugerido_por: userName,
      status: "Em Análise"
    };

    const { data, error } = await supabase.from("sugestoes_repertorio").insert([novaSugestao]).select();
    if (!error && data) {
      setListaSugestoes([data[0], ...listaSugestoes]);
      setSugestaoMusica("");
      setSugestaoCantor("");
      alert("Sugestão enviada com sucesso!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-slate-300 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" /> Painel da Equipe
              </h1>
              <p className="text-slate-400 text-xs">Organização e técnica integrada ao Supabase</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pt-2 no-scrollbar">
          <button onClick={() => setAbaAtiva("escala")} className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${abaAtiva === "escala" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-300"}`}>Escala</button>
          <button onClick={() => setAbaAtiva("mapa")} className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${abaAtiva === "mapa" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-300"}`}>Mapa de Palco</button>
          <button onClick={() => setAbaAtiva("aquecimento")} className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${abaAtiva === "aquecimento" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-300"}`}>Aquecimento</button>
          <button onClick={() => setAbaAtiva("sugestoes")} className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${abaAtiva === "sugestoes" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-300"}`}>Sugestões</button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4 flex-1">
        {abaAtiva === "escala" && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-violet-600 uppercase">{cultoSelecionadoInfo.tipo}</span>
                  <h3 className="text-sm font-bold text-slate-900">{cultoSelecionadoInfo.titulo}</h3>
                </div>
                {podeCriar && (
                  <Button onClick={() => { buscarListasDoSupabase(); setMostrarModalHistorico(true); }} size="sm" className="h-8 bg-violet-50 text-violet-700 text-xs border border-violet-200">
                    <Download className="w-3.5 h-3.5 mr-1" /> Puxar Lista
                  </Button>
                )}
              </div>
            </div>

            {mostrarModalHistorico && (
              <div className="bg-violet-50 border border-violet-200 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-violet-950 uppercase">Selecionar Lista</h4>
                  <button onClick={() => setMostrarModalHistorico(false)} className="text-xs text-slate-500 font-bold">Fechar</button>
                </div>
                {carregandoHistorico ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-600" /> : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {historicoListas.map((item) => (
                      <div key={item.id} onClick={() => handleImportarDaLista(item)} className="bg-white p-2.5 rounded-xl border flex justify-between text-xs cursor-pointer hover:bg-violet-100/50">
                        <div>
                          <p className="font-bold text-slate-800">{item.titulo || item.assunto}</p>
                          <p className="text-[10px] text-slate-400">{item.data}</p>
                        </div>
                        <span className="text-[10px] bg-violet-600 text-white px-2 py-1 rounded-lg">Selecionar</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {podeCriar && listaIdAtual && (
              <form onSubmit={handleSalvarItemEscala} className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase">{editandoEscalaId ? "Editar Participante" : "Adicionar Participante"}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input placeholder="Cargo (ex: Teclado)" value={formEscala.cargo} onChange={(e) => setFormEscala({ ...formEscala, cargo: e.target.value })} className="h-8 text-xs" />
                  <Input placeholder="Nome Completo" value={formEscala.nome} onChange={(e) => setFormEscala({ ...formEscala, nome: e.target.value })} className="h-8 text-xs" />
                </div>
                <Button type="submit" className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs">Salvar na Tabela</Button>
              </form>
            )}

            <div className="bg-white p-4 rounded-2xl border shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase mb-3 block">Membros Escalados</span>
              {escalaCulto.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs">Nenhum membro na escala para esta lista.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {escalaCulto.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">{item.cargo}</span>
                        <span className="font-semibold text-slate-800 text-sm">{item.nome}</span>
                      </div>
                      {podeCriar && (
                        <div className="flex gap-1.5">
                          <button onClick={() => { setEditandoEscalaId(item.id); setFormEscala({ cargo: item.cargo, nome: item.nome }); }} className="p-1.5 bg-violet-50 text-violet-600 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeletarItemEscala(item.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === "mapa" && (
          <div className="space-y-3">
            {podeCriar && (
              <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Gerenciar Canal de Palco</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Canal (01)" value={novoCanal.canal} onChange={(e) => setNovoCanal({ ...novoCanal, canal: e.target.value })} className="h-8 text-xs" />
                  <Input placeholder="Função" value={novoCanal.funcao} onChange={(e) => setNovoCanal({ ...novoCanal, funcao: e.target.value })} className="h-8 text-xs" />
                  <Input placeholder="Microfone" value={novoCanal.microfone} onChange={(e) => setNovoCanal({ ...novoCanal, microfone: e.target.value })} className="h-8 text-xs" />
                  <Input placeholder="Retorno" value={novoCanal.retorno} onChange={(e) => setNovoCanal({ ...novoCanal, retorno: e.target.value })} className="h-8 text-xs" />
                </div>
                <Button onClick={handleSalvarCanal} className="w-full h-8 bg-violet-600 text-white text-xs">Salvar Canal</Button>
              </div>
            )}
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
              {canaisMapa.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border text-xs">
                  <div>
                    <span className="font-bold text-violet-700">Canal {item.canal}</span> - {item.funcao}
                  </div>
                  {podeCriar && (
                    <button onClick={() => handleDeletarCanal(item.id)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === "aquecimento" && (
          <div className="bg-white p-5 rounded-2xl border shadow-sm text-center space-y-3">
            <Headphones className="w-8 h-8 mx-auto text-violet-600" />
            <h3 className="text-sm font-bold">{exercicioSelecionado}</h3>
            <button onClick={() => setReproduzindo(!reproduzindo)} className="w-12 h-12 bg-violet-600 text-white rounded-full mx-auto flex items-center justify-center">
              {reproduzindo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
          </div>
        )}

        {abaAtiva === "sugestoes" && (
          <div className="space-y-3">
            <form onSubmit={handleEnviarSugestao} className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Sugerir Hino</h3>
              <Input placeholder="Nome da Música" value={sugestaoMusica} onChange={(e) => setSugestaoMusica(e.target.value)} className="h-9 text-xs" />
              <Input placeholder="Cantor / Autor" value={sugestaoCantor} onChange={(e) => setSugestaoCantor(e.target.value)} className="h-9 text-xs" />
              <Button type="submit" className="w-full h-9 bg-violet-600 text-white text-xs">Enviar Sugestão</Button>
            </form>
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
              {listaSugestoes.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border text-xs flex justify-between">
                  <div>
                    <p className="font-bold">{item.musica}</p>
                    <p className="text-[10px] text-slate-400">Por: {item.sugerido_por}</p>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}