import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Cloud, Monitor, Smartphone, Music, BookOpen, 
  Megaphone, Shield, Globe, Loader2, 
  EyeOff, Check, X, Filter, ChevronRight, ChevronLeft, CheckSquare, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

const normalizarTexto = (texto) =>
  String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"¡!¿]/g, "") 
    .trim();

const VERSOES_DISPONIVEIS = [
  { id: 'arc', nome: 'ARC', extenso: 'Almeida Revista e Corrigida' },
  { id: 'acf', nome: 'ACF', extenso: 'Almeida Corrigida Fiel' },
  { id: 'ara', nome: 'ARA', extenso: 'Almeida Revista e Atualizada' },
  { id: 'aa', nome: 'AA', extenso: 'Almeida Antiga' },
  { id: 'ntlh', nome: 'NTLH', extenso: 'Nova Tradução na Ling. de Hoje' },
  { id: 'nvi', nome: 'NVI', extenso: 'Nova Versão Internacional' }
];

const LIVROS_MAPA = {
  'AT': [
    { abbrev: 'gn', nome: 'Gênesis', caps: 50 },
    { abbrev: 'ex', nome: 'Êxodo', caps: 40 },
    { abbrev: 'lv', nome: 'Levítico', caps: 27 },
    { abbrev: 'nm', nome: 'Números', caps: 36 },
    { abbrev: 'dt', nome: 'Deuteronômio', caps: 34 },
    { abbrev: 'js', nome: 'Josué', caps: 24 },
    { abbrev: 'jz', nome: 'Juízes', caps: 21 },
    { abbrev: 'rt', nome: 'Rute', caps: 4 },
    { abbrev: '1sm', nome: '1 Samuel', caps: 31 },
    { abbrev: '2sm', nome: '2 Samuel', caps: 24 },
    { abbrev: '1rs', nome: '1 Reis', caps: 22 },
    { abbrev: '2rs', nome: '2 Reis', caps: 25 },
    { abbrev: '1cr', nome: '1 Crônicas', caps: 29 },
    { abbrev: '2cr', nome: '2 Crônicas', caps: 36 },
    { abbrev: 'ed', nome: 'Esdras', caps: 10 },
    { abbrev: 'ne', nome: 'Neemias', caps: 13 },
    { abbrev: 'et', nome: 'Ester', caps: 10 },
    { abbrev: 'job', nome: 'Jó', caps: 42 },
    { abbrev: 'sl', nome: 'Salmos', caps: 150 },
    { abbrev: 'pv', nome: 'Provérbios', caps: 31 },
    { abbrev: 'ec', nome: 'Eclesiastes', caps: 12 },
    { abbrev: 'ct', nome: 'Cantares', caps: 8 },
    { abbrev: 'is', nome: 'Isaías', caps: 66 },
    { abbrev: 'jr', nome: 'Jeremias', caps: 52 },
    { abbrev: 'lm', nome: 'Lamentações', caps: 5 },
    { abbrev: 'ez', nome: 'Ezequiel', caps: 48 },
    { abbrev: 'dn', nome: 'Daniel', caps: 12 },
    { abbrev: 'os', nome: 'Oseias', caps: 14 },
    { abbrev: 'jl', nome: 'Joel', caps: 3 },
    { abbrev: 'am', nome: 'Amós', caps: 9 },
    { abbrev: 'ob', nome: 'Obadias', caps: 1 },
    { abbrev: 'jn', nome: 'Jonas', caps: 4 },
    { abbrev: 'mq', nome: 'Miqueias', caps: 7 },
    { abbrev: 'na', nome: 'Naum', caps: 3 },
    { abbrev: 'hc', nome: 'Habacuque', caps: 3 },
    { abbrev: 'sf', nome: 'Sofonias', caps: 3 },
    { abbrev: 'ag', nome: 'Ageu', caps: 2 },
    { abbrev: 'zc', nome: 'Zacarias', caps: 14 },
    { abbrev: 'ml', nome: 'Malaquias', caps: 4 }
  ],
  'NT': [
    { abbrev: 'mt', nome: 'Mateus', caps: 28 },
    { abbrev: 'mc', nome: 'Marcos', caps: 16 },
    { abbrev: 'lc', nome: 'Lucas', caps: 24 },
    { abbrev: 'jo', nome: 'João', caps: 21 },
    { abbrev: 'at', nome: 'Atos', caps: 28 },
    { abbrev: 'rm', nome: 'Romanos', caps: 16 },
    { abbrev: '1co', nome: '1 Coríntios', caps: 16 },
    { abbrev: '2co', nome: '2 Coríntios', caps: 13 },
    { abbrev: 'gl', nome: 'Gálatas', caps: 6 },
    { abbrev: 'ef', nome: 'Efésios', caps: 6 },
    { abbrev: 'fp', nome: 'Filipenses', caps: 4 },
    { abbrev: 'cl', nome: 'Colossenses', caps: 4 },
    { abbrev: '1ts', nome: '1 Tessalonicenses', caps: 5 },
    { abbrev: '2ts', nome: '2 Tessalonicenses', caps: 3 },
    { abbrev: '1tm', nome: '1 Timóteo', caps: 6 },
    { abbrev: '2tm', nome: '2 Timóteo', caps: 4 },
    { abbrev: 'tt', nome: 'Tito', caps: 3 },
    { abbrev: 'fm', nome: 'Filemom', caps: 1 },
    { abbrev: 'hb', nome: 'Hebreus', caps: 13 },
    { abbrev: 'tg', nome: 'Tiago', caps: 5 },
    { abbrev: '1pe', nome: '1 Pedro', caps: 5 },
    { abbrev: '2pe', nome: '2 Pedro', caps: 3 },
    { abbrev: '1jo', nome: '1 João', caps: 5 },
    { abbrev: '2jo', nome: '2 João', caps: 1 },
    { abbrev: '3jo', nome: '3 João', caps: 1 },
    { abbrev: 'jd', nome: 'Judas', caps: 1 },
    { abbrev: 'ap', nome: 'Apocalipse', caps: 22 }
  ]
};

