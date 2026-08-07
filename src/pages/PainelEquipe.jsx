import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, Mic, Music, HardDrive, Calendar, Sliders, Cloud,
  Globe, Shield, Loader2, Trash2, Pencil, ChevronDown, Star, UserPlus, X, Plus, Minus, Tag,
  Save, Image as ImageIcon, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import PreviewModal from "@/components/lista/PreviewModal";

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

export default function PainelEquipe() {
  const navigate = useNavigate();
  const cardEscalaRef = useRef(null);

  const [abaAtiva, setAbaAtiva] = useState("escala");
  const [menuDropdownAberto, setMenuDropdownAberto] = useState(false);

  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");
  const [carregandoIgreja, setCarregandoIgreja] = useState(false);

  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const temNuvem = userNuvem.trim() !== "";

  const [mostrarBotaoPadrao, setMostrarBotaoPadrao] = useState(false);
  const [mostrarFormAdicionar, setMostrarFormAdicionar] = useState(false);

  const [membrosCadastrados, setMembrosCadastrados] = useState([]);
  const [modalMembrosAberto, setModalMembrosAberto] = useState(false);
  const [formMembroModal, setFormMembroModal] = useState({ id: null, nome: "", equipe_padrao: false });
  const [salvarNovoNoBanco, setSalvarNovoNoBanco] = useState(false);

  const funcoesFrequentes = ["Regente", "Teclado", "Violão", "Vocal", "Som", "Mídia / Projeção", "Bateria", "Baixo"];

  const [canaisMapa, setCanaisMapa] = useState([]);
  const [novoCanal, setNovoCanal] = useState({ canal: "", funcao: "", microfone: "", retorno: "" });
  const [editandoCanalId, setEditandoCanalId] = useState(null);

  const [escalaCulto, setEscalaCulto] = useState([]);
  const [formEscala, setFormEscala] = useState({ cargo: "", nome: "" });
  const [editandoEscalaId, setEditandoEscalaId] = useState(null);
  const [temAlteracoesPendentes, setTemAlteracoesPendentes] = useState(false);
  const [salvandoEscala, setSalvandoEscala] = useState(false);

  const [modalPreview, setModalPreview] = useState({ open: false, mode: "image" });

  const [historicoListas, setHistoricoListas] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [carregandoEscala, setCarregandoEscala] = useState(false);
  const [mostrarModalHistorico, setMostrarModalHistorico] = useState(false);

  const [cultoSelecionadoInfo, setCultoSelecionadoInfo] = useState({
    id: null,
    titulo: "",
    data: "",
    responsavel: "",
    tipo: ""
  });

  useEffect(() => {
    const validarAcesso = async () => {
      try {
        setCarregandoValidacao(true);
        const roleSalva = localStorage.getItem("icmlyrics_role") || "user";

        if (roleSalva === "super_admin" || userNuvem === "admin_geral") {
          setUserRole("super_admin");
          const nomeIgrejaDefinido = userNuvem || "Administração Geral";
          setNomeIgreja(nomeIgrejaDefinido);
          carregarMapaPalco(nomeIgrejaDefinido);
          carregarMembrosCadastrados(nomeIgrejaDefinido);
          return;
        }

        if (!userNuvem.trim()) {
          setUserRole("user");
          const nomeIgrejaDefinido = localStorage.getItem("icmlyrics_nome_igreja") || usuarioLocal || "Modo Local";
          setNomeIgreja(nomeIgrejaDefinido);
          carregarMapaPalco(nomeIgrejaDefinido);
          carregarMembrosCadastrados(nomeIgrejaDefinido);
          return;
        }

        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("role, nome_igreja")
          .eq("usuario", userNuvem.trim())
          .maybeSingle();

        let nomeFinal = userNuvem;

        if (!error && data) {
          const roleDoBanco = data.role?.toLowerCase() || "";

          if (roleDoBanco === "super_admin" || roleDoBanco === "super_adm") {
            setUserRole("super_admin");
          } else if (roleDoBanco === "church_admin" || roleDoBanco === "adm_local" || roleSalva === "church_admin") {
            setUserRole("church_admin");
          } else {
            setUserRole("user");
          }

          nomeFinal = data.nome_igreja || userNuvem;
          setNomeIgreja(nomeFinal);
        } else {
          setUserRole(roleSalva);
          nomeFinal = localStorage.getItem("icmlyrics_nome_igreja") || userNuvem;
          setNomeIgreja(nomeFinal);
        }

        carregarMapaPalco(nomeFinal);
        carregarMembrosCadastrados(nomeFinal);
      } catch (err) {
        console.error("Erro ao validar permissões:", err);
        setUserRole(localStorage.getItem("icmlyrics_role") || "user");
      } finally {
        setCarregandoValidacao(false);
      }
    };

    validarAcesso();
  }, [userNuvem, usuarioLocal]);

  const carregarMembrosCadastrados = async (igrejaNome) => {
    const igrejaParaBuscar = igrejaNome || nomeIgreja;
    if (!igrejaParaBuscar || igrejaParaBuscar === "Carregando...") return;

    try {
      const { data, error } = await supabase
        .from("membros_equipe")
        .select("*")
        .eq("nome_igreja", igrejaParaBuscar)
        .order("nome", { ascending: true });

      if (!error && data) setMembrosCadastrados(data);
    } catch (err) {
      console.error("Erro ao carregar membros cadastrados:", err);
    }
  };

  const carregarMapaPalco = async (igrejaNome) => {
    const igrejaParaBuscar = igrejaNome || nomeIgreja;
    if (!igrejaParaBuscar || igrejaParaBuscar === "Carregando...") return;

    setCarregandoMapa(true);
    try {
      const { data, error } = await supabase
        .from("mapa_palco")
        .select("*")
        .eq("nome_igreja", igrejaParaBuscar)
        .order("canal", { ascending: true });

      if (!error && data) setCanaisMapa(data);
    } catch (err) {
      console.error("Erro ao carregar mapa de palco:", err);
    } finally {
      setCarregandoMapa(false);
    }
  };

  const carregarEscalaEquipe = async (listaId) => {
    if (!listaId) return setEscalaCulto([]);
    setCarregandoEscala(true);
    try {
      const { data, error } = await supabase
        .from("escala_equipe")
        .select("*")
        .eq("lista_id", listaId)
        .eq("nome_igreja", nomeIgreja)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setEscalaCulto(data);
        setTemAlteracoesPendentes(false);
      }
    } catch (err) {
      console.error("Erro ao carregar escala da equipe:", err);
    } finally {
      setCarregandoEscala(false);
    }
  };

  const podeCriar = userRole === "super_admin" || userRole === "church_admin";
  const isSuper = userRole === "super_admin";

  const carregarNomeIgreja = async () => {
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
          carregarMapaPalco(data.nome_igreja);
          carregarMembrosCadastrados(data.nome_igreja);
        } else {
          const nomeSalvo = localStorage.getItem("icmlyrics_nome_igreja") || usuarioAtual;
          setNomeIgreja(nomeSalvo);
          carregarMapaPalco(nomeSalvo);
          carregarMembrosCadastrados(nomeSalvo);
        }
      } catch (e) {
        console.error("Erro ao buscar igreja autorizada:", e);
      } finally {
        setCarregandoIgreja(false);
      }
    }
  };

  const buscarHistoricoListas = async () => {
    setCarregandoHistorico(true);
    try {
      const { data, error } = await supabase
        .from("listas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) setHistoricoListas(data);
    } catch (err) {
      console.error("Erro ao buscar histórico de listas:", err);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const handleImportarDoHistorico = (item) => {
    const listaId = item.id;
    const dataRaw = item.data || item.created_at?.split("T")[0];

    setCultoSelecionadoInfo({
      id: listaId,
      titulo: item.titulo || item.assunto || item.tipo_culto || "Culto / Evento Geral",
      data: formatarDataComDiaSemana(dataRaw),
      responsavel: item.responsavel || item.autor || "Não informado",
      tipo: item.tipo_culto || item.evento || "Culto"
    });

    carregarEscalaEquipe(listaId);
    setMostrarBotaoPadrao(true);
    setMostrarModalHistorico(false);
  };

  const handleCarregarEquipePadrao = async () => {
    if (!podeCriar) return;
    if (!cultoSelecionadoInfo.id) {
      return alert("Selecione primeiro um culto no botão 'Cultos' para vincular a equipe padrão.");
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
        cargo: membro.funcao_padrao || "Geral",
        nome: membro.nome,
        nome_igreja: nomeIgreja
      }));

      setEscalaCulto((prev) => [...prev, ...novosItensLocais]);
      setTemAlteracoesPendentes(true);
    } catch (err) {
      console.error("Erro ao puxar equipe padrão:", err);
    }
  };

  const handleAdicionarItemEscalaLocal = (e) => {
    e.preventDefault();
    if (!podeCriar) return alert("Apenas administradores podem alterar a escala.");
    if (!formEscala.cargo.trim() && !formEscala.nome.trim()) return alert("Preencha a função e o nome do integrante.");

    if (editandoEscalaId) {
      setEscalaCulto((prev) =>
        prev.map((item) =>
          item.id === editandoEscalaId
            ? { ...item, cargo: formEscala.cargo.trim() || "Geral", nome: formEscala.nome.trim() || "A definir" }
            : item
        )
      );
      setEditandoEscalaId(null);
    } else {
      const novoItem = {
        id: `temp_${Date.now()}`,
        lista_id: cultoSelecionadoInfo.id,
        cargo: formEscala.cargo.trim() || "Geral",
        nome: formEscala.nome.trim() || "A definir",
        nome_igreja: nomeIgreja
      };
      setEscalaCulto((prev) => [...prev, novoItem]);

      if (salvarNovoNoBanco && formEscala.nome.trim()) {
        supabase.from("membros_equipe").insert([{
          nome: formEscala.nome.trim(),
          funcao_padrao: formEscala.cargo.trim() || "",
          equipe_padrao: false,
          nome_igreja: nomeIgreja
        }]).then(() => carregarMembrosCadastrados(nomeIgreja));
      }
    }

    setFormEscala({ cargo: "", nome: "" });
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
    setEscalaCulto([]);
    setTemAlteracoesPendentes(true);
  };

  const handleCancelarEscala = () => {
    setEscalaCulto([]);
    setCultoSelecionadoInfo({
      id: null,
      titulo: "",
      data: "",
      responsavel: "",
      tipo: ""
    });
    setMostrarBotaoPadrao(false);
    setMostrarFormAdicionar(false);
    setTemAlteracoesPendentes(false);
  };

  const handleExcluirEscalaDoCulto = async () => {
    if (!podeCriar) return;
    if (!cultoSelecionadoInfo.id) return alert("Nenhum culto selecionado.");

    if (!window.confirm("Deseja realmente apagar a escala deste culto do banco de dados? (A lista principal do culto não será excluída).")) {
      return;
    }

    setSalvandoEscala(true);
    try {
      const { error } = await supabase
        .from("escala_equipe")
        .delete()
        .eq("lista_id", cultoSelecionadoInfo.id)
        .eq("nome_igreja", nomeIgreja);

      if (error) throw error;

      handleCancelarEscala();
      alert("Escala removida do banco de dados com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir escala do banco:", err);
      alert("Erro ao apagar escala do banco de dados.");
    } finally {
      setSalvandoEscala(false);
    }
  };

  const handleSalvarEscalaBanco = async () => {
    if (!cultoSelecionadoInfo.id) return alert("Nenhum culto selecionado.");
    setSalvandoEscala(true);

    try {
      await supabase
        .from("escala_equipe")
        .delete()
        .eq("lista_id", cultoSelecionadoInfo.id)
        .eq("nome_igreja", nomeIgreja);

      if (escalaCulto.length > 0) {
        const payload = escalaCulto.map((item) => ({
          lista_id: cultoSelecionadoInfo.id,
          cargo: item.cargo,
          nome: item.nome,
          nome_igreja: nomeIgreja
        }));

        const { error } = await supabase.from("escala_equipe").insert(payload);
        if (error) throw error;
      }

      setTemAlteracoesPendentes(false);
      alert("Escala salva com sucesso!");
      carregarEscalaEquipe(cultoSelecionadoInfo.id);
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
            equipe_padrao: formMembroModal.equipe_padrao
          })
          .eq("id", formMembroModal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("membros_equipe")
          .insert([{
            nome: formMembroModal.nome.trim(),
            equipe_padrao: formMembroModal.equipe_padrao,
            nome_igreja: nomeIgreja
          }]);

        if (error) throw error;
      }

      setFormMembroModal({ id: null, nome: "", equipe_padrao: false });
      carregarMembrosCadastrados(nomeIgreja);
    } catch (err) {
      console.error("Erro ao salvar membro no banco:", err);
    }
  };

  const handleAtualizarFuncaoMembro = async (membroId, novaFuncao) => {
    if (!podeCriar) return;
    try {
      const { error } = await supabase
        .from("membros_equipe")
        .update({ funcao_padrao: novaFuncao })
        .eq("id", membroId);

      if (!error) carregarMembrosCadastrados(nomeIgreja);
    } catch (err) {
      console.error("Erro ao atualizar função do membro:", err);
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

  const handleSalvarCanal = async () => {
    if (!podeCriar) return alert("Apenas administradores podem gerenciar o mapa de palco.");
    if (!novoCanal.canal || !novoCanal.funcao) return alert("Preencha os campos obrigatórios (Canal e Função).");

    try {
      if (editandoCanalId) {
        const { error } = await supabase
          .from("mapa_palco")
          .update({ ...novoCanal, nome_igreja: nomeIgreja })
          .eq("id", editandoCanalId)
          .eq("nome_igreja", nomeIgreja);

        if (error) throw error;
        setEditandoCanalId(null);
      } else {
        const { error } = await supabase.from("mapa_palco").insert([{ ...novoCanal, nome_igreja: nomeIgreja }]);
        if (error) throw error;
      }

      setNovoCanal({ canal: "", funcao: "", microfone: "", retorno: "" });
      carregarMapaPalco(nomeIgreja);
    } catch (err) {
      console.error("Erro ao salvar canal:", err);
    }
  };

  const handleDeletarCanal = async (id) => {
    if (!podeCriar) return;
    if (!window.confirm("Deseja remover este canal do mapa de palco?")) return;

    try {
      const { error } = await supabase
        .from("mapa_palco")
        .delete()
        .eq("id", id)
        .eq("nome_igreja", nomeIgreja);

      if (!error) carregarMapaPalco(nomeIgreja);
    } catch (err) {
      console.error("Erro ao deletar canal:", err);
    }
  };

  const rowsParaPreview = escalaCulto.map((item) => ({
    id: item.id,
    type: "louvor",
    categoria: item.cargo,
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
            <button
              onClick={() => setAbaAtiva("escala")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                abaAtiva === "escala" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Escala
            </button>

            <button
              onClick={() => setAbaAtiva("mapa")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                abaAtiva === "mapa" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Mapa de Palco
            </button>
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

      <div className="px-4 mt-4 space-y-4 flex-1">
        {abaAtiva === "escala" && (
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
                  onClick={() => { buscarHistoricoListas(); setMostrarModalHistorico(true); }}
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold gap-1.5 border-slate-200 px-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">Cultos</span>
                </Button>

                {mostrarBotaoPadrao && (
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
                  <p className="text-xs text-slate-500 text-center py-2">Nenhum registro encontrado.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {historicoListas.map((item) => {
                      const dataFormatada = formatarDataComDiaSemana(item.data || item.created_at);
                      const tipoEvento = item.tipo_culto || item.evento || item.titulo || item.assunto || "Culto";
                      const responsavel = item.responsavel || item.autor || "Geral";

                      return (
                        <div 
                          key={item.id}
                          onClick={() => handleImportarDoHistorico(item)}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{dataFormatada}</p>
                            <p className="text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-700">{tipoEvento}</span> • Resp: {responsavel}
                            </p>
                          </div>
                          <span className="text-[10px] bg-slate-800 text-white font-bold px-2 py-1 rounded-lg">Selecionar</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div ref={cardEscalaRef} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              {cultoSelecionadoInfo.id && (
                <div className="flex justify-between items-start gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {cultoSelecionadoInfo.tipo}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{cultoSelecionadoInfo.titulo}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                      <div><span className="text-slate-400">Data:</span> <strong className="text-slate-800">{cultoSelecionadoInfo.data}</strong></div>
                      <div><span className="text-slate-400">Responsável:</span> <strong className="text-slate-800">{cultoSelecionadoInfo.responsavel}</strong></div>
                    </div>
                  </div>

                  {podeCriar && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMostrarFormAdicionar(!mostrarFormAdicionar)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all flex items-center gap-1.5 shadow-sm text-xs font-bold cursor-pointer"
                        title={mostrarFormAdicionar ? "Recolher formulário" : "Adicionar participante à escala"}
                      >
                        {mostrarFormAdicionar ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {mostrarFormAdicionar && podeCriar && (
                <form onSubmit={handleAdicionarItemEscalaLocal} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {editandoEscalaId ? "Alterar Função na Escala" : "Adicionar Participante à Escala"}
                    </span>

                    {membrosCadastrados.length > 0 && !editandoEscalaId && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Puxar do banco:</span>
                        <select
                          onChange={(e) => {
                            const membro = membrosCadastrados.find(m => m.id === Number(e.target.value));
                            if (membro) {
                              setFormEscala({
                                cargo: membro.funcao_padrao || formEscala.cargo,
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
                              {membro.nome} {membro.funcao_padrao ? `(${membro.funcao_padrao})` : ""} {membro.equipe_padrao ? "★" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400">Atalhos de Funções:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {funcoesFrequentes.map((funcao) => (
                        <button
                          key={funcao}
                          type="button"
                          onClick={() => setFormEscala({ ...formEscala, cargo: funcao })}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            formEscala.cargo === funcao
                              ? "bg-slate-800 text-white border-slate-800 font-bold"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {funcao}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    <Input 
                      placeholder="Função (ex: Teclado, Regente, Som)" 
                      value={formEscala.cargo}
                      onChange={(e) => setFormEscala({ ...formEscala, cargo: e.target.value })}
                      className="h-9 text-xs bg-white"
                    />
                    <Input 
                      placeholder="Nome do integrante" 
                      value={formEscala.nome}
                      onChange={(e) => setFormEscala({ ...formEscala, nome: e.target.value })}
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  {!editandoEscalaId && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <input 
                        type="checkbox" 
                        id="salvarNoBancoCheck"
                        checked={salvarNovoNoBanco}
                        onChange={(e) => setSalvarNovoNoBanco(e.target.checked)}
                        className="rounded border-slate-300 text-slate-800 focus:ring-slate-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <label htmlFor="salvarNoBancoCheck" className="text-[11px] text-slate-500 cursor-pointer select-none">
                        Salvar também este nome no Banco de Membros
                      </label>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" className="w-full h-9 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer">
                      {editandoEscalaId ? "Alterar Item na Lista" : "Adicionar à Lista"}
                    </Button>
                    {editandoEscalaId && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setEditandoEscalaId(null);
                          setFormEscala({ cargo: "", nome: "" });
                        }}
                        className="h-9 text-xs cursor-pointer"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              )}

              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Membros Escalados ({escalaCulto.length})
                  </span>

                  {escalaCulto.length > 0 && podeCriar && (
                    <button
                      type="button"
                      onClick={handleLimparMembrosEscalados}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Limpar visualização local dos membros"
                    >
                      <Trash2 className="w-3 h-3" /> Limpar Membros
                    </button>
                  )}
                </div>
                
                {carregandoEscala ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>
                ) : escalaCulto.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Puxe um culto no botão 'Cultos' ou clique em 'Padrão' para preencher automaticamente.
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {escalaCulto.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-600 font-bold text-[11px] uppercase block">{item.cargo}</span>
                          <span className="font-semibold text-slate-800 text-sm">{item.nome}</span>
                        </div>
                        
                        {podeCriar && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setEditandoEscalaId(item.id);
                                setFormEscala({ cargo: item.cargo, nome: item.nome });
                                setMostrarFormAdicionar(true);
                              }}
                              className="p-1.5 bg-slate-200/60 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Alterar nome/função na escala"
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

            {cultoSelecionadoInfo.id && escalaCulto.length > 0 && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                {podeCriar && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSalvarEscalaBanco}
                      disabled={salvandoEscala}
                      className={`flex-1 h-10 text-xs font-bold rounded-xl gap-2 cursor-pointer transition-all ${
                        temAlteracoesPendentes 
                          ? "bg-slate-900 hover:bg-slate-800 text-white shadow-md animate-pulse" 
                          : "bg-slate-800 hover:bg-slate-900 text-white"
                      }`}
                    >
                      {salvandoEscala ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 text-emerald-400" />
                      )}
                      {temAlteracoesPendentes ? "Salvar Escala no Banco *" : "Salvar Escala"}
                    </Button>

                    <Button
                      onClick={handleExcluirEscalaDoCulto}
                      disabled={salvandoEscala}
                      variant="outline"
                      className="h-10 border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-3 rounded-xl cursor-pointer"
                      title="Apagar escala deste culto no banco de dados"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Compartilhar / Exportar Escala
                  </span>
                  
                  <div className="flex flex-col gap-2">
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

                    <Button
                      onClick={handleCancelarEscala}
                      variant="outline"
                      className="h-9 border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs w-full"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {modalMembrosAberto && (
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
                    setFormMembroModal({ id: null, nome: "", equipe_padrao: false });
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
                        onClick={() => setFormMembroModal({ id: null, nome: "", equipe_padrao: false })}
                        className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                      >
                        Limpar / Novo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 flex items-center">
                      <Input 
                        placeholder="Nome do integrante" 
                        value={formMembroModal.nome}
                        onChange={(e) => setFormMembroModal({ ...formMembroModal, nome: e.target.value })}
                        className="h-9 text-xs bg-white pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setFormMembroModal({ ...formMembroModal, equipe_padrao: !formMembroModal.equipe_padrao })}
                        className="absolute right-2.5 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                        title={formMembroModal.equipe_padrao ? "Marcado como Equipe Padrão" : "Marcar como Equipe Padrão"}
                      >
                        <Star className={`w-4 h-4 ${formMembroModal.equipe_padrao ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                      </button>
                    </div>

                    <Button type="submit" size="sm" className="h-9 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      Salvar
                    </Button>
                  </div>
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

                              <div className="flex items-center gap-1 mt-1">
                                <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                                <select
                                  value={membro.funcao_padrao || ""}
                                  onChange={(e) => handleAtualizarFuncaoMembro(membro.id, e.target.value)}
                                  className="text-[11px] bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 font-medium outline-none focus:ring-1 focus:ring-slate-400 w-full max-w-[170px] cursor-pointer"
                                >
                                  <option value="">Escolher função...</option>
                                  {funcoesFrequentes.map((funcao) => (
                                    <option key={funcao} value={funcao}>
                                      {funcao}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setFormMembroModal({
                                id: membro.id,
                                nome: membro.nome,
                                equipe_padrao: !!membro.equipe_padrao
                              })}
                              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Editar nome"
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

        {abaAtiva === "mapa" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {podeCriar && (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {editandoCanalId ? "Editar Canal" : "Adicionar Canal ao Mapa"}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="Canal (ex: 06)" 
                    value={novoCanal.canal} 
                    onChange={(e) => setNovoCanal({ ...novoCanal, canal: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input 
                    placeholder="Função (ex: Violão)" 
                    value={novoCanal.funcao} 
                    onChange={(e) => setNovoCanal({ ...novoCanal, funcao: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input 
                    placeholder="Microfone / DI" 
                    value={novoCanal.microfone} 
                    onChange={(e) => setNovoCanal({ ...novoCanal, microfone: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input 
                    placeholder="Retorno (ex: Fone P2)" 
                    value={novoCanal.retorno} 
                    onChange={(e) => setNovoCanal({ ...novoCanal, retorno: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSalvarCanal} className="w-full h-8 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer">
                    {editandoCanalId ? "Salvar Alterações do Canal" : "Adicionar Canal ao Mapa"}
                  </Button>
                  {editandoCanalId && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditandoCanalId(null);
                        setNovoCanal({ canal: "", funcao: "", microfone: "", retorno: "" });
                      }}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Configuração de Canais e Palco</h3>
              
              {carregandoMapa ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>
              ) : canaisMapa.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum canal cadastrado no mapa de palco desta igreja.</p>
              ) : (
                <div className="space-y-2.5">
                  {canaisMapa.map((item) => (
                    <div key={item.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center text-[11px]">
                          {item.canal}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">{item.funcao}</p>
                          <p className="text-[10px] text-slate-400">Mic: {item.microfone || "-"} • Retorno: {item.retorno || "-"}</p>
                        </div>
                      </div>
                      
                      {podeCriar && (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => {
                              setNovoCanal({
                                canal: item.canal,
                                funcao: item.funcao,
                                microfone: item.microfone || "",
                                retorno: item.retorno || ""
                              });
                              setEditandoCanalId(item.id);
                            }}
                            className="p-1.5 bg-slate-200/60 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Editar canal"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeletarCanal(item.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Excluir canal"
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
      </div>

      <PreviewModal 
        open={modalPreview.open} 
        onOpenChange={(open) => setModalPreview({ ...modalPreview, open })} 
        mode={modalPreview.mode} 
        rows={rowsParaPreview} 
        dataCulto={cultoSelecionadoInfo.data}
        tipoCulto={cultoSelecionadoInfo.titulo || cultoSelecionadoInfo.tipo}
        responsavel={cultoSelecionadoInfo.responsavel}
        nomeIgreja={nomeIgreja}
      />
    </div>
  );
}