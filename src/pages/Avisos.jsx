import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Megaphone, Plus, Trash2, Globe, Shield, User, 
  Loader2, FileText, Upload, ChevronDown, ChevronUp, Download 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Avisos() {
  const navigate = useNavigate();
  
  // Estados dos Avisos
  const [avisos, setAvisos] = useState([]);
  const [novoAviso, setNovoAviso] = useState("");
  const [carregandoAvisos, setCarregandoAvisos] = useState(true);
  
  // Estados da Igreja e Login
  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoIgreja, setCarregandoIgreja] = useState(true);
  const userRole = localStorage.getItem("icmlyrics_role") || "user"; 
  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "Geral"; 
  const podeCriar = userRole === "super_adm" || userRole === "church_admin";

  // Estados dos Arquivos/Relatórios
  const [arquivos, setArquivos] = useState([]);
  const [carregandoArquivos, setCarregandoArquivos] = useState(true);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [observacaoArquivo, setObservacaoArquivo] = useState("");
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [itemExpandido, setItemExpandido] = useState(null); // Controla qual linha está aberta

  // Tradução da função para exibição
  const obterNomeAutor = () => userRole === "super_adm" ? "Super Admin" : "Adm Local";

  // 1. CARREGA O NOME DA IGREJA
  useEffect(() => {
    const buscarNomeIgrejaDoBanco = async () => {
      try {
        setCarregandoIgreja(true);
        if (userRole === "super_adm" && (!userNuvem || userNuvem === "Geral")) {
          setNomeIgreja("Administração Geral");
          return;
        }
        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("nome_igreja")
          .eq("usuario", userNuvem)
          .maybeSingle();

        if (error) throw error;
        setNomeIgreja(data?.nome_igreja || userNuvem);
      } catch (err) {
        console.error(err);
        setNomeIgreja(userNuvem); 
      } finally {
        setCarregandoIgreja(false);
      }
    };
    buscarNomeIgrejaDoBanco();
  }, [userNuvem, userRole]);

  // 2. CARREGA AVISOS E ARQUIVOS DO BANCO
  const buscarDadosDoBanco = async () => {
    try {
      setCarregandoAvisos(true);
      setCarregandoArquivos(true);

      // Buscar Avisos
      const resAvisos = await supabase.from("avisos").select("*").order("created_at", { ascending: false });
      if (!resAvisos.error) {
        setAvisos(resAvisos.data.filter(a => a.tipo === "global" || a.nuvem?.toLowerCase() === userNuvem.toLowerCase()));
      }

      // Buscar Arquivos
      const resArquivos = await supabase.from("arquivos_enviados").select("*").order("created_at", { ascending: false });
      if (!resArquivos.error) {
        setArquivos(resArquivos.data.filter(arq => arq.nuvem?.toLowerCase() === userNuvem.toLowerCase() || userRole === "super_adm"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregandoAvisos(false);
      setCarregandoArquivos(false);
    }
  };

  useEffect(() => {
    buscarDadosDoBanco();
  }, [userNuvem]);

  // 3. CRIAÇÃO DE AVISO TEXTUAL
  const handleCriarAviso = async () => {
    if (!novoAviso.trim()) return;
    try {
      const { error } = await supabase.from("avisos").insert([{
        texto: novoAviso,
        tipo: userRole === "super_adm" ? "global" : "local",
        nuvem: userRole === "super_adm" ? "todos" : userNuvem,
        autor: obterNomeAutor()
      }]);
      if (error) throw error;
      setNovoAviso("");
      buscarDadosDoBanco();
    } catch (e) {
      alert("Erro ao publicar o aviso.");
    }
  };

  const handleDeletarAviso = async (id) => {
    if (!window.confirm("Deseja excluir este aviso?")) return;
    await supabase.from("avisos").delete().eq("id", id);
    buscarDadosDoBanco();
  };

  // 4. LOGICA DE UPLOAD E VALIDAÇÃO DE ARQUIVOS (Máx 2MB, bloqueia áudio)
  const handleSelecionarArquivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validação de tipo: bloqueia áudios explicitamente
    if (file.type.startsWith("audio/")) {
      alert("Arquivos de áudio não são permitidos!");
      return;
    }

    // Validação de tamanho: 2MB = 2 * 1024 * 1024 bytes
    if (file.size > 2 * 1024 * 1024) {
      alert("O arquivo é muito grande! O limite máximo permitido é de 2 Megas (2MB).");
      return;
    }

    setArquivoSelecionado(file);
  };

  const handleEnviarArquivo = async () => {
    if (!arquivoSelecionado) return alert("Selecione um arquivo primeiro.");
    
    try {
      setEnviandoArquivo(true);

      // Gera um nome único para o arquivo não sobrescrever outros no Storage
      const extensao = arquivoSelecionado.name.split(".").pop();
      const nomeLimpo = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extensao}`;
      const caminhoArquivo = `${userNuvem}/${nomeLimpo}`;

      // Upload para o Bucket 'arquivos_avisos'
      const { error: uploadError } = await supabase.storage
        .from("arquivos_avisos")
        .upload(caminhoArquivo, arquivoSelecionado);

      if (uploadError) throw uploadError;

      // Pega a URL pública gerada para o arquivo
      const { data: urlData } = supabase.storage
        .from("arquivos_avisos")
        .getPublicUrl(caminhoArquivo);

      // Salva os dados resumidos na tabela arquivos_enviados
      const { error: dbError } = await supabase.from("arquivos_enviados").insert([{
        nome_igreja: nomeIgreja,
        autor: obterNomeAutor(),
        observacao: observacaoArquivo,
        nome_arquivo: arquivoSelecionado.name,
        url_arquivo: urlData.publicUrl,
        nuvem: userNuvem
      }]);

      if (dbError) throw dbError;

      setArquivoSelecionado(null);
      setObservacaoArquivo("");
      alert("Arquivo enviado com sucesso!");
      buscarDadosDoBanco();
    } catch (e) {
      console.error(e);
      alert("Falha ao enviar arquivo.");
    } finally {
      setEnviandoArquivo(false);
    }
  };

  const handleDeletarArquivo = async (id, urlArquivo) => {
    if (!window.confirm("Deseja apagar este arquivo permanentemente?")) return;
    try {
      // Extrai o caminho do arquivo no storage a partir da URL pública
      const partes = urlArquivo.split("/arquivos_avisos/");
      if (partes.length > 1) {
        await supabase.storage.from("arquivos_avisos").remove([partes[1]]);
      }
      await supabase.from("arquivos_enviados").delete().eq("id", id);
      buscarDadosDoBanco();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Cabeçalho */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Mural & Documentos</h1>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          {carregandoIgreja ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> : (
            <span className="text-[11px] font-bold text-slate-300 tracking-wide uppercase">{nomeIgreja}</span>
          )}
          <span className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-400">
            {userRole === "super_adm" ? <Globe className="w-2.5 h-2.5 text-amber-400" /> : <Shield className="w-2.5 h-2.5 text-indigo-400" />}
            {userRole === "super_adm" ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto mt-2">
        {/* ================= SEÇÃO 1: MURAL DE AVISOS TEXTUAIS ================= */}
        {podeCriar && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" /> Criar Novo Comunicado
            </h3>
            <textarea
              value={novoAviso}
              onChange={(e) => setNovoAviso(e.target.value)}
              placeholder={`Escreva um aviso para a nuvem ${nomeIgreja}...`}
              className="w-full h-20 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none text-slate-700"
            />
            <button onClick={handleCriarAviso} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs h-10 flex items-center justify-center gap-2 transition-colors">
              <Megaphone className="w-4 h-4" /> Publicar Aviso
            </button>
          </div>
        )}

        {/* Lista de Avisos */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Avisos Recentes</span>
          {carregandoAvisos ? <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /> : avisos.length === 0 ? (
            <p className="text-xs text-slate-400 text-center bg-white p-4 rounded-2xl border border-slate-100">Nenhum aviso ativo.</p>
          ) : (
            <div className="space-y-2">
              {avisos.map((aviso) => (
                <div key={aviso.id} className={`p-4 rounded-2xl border bg-white flex justify-between shadow-sm ${aviso.tipo === "global" ? "border-amber-100 bg-gradient-to-r from-amber-50/10 to-transparent" : "border-slate-100"}`}>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md ${aviso.tipo === "global" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"}`}>{aviso.tipo}</span>
                      <span className="text-[10px] text-slate-400">{new Date(aviso.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap mt-1">{aviso.texto}</p>
                    <span className="text-[10px] text-slate-400 block italic">Por: {aviso.autor}</span>
                  </div>
                  {podeCriar && <button onClick={() => handleDeletarAviso(aviso.id)} className="text-slate-300 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= SEÇÃO 2: CENTRAL DE ARQUIVOS E RELATÓRIOS ================= */}
        <div className="border-t border-slate-200 pt-4 space-y-4">
          {podeCriar && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" /> Enviar Imagem / Documento (Máx 2MB)
              </h3>
              <input 
                type="file" 
                id="file-upload" 
                accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .txt" 
                onChange={handleSelecionarArquivo}
                className="hidden"
              />
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-4 cursor-pointer hover:bg-slate-50 transition-colors">
                <FileText className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-500 font-medium">
                  {arquivoSelecionado ? arquivoSelecionado.name : "Clique para selecionar o arquivo"}
                </span>
              </label>

              <input 
                type="text" 
                placeholder="Adicionar alguma observação importante..." 
                value={observacaoArquivo}
                onChange={(e) => setObservacaoArquivo(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              />

              <button 
                onClick={handleEnviarArquivo} 
                disabled={enviandoArquivo}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs h-10 flex items-center justify-center gap-2 disabled:bg-slate-300"
              >
                {enviandoArquivo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Enviar para a Nuvem
              </button>
            </div>
          )}

          {/* Lista em formato de Linhas Sanfona (Accordion) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Arquivos Compartilhados</span>
            
            {carregandoArquivos ? <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" /> : arquivos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center bg-white p-4 rounded-2xl border border-slate-100">Nenhum documento anexado.</p>
            ) : (
              <div className="space-y-1.5">
                {arquivos.map((arq) => {
                  const estaExpandido = itemExpandido === arq.id;
                  return (
                    <div key={arq.id} className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden transition-all">
                      
                      {/* LINHA PRINCIPAL COMPACTA */}
                      <div 
                        onClick={() => setItemExpandido(estaExpandido ? null : arq.id)}
                        className="p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-700 truncate block max-w-[120px]">{arq.nome_igreja}</span>
                              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">{arq.autor}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{new Date(arq.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {arq.observacao && <span className="text-[10px] text-slate-400 italic max-w-[80px] truncate">({arq.observacao})</span>}
                          {estaExpandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* CONTEÚDO EXPANDIDO (Ao Clicar) */}
                      {estaExpandido && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-50 bg-slate-50/50 space-y-2.5 text-xs text-slate-600 animate-fadeIn">
                          <div>
                            <span className="font-semibold block text-[10px] text-slate-400 uppercase">Arquivo original:</span>
                            <p className="text-slate-700 font-medium break-all">{arq.nome_arquivo}</p>
                          </div>
                          
                          {arq.observacao && (
                            <div>
                              <span className="font-semibold block text-[10px] text-slate-400 uppercase">Observações:</span>
                              <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">{arq.observacao}</p>
                            </div>
                          )}

                          {/* Ações do arquivo */}
                          <div className="flex items-center gap-2 pt-1">
                            <a 
                              href={arq.url_arquivo} 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 hover:bg-slate-800"
                            >
                              <Download className="w-3.5 h-3.5" /> Abrir / Baixar
                            </a>
                            
                            {(userRole === "super_adm" || userNuvem === arq.nuvem) && (
                              <button 
                                onClick={() => handleDeletarArquivo(arq.id, arq.url_arquivo)} 
                                className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-colors ml-auto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}