const TODOS_LIVROS = [...LIVROS_MAPA.AT, ...LIVROS_MAPA.NT];

export default function PainelControle() {
  const navigate = useNavigate();

  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";

  const [modoAtivo, setModoAtivo] = useState("louvor");

  const [louvorBusca, setLouvorBusca] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [louvoresLista, setLouvoresLista] = useState([]);
  const [louvoresResultado, setLouvoresResultado] = useState([]);
  const [louvorSelecionado, setLouvorSelecionado] = useState(null);
  const [estrofeAtiva, setEstrofeAtiva] = useState(0);

  const [paginaLouvores, setPaginaLouvores] = useState(0);
  const [carregandoMaisLouvores, setCarregandoMaisLouvores] = useState(false);
  const [temMaisLouvores, setTemMaisLouvores] = useState(true);
  const ITENS_POR_PAGINA = 50;

  const [livroSelecionado, setLivroSelecionado] = useState(TODOS_LIVROS[0]);
  const [capituloSelecionado, setCapituloSelecionado] = useState(1);
  const [versiculosDisponiveis, setVersiculosDisponiveis] = useState([]);
  const [carregandoVersiculos, setCarregandoVersiculos] = useState(false);

  const [modoMultisselecao, setModoMultisselecao] = useState(false);
  const [versiculosSelecionados, setVersiculosSelecionados] = useState([]);

  const [versaoSelecionada, setVersaoSelecionada] = useState(() => {
    const usuarioAtual = localStorage.getItem("icmlyrics_user") || "comum";
    return localStorage.getItem(`icmlyrics_biblia_versao_favorita_${usuarioAtual}`) || 
           localStorage.getItem("icmlyrics_biblia_versao_favorita") || "arc";
  });

  const [bibliaAtiva, setBibliaAtiva] = useState(null);

  const [projecaoAtualInfo, setProjecaoAtualInfo] = useState({ tipo: "Nenhum", titulo: "Aguardando...", texto: "" });

  const [avisoTexto, setAvisoTexto] = useState("");
  const [notificacao, setNotificacao] = useState("");

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
        setUserRole(localStorage.getItem("icmlyrics_role") || "user");
      } finally {
        setCarregandoValidacao(false);
      }
    };
    validarAcesso();
  }, [userNuvem]);

  useEffect(() => {
    setPaginaLouvores(0);
    setTemMaisLouvores(true);
    carregarLouvoresPorCategoria(filterCategoria, 0, true);
  }, [filterCategoria]);

  const carregarLouvoresPorCategoria = async (cat, pagina = 0, substituir = false) => {
    try {
      if (pagina > 0) setCarregandoMaisLouvores(true);
      const inicio = pagina * ITENS_POR_PAGINA;
      const fim = inicio + ITENS_POR_PAGINA - 1;

      let query = supabase
        .from("louvores")
        .select("*")
        .order("numero", { ascending: true, nullsLast: true })
        .range(inicio, fim);

      if (cat !== "all") {
        query = query.eq("categoria", cat);
      }

      const { data } = await query;
      if (data) {
        if (data.length < ITENS_POR_PAGINA) {
          setTemMaisLouvores(false);
        }
        if (substituir) {
          setLouvoresLista(data);
        } else {
          setLouvoresLista(prev => [...prev, ...data]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregandoMaisLouvores(false);
    }
  };

  const lidarComScrollListaLouvores = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !carregandoMaisLouvores && temMaisLouvores && !louvorBusca) {
      const proximaPagina = paginaLouvores + 1;
      setPaginaLouvores(proximaPagina);
      carregarLouvoresPorCategoria(filterCategoria, proximaPagina, false);
    }
  };

  useEffect(() => {
    if (livroSelecionado && capituloSelecionado) {
      carregarVersiculosSidebar(livroSelecionado, capituloSelecionado, versaoSelecionada);
    }
  }, [livroSelecionado, capituloSelecionado, versaoSelecionada]);

  const carregarVersiculosSidebar = async (livroObj, cap, versao) => {
    setCarregandoVersiculos(true);
    try {
      const { data, error } = await supabase
        .from("versiculos")
        .select("versiculo, texto")
        .eq("book_abbrev", livroObj.abbrev)
        .eq("capitulo", cap)
        .eq("versao", versao)
        .order("versiculo", { ascending: true });

      if (error) throw error;
      const versiculosCarregados = data || [];
      setVersiculosDisponiveis(versiculosCarregados);
      setVersiculosSelecionados([]);

      setBibliaAtiva({
        livroNome: livroObj.nome,
        cap: cap,
        versiculos: versiculosCarregados,
        indiceAtivo: 0
      });
    } catch (err) {
      console.error(err);
      setVersiculosDisponiveis([]);
    } finally {
      setCarregandoVersiculos(false);
    }
  };

  const transmitirProjecao = async (dados) => {
    const { error } = await supabase
      .from("projecao_ativa")
      .upsert({
        id: 1,
        tipo: dados.tipo,
        titulo: dados.titulo,
        texto: dados.texto,
        avisoUrgente: dados.avisoUrgente !== undefined ? dados.avisoUrgente : null,
        updated_at: new Date()
      });

    if (error) {
      console.error(error.message);
    } else {
      setProjecaoAtualInfo({ tipo: dados.tipo, titulo: dados.titulo, texto: dados.texto });
      setNotificacao("Enviado para o telão!");
      setTimeout(() => setNotificacao(""), 2000);
    }
  };

  const buscarLouvores = async (termo, categoria = filterCategoria) => {
    setLouvorBusca(termo);
    const termoBruto = (termo || "").trim();

    if (!termoBruto) {
      setPaginaLouvores(0);
      setTemMaisLouvores(true);
      carregarLouvoresPorCategoria(categoria, 0, true);
      setLouvoresResultado([]);
      return;
    }

    const termoNorm = normalizarTexto(termoBruto);
    const eNumero = !isNaN(termoBruto);

    let query = supabase.from("louvores").select("*");
    if (categoria !== "all") {
      query = query.eq("categoria", categoria);
    }

    if (eNumero) {
      query = query.eq("numero", parseInt(termoBruto, 10));
    } else {
      query = query.or(`nome.ilike.%${termoBruto}%,letra_musica.ilike.%${termoBruto}%`);
    }

    const { data } = await query.limit(50);

    if (data) {
      const filtradosESort = data
        .filter((l) => {
          const matchNumero = l.numero && String(l.numero).startsWith(termoBruto);
          const matchNome = normalizarTexto(l.nome).includes(termoNorm);
          const matchLetra = l.letra_musica && normalizarTexto(l.letra_musica).includes(termoNorm);
          return matchNumero || matchNome || matchLetra;
        })
        .sort((a, b) => {
          if (eNumero) {
            const exatoA = String(a.numero) === termoBruto;
            const exatoB = String(b.numero) === termoBruto;
            if (exatoA && !exatoB) return -1;
            if (!exatoA && exatoB) return 1;
          }
          return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
        });

      setLouvoresLista(filtradosESort);
      setLouvoresResultado(filtradosESort.slice(0, 5));
    } else {
      setLouvoresLista([]);
      setLouvoresResultado([]);
    }
  };

  const selecionarLouvor = (louvor) => {
    const estrofes = louvor.letra_musica
      ? louvor.letra_musica.split(/\n\s*\n/).filter((e) => e.trim() !== "")
      : [];
    
    const objetoLouvor = { ...louvor, estrofes };
    setLouvorSelecionado(objetoLouvor);
    setEstrofeAtiva(0);
    setLouvoresResultado([]);

    const tituloFormatado = louvor.numero ? `${louvor.numero} - ${louvor.nome}` : louvor.nome;

    if (estrofes.length > 0) {
      transmitirProjecao({
        tipo: "louvor",
        titulo: tituloFormatado,
        texto: estrofes[0]
      });
    }
  };

  const irParaEstrofe = (index) => {
    if (!louvorSelecionado || !louvorSelecionado.estrofes[index]) return;
    setEstrofeAtiva(index);
    const tituloFormatado = louvorSelecionado.numero ? `${louvorSelecionado.numero} - ${louvorSelecionado.nome}` : louvorSelecionado.nome;
    transmitirProjecao({
      tipo: "louvor",
      titulo: tituloFormatado,
      texto: louvorSelecionado.estrofes[index]
    });
  };

  const selecionarVersiculoBiblia = (indexVersiculo) => {
    const versiculoObj = versiculosDisponiveis[indexVersiculo];
    if (!versiculoObj) return;

    if (modoMultisselecao) {
      const jaSelecionado = versiculosSelecionados.includes(indexVersiculo);
      if (jaSelecionado) {
        setVersiculosSelecionados(prev => prev.filter(i => i !== indexVersiculo));
      } else {
        setVersiculosSelecionados(prev => [...prev, indexVersiculo].sort((a, b) => a - b));
      }
      return;
    }

    const referencia = `${livroSelecionado.nome} ${capituloSelecionado}:${versiculoObj.versiculo} (${versaoSelecionada.toUpperCase()})`;
    
    setBibliaAtiva(prev => ({
      ...prev,
      indiceAtivo: indexVersiculo
    }));

    transmitirProjecao({
      tipo: "biblia",
      titulo: referencia,
      texto: versiculoObj.texto
    });
  };

  const projetarVersiculosSelecionados = () => {
    if (versiculosSelecionados.length === 0) return;
    const ordenados = [...versiculosSelecionados].sort((a, b) => a - b);
    const numsStr = ordenados.map(i => versiculosDisponiveis[i].versiculo).join(", ");
    const referencia = `${livroSelecionado.nome} ${capituloSelecionado}:${numsStr} (${versaoSelecionada.toUpperCase()})`;
    const textoConsolidado = ordenados.map(i => `${versiculosDisponiveis[i].versiculo}. ${versiculosDisponiveis[i].texto}`).join("\n\n");

    transmitirProjecao({
      tipo: "biblia",
      titulo: referencia,
      texto: textoConsolidado
    });
  };

  const irParaVersiculoBiblia = (novoIndice) => {
    if (!bibliaAtiva || !bibliaAtiva.versiculos[novoIndice]) return;
    const vObj = bibliaAtiva.versiculos[novoIndice];
    const referencia = `${bibliaAtiva.livroNome} ${bibliaAtiva.cap}:${vObj.versiculo} (${versaoSelecionada.toUpperCase()})`;

    setBibliaAtiva(prev => ({ ...prev, indiceAtivo: novoIndice }));
    transmitirProjecao({
      tipo: "biblia",
      titulo: referencia,
      texto: vObj.texto
    });
  };

  const isSuper = userRole === "super_admin";

  const ferramentasProjecao = [
    { 
      label: "Telão Principal", 
      icon: Monitor, 
      color: "bg-blue-600", 
      onClick: () => window.open("/projetor/tela-projetor", "_blank") 
    },
    { 
      label: "Visão Ao Vivo", 
      icon: Smartphone, 
      color: "bg-emerald-600", 
      onClick: () => window.open("/projetor/tela-aovivo", "_blank") 
    },
    { 
      label: "Blackout", 
      icon: EyeOff, 
      color: "bg-rose-600", 
      onClick: () => transmitirProjecao({ tipo: "espera", titulo: "ICMlyrics", texto: "Aguardando projeção..." }) 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28 transition-colors relative flex flex-col justify-between">
      
      {notificacao && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 sm:w-5 sm:h-5" /> {notificacao}
        </div>
      )}

      <div>
        <div className="bg-slate-900 dark:bg-slate-900 text-white px-4 sm:px-8 pt-10 pb-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/dashboard")} 
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">Projeção</h1>
          </div>

          <div className="flex flex-col items-end gap-1 text-right max-w-[200px]">
            {carregandoValidacao ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : !userNuvem.trim() ? (
              <Cloud className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
            ) : (
              <>
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 dark:text-slate-300 uppercase truncate w-full">
                  {nomeIgreja}
                </span>
                <div className="flex items-center gap-1.5">
                  <div 
                    className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <span className="text-[9px] sm:text-[10px] uppercase font-bold px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">
                    {isSuper ? (
                      <Globe className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Shield className="w-3 h-3 text-indigo-400" />
                    )}
                    {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
              Telas e Ações Rápidas
            </p>
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {ferramentasProjecao.map((f) => (
                <button 
                  key={f.label} 
                  onClick={f.onClick} 
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-2xl ${f.color} dark:bg-slate-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <f.icon className="w-5 h-5 sm:w-8 sm:h-8 text-white dark:text-slate-200" />
                  </div>
                  <span className="text-xs sm:text-base font-semibold text-slate-700 dark:text-slate-100">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Painel de Operação ao Vivo
            </p>

            <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md gap-2">
              <button
                onClick={() => setModoAtivo("louvor")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  modoAtivo === "louvor"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Music className="w-4 h-4 text-teal-400" /> Ir para Louvor
              </button>
              <button
                onClick={() => setModoAtivo("biblia")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  modoAtivo === "biblia"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <BookOpen className="w-4 h-4 text-white" /> Ir para Bíblia
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              
              <div className="space-y-4 sm:space-y-5">
                
                {modoAtivo === "louvor" ? (
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" /> Buscar Louvor
                    </h3>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar por nome, número ou letra..."
                          value={louvorBusca}
                          onChange={(e) => buscarLouvores(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 font-medium"
                        />
                        {louvorBusca && (
                          <button
                            type="button"
                            onClick={limparBusca}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <Select 
                        value={filterCategoria} 
                        onValueChange={(cat) => {
                          setFilterCategoria(cat);
                          buscarLouvores(louvorBusca, cat);
                        }}
                      >
                        <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl h-9 text-xs font-semibold">
                          <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
                          <SelectItem value="all">Todas as Categorias</SelectItem>
                          <SelectItem value="Avulsos">Avulsos</SelectItem>
                          <SelectItem value="Cias">Cias</SelectItem>
                          <SelectItem value="Coletânea">Coletânea</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Leitura Bíblica (Ir para)
                    </h3>

                    <div className="space-y-2.5">
                      <Select 
                        value={versaoSelecionada} 
                        onValueChange={setVersaoSelecionada}
                      >
                        <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl h-9 text-xs font-semibold">
                          <SelectValue placeholder="Tradução" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
                          {VERSOES_DISPONIVEIS.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.nome} - {v.extenso}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select 
                        value={livroSelecionado.abbrev} 
                        onValueChange={(abbrev) => {
                          const liv = TODOS_LIVROS.find(l => l.abbrev === abbrev);
                          if (liv) {
                            setLivroSelecionado(liv);
                            setCapituloSelecionado(1);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl h-9 text-xs font-semibold">
                          <SelectValue placeholder="Livro" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[220px] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
                          {TODOS_LIVROS.map(l => (
                            <SelectItem key={l.abbrev} value={l.abbrev}>{l.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select 
                        value={String(capituloSelecionado)} 
                        onValueChange={(cap) => setCapituloSelecionado(Number(cap))}
                      >
                        <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl h-9 text-xs font-semibold">
                          <SelectValue placeholder="Capítulo" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[220px] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
                          {Array.from({ length: livroSelecionado.caps }, (_, i) => i + 1).map(c => (
                            <SelectItem key={c} value={String(c)}>Capítulo {c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Feedback ao vivo (no telão)
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      {projecaoAtualInfo.tipo === "biblia" ? "Versículo Ativo" : projecaoAtualInfo.tipo === "louvor" ? "Louvor Ativo" : "Status"}
                    </p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {projecaoAtualInfo.titulo}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 italic leading-relaxed pt-1">
                      "{projecaoAtualInfo.texto || "Nenhum conteúdo projetado no momento."}"
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                    <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> Alerta no Rodapé
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Aviso urgente..."
                      value={avisoTexto}
                      onChange={(e) => setAvisoTexto(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 font-medium"
                    />
                    <Button
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl h-10 px-4 cursor-pointer"
                      onClick={() => transmitirProjecao({ avisoUrgente: avisoTexto })}
                    >
                      Enviar
                    </Button>
                  </div>
                </div>

              </div>

              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
                
                {modoAtivo === "louvor" && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {louvorSelecionado ? (
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setLouvorSelecionado(null)}
                              className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" /> Voltar à lista
                            </button>
                            <h2 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                              {louvorSelecionado.numero ? `${louvorSelecionado.numero} - ${louvorSelecionado.nome}` : louvorSelecionado.nome}
                            </h2>
                          </div>
                          <span className="text-xs text-slate-400 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            Bloco {estrofeAtiva + 1} / {louvorSelecionado.estrofes.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                          {louvorSelecionado.estrofes.map((estrofe, idx) => (
                            <button
                              key={idx}
                              onClick={() => irParaEstrofe(idx)}
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                estrofeAtiva === idx
                                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-950 dark:text-blue-100 shadow-sm font-semibold ring-1 ring-blue-400/50"
                                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                              }`}
                            >
                              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Bloco {idx + 1}
                              </span>
                              <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{estrofe}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 flex-1 flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <h2 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Music className="w-5 h-5 text-teal-500" /> Lista de Louvores ({filterCategoria === "all" ? "Todas as Categorias" : filterCategoria})
                          </h2>
                          <span className="text-xs font-mono text-slate-400 font-bold">
                            {louvoresLista.length} hinos carregados
                          </span>
                        </div>

                        {louvoresLista.length === 0 ? (
                          <div className="py-24 text-center text-slate-400 text-xs sm:text-sm italic">
                            Nenhum louvor encontrado nesta categoria ou busca.
                          </div>
                        ) : (
                          <div 
                            onScroll={lidarComScrollListaLouvores}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1"
                          >
                            {louvoresLista.map((l) => (
                              <button
                                key={l.id}
                                onClick={() => selecionarLouvor(l)}
                                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-teal-500 dark:hover:border-teal-500 text-left transition-all cursor-pointer flex items-center justify-between group"
                              >
                                <div className="truncate pr-2">
                                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 mr-2">
                                    {l.numero !== null && l.numero !== undefined ? `${l.numero}` : "•"}
                                  </span>
                                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                    {l.nome}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400 shrink-0">
                                  {l.categoria || "Geral"}
                                </span>
                              </button>
                            ))}
                            {carregandoMaisLouvores && (
                              <div className="col-span-full py-3 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {modoAtivo === "biblia" && bibliaAtiva && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-500" />
                        <h2 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                          {bibliaAtiva.livroNome} {bibliaAtiva.cap} ({versaoSelecionada.toUpperCase()})
                        </h2>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={modoMultisselecao ? "default" : "outline"}
                          onClick={() => {
                            setModoMultisselecao(!modoMultisselecao);
                            setVersiculosSelecionados([]);
                          }}
                          className={`h-8 px-3 text-xs gap-1.5 font-bold rounded-xl cursor-pointer ${
                            modoMultisselecao ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                          }`}
                        >
                          <CheckSquare className="w-4 h-4" /> {modoMultisselecao ? "Modo Seleção Ativo" : "Multisseleção"}
                        </Button>

                        {!modoMultisselecao && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => irParaVersiculoBiblia(bibliaAtiva.indiceAtivo - 1)}
                              disabled={bibliaAtiva.indiceAtivo <= 0}
                              className="h-8 px-3 text-xs gap-1 font-bold rounded-xl cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" /> Anterior
                            </Button>
                            <span className="text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                              {bibliaAtiva.indiceAtivo + 1} / {bibliaAtiva.versiculos.length}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => irParaVersiculoBiblia(bibliaAtiva.indiceAtivo + 1)}
                              disabled={bibliaAtiva.indiceAtivo >= bibliaAtiva.versiculos.length - 1}
                              className="h-8 px-3 text-xs gap-1 font-bold rounded-xl cursor-pointer"
                            >
                              Próximo <ChevronRight className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {carregandoVersiculos ? (
                      <div className="py-24 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      </div>
                    ) : bibliaAtiva.versiculos.length === 0 ? (
                      <div className="py-24 text-center text-slate-400 text-xs sm:text-sm italic">
                        Nenhum versículo encontrado para este capítulo.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                        {bibliaAtiva.versiculos.map((v, idx) => {
                          const selecionado = versiculosSelecionados.includes(idx);
                          const ativo = !modoMultisselecao && bibliaAtiva.indiceAtivo === idx;
                          return (
                            <button
                              key={v.versiculo}
                              onClick={() => selecionarVersiculoBiblia(idx)}
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                selecionado
                                  ? "bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm font-semibold"
                                  : ativo
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm font-semibold ring-1 ring-emerald-400/50"
                                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                  Versículo {v.versiculo}
                                </span>
                                {modoMultisselecao && (
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${selecionado ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 dark:border-slate-600"}`}>
                                    {selecionado && <Check className="w-3 h-3" />}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{v.texto}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {modoMultisselecao && versiculosSelecionados.length > 0 && (
                      <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-xl mt-2">
                        <span className="text-xs font-bold pl-2">
                          {versiculosSelecionados.length} versículo(s) selecionado(s)
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 gap-1.5 cursor-pointer"
                            onClick={projetarVersiculosSelecionados}
                          >
                            <Send className="w-3.5 h-3.5" /> Projetar Selecionados
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-300 hover:text-white text-xs h-8 cursor-pointer"
                            onClick={() => setVersiculosSelecionados([])}
                          >
                            Limpar
                          </Button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}