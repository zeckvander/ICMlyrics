import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Music, Send, Cloud, Globe, Shield, Loader2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function Sugestoes() {
  const navigate = useNavigate();

  // Estados de Usuário / Igreja / Permissões (Lógica mantida)
  const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
  const [carregandoValidacao, setCarregandoValidacao] = useState(true);
  const [userRole, setUserRole] = useState("user");

  const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const temNuvem = userNuvem.trim() !== "";
  const userName = localStorage.getItem("icmlyrics_user") || "Usuário";

  // Formulário de Sugestão
  const [sugestaoMusica, setSugestaoMusica] = useState("");
  const [sugestaoCantor, setSugestaoCantor] = useState("");
  const [sugestaoTom, setSugestaoTom] = useState("");

  const [listaSugestoes, setListaSugestoes] = useState([
    { musica: "Grandes Coisas", autor: "Fernandinho", tom: "G", sugeridoPor: "João (Teclado)", status: "Em Análise" },
    { musica: "Bondade de Deus", autor: "Isadora Pompeo", tom: "C", sugeridoPor: "Sarah (Vocal)", status: "Aprovado" }
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

  const handleEnviarSugestao = (e) => {
    e.preventDefault();
    if (!sugestaoMusica.trim()) return alert("Digite ao menos o nome da música.");

    const novaSugestao = {
      musica: sugestaoMusica,
      autor: sugestaoCantor || "Não informado",
      tom: sugestaoTom || "-",
      sugeridoPor: userName,
      status: "Em Análise"
    };

    setListaSugestoes([novaSugestao, ...listaSugestoes]);
    setSugestaoMusica("");
    setSugestaoCantor("");
    setSugestaoTom("");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 flex flex-col">
      {/* Cabeçalho Limpo */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/painel-equipe")} 
              className="text-slate-300 hover:text-white transition-colors"
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
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 mt-4 space-y-4 flex-1">
        
        {/* Card do Formulário */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nova Sugestão de Hino</h3>
          </div>

          <form onSubmit={handleEnviarSugestao} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nome da Música *</label>
              <Input 
                placeholder="Ex: Todas as Coisas, Porque Ele Vive..." 
                value={sugestaoMusica}
                onChange={(e) => setSugestaoMusica(e.target.value)}
                className="h-9 mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cantor / Grupo</label>
                <Input 
                  placeholder="Ex: Fernandinho, Coro" 
                  value={sugestaoCantor}
                  onChange={(e) => setSugestaoCantor(e.target.value)}
                  className="h-9 mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tom</label>
                <Input 
                  placeholder="Ex: G, C" 
                  value={sugestaoTom}
                  onChange={(e) => setSugestaoTom(e.target.value)}
                  className="h-9 mt-1 text-xs"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 rounded-xl shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Enviar Sugestão à Liderança
            </Button>
          </form>
        </div>

        {/* Lista de Sugestões Enviadas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sugestões Enviadas pela Equipe</p>

          {listaSugestoes.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Nenhuma sugestão enviada até o momento.</p>
          ) : (
            listaSugestoes.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-slate-800 text-sm">{item.musica}</p>
                    {item.tom !== "-" && (
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                        {item.tom}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Original: {item.autor} • Sugerido por: {item.sugeridoPor}
                  </p>
                </div>

                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                  item.status === "Aprovado" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {item.status}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}