import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Cloud, Monitor, Smartphone, Music, BookOpen, 
  Megaphone, Shield, Globe, Loader2, 
  EyeOff, Check, X, Filter, ChevronRight, ChevronLeft, CheckSquare, Send,
  Settings, Lock, Upload, Trash2, Image as ImageIcon, Type, RotateCcw
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

const FONTES_DISPONIVEIS = [
  { id: "Inter", nome: "Inter (Padrão)" },
  { id: "Montserrat", nome: "Montserrat" },
  { id: "Roboto", nome: "Roboto" },
  { id: "Poppins", nome: "Poppins" },
  { id: "Open Sans", nome: "Open Sans" },
  { id: "Lato", nome: "Lato" },
  { id: "Ubuntu", nome: "Ubuntu" }
];

const FUNDOS_PADRAO = [
  { id: "azul", nome: "Azul Noite Profundo", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920" },
  { id: "madeira", nome: "Madeira Escura Elegante", url: "https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=1920" },
  { id: "bokeh", nome: "Bokeh / Partículas Solenes", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920" },
  { id: "cinza", nome: "Cinza Chumbo Texturizado", url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1920" }
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
  const [modalConfigAberto, setModalConfigAberto] = useState(false);

  const [senhaInput, setSenhaInput] = useState("");
  const [senhaSalvaNoBanco, setSenhaSalvaNoBanco] = useState("");
  const [primeiroUso, setPrimeiroUso] = useState(false);
  const [carregandoConfig, setCarregandoConfig] = useState(false);
  const [erroSenha, setErroSenha] = useState("");
  const [mensagemSucessoConfig, setMensagemSucessoConfig] = useState("");

  const [fonteSelecionada, setFonteSelecionada] = useState("Inter");
  const [temaModo, setTemaModo] = useState("escuro");
  const [fundoUrlAtivo, setFundoUrlAtivo] = useState("");

  const [imagensPersonalizadas, setImagensPersonalizadas] = useState([]);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

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
    if (modalConfigAberto) {
      carregarConfiguracoesNuvem();
      carregarImagensStorage();
    }
  }, [modalConfigAberto]);

  const carregarConfiguracoesNuvem = async () => {
    try {
      const { data } = await supabase
        .from("configuracoes_projecao")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (data && data.senha_admin) {
        setSenhaSalvaNoBanco(data.senha_admin);
        setPrimeiroUso(false);
        setFonteSelecionada(data.fonte_familia || "Inter");
        setTemaModo(data.tema_modo || "escuro");
        setFundoUrlAtivo(data.imagem_fundo_url || "");
      } else {
        setPrimeiroUso(true);
        setSenhaSalvaNoBanco("");
      }
    } catch (err) {
      console.error(err);
      setPrimeiroUso(true);
    }
  };

  const carregarImagensStorage = async () => {
    try {
      const { data } = await supabase.storage
        .from("fundos_projecao")
        .list("", { limit: 10, sortBy: { column: "created_at", order: "desc" } });

      if (data) {
        const urlPublicas = data.map((file) => {
          const { data: pubData } = supabase.storage
            .from("fundos_projecao")
            .getPublicUrl(file.name);
          return { name: file.name, url: pubData.publicUrl };
        });
        setImagensPersonalizadas(urlPublicas);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const salvarConfiguracoesGlobais = async () => {
    if (primeiroUso) {
      if (!senhaInput.trim()) {
        setErroSenha("Digite uma senha de administrador válida para o primeiro uso.");
        return;
      }
    } else {
      if (senhaInput !== senhaSalvaNoBanco) {
        setErroSenha("Senha de administrador incorreta.");
        return;
      }
    }

    setCarregandoConfig(true);
    setErroSenha("");
    try {
      const dadosUpsert = {
        id: 1,
        fonte_familia: fonteSelecionada,
        tema_modo: temaModo,
        imagem_fundo_url: fundoUrlAtivo
      };

      if (primeiroUso) {
        dadosUpsert.senha_admin = senhaInput.trim();
      }

      const { error } = await supabase
        .from("configuracoes_projecao")
        .upsert(dadosUpsert);

      if (error) throw error;

      if (primeiroUso) {
        setSenhaSalvaNoBanco(senhaInput.trim());
        setPrimeiroUso(false);
      }

      setSenhaInput("");
      setMensagemSucessoConfig("Configurações salvas e sincronizadas na nuvem com sucesso!");
      setTimeout(() => {
        setMensagemSucessoConfig("");
        setModalConfigAberto(false);
      }, 1500);
    } catch (err) {
      setErroSenha("Erro ao salvar: " + err.message);
    } finally {
      setCarregandoConfig(false);
    }
  };

  const restaurarPadrao = async () => {
    try {
      const { data } = await supabase
        .from("configuracoes_projecao")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (data) {
        setFonteSelecionada(data.fonte_familia || "Inter");
        setTemaModo(data.tema_modo || "escuro");
        setFundoUrlAtivo(data.imagem_fundo_url || "");
        setMensagemSucessoConfig("Redefinido para o padrão da nuvem!");
      } else {
        setFonteSelecionada("Inter");
        setTemaModo("escuro");
        setFundoUrlAtivo("");
        setMensagemSucessoConfig("Redefinido para o padrão de fábrica!");
      }
    } catch (err) {
      setFonteSelecionada("Inter");
      setTemaModo("escuro");
      setFundoUrlAtivo("");
      setMensagemSucessoConfig("Redefinido para o padrão de fábrica!");
    }
    setTimeout(() => setMensagemSucessoConfig(""), 2000);
  };

  const fazerUploadImagem = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagensPersonalizadas.length >= 5) {
      alert("Limite máximo de 5 imagens personalizadas atingido. Remova uma antes de enviar outra.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    setEnviandoImagem(true);
    try {
      const nomeArquivo = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const { error } = await supabase.storage
        .from("fundos_projecao")
        .upload(nomeArquivo, file);

      if (error) throw error;

      await carregarImagensStorage();
    } catch (err) {
      alert("Erro ao fazer upload: " + err.message);
    } finally {
      setEnviandoImagem(false);
    }
  };

  const excluirImagemStorage = async (nomeArquivo) => {
    try {
      const { error } = await supabase.storage
        .from("fundos_projecao")
        .remove([nomeArquivo]);

      if (error) throw error;
      carregarImagensStorage();
    } catch (err) {
      alert("Erro ao excluir imagem: " + err.message);
    }
  };

  useEffect(() => {
    setPaginaLouvores(0);
    setTemMaisLouvores(true);
    carregarLouvoresPorCategoria(filterCategoria, 0, true);
  }, [filterCategoria]);

  const ordenarLouvoresCustom = (lista) => {
    return [...lista].sort((a, b) => {
      const numA = a.numero !== null && a.numero !== undefined ? Number(a.numero) : 999999;
      const numB = b.numero !== null && b.numero !== undefined ? Number(b.numero) : 999999;
      
      if (numA === 0 && numB !== 0) return -1;
      if (numB === 0 && numA !== 0) return 1;

      if (numA !== numB) return numA - numB;

      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });
  };

  const carregarLouvoresPorCategoria = async (cat, pagina = 0, substituir = false) => {
    try {
      if (pagina > 0) setCarregandoMaisLouvores(true);
      const inicio = pagina * ITENS_POR_PAGINA;
      const fim = inicio + ITENS_POR_PAGINA - 1;

      let query = supabase
        .from("louvores")
        .select("*")
        .range(inicio, fim);

      if (cat !== "all") {
        query = query.eq("categoria", cat);
      }

      const { data } = await query;
      if (data) {
        if (data.length < ITENS_POR_PAGINA) {
          setTemMaisLouvores(false);
        }
        const ordenados = ordenarLouvoresCustom(data);
        if (substituir) {
          setLouvoresLista(ordenados);
        } else {
          setLouvoresLista(prev => ordenarLouvoresCustom([...prev, ...ordenados]));
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
      const filtradosESort = ordenarLouvoresCustom(data.filter((l) => {
        const matchNumero = l.numero !== null && l.numero !== undefined && String(l.numero).startsWith(termoBruto);
        const matchNome = normalizarTexto(l.nome).includes(termoNorm);
        const matchLetra = l.letra_musica && normalizarTexto(l.letra_musica).includes(termoNorm);
        return matchNumero || matchNome || matchLetra;
      }));

      setLouvoresLista(filtradosESort);
      setLouvoresResultado(filtradosESort.slice(0, 5));
    } else {
      setLouvoresLista([]);
      setLouvoresResultado([]);
    }
  };

  const limparBusca = () => {
    setLouvorBusca("");
    setPaginaLouvores(0);
    setTemMaisLouvores(true);
    carregarLouvoresPorCategoria(filterCategoria, 0, true);
    setLouvoresResultado([]);
  };

  const selecionarLouvor = (louvor) => {
    let estrofesProcessadas = [];
    if (louvor.letra_musica) {
      const blocosBrutos = louvor.letra_musica.split(/\n\s*\n/).map(b => b.trim()).filter(b => b !== "");
      
      let estrofesPuras = [];
      let coroTexto = null;
      let finalTexto = null;

      blocosBrutos.forEach(bloco => {
        const linhas = bloco.split("\n");
        const primeiraLinhaNorm = normalizarTexto(linhas[0]);

        if ((primeiraLinhaNorm === "coro" || primeiraLinhaNorm === "coro:") && linhas.length === 1) {
          return;
        }

        if ((primeiraLinhaNorm === "coro" || primeiraLinhaNorm === "coro:") && linhas.length > 1) {
          coroTexto = bloco;
        } else if (primeiraLinhaNorm.startsWith("final")) {
          finalTexto = bloco;
        } else {
          estrofesPuras.push(bloco);
        }
      });

      if (coroTexto && estrofesPuras.length > 0) {
        estrofesPuras.forEach((est) => {
          estrofesProcessadas.push(est);
          estrofesProcessadas.push(coroTexto);
        });
      } else {
        estrofesProcessadas = estrofesPuras;
      }

      if (finalTexto) {
        estrofesProcessadas.push(finalTexto);
      }

      if (estrofesProcessadas.length === 0 && blocosBrutos.length > 0) {
        estrofesProcessadas = blocosBrutos;
      }
    }
    
    const objetoLouvor = { ...louvor, estrofes: estrofesProcessadas };
    setLouvorSelecionado(objetoLouvor);
    setEstrofeAtiva(0);
    setLouvoresResultado([]);

    const tituloFormatado = louvor.numero !== null && louvor.numero !== undefined && louvor.numero !== 0 
      ? `${louvor.numero} - ${louvor.nome}` 
      : louvor.nome;

    if (estrofesProcessadas.length > 0) {
      transmitirProjecao({
        tipo: "louvor",
        titulo: tituloFormatado,
        texto: estrofesProcessadas[0]
      });
    }
  };

  const irParaEstrofe = (index) => {
    if (!louvorSelecionado || !louvorSelecionado.estrofes[index]) return;
    setEstrofeAtiva(index);
    const tituloFormatado = louvorSelecionado.numero !== null && louvorSelecionado.numero !== undefined && louvorSelecionado.numero !== 0 
      ? `${louvorSelecionado.numero} - ${louvorSelecionado.nome}` 
      : louvorSelecionado.nome;
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
                  <div className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors">
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
            <div className="flex items-center justify-between px-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Painel de Operação ao Vivo
              </p>
              <button
                onClick={() => setModalConfigAberto(true)}
                className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white shadow-sm"
                title="Configurações de Projeção"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

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
                              {louvorSelecionado.numero !== null && louvorSelecionado.numero !== undefined && louvorSelecionado.numero !== 0 
                                ? `${louvorSelecionado.numero} - ${louvorSelecionado.nome}` 
                                : louvorSelecionado.nome}
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
                                    {l.numero !== null && l.numero !== undefined && l.numero !== 0 ? `${l.numero}` : "•"}
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

      {modalConfigAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-teal-400" />
                <h2 className="font-bold text-base">Configurações Globais de Projeção</h2>
              </div>
              <button 
                onClick={() => setModalConfigAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {mensagemSucessoConfig && (
                <div className="bg-emerald-600 text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {mensagemSucessoConfig}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-teal-500" /> Fonte do Telão (Sans-Serif)
                </label>
                <Select value={fonteSelecionada} onValueChange={setFonteSelecionada}>
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl h-11 text-sm font-semibold">
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
                    {FONTES_DISPONIVEIS.map((f) => (
                      <SelectItem key={f.id} value={f.id} style={{ fontFamily: f.id }}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-500" /> Modo de Exibição
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemaModo("escuro")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      temaModo === "escuro" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Escuro Sólido
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemaModo("claro")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      temaModo === "claro" ? "bg-slate-200 text-slate-900 border-slate-300 shadow-sm" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemaModo("imagem")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      temaModo === "imagem" ? "bg-teal-600 text-white border-teal-600 shadow-sm" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Imagem de Fundo
                  </button>
                </div>
              </div>

              {temaModo === "imagem" && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      4 Fundos Padrão da Nuvem
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {FUNDOS_PADRAO.map((fp) => (
                        <button
                          key={fp.id}
                          type="button"
                          onClick={() => setFundoUrlAtivo(fp.url)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            fundoUrlAtivo === fp.url
                              ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-400"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300"
                          }`}
                        >
                          <div 
                            className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0 border border-slate-300 dark:border-slate-600"
                            style={{ backgroundImage: `url(${fp.url})` }}
                          />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {fp.nome}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Imagens Personalizadas ({imagensPersonalizadas.length}/5)
                      </span>
                      {imagensPersonalizadas.length < 5 && (
                        <label className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer hover:opacity-90 flex items-center gap-1.5 transition-opacity">
                          {enviandoImagem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          Enviar Imagem
                          <input type="file" accept="image/png, image/jpeg, image/webp" onChange={fazerUploadImagem} className="hidden" />
                        </label>
                      )}
                    </div>

                    {imagensPersonalizadas.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imagensPersonalizadas.map((img) => (
                          <div 
                            key={img.name}
                            className={`relative group rounded-xl border overflow-hidden p-1 transition-all ${
                              fundoUrlAtivo === img.url ? "border-teal-500 ring-2 ring-teal-400" : "border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <div 
                              onClick={() => setFundoUrlAtivo(img.url)}
                              className="h-20 bg-cover bg-center rounded-lg cursor-pointer"
                              style={{ backgroundImage: `url(${img.url})` }}
                            />
                            <button
                              type="button"
                              onClick={() => excluirImagemStorage(img.name)}
                              className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Excluir imagem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2 text-center">Nenhuma imagem personalizada enviada ainda.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Senha de Administrador para Salvar na Nuvem
                  </label>
                  <input
                    type="password"
                    placeholder={primeiroUso ? "Crie a senha do adm (primeiro uso)..." : "Digite a senha do adm para salvar..."}
                    value={senhaInput}
                    onChange={(e) => setSenhaInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold tracking-widest text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  {erroSenha && <p className="text-xs font-semibold text-rose-500">{erroSenha}</p>}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={restaurarPadrao}
                    className="rounded-xl h-10 text-xs font-bold gap-1.5 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalConfigAberto(false)}
                      className="rounded-xl h-10 text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={salvarConfiguracoesGlobais}
                      disabled={carregandoConfig}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      {carregandoConfig && <Loader2 className="w-4 h-4 animate-spin" />}
                      Salvar na Nuvem
                    </Button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}