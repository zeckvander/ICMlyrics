import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Feather, 
  Church, 
  Heart, 
  FileText,
  Cloud,
  Radio
} from "lucide-react";
import DrawerMenu from "@/components/louvores/DrawerMenu";
import { supabase } from "@/lib/supabaseClient";

export default function Culto({ onNavigate }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [nomeIgreja, setNomeIgreja] = useState("");
  const [carregandoIgreja, setCarregandoIgreja] = useState(false);

  const usuarioNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";
  const usuarioLocal = localStorage.getItem("icmlyrics_user") || "";
  const temNuvem = usuarioNuvem.trim() !== "";

  useEffect(() => {
    const tema = localStorage.getItem("icmlyrics_tema");
    if (tema === "escuro") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const carregarNomeIgreja = async () => {
    setCarregandoIgreja(true);
    const usuarioAtual = usuarioNuvem || usuarioLocal;

    if (temNuvem && usuarioAtual) {
      try {
        const { data, error } = await supabase
          .from("igrejas_autorizadas")
          .select("nome_igreja")
          .eq("usuario", usuarioAtual)
          .maybeSingle();

        if (!error && data && data.nome_igreja) {
          setNomeIgreja(data.nome_igreja);
        } else {
          setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioAtual);
        }
      } catch (e) {
        setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioAtual);
      } finally {
        setCarregandoIgreja(false);
      }
    } else {
      setNomeIgreja(localStorage.getItem("icmlyrics_nome_igreja") || usuarioLocal || "Modo Local");
      setCarregandoIgreja(false);
    }
  };

  useEffect(() => {
    carregarNomeIgreja();
  }, [temNuvem, usuarioNuvem, usuarioLocal]);

  const cardColor = 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80';
  const iconBaseColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

  const menuItems = [
    {
      id: 'dados',
      path: '/dados',
      title: 'Dados do Culto',
      description: 'Horários, dirigentes, obreiros presentes e informações gerais.',
      icon: Church,
      color: cardColor,
      iconBg: iconBaseColor
    },
    {
      id: 'dons',
      path: '/registro-dons',
      title: 'Registro de Dons',
      description: 'Registre sonhos, visões, revelações e gere cartazes.',
      icon: Feather,
      color: cardColor,
      iconBg: iconBaseColor
    },
    {
      id: 'pedidos',
      path: '/oracao',
      title: 'Pedidos de Oração',
      description: 'Espaço para registrar e acompanhar os pedidos de oração.',
      icon: Heart,
      color: cardColor,
      iconBg: iconBaseColor
    },
    {
      id: 'relatorio',
      path: '/culto/relatorio',
      title: 'Relatório Geral',
      description: 'Resumo consolidado do culto pronto para envio.',
      icon: FileText,
      color: cardColor,
      iconBg: iconBaseColor
    },
    {
      id: 'radios',
      path: '/radios-online', 
      title: 'Rádios Online',
      description: 'Acesse a Rádio Maanaim e outras transmissões web.',
      icon: Radio,
      color: cardColor,
      iconBg: iconBaseColor
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative font-['Inter',sans-serif] text-[#1e293b] dark:text-slate-100 transition-colors duration-200">
      <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 pt-12 pb-6 flex items-center justify-between sticky top-0 z-30 shadow-md border-b border-transparent dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-1.5">
              <Church className="w-5 h-5 text-emerald-400 shrink-0" /> Culto
            </h1>
            <p className="text-slate-400 text-xs">Gerenciamento de funções </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right max-w-[180px]">
          {temNuvem && (
            <span className="text-[11px] font-bold text-slate-300 uppercase truncate w-full">
              {nomeIgreja}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                carregarNomeIgreja();
              }}
              className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <Cloud className={`w-3 h-3 ${temNuvem ? "text-emerald-400" : "text-slate-400"} ${carregandoIgreja ? "animate-spin" : ""}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.path) navigate(item.path);
                  if (onNavigate) onNavigate(item.id);
                }}
                className={`p-6 rounded-2xl border shadow-sm transition-all text-left flex items-start gap-4 ${item.color}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${item.iconBg}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1 text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}