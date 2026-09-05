import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Music, Send, Cloud, Globe, Shield, Loader2, Sparkles, Trash2, CheckCircle2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function Sugestoes() {
  const navigate = useNavigate();

  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");

  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const userName = localStorage.getItem("icmlyrics_user") || "Usuário";

  const [sugestaoMusica, setSugestaoMusica] = useState("");
  const [sugestaoCantor, setSugestaoCantor] = useState("");
  const [sugestaoTom, setSugestaoTom] = useState("");

  const [listaSugestoes, setListaSugestoes] = useState([
    { id: 1, musica: "Grandes Coisas", autor: "Fernandinho", tom: "G", sugeridoPor: "João (Teclado)", status: "Em Análise" },
    { id: 2, musica: "Bondade de Deus", autor: "Isadora Pompeo", tom: "C", sugeridoPor: "Sarah (Vocal)", status: "Aprovado" }
  ]);

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

  const isSuper = userRole === "super_admin";
  const podeGerenciar = userRole === "super_admin" || userRole === "church_admin";

  const handleEnviarSugestao = (e) => {
    e.preventDefault();
    if (!sugestaoMusica.trim()) return alert("Digite ao menos o nome da música.");

    const novaSugestao = {
      id: Date.now(),
      musica: sugestaoMusica.trim(),
      autor: sugestaoCantor.trim() || "Não informado",
      tom: sugestaoTom.trim() || "-",
      sugeridoPor: userName,
      status: "Em Análise"
    };

    setListaSugestoes([novaSugestao, ...listaSugestoes]);
    setSugestaoMusica("");
    setSugestaoCantor("");
    setSugestaoTom("");
  };

  const handleAlternarStatus = (id) => {
    if (!podeGerenciar) return;
    setListaSugestoes((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Em Análise" ? "Aprovado" : "Em Análise" }
          : item
      )
    );
  };

  const handleDeletarSugestao = (id) => {
    if (!podeGerenciar) return;
    if (!window.confirm("Deseja remover esta sugestão?")) return;
    setListaSugestoes((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28 flex flex-col transition-colors">
      {/* Cabeçalho */}
      <div className="bg-slate-900 dark:bg-slate-900/90 text-white px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/painel-equipe")} 
            className="text-slate-300 hover:text-white transition-colors p-1"
            title="Voltar ao Painel da Equipe"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Music className="w-5 h-5 text-emerald-400" /> Sugestões de Louvor
            </h1>
            <p className="text-slate-400 text-xs">Envie ideias de hinos para a liderança</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right max-w-[180px]">
          {carregandoValidacao ? (
            <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
          ) : (
            <>
              <span className="text-[11px] font-bold text-slate-300 uppercase truncate w-full">
                {nomeIgreja}
              </span>
              <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">
                {isSuper ? (
                  <Globe className="w-2.5 h-2.5 text-amber-400" />
                ) : (
                  <Shield className="w-2.5 h-2.5 text-indigo-400" />
                )}
                {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 mt-4 space-y-4 flex-1 max-w-md mx-auto w-full">
        {/* Card do Formulário */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nova Sugestão de Hino</h3>
          </div>

          <form onSubmit={handleEnviarSugestao} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nome da Música *</label>
              <Input 
                placeholder="Ex: Todas as Coisas, Porque Ele Vive..." 
                value={sugestaoMusica}
                onChange={(e) => setSugestaoMusica(e.target.value)}
                className="h-9 mt-1 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cantor / Grupo</label>
                <Input 
                  placeholder="Ex: Fernandinho, Coro" 
                  value={sugestaoCantor}
                  onChange={(e) => setSugestaoCantor(e.target.value)}
                  className="h-9 mt-1 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tom</label>
                <Input 
                  placeholder="Ex: G, C" 
                  value={sugestaoTom}
                  onChange={(e) => setSugestaoTom(e.target.value)}
                  className="h-9 mt-1 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5 rounded-xl shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Enviar Sugestão à Liderança
            </Button>
          </form>
        </div>

        {/* Lista de Sugestões */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2.5">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sugestões Enviadas pela Equipe</p>

          {listaSugestoes.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">Nenhuma sugestão enviada até o momento.</p>
          ) : (
            listaSugestoes.map((item) => (
              <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.musica}</p>
                    {item.tom !== "-" && (
                      <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded shrink-0">
                        {item.tom}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    Original: {item.autor} • Sugerido por: {item.sugeridoPor}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAlternarStatus(item.id)}
                    disabled={!podeGerenciar}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                      item.status === "Aprovado" 
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50" 
                        : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    } ${!podeGerenciar ? "cursor-default" : "cursor-pointer"}`}
                    title={podeGerenciar ? "Clique para alterar o status" : "Status atual"}
                  >
                    {item.status === "Aprovado" ? <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                    {item.status}
                  </button>

                  {podeGerenciar && (
                    <button
                      onClick={() => handleDeletarSugestao(item.id)}
                      className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                      title="Excluir sugestão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}