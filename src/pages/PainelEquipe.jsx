import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, Mic, Music, HardDrive, Calendar, Sliders, Cloud,
  Globe, Shield, Loader2, Trash2, Pencil, ChevronDown, ChevronUp, Star, UserPlus, X, Plus, Minus,
  Save, Image as ImageIcon, FileText, Edit3, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import PreviewModalEscala from "@/components/lista/PreviewModalEscala";

const formatarDataComDiaSemana = (dataRaw) => {
  if (!dataRaw) return "Data não definida";
  const strData = dataRaw.split("T")[0];
  const partes = strData.split("-");
  if (partes.length !== 3) return dataRaw;
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

const ordenarMembrosOuEscala = (a, b) => {
  const funcA = (a.funcao || "").trim().toLowerCase();
  const funcB = (b.funcao || "").trim().toLowerCase();
  const catA = (a.categoria || "").trim().toLowerCase();
  const catB = (b.categoria || "").trim().toLowerCase();
  const getFuncPriority = (f) => {
    if (f.includes("instrumento")) return 1;
    if (f.includes("voz")) return 2;
    return 3;
  };
  const fpA = getFuncPriority(funcA);
  const fpB = getFuncPriority(funcB);
  if (fpA !== fpB) return fpA - fpB;
  if (funcA.includes("instrumento") && funcB.includes("instrumento")) {
    const getInstPriority = (cat) => {
      if (cat.includes("teclado")) return 1;
      if (cat.includes("violão") || cat.includes("violao")) return 2;
      if (cat.includes("baixo")) return 3;
      if (cat.includes("bateria")) return 4;
      return 5;
    };
    const pA = getInstPriority(catA);
    const pB = getInstPriority(catB);
    if (pA !== pB) return pA - pB;
    if (catA !== catB) return catA.localeCompare(catB);
  }
  if (funcA.includes("voz") && funcB.includes("voz")) {
    const getVozPriority = (cat) => {
      if (cat.includes("soprano")) return 1;
      if (cat.includes("contralto")) return 2;
      if (cat.includes("tenor")) return 3;
      if (cat.includes("baixo")) return 4;
      return 5;
    };
    const pA = getVozPriority(catA);
    const pB = getVozPriority(catB);
    if (pA !== pB) return pA - pB;
    if (catA !== catB) return catA.localeCompare(catB);
  }
  if (catA !== catB) {
    return catA.localeCompare(catB);
  }
  return (a.nome || "").localeCompare(b.nome || "");
};

export default function PainelEquipe() {
  const navigate = useNavigate();
  const cardEscalaRef = useRef(null);
  const [menuDropdownAberto, setMenuDropdownAberto] = useState(false);
  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");
  const [carregandoIgreja, setCarregandoIgreja] = useState(false);
  const [carregandoEscala, setCarregandoEscala] = useState(false);
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const temNuvem = userNuvem.trim() !== "";
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mostrarBotaoPadrao, setMostrarBotaoPadrao] = useState(false);
  const [mostrarFormAdicionar, setMostrarFormAdicionar] = useState(false);
  const [membrosCadastrados, setMembrosCadastrados] = useState([]);
  const [modalMembrosAberto, setModalMembrosAberto] = useState(false);
  const [formMembroModal, setFormMembroModal] = useState({ id: null, nome: "", equipe_padrao: false, funcao: "", categoria: "" });
  const [salvarNovoNoBanco, setSalvarNovoNoBanco] = useState(false);
  const funcoesMacro = ["Instrumento", "Voz", "Som", "Mídia / Projeção"];
  const categoriasFrequentes = {
    "Instrumento": [
      "Teclado", 
      "Violão", 
      "Baixo", 
      "Bateria", 
      "Clarinete", 
      "Flauta", 
      "Guitarra", 
      "Sax Alto", 
      "Sax Soprano", 
      "Trombone", 
      "Trompete", 
      "Viola", 
      "Violino I", 
      "Violino II", 
      "Violoncelo"
    ],
    "Voz": ["Soprano", "Contralto", "Tenor", "Baixo"],
    "Som": ["Operador de Áudio", "Auxiliar de Som"],
    "Mídia / Projeção": ["Projeção", "Transmissão", "Câmera"]
  };
  const [escalaCulto, setEscalaCulto] = useState([]);
  const [formEscala, setFormEscala] = useState({ funcao: "Instrumento", categoria: "", nome: "" });
  const [temAlteracoesPendentes, setTemAlteracoesPendentes] = useState(false);
  const [salvandoEscala, setSalvandoEscala] = useState(false);
  const [modalEditarEscala, setModalEditarEscala] = useState({ open: false, id: null, nome: "", funcao: "", categoria: "" });
  const [modalPreview, setModalPreview] = useState({ open: false, mode: "image" });
  const [historicoListas, setHistoricoListas] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [mostrarModalHistorico, setMostrarModalHistorico] = useState(false);
  const [listaSanfonaExpandida, setListaSanfonaExpandida] = useState(false);
  const [cultoSelecionadoInfo, setCultoSelecionadoInfo] = useState({
    id: null,
    titulo: "",
    data: "",
    louvor: "",
    palavra: "",
    tipo: ""
  });
  const podeCriar = userRole === "super_admin" || userRole === "church_admin";
  const isSuper = userRole === "super_admin";
  const outrosCultos = historicoListas.filter(
    (item) => item.id !== cultoSelecionadoInfo.id
  );

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
        carregarMembrosCadastrados(nomeFinal);
        buscarHistoricoListas(roleFinal);
      } catch (err) {
        console.error("Erro ao validar permissões:", err);
        setUserRole(localStorage.getItem("icmlyrics_role") || "user");
      } finally {
        setCarregandoValidacao(false);
      }
    };
    validarAcesso();
  }, [userNuvem, usuarioLocal, temNuvem]);

  const buscarHistoricoListas = async (roleParam) => {
    if (!temNuvem) return;
    setCarregandoHistorico(true);
    const roleAtual = roleParam || userRole;
    try {
      let query = supabase
        .from("listas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (userNuvem && userNuvem.trim() !== "" && userNuvem !== "admin_geral" && roleAtual !== "super_admin") {
        query = query.eq("acesso_usuario", userNuvem.trim());
      }
      const { data, error } = await query;
      if (!error && data) {
        setHistoricoListas(data);
        const ehAdmin = roleAtual === "super_admin" || roleAtual === "church_admin";
        if (!ehAdmin && data.length > 0) {
          selecionarCulto(data[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar histórico de listas:", err);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const carregarMembrosCadastrados = async (igrejaNome) => {
    if (!temNuvem) return;
    const igrejaParaBuscar = igrejaNome || nomeIgreja;
    if (!igrejaParaBuscar || igrejaParaBuscar === "Carregando...") return;
    try {
      const { data, error } = await supabase
        .from("membros_equipe")
        .select("*")
        .eq("nome_igreja", igrejaParaBuscar);
      if (!error && data) {
        const ordenados = [...data].sort(ordenarMembrosOuEscala);
        setMembrosCadastrados(ordenados);
      }
    } catch (err) {
      console.error("Erro ao carregar membros cadastrados:", err);
    }
  };

  const carregarEscalaEquipe = async (listaId, igrejaNome) => {
    if (!temNuvem || !listaId) return setEscalaCulto([]);
    const nomeParaBuscar = igrejaNome || nomeIgreja;
    setCarregandoEscala(true);
    try {
      let query = supabase
        .from("escala_equipe")
        .select("*")
        .eq("lista_id", listaId);
      if (nomeParaBuscar && nomeParaBuscar !== "Carregando...") {
        query = query.eq("nome_igreja", nomeParaBuscar);
      }
      const { data, error } = await query;
      if (!error && data) {
        const formatado = data.map(item => ({
          ...item,
          funcao: item.funcao || item.cargo || "Instrumento",
          categoria: item.categoria || item.detalhe || ""
        }));
        const ordenados = formatado.sort(ordenarMembrosOuEscala);
        setEscalaCulto(ordenados);
        setTemAlteracoesPendentes(false);
      }
    } catch (err) {
      console.error("Erro ao carregar escala da equipe:", err);
    } finally {
      setCarregandoEscala(false);
    }
  };

  const carregarNomeIgreja = async () => {
    if (!temNuvem) return;
    setCarregandoIgreja(true);
    const usuarioAtual = userNuvem || usuarioLocal;
    if (temNuvem && usuarioAtual) {
      try {
        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("nome_igreja")
          .eq("usuario", usuarioAtual)
          .maybeSingle();
        if (!error && data && data.nome_igreja) {
          setNomeIgreja(data.nome_igreja);
          carregarMembrosCadastrados(data.nome_igreja);
        } else {
          const nomeSalvo = localStorage.getItem("icmlyrics_nome_igreja") || usuarioAtual;
          setNomeIgreja(nomeSalvo);
          carregarMembrosCadastrados(nomeSalvo);
        }
      } catch (e) {
        console.error("Erro ao buscar igreja autorizada:", e);
      } finally {
        setCarregandoIgreja(false);
      }
    }
  };

  const selecionarCulto = (item) => {
    if (!temNuvem) return;
    const listaId = item.id;
    const dataRaw = item.data_culto || item.data || item.created_at?.split("T")[0];
    setCultoSelecionadoInfo({
      id: listaId,
      titulo: item.tipo_culto || item.evento || item.titulo || item.assunto || "Culto / Evento Geral",
      data: formatarDataComDiaSemana(dataRaw),
      louvor: item.responsavel || item.autor || "",
      palavra: item.palavra || "",
      tipo: item.tipo_culto || item.evento || "Culto"
    });
    carregarEscalaEquipe(listaId, nomeIgreja);
    setMostrarBotaoPadrao(true);
    setMostrarModalHistorico(false);
    setListaSanfonaExpandida(false);
    setModoEdicao(false);
    setMostrarFormAdicionar(false);
  };

  const handleCarregarEquipePadrao = async () => {
    if (!temNuvem || !podeCriar) return;
    if (!cultoSelecionadoInfo.id) {
      return alert("Selecione primeiro um culto na lista para vincular a equipe padrão.");
    }
    try {
      const { data: membrosPadrao, error: errMembros } = await supabase
        .from("membros_equipe")
        .select("*")
        .eq("nome_igreja", nomeIgreja)
        .eq("equipe_padrao", true);
      if (errMembros || !membrosPadrao || membrosPadrao.length === 0) {
        alert("Nenhum integrante marcado como 'Equipe Padrão' no Banco de Membros.");
        return;
      }
      const nomesNaEscala = new Set(
        escalaCulto.map((item) => item.nome.trim().toLowerCase())
      );
      const membrosNovos = membrosPadrao.filter(
        (membro) => !nomesNaEscala.has(membro.nome.trim().toLowerCase())
      );
      if (membrosNovos.length === 0) {
        alert("Todos os integrantes da equipe padrão já estão na lista.");
        return;
      }
      const novosItensLocais = membrosNovos.map((membro) => ({
        id: `temp_${Date.now()}_${Math.random()}`,
        lista_id: cultoSelecionadoInfo.id,
        funcao: membro.funcao || membro.cargo || "Instrumento",
        categoria: membro.categoria || membro.detalhe || "",
        nome: membro.nome,
        nome_igreja: nomeIgreja
      }));
      const combinados = [...escalaCulto, ...novosItensLocais].sort(ordenarMembrosOuEscala);
      setEscalaCulto(combinados);
      setTemAlteracoesPendentes(true);
      setModoEdicao(true);
    } catch (err) {
      console.error("Erro ao puxar equipe padrão:", err);
    }
  };

  const handleAdicionarItemEscalaLocal = (e) => {
    e.preventDefault();
    if (!temNuvem || !podeCriar) return alert("Apenas administradores podem alterar a escala.");
    if (!formEscala.nome.trim()) return alert("Preencha o nome do integrante.");
    const novoItem = {
      id: `temp_${Date.now()}`,
      lista_id: cultoSelecionadoInfo.id,
      funcao: formEscala.funcao.trim() || "Instrumento",
      categoria: formEscala.categoria.trim() || "",
      nome: formEscala.nome.trim(),
      nome_igreja: nomeIgreja
    };
    const combinados = [...escalaCulto, novoItem].sort(ordenarMembrosOuEscala);
    setEscalaCulto(combinados);
    if (salvarNovoNoBanco && formEscala.nome.trim()) {
      supabase.from("membros_equipe").insert([{
        nome: formEscala.nome.trim(),
        funcao: formEscala.funcao.trim(),
        categoria: formEscala.categoria.trim(),
        equipe_padrao: false,
        nome_igreja: nomeIgreja
      }]).then(() => carregarMembrosCadastrados(nomeIgreja));
    }
    setFormEscala({ funcao: "Instrumento", categoria: "", nome: "" });
    setSalvarNovoNoBanco(false);
    setTemAlteracoesPendentes(true);
  };

  const handleDeletarItemEscalaLocal = (id) => {
    if (!podeCriar) return;
    setEscalaCulto((prev) => prev.filter((item) => item.id !== id));
    setTemAlteracoesPendentes(true);
  };

  const handleLimparMembrosEscalados = () => {
    if (!podeCriar) return;
    if (escalaCulto.length === 0) return;
    if (window.confirm("Deseja remover todos os membros desta escala localmente?")) {
      setEscalaCulto([]);
      setTemAlteracoesPendentes(true);
    }
  };

  const handleCancelarEscala = () => {
    setEscalaCulto([]);
    setCultoSelecionadoInfo({
      id: null,
      titulo: "",
      data: "",
      louvor: "",
      palavra: "",
      tipo: ""
    });
    setMostrarBotaoPadrao(false);
    setMostrarFormAdicionar(false);
    setTemAlteracoesPendentes(false);
    setModoEdicao(false);
  };

  const handleCancelarEdicao = () => {
    setModoEdicao(false);
    setMostrarFormAdicionar(false);
    setTemAlteracoesPendentes(false);
    carregarEscalaEquipe(cultoSelecionadoInfo.id, nomeIgreja);
  };

  const handleExcluirCultoDaLista = async () => {
    if (!podeCriar) return;
    if (!cultoSelecionadoInfo.id) return alert("Nenhum culto selecionado.");
    if (!window.confirm("Tem certeza que deseja excluir este culto?")) {
      return;
    }
    setSalvandoEscala(true);
    try {
      const { error } = await supabase
        .from("listas")
        .delete()
        .eq("id", cultoSelecionadoInfo.id);
      if (error) throw error;
      await supabase
        .from("escala_equipe")
        .delete()
        .eq("lista_id", cultoSelecionadoInfo.id);
      handleCancelarEscala();
      buscarHistoricoListas();
      alert("Culto excluído da tabela listas com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir culto da tabela listas:", err);
      alert("Erro ao excluir o culto.");
    } finally {
      setSalvandoEscala(false);
    }
  };

  const handleSalvarEscalaBanco = async () => {
    if (!cultoSelecionadoInfo.id) return alert("Nenhum culto selecionado.");
    setSalvandoEscala(true);
    try {
      await supabase
        .from("listas")
        .update({
          responsavel: cultoSelecionadoInfo.louvor,
          palavra: cultoSelecionadoInfo.palavra
        })
        .eq("id", cultoSelecionadoInfo.id);
      await supabase
        .from("escala_equipe")
        .delete()
        .eq("lista_id", cultoSelecionadoInfo.id)
        .eq("nome_igreja", nomeIgreja);
      if (escalaCulto.length > 0) {
        const payload = escalaCulto.map((item) => ({
          lista_id: cultoSelecionadoInfo.id,
          funcao: item.funcao,
          categoria: item.categoria,
          cargo: item.funcao,
          detalhe: item.categoria,
          nome: item.nome,
          nome_igreja: nomeIgreja
        }));
        const { error } = await supabase.from("escala_equipe").insert(payload);
        if (error) throw error;
      }
      setTemAlteracoesPendentes(false);
      setModoEdicao(false);
      setMostrarFormAdicionar(false);
      alert("Escala salva com sucesso!");
      carregarEscalaEquipe(cultoSelecionadoInfo.id, nomeIgreja);
    } catch (err) {
      console.error("Erro ao salvar escala:", err);
      alert("Erro ao salvar escala no banco de dados.");
    } finally {
      setSalvandoEscala(false);
    }
  };

  const handleGerarPreview = async (mode) => {
    if (escalaCulto.length === 0) {
      return alert("Não há integrantes na escala para gerar a visualização.");
    }
    if (temAlteracoesPendentes) {
      await handleSalvarEscalaBanco();
    }
    setModalPreview({ open: true, mode });
  };

  const handleSalvarMembroModal = async (e) => {
    e.preventDefault();
    if (!podeCriar) return alert("Permissão negada.");
    if (!formMembroModal.nome.trim()) return alert("O nome do integrante é obrigatório.");
    try {
      if (formMembroModal.id) {
        const { error } = await supabase
          .from("membros_equipe")
          .update({
            nome: formMembroModal.nome.trim(),
            equipe_padrao: formMembroModal.equipe_padrao,
            funcao: formMembroModal.funcao,
            categoria: formMembroModal.categoria
          })
          .eq("id", formMembroModal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("membros_equipe")
          .insert([{
            nome: formMembroModal.nome.trim(),
            funcao: formMembroModal.funcao || "Instrumento",
            categoria: formMembroModal.categoria || "",
            nome_igreja: nomeIgreja
          }]);
        if (error) throw error;
      }
      setFormMembroModal({ id: null, nome: "", equipe_padrao: false, funcao: "", categoria: "" });
      carregarMembrosCadastrados(nomeIgreja);
    } catch (err) {
      console.error("Erro ao salvar membro no banco:", err);
    }
  };

  const handleDeletarMembroBanco = async (membroId) => {
    if (!podeCriar) return;
    if (!window.confirm("Deseja remover este integrante do banco de dados?")) return;
    try {
      const { error } = await supabase
        .from("membros_equipe")
        .delete()
        .eq("id", membroId);
      if (!error) carregarMembrosCadastrados(nomeIgreja);
    } catch (err) {
      console.error("Erro ao deletar membro do banco:", err);
    }
  };

  const handleAlternarEquipePadrao = async (membroId, statusAtual) => {
    if (!podeCriar) return;
    try {
      const { error } = await supabase
        .from("membros_equipe")
        .update({ equipe_padrao: !statusAtual })
        .eq("id", membroId);
      if (!error) carregarMembrosCadastrados(nomeIgreja);
    } catch (err) {
      console.error("Erro ao alterar status da equipe padrão:", err);
    }
  };

  const rowsParaPreview = escalaCulto.map((item) => ({
    id: item.id,
    type: "louvor",
    classificacao: item.funcao,
    categoria: item.categoria,
    funcao: item.funcao,
    detalhe: item.categoria,
    nome: item.nome,
    observacao: ""
  }));

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-5 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-slate-300 hover:text-white transition-colors" aria-label="Voltar ao Dashboard">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-300" /> Painel da Equipe
              </h1>
              <p className="text-slate-400 text-xs">Organização, técnica e escala para o culto</p>
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
                  <div 
                    onClick={(e) => { e.stopPropagation(); carregarNomeIgreja(); }}
                    className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
                    title="Sincronizar dados"
                  >
                    <Cloud className={`w-3 h-3 text-emerald-400 ${carregandoIgreja ? "animate-spin" : ""}`} />
                  </div>
                  <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">
                    {isSuper ? <Globe className="w-2.5 h-2.5 text-slate-300" /> : <Shield className="w-2.5 h-2.5 text-slate-300" />}
                    {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-white shadow-sm border border-slate-700 flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Escala da Equipe
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuDropdownAberto(!menuDropdownAberto)}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white shadow-sm transition-all flex items-center justify-center border border-slate-700/50"
            >
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {menuDropdownAberto && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => { setMenuDropdownAberto(false); navigate("/mapa-palco"); }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 font-semibold transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-400" /> Mapa de Palco
                </button>
                <button
                  onClick={() => { setMenuDropdownAberto(false); navigate("/Aquecimento-Vocal"); }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 font-semibold transition-colors"
                >
                  <Mic className="w-3.5 h-3.5 text-slate-400" /> Aquecimento Vocal
                </button>
                <button
                  onClick={() => { setMenuDropdownAberto(false); navigate("/sugestoes"); }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 font-semibold transition-colors"
                >
                  <Music className="w-3.5 h-3.5 text-slate-400" /> Sugestões de Hinos
                </button>
                <button
                  onClick={() => { setMenuDropdownAberto(false); navigate("/drive"); }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 font-semibold transition-colors"
                >
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Drive de Arquivos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 mt-4 space-y-4 flex-1 flex flex-col">
        {!temNuvem ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center shadow-sm space-y-3 my-auto mx-auto max-w-md w-full">
            <Cloud className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Nenhuma Nuvem Conectada</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Você precisa estar conectado a uma nuvem para visualizar e gerenciar o Painel da Equipe e suas escalas.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            {podeCriar && (
              <div className="flex w-full gap-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <Button 
                  onClick={() => setModalMembrosAberto(true)}
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold gap-1.5 shadow-sm px-2 cursor-pointer border-slate-700"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="truncate">Membros</span>
                </Button>
                <Button 
                  onClick={() => { buscarHistoricoListas(); setMostrarModalHistorico(true); setListaSanfonaExpandida(false); }}
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold gap-1.5 border-slate-200 px-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">Cultos</span>
                </Button>
                {podeCriar && modoEdicao && cultoSelecionadoInfo.id && (
                  <Button 
                    onClick={handleCarregarEquipePadrao}
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold gap-1.5 border-slate-200 px-2 cursor-pointer transition-all animate-in fade-in duration-200"
                    title="Puxar todos os integrantes marcados como Padrão"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="truncate">Padrão</span>
                  </Button>
                )}
              </div>
            )}
            {mostrarModalHistorico && (
              <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Selecionar Culto / Evento</h4>
                  <button onClick={() => setMostrarModalHistorico(false)} className="text-xs text-slate-500 hover:text-slate-800 font-bold">Fechar</button>
                </div>
                {carregandoHistorico ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>
                ) : historicoListas.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">Nenhum registro encontrado nesta nuvem.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {historicoListas.map((item) => {
                      const dataFormatada = formatarDataComDiaSemana(item.data_culto || item.data || item.created_at);
                      const tipoEvento = item.tipo_culto || item.evento || item.titulo || item.assunto || "Culto";
                      const louvor = item.responsavel || item.autor || "Geral";
                      return (
                        <div 
                          key={item.id}
                          onClick={() => selecionarCulto(item)}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{dataFormatada}</p>
                            <p className="text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-700">{tipoEvento}</span> • Louvor: {louvor}
                            </p>
                          </div>
                          <span className="text-[10px] bg-slate-800 text-white font-bold px-2 py-1 rounded-lg">Mostrar Escala</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {cultoSelecionadoInfo.id && (
              <div ref={cardEscalaRef} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start gap-3 pb-3 border-b border-slate-100">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {cultoSelecionadoInfo.tipo}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{cultoSelecionadoInfo.titulo}</h3>
                    {modoEdicao && podeCriar ? (
                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <div className="inline-flex items-center whitespace-nowrap"><span className="text-slate-400 mr-1">Data:</span> <strong className="text-slate-800">{cultoSelecionadoInfo.data}</strong></div>
                          <Button 
                            onClick={() => navigate("/historico-listas", { state: { listaId: cultoSelecionadoInfo.id } })}
                            className="h-7 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider px-2 rounded-lg shadow-sm flex items-center gap-1.5"
                          >
                            Lista de Louvores <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Louvor</label>
                            <Input 
                              value={cultoSelecionadoInfo.louvor}
                              onChange={(e) => setCultoSelecionadoInfo({ ...cultoSelecionadoInfo, louvor: e.target.value })}
                              className="h-8 text-xs bg-white"
                              placeholder="Responsável pelo louvor"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Palavra</label>
                            <Input 
                              value={cultoSelecionadoInfo.palavra}
                              onChange={(e) => setCultoSelecionadoInfo({ ...cultoSelecionadoInfo, palavra: e.target.value })}
                              className="h-8 text-xs bg-white"
                              placeholder="Responsável pela palavra"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                        <div className="inline-flex items-center whitespace-nowrap"><span className="text-slate-400 mr-1">Data:</span> <strong className="text-slate-800">{cultoSelecionadoInfo.data}</strong></div>
                        {podeCriar && (
                          <Button 
                            onClick={() => navigate("/historico-listas", { state: { listaId: cultoSelecionadoInfo.id } })}
                            className="h-7 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider px-2 rounded-lg shadow-sm flex items-center gap-1.5"
                          >
                            Lista de Louvores <ArrowRight className="w-3 h-3" />
                          </Button>
                        )}
                        <div className="inline-flex items-center whitespace-nowrap"><span className="text-slate-400 mr-1">Louvor:</span> <strong className="text-slate-800">{cultoSelecionadoInfo.louvor || "Não informado"}</strong></div>
                        {cultoSelecionadoInfo.palavra && (
                          <div className="inline-flex items-center whitespace-nowrap"><span className="text-slate-400 mr-1">Palavra:</span> <strong className="text-slate-800">{cultoSelecionadoInfo.palavra}</strong></div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {!podeCriar && (
                      <Button 
                        onClick={() => navigate("/historico-listas", { state: { listaId: cultoSelecionadoInfo.id } })}
                        className="h-7 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider px-2 rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        Lista de Louvores <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                    {podeCriar && modoEdicao ? (
                      <button
                        type="button"
                        onClick={() => setMostrarFormAdicionar(!mostrarFormAdicionar)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all flex items-center gap-1.5 shadow-sm text-xs font-bold cursor-pointer"
                        title={mostrarFormAdicionar ? "Recolher formulário" : "Adicionar participante à escala"}
                      >
                        {mostrarFormAdicionar ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    ) : podeCriar && !modoEdicao ? (
                      <div className="flex items-center gap-1.5">
                        <Button 
                          onClick={() => setModoEdicao(true)}
                          className="h-8 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Alterar
                        </Button>
                        <Button 
                          onClick={handleExcluirCultoDaLista}
                          disabled={salvandoEscala}
                          variant="outline"
                          className="h-8 w-8 p-0 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center shadow-sm cursor-pointer"
                          title="Excluir Culto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
                {mostrarFormAdicionar && podeCriar && modoEdicao && (
                  <form onSubmit={handleAdicionarItemEscalaLocal} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Adicionar Participante à Escala
                      </span>
                      {membrosCadastrados.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Puxar do banco:</span>
                          <select
                            onChange={(e) => {
                              const membro = membrosCadastrados.find(m => m.id === Number(e.target.value));
                              if (membro) {
                                setFormEscala({
                                  funcao: membro.funcao || "Instrumento",
                                  categoria: membro.categoria || "",
                                  nome: membro.nome
                                });
                              }
                            }}
                            defaultValue=""
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                          >
                            <option value="" disabled>Selecionar membro...</option>
                            {membrosCadastrados.map((membro) => (
                              <option key={membro.id} value={membro.id}>
                                {membro.nome} ({membro.funcao || "Geral"}{membro.categoria ? ` - ${membro.categoria}` : ""}) {membro.equipe_padrao ? "★" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Função (Grupo)</label>
                        <select 
                          value={formEscala.funcao}
                          onChange={(e) => setFormEscala({ ...formEscala, funcao: e.target.value, categoria: "" })}
                          className="w-full h-9 text-xs bg-white border border-slate-200 rounded-lg px-2 font-medium outline-none cursor-pointer"
                        >
                          {funcoesMacro.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Categoria / Detalhe</label>
                        <select 
                          value={formEscala.categoria}
                          onChange={(e) => setFormEscala({ ...formEscala, categoria: e.target.value })}
                          className="w-full h-9 text-xs bg-white border border-slate-200 rounded-lg px-2 font-medium outline-none cursor-pointer"
                        >
                          <option value="">Selecione ou digite ao lado...</option>
                          {(categoriasFrequentes[formEscala.funcao] || []).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nome</label>
                        <Input 
                          placeholder="Nome do integrante" 
                          value={formEscala.nome}
                          onChange={(e) => setFormEscala({ ...formEscala, nome: e.target.value })}
                          className="h-9 text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <input 
                        type="checkbox" 
                        id="salvarNoBancoCheck"
                        checked={salvarNovoNoBanco}
                        onChange={(e) => setSalvarNovoNoBanco(e.target.checked)}
                        className="rounded border-slate-300 text-slate-800 focus:ring-slate-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <label htmlFor="salvarNoBancoCheck" className="text-[11px] text-slate-500 cursor-pointer select-none">
                        Salvar também este integrante no Banco de Membros
                      </label>
                    </div>
                    <Button type="submit" className="w-full h-9 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer">
                      Adicionar à Lista
                    </Button>
                  </form>
                )}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Membros Escalados ({escalaCulto.length})
                    </span>
                    {escalaCulto.length > 0 && podeCriar && modoEdicao && (
                      <button
                        type="button"
                        onClick={handleLimparMembrosEscalados}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Limpar Membros
                      </button>
                    )}
                  </div>
                  {carregandoEscala ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>
                  ) : escalaCulto.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      {podeCriar && modoEdicao 
                        ? "Use o botão '+' ou clique em 'Padrão' no topo para preencher."
                        : "Nenhum participante escalado para este culto."}
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {escalaCulto.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-600 font-bold text-[11px] uppercase">{item.funcao}</span>
                              {item.categoria && <span className="text-slate-400 text-[10px]">• {item.categoria}</span>}
                            </div>
                            <span className="font-semibold text-slate-800 text-sm">{item.nome}</span>
                          </div>
                          {podeCriar && modoEdicao && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  setModalEditarEscala({
                                    open: true,
                                    id: item.id,
                                    nome: item.nome,
                                    funcao: item.funcao || "Instrumento",
                                    categoria: item.categoria || ""
                                  });
                                }}
                                className="p-1.5 bg-slate-200/60 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Alterar dados na escala"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeletarItemEscalaLocal(item.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Remover da escala local"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {cultoSelecionadoInfo.id && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                {podeCriar && modoEdicao ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Ações de Edição
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSalvarEscalaBanco}
                        disabled={salvandoEscala}
                        className="flex-1 h-10 text-xs font-bold rounded-xl gap-2 cursor-pointer transition-all bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                      >
                        {salvandoEscala ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-400" />}
                        Salvar Escala no Banco
                      </Button>
                      <Button
                        onClick={handleExcluirCultoDaLista}
                        disabled={salvandoEscala}
                        variant="outline"
                        className="h-10 border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-3 rounded-xl cursor-pointer"
                        title="Excluir este culto da tabela listas desta nuvem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleCancelarEdicao}
                      variant="outline"
                      className="w-full h-9 border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-bold rounded-xl cursor-pointer"
                    >
                      Cancelar Edição
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Compartilhar / Exportar Escala
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleGerarPreview("image")}
                        className="h-9 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Gerar Imagem
                      </Button>
                      <Button
                        onClick={() => handleGerarPreview("image-text")}
                        variant="secondary"
                        className="h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs border border-slate-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                        Imagem e Texto
                      </Button>
                    </div>
                    {podeCriar && (
                      <div className="pt-2 border-t border-slate-100 flex gap-2">
                        <Button
                          onClick={handleCancelarEscala}
                          variant="ghost"
                          className="w-full h-8 text-slate-500 hover:bg-slate-100 text-[11px] font-bold rounded-xl gap-1.5 cursor-pointer flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" /> Fechar Visualização
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {historicoListas.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <button
                  type="button"
                  onClick={() => { setListaSanfonaExpandida(!listaSanfonaExpandida); setMostrarModalHistorico(false); }}
                  className="w-full flex justify-between items-center text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {cultoSelecionadoInfo.id 
                        ? `Outras Escalas (${outrosCultos.length})` 
                        : `Cultos e Escalas (${historicoListas.length})`}
                    </span>
                  </div>
                  {listaSanfonaExpandida ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {listaSanfonaExpandida && (
                  <div className="pt-2 space-y-2 max-h-60 overflow-y-auto pr-1 animate-in fade-in duration-150">
                    {(cultoSelecionadoInfo.id ? outrosCultos : historicoListas).map((item) => {
                      const dataF = formatarDataComDiaSemana(item.data_culto || item.data || item.created_at);
                      const tipoE = item.tipo_culto || item.evento || item.titulo || item.assunto || "Culto";
                      const louvor = item.responsavel || item.autor || "Geral";
                      return (
                        <div
                          key={item.id}
                          onClick={() => selecionarCulto(item)}
                          className="p-3 rounded-xl text-xs cursor-pointer flex justify-between items-center transition-all border bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80 hover:border-slate-300"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{dataF}</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-700">{tipoE}</span> • Louvor: {louvor}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-white shrink-0">
                            Mostrar Escala
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {modalMembrosAberto && temNuvem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-300" />
                  <h3 className="font-bold text-sm">Banco de Membros</h3>
                </div>
                <button 
                  onClick={() => {
                    setModalMembrosAberto(false);
                    setFormMembroModal({ id: null, nome: "", equipe_padrao: false, funcao: "", categoria: "" });
                  }} 
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                <form onSubmit={handleSalvarMembroModal} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      {formMembroModal.id ? "Editar Integrante" : "Cadastrar Novo Integrante"}
                    </span>
                    {formMembroModal.id && (
                      <button
                        type="button"
                        onClick={() => setFormMembroModal({ id: null, nome: "", equipe_padrao: false, funcao: "", categoria: "" })}
                        className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                      >
                        Limpar / Novo
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={formMembroModal.funcao}
                      onChange={(e) => setFormMembroModal({ ...formMembroModal, funcao: e.target.value, categoria: "" })}
                      className="h-9 text-xs bg-white border border-slate-200 rounded-xl px-2 font-medium outline-none cursor-pointer"
                    >
                      <option value="">Função...</option>
                      {funcoesMacro.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select
                      value={formMembroModal.categoria}
                      onChange={(e) => setFormMembroModal({ ...formMembroModal, categoria: e.target.value })}
                      className="h-9 text-xs bg-white border border-slate-200 rounded-xl px-2 font-medium outline-none cursor-pointer"
                    >
                      <option value="">Categoria/Instrumento...</option>
                      {(categoriasFrequentes[formMembroModal.funcao] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="relative flex items-center">
                      <Input 
                        placeholder="Nome" 
                        value={formMembroModal.nome}
                        onChange={(e) => setFormMembroModal({ ...formMembroModal, nome: e.target.value })}
                        className="h-9 text-xs bg-white pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setFormMembroModal({ ...formMembroModal, equipe_padrao: !formMembroModal.equipe_padrao })}
                        className="absolute right-2.5 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                        title="Equipe Padrão"
                      >
                        <Star className={`w-4 h-4 ${formMembroModal.equipe_padrao ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                      </button>
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="w-full h-9 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer">
                    <Plus className="w-4 h-4 mr-1" /> Salvar Integrante no Banco
                  </Button>
                </form>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-slate-500 uppercase">Integrantes Salvos ({membrosCadastrados.length})</span>
                    <span className="text-[10px] text-slate-400">★ Equipe Padrão</span>
                  </div>
                  {membrosCadastrados.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Nenhum participante cadastrado no banco ainda.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {membrosCadastrados.map((membro) => (
                        <div 
                          key={membro.id} 
                          className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors shadow-2xs gap-2"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleAlternarEquipePadrao(membro.id, membro.equipe_padrao)}
                              title={membro.equipe_padrao ? "Remover da Equipe Padrão" : "Marcar como Equipe Padrão"}
                              className="shrink-0 cursor-pointer"
                            >
                              <Star className={`w-4 h-4 transition-transform active:scale-125 ${membro.equipe_padrao ? "text-amber-500 fill-amber-500" : "text-slate-300 hover:text-amber-400"}`} />
                            </button>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-semibold text-slate-800 text-xs truncate">
                                {membro.nome}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate">
                                <strong className="text-slate-700">{membro.funcao || "Instrumento"}</strong> {membro.categoria ? `• ${membro.categoria}` : ""}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setFormMembroModal({
                                id: membro.id,
                                nome: membro.nome,
                                equipe_padrao: !!membro.equipe_padrao,
                                funcao: membro.funcao || "Instrumento",
                                categoria: membro.categoria || ""
                              })}
                              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Editar integrante"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletarMembroBanco(membro.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Excluir do banco"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-right">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setModalMembrosAberto(false)}
                  className="h-8 text-xs font-semibold cursor-pointer"
                >
                  Concluir
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {modalEditarEscala.open && temNuvem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Editar Integrante na Escala</h3>
              <button 
                onClick={() => setModalEditarEscala({ open: false, id: null, nome: "", funcao: "", categoria: "" })}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome</label>
                <Input 
                  value={modalEditarEscala.nome}
                  onChange={(e) => setModalEditarEscala({ ...modalEditarEscala, nome: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Função (Grupo)</label>
                <select 
                  value={modalEditarEscala.funcao}
                  onChange={(e) => setModalEditarEscala({ ...modalEditarEscala, funcao: e.target.value, categoria: "" })}
                  className="w-full h-9 text-xs bg-white border border-slate-200 rounded-xl px-2 font-medium outline-none cursor-pointer"
                >
                  {funcoesMacro.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria / Instrumento</label>
                <select 
                  value={modalEditarEscala.categoria}
                  onChange={(e) => setModalEditarEscala({ ...modalEditarEscala, categoria: e.target.value })}
                  className="w-full h-9 text-xs bg-white border border-slate-200 rounded-xl px-2 font-medium outline-none cursor-pointer mb-2"
                >
                  <option value="">Selecione a categoria...</option>
                  {(categoriasFrequentes[modalEditarEscala.funcao] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input 
                  placeholder="Ou digite o instrumento/categoria"
                  value={modalEditarEscala.categoria}
                  onChange={(e) => setModalEditarEscala({ ...modalEditarEscala, categoria: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setModalEditarEscala({ open: false, id: null, nome: "", funcao: "", categoria: "" })}
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  if (!modalEditarEscala.nome.trim()) return alert("O nome é obrigatório.");
                  const atualizados = escalaCulto.map((item) =>
                    item.id === modalEditarEscala.id
                      ? { ...item, nome: modalEditarEscala.nome.trim(), funcao: modalEditarEscala.funcao, categoria: modalEditarEscala.categoria.trim() }
                      : item
                  ).sort(ordenarMembrosOuEscala);
                  setEscalaCulto(atualizados);
                  setTemAlteracoesPendentes(true);
                  setModalEditarEscala({ open: false, id: null, nome: "", funcao: "", categoria: "" });
                }}
                className="h-8 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
      {temNuvem && (
        <PreviewModalEscala 
          open={modalPreview.open} 
          onOpenChange={(open) => setModalPreview({ ...modalPreview, open })} 
          mode={modalPreview.mode} 
          rows={rowsParaPreview} 
          dataCulto={cultoSelecionadoInfo.data}
          tipoCulto={cultoSelecionadoInfo.titulo || cultoSelecionadoInfo.tipo}
          responsavel={cultoSelecionadoInfo.louvor}
          nomeIgreja={nomeIgreja}
        />
      )}
    </div>
  );
}
