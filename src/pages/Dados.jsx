import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, FileText, Calendar, Cloud, Globe, Shield, Loader2, 
  Save, Plus, Minus, ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

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

// Agrupamento por Categorias
const GRUPOS_CATEGORIAS = [
  {
    titulo: "Cias",
    itens: [
      { key: "criancas", label: "Crianças" },
      { key: "intermediarios", label: "Intermediários" },
      { key: "adolescentes", label: "Adolescentes" }
    ]
  },
  {
    titulo: "Membros",
    itens: [
      { key: "membros_geral", label: "Membros" },
      { key: "jovens", label: "Jovens" }
    ]
  },
  {
    titulo: "Funções",
    itens: [
      { key: "grupo_louvor", label: "Grupo de Louvor" },
      { key: "mesa_projecao", label: "Mesa/ Projeção" },
      { key: "acessibilidade", label: "Acessibilidade" },
      { key: "interprete", label: "Intérprete" }
    ]
  },
  {
    titulo: "Ministério",
    itens: [
      { key: "obreiros", label: "Obreiros" },
      { key: "diaconos", label: "Diáconos" },
      { key: "ungidos", label: "Ungidos" },
      { key: "pastores", label: "Pastores" }
    ]
  },
  {
    titulo: "Visitantes",
    itens: [
      { key: "visitantes_geral", label: "Visitantes" },
      { key: "visitantes_jovens", label: "Jovens" },
      { key: "visitantes_criancas", label: "Crianças" },
      { key: "visitantes_intermediarios", label: "Intermediários" },
      { key: "visitantes_adolescentes", label: "Adolescentes" }
    ]
  }
];

const VALORES_INICIAIS = GRUPOS_CATEGORIAS.reduce((acc, grupo) => {
  grupo.itens.forEach((item) => {
    acc[item.key] = 0;
  });
  return acc;
}, {});

