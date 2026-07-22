import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Trash2, Play, Calendar, Music, Printer, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import DrawerMenu from "@/components/louvores/DrawerMenu";
import PreviewModal from "@/components/lista/PreviewModal"; 

import { supabase } from "@/lib/supabaseClient"; 

export default function HistoricoListas() {
  const navigate = useNavigate();
  const [listasLocais, setListasLocais] = useState([]);
  const [listasNuvem, setListasNuvem] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. OBTENÇÃO FLEXÍVEL DAS CREDENCIAIS DO LOCALSTORAGE
  const usuario = localStorage.getItem("icmlyrics_user_nuvem") || localStorage.getItem("icmlyrics_user") || "";
  const senha = localStorage.getItem("icmlyrics_senha_nuvem") || "";
  
  // Considera ativo na nuvem se houver qualquer identificador de usuário armazenado
  const temNuvem = usuario.trim() !== "";

  const [modalOpen, setModalOpen] = useState(false);
  // Estado do modal atualizado para aceitar também tipo e responsável
  const [dadosModal, setDadosModal] = useState({ rows: [], dataCulto: "", tipoCulto: "", responsavel: "" });

  const carregarLocal = () => {
    try {
      const localListas = localStorage.getItem("icmlyrics_historico_listas");
      setListasLocais(localListas ? JSON.parse(localListas) : []);
    } catch (e) {
      console.error("Erro ao ler dados locais:", e);
    }
  };

  const carregarNuvem = async () => {
    if (!temNuvem) return;
    setLoading(true);
    try {
      // Monta a consulta filtrando pelo usuário e incluindo tipo_culto e responsavel
      let query = supabase
        .from("listas")
        .select(`
          id,
          data_culto,
          dia_semana,
          tipo_culto,
          responsavel,
          lista_itens (
            id,
            ordem,
            tipo,
            observacao,
            texto_secao,
            louvores (
              id,
              numero,
              nome,
              categoria
            )
          )
        `)
        .eq("acesso_usuario", usuario);

      // Adiciona o filtro de senha apenas se houver senha cadastrada localmente
      if (senha.trim() !== "") {
        query = query.eq("acesso_senha", senha);
      }

      const { data, error } = await query.order("data_culto", { ascending: false });

      if (error) throw error;

      if (data) {
        const formatadas = data.map((lista) => {
          const itensOrdenados = (lista.lista_itens || []).sort((a, b) => a.ordem - b.ordem);
          const rowsFormatadas = itensOrdenados.map((item) => ({
            id: item.id,
            type: item.tipo,
            categoria: item.louvores?.categoria || "Avulsos",
            observacao: item.observacao || "",
            text: item.tipo === "divider" ? item.texto_secao : "",
            nome: item.tipo === "louvor" ? (item.louvores?.nome || "") : "",
            numero: item.tipo === "louvor" ? (item.louvores?.numero || "") : "",
            id_louvor_db: item.louvores?.id || null
          }));

          return {
            id: lista.id,
            dataCulto: lista.data_culto,
            diaSemana: lista.dia_semana,
            tipoCulto: lista.tipo_culto || "",       // <--- Mapeando do banco
            responsavel: lista.responsavel || "",    // <--- Mapeando do banco
            rows: rowsFormatadas,
            origem: "nuvem"
          };
        });
        setListasNuvem(formatadas);
      }
    } catch (e) {
      console.error("Erro ao sincronizar com a nuvem:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLocal();
    carregarNuvem();
  }, []);

  const todasAsListas = [...listasLocais.map(l => ({ ...l, origem: "local" })), ...listasNuvem]
    .sort((a, b) => new Date(b.dataCulto) - new Date(a.dataCulto));

  const handleDeletarLista = async (lista) => {
    if (window.confirm("Deseja realmente excluir esta lista?")) {
      if (lista.origem === "nuvem") {
        try {
          const { error } = await supabase.from("listas").delete().eq("id", lista.id);
          if (error) throw error;
          setListasNuvem(prev => prev.filter(l => l.id !== lista.id));
        } catch (e) {
          alert(`Erro ao excluir lista na nuvem: ${e.message}`);
        }
      } else {
        const atualizadas = listasLocais.filter((l) => l.id !== lista.id);
        setListasLocais(atualizadas);
        localStorage.setItem("icmlyrics_historico_listas", JSON.stringify(atualizadas));
      }
    }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const handleAbrirReimpressao = (lista) => {
    setDadosModal({
      rows: lista.rows || [],
      dataCulto: lista.dataCulto || "",
      tipoCulto: lista.tipoCulto || lista.tipo_culto || "",
      responsavel: lista.responsavel || ""
    });
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button onClick={() => setDrawerOpen(true)} className="text-slate-300 hover:text-white transition-colors p-1 mr-1">
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Histórico</h1>
            <p className="text-slate-400 text-xs">Listas passadas do culto</p>
          </div>
        </div>

        {/* Indicador de Nuvem Discreto que serve como botão para recarregar */}
        <button 
          onClick={carregarNuvem} 
          disabled={loading || !temNuvem} 
          className="p-2 text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          ) : temNuvem ? (
            <Cloud className="w-5 h-5 text-emerald-400 drop-shadow" title={`Sincronizado (${usuario})! Clique para atualizar.`} />
          ) : (
            <CloudOff className="w-5 h-5 text-slate-500" title="Apenas local (Nenhum usuário logado)" />
          )}
        </button>
      </div>

      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="p-4 space-y-4">
        {todasAsListas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma lista encontrada.</p>
            <button onClick={() => navigate("/nova-lista")} className="mt-4 bg-indigo-600 text-white px-4 py-2 text-sm rounded-xl font-medium">
              Criar Nova Lista
            </button>
          </div>
        ) : (
          todasAsListas.map((lista) => (
            <div key={lista.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">
                    {formatarData(lista.dataCulto)}
                  </span>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {lista.diaSemana}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    lista.origem === "nuvem" ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"
                  }`}>
                    {lista.origem}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeletarLista(lista)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 pl-1">
                {lista.rows.map((row, index) => (
                  <div key={row.id || index} className="text-sm text-slate-600 flex items-center gap-2">
                    {row.type === "divider" ? (
                      <span className="text-xs font-bold tracking-wide text-indigo-500 uppercase mt-1">
                        ✦ {row.text || "Seção"}
                      </span>
                    ) : (
                      <>
                        <Music className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-500 w-9">
                          {row.numero && !String(row.numero).startsWith("local_") ? row.numero : "—"}
                        </span>
                        <span className="truncate text-slate-700">{row.nome}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1 w-full">
                <Button 
                  onClick={() => navigate("/modo-playlist", { state: { lista: lista } })}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs font-semibold"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Playlist
                </Button>
                <Button 
                  onClick={() => handleAbrirReimpressao(lista)}
                  variant="outline"
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 gap-2 h-9 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" /> Reimprimir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <PreviewModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        mode="image" 
        rows={dadosModal.rows} 
        dataCulto={dadosModal.dataCulto} 
        tipoCulto={dadosModal.tipoCulto}       
        responsavel={dadosModal.responsavel}  
      />
    </div>
  );
}