export default function Dados() {
  const navigate = useNavigate();

  // Autenticação e Permissões
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [userRole, setUserRole] = useState("user");
  const [carregandoIgreja, setCarregandoIgreja] = useState(false);
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const temNuvem = userNuvem.trim() !== "";
  const isSuper = userRole === "super_admin";

  // Culto Selecionado e Histórico
  const [historicoListas, setHistoricoListas] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [mostrarModalHistorico, setMostrarModalHistorico] = useState(false);
  const [cultoSelecionadoInfo, setCultoSelecionadoInfo] = useState({
    id: null,
    titulo: "",
    data: "",
    tipo: ""
  });

  // Responsáveis
  const [obreiroPorta, setObreiroPorta] = useState("");
  const [irmaoLouvor, setIrmaoLouvor] = useState("");
  const [irmaoPalavra, setIrmaoPalavra] = useState("");

  // Quantitativos
  const [quantitativos, setQuantitativos] = useState(VALORES_INICIAIS);
  const [salvandoDados, setSalvandoDados] = useState(false);

  // Estado das Sanfonas/Accordions (iniciam fechadas)
  const [gruposAbertos, setGruposAbertos] = useState({});

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
        if (data.length > 0 && !cultoSelecionadoInfo.id) {
          selecionarCulto(data[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar histórico de listas:", err);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const selecionarCulto = async (item) => {
    if (!temNuvem || !item) return;
    const dataRaw = item.data_culto || item.data || item.created_at?.split("T")[0];
    const tipoCultoInformado = item.tipo_culto || item.evento || item.titulo || item.assunto || "";

    setCultoSelecionadoInfo({
      id: item.id,
      titulo: tipoCultoInformado ? `Culto de ${tipoCultoInformado}` : "Culto / Evento Geral",
      data: formatarDataComDiaSemana(dataRaw),
      tipo: tipoCultoInformado
    });

    // Responsável pelo Louvor (Vem prioritariamente da tabela 'listas.responsavel')
    const louvorEncontrado = item.responsavel || item.irmao_louvor || item.louvor || item.autor || "";
    setIrmaoLouvor(louvorEncontrado);

    // Valores padrão diretos do item da lista
    let palavraEncontrada = item.irmao_palavra || item.palavra || item.pregador || "";
    let obreiroEncontrado = item.obreiro_porta || item.obreiro || item.porta || "";

    // Busca detalhada na tabela 'escala_equipe' vinculada pelo lista_id
    try {
      const { data: equipeData, error: equipeError } = await supabase
        .from("escala_equipe")
        .select("*")
        .eq("lista_id", item.id);

      if (!equipeError && equipeData && equipeData.length > 0) {
        // Busca pessoa escalada para a Palavra
        const membroPalavra = equipeData.find((m) => {
          const cargoStr = (m.cargo || m.funcao || m.categoria || "").toLowerCase();
          return cargoStr.includes("palavra") || cargoStr.includes("pregador") || cargoStr.includes("pregação") || cargoStr.includes("ministra");
        });
        if (membroPalavra && membroPalavra.nome) {
          palavraEncontrada = membroPalavra.nome;
        }

        // Busca pessoa escalada para Obreiro / Porta
        const membroPorta = equipeData.find((m) => {
          const cargoStr = (m.cargo || m.funcao || m.categoria || "").toLowerCase();
          return cargoStr.includes("porta") || cargoStr.includes("recepção") || cargoStr.includes("obreiro");
        });
        if (membroPorta && membroPorta.nome) {
          obreiroEncontrado = membroPorta.nome;
        }
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes da equipe:", err);
    }

    setIrmaoPalavra(palavraEncontrada);
    setObreiroPorta(obreiroEncontrado);

    if (item.quantitativo && typeof item.quantitativo === "object") {
      setQuantitativos({ ...VALORES_INICIAIS, ...item.quantitativo });
    } else {
      setQuantitativos(VALORES_INICIAIS);
    }

    setMostrarModalHistorico(false);
  };

  const carregarNomeIgreja = async () => {
    if (!temNuvem) return;
    setCarregandoIgreja(true);
    const usuarioAtual = userNuvem || usuarioLocal;
    try {
      const { data, error } = await supabase
        .from("igrejas_autorizadas")
        .select("nome_igreja")
        .eq("usuario", usuarioAtual)
        .maybeSingle();
      if (!error && data && data.nome_igreja) {
        setNomeIgreja(data.nome_igreja);
      }
    } catch (e) {
      console.error("Erro ao sincronizar dados da igreja:", e);
    } finally {
      setCarregandoIgreja(false);
    }
  };

  const handleAlterarQuantidade = (key, delta) => {
    setQuantitativos((prev) => ({
      ...prev,
      [key]: Math.max(0, (Number(prev[key]) || 0) + delta)
    }));
  };

  const handleInputChangeCount = (key, valor) => {
    const num = parseInt(valor, 10);
    setQuantitativos((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  const toggleGrupo = (titulo) => {
    setGruposAbertos((prev) => ({
      ...prev,
      [titulo]: !prev[titulo]
    }));
  };

  const calcularSubtotalGrupo = (itens) => {
    return itens.reduce((acc, item) => acc + (Number(quantitativos[item.key]) || 0), 0);
  };

  const totalFrequencia = Object.values(quantitativos).reduce(
    (acc, curr) => acc + (Number(curr) || 0), 0
  );

  const handleSalvarDados = async () => {
    if (!cultoSelecionadoInfo.id) {
      return alert("Selecione um culto primeiro para salvar os dados.");
    }

    setSalvandoDados(true);
    try {
      const payload = {
        obreiro_porta: obreiroPorta || "",
        responsavel: irmaoLouvor || "",
        irmao_louvor: irmaoLouvor || "",
        louvor: irmaoLouvor || "",
        palavra: irmaoPalavra || "",
        irmao_palavra: irmaoPalavra || "",
        quantitativo: quantitativos
      };

      const { error } = await supabase
        .from("listas")
        .update(payload)
        .eq("id", cultoSelecionadoInfo.id);

      if (error) throw error;

      alert("Dados do culto salvos com sucesso!");
      buscarHistoricoListas();
    } catch (err) {
      console.error("Erro ao salvar dados do culto:", err);
      alert("Erro ao salvar os dados.");
    } finally {
      setSalvandoDados(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col font-['Inter',sans-serif]">
      {/* Topbar */}
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
                <FileText className="w-5 h-5 text-slate-300" /> Dados do Culto
              </h1>
              <p className="text-slate-400 text-xs">Registro de responsáveis e frequência</p>
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
                    onClick={carregarNomeIgreja}
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
      </div>

      {/* Conteúdo Principal */}
      <div className="px-4 mt-4 space-y-4 flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {!temNuvem ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center shadow-sm space-y-3 my-auto w-full">
            <Cloud className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Nenhuma Nuvem Conectada</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Você precisa estar conectado a uma nuvem para carregar e salvar os dados do culto.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Seletor de Culto */}
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {cultoSelecionadoInfo.id ? cultoSelecionadoInfo.data : "Selecione um Culto"}
                </span>
              </div>
              <Button 
                onClick={() => { buscarHistoricoListas(); setMostrarModalHistorico(true); }}
                disabled={carregandoHistorico}
                size="sm"
                variant="outline"
                className="h-8 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold gap-1.5 px-3 cursor-pointer border-slate-700"
              >
                {carregandoHistorico ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Puxar Histórico</span>
              </Button>
            </div>

            {/* Modal de Histórico */}
            {mostrarModalHistorico && (
              <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Selecione um Culto para Carregar</h4>
                  <button onClick={() => setMostrarModalHistorico(false)} className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer">Fechar</button>
                </div>
                {carregandoHistorico ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>
                ) : historicoListas.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">Nenhum registro encontrado nesta nuvem.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {historicoListas.map((item) => {
                      const dataFormatada = formatarDataComDiaSemana(item.data_culto || item.data || item.created_at);
                      const tipoCultoStr = item.tipo_culto || item.evento || item.titulo || item.assunto || "";
                      const louvor = item.responsavel || item.irmao_louvor || item.louvor || item.autor || "Não informado";
                      return (
                        <div 
                          key={item.id}
                          onClick={() => selecionarCulto(item)}
                          className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800">{dataFormatada}</p>
                              {tipoCultoStr && (
                                <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase">
                                  {tipoCultoStr}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Louvor: <span className="font-semibold text-slate-700">{louvor}</span>
                            </p>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-bold px-2.5 py-1 rounded-lg">Carregar</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Card de Responsáveis */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Responsáveis do Culto
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {cultoSelecionadoInfo.titulo || "Informações do Serviço"}
                  </h3>
                </div>
                {cultoSelecionadoInfo.tipo && (
                  <span className="bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-lg">
                    {cultoSelecionadoInfo.tipo}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Obreiro à Porta
                  </label>
                  <Input 
                    type="text"
                    value={obreiroPorta || ""}
                    onChange={(e) => setObreiroPorta(e.target.value)}
                    placeholder="Nome do obreiro na porta"
                    className="h-9 text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Irmão com o Louvor
                    </label>
                    <Input 
                      type="text"
                      value={irmaoLouvor || ""}
                      onChange={(e) => setIrmaoLouvor(e.target.value)}
                      placeholder="Responsável pelo louvor"
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Irmão com a Palavra
                    </label>
                    <Input 
                      type="text"
                      value={irmaoPalavra || ""}
                      onChange={(e) => setIrmaoPalavra(e.target.value)}
                      placeholder="Responsável pela palavra"
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quantitativos em Sanfona (Accordion) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Frequência
                  </span>
                  <h3 className="text-base font-bold text-slate-900">Quantitativo por Categoria</h3>
                </div>
                <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-300 block">Total Geral</span>
                  <span className="text-base font-extrabold">{totalFrequencia}</span>
                </div>
              </div>

              {/* Sanfona / Accordion das Categorias */}
              <div className="space-y-2.5">
                {GRUPOS_CATEGORIAS.map((grupo) => {
                  const estaAberto = !!gruposAbertos[grupo.titulo];
                  const subtotal = calcularSubtotalGrupo(grupo.itens);

                  return (
                    <div 
                      key={grupo.titulo} 
                      className="border border-slate-200/90 rounded-xl overflow-hidden transition-all bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGrupo(grupo.titulo)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            {grupo.titulo}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded-full">
                            {subtotal}
                          </span>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                            estaAberto ? "rotate-180" : ""
                          }`} 
                        />
                      </button>

                      {estaAberto && (
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-200/80 bg-white animate-in fade-in duration-150">
                          {grupo.itens.map((item) => (
                            <div 
                              key={item.key} 
                              className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80"
                            >
                              <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAlterarQuantidade(item.key, -1)}
                                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input 
                                  type="number"
                                  min="0"
                                  value={quantitativos[item.key] ?? 0}
                                  onChange={(e) => handleInputChangeCount(item.key, e.target.value)}
                                  className="w-11 h-7 text-center font-bold text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAlterarQuantidade(item.key, 1)}
                                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ação de Salvar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <Button
                onClick={handleSalvarDados}
                disabled={salvandoDados}
                className="w-full h-11 text-xs font-bold rounded-xl gap-2 cursor-pointer transition-all bg-slate-900 hover:bg-slate-800 text-white shadow-md"
              >
                {salvandoDados ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-emerald-400" />
                )}
                Salvar Dados do Culto
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}