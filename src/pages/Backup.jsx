import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Upload, ShieldCheck, Database, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Backup() {
  const navigate = useNavigate();
  const [groupedItems, setGroupedItems] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState({});

  const mapearCategorias = () => {
    const categorias = {
      favoritos: { label: "Hinos Favoritos", chaves: [], detect: ["fav", "like", "louvor_salvo"] },
      historico: { label: "Histórico de Louvores Acessados", chaves: [], detect: ["hist", "recent"] },
      biblia: { label: "Minhas Marcações da Bíblia", chaves: [], detect: ["biblia", "vers", "marcac"] },
      listas: { label: "Minhas Listas de Louvor e Playlists", chaves: [], detect: ["lista", "play", "coletanea"] },
      perfil: { label: "Meus Dados de Perfil", chaves: [], detect: ["icmlyrics_user", "icmlyrics_user_nuvem"] },
      permissoes: { label: "Acesso e Permissões", chaves: [], detect: ["icmlyrics_role", "permiss"] },
      sessao: { label: "Usuário", chaves: [], detect: ["sb-", "auth", "session"] },
      config: { label: "Preferências e Ajustes do Aplicativo", chaves: [], detect: ["theme", "config", "version", "ajuste"] },
    };

    const outros = { label: "Outros Dados do Sistema", chaves: [] };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const keyLower = key.toLowerCase();
      let encaixou = false;

      for (const catId in categorias) {
        if (categorias[catId].detect.some(d => keyLower.includes(d))) {
          categorias[catId].chaves.push(key);
          encaixou = true;
          break;
        }
      }
      if (!encaixou) {
        outros.chaves.push(key);
      }
    }

    const listaFinal = [];
    const iniciaisSelecionados = {};

    Object.keys(categorias).forEach(id => {
      if (categorias[id].chaves.length > 0) {
        listaFinal.push({ id, label: categorias[id].label, chaves: categorias[id].chaves });
        iniciaisSelecionados[id] = true;
      }
    });

    if (outros.chaves.length > 0) {
      listaFinal.push({ id: "outros", label: outros.label, chaves: outros.chaves });
      iniciaisSelecionados["outros"] = true;
    }

    setGroupedItems(listaFinal);
    setSelectedGroups(iniciaisSelecionados);
  };

  useEffect(() => {
    mapearCategorias();
  }, []);

  const toggleGroup = (id) => {
    setSelectedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (status) => {
    const updated = {};
    groupedItems.forEach(item => {
      updated[item.id] = status;
    });
    setSelectedGroups(updated);
  };

  // Tenta encontrar o nome ou ID do usuário dinamicamente para usar no arquivo
  const obterNomeUsuarioDoStorage = () => {
    try {
      // 1. Tenta buscar direto na sua string crua do icmlyrics_user
      const userRaw = localStorage.getItem("icmlyrics_user");
      if (userRaw) {
        if (userRaw.startsWith("{")) {
          const parsed = JSON.parse(userRaw);
          if (parsed.name || parsed.username || parsed.email) {
            return (parsed.name || parsed.username || parsed.email).split("@")[0].replace(/[^a-zA-Z0-9]/g, "_");
          }
        }
        return userRaw.replace(/[^a-zA-Z0-9]/g, "_");
      }

      // 2. Se falhar, varre chaves do Supabase em busca do email logado
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("sb-") && key.includes("-auth-token")) {
          const sessionData = JSON.parse(localStorage.getItem(key));
          if (sessionData?.user?.email) {
            return sessionData.user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_");
          }
        }
      }
    } catch (e) {
      console.warn("Não foi possível processar o nome do usuário para o arquivo.", e);
    }
    return ""; // Retorna vazio se não achar nada
  };

  const exportarBackupAgrupado = () => {
    try {
      const objetoExportacao = {};
      let temItem = false;

      groupedItems.forEach(grupo => {
        if (selectedGroups[grupo.id]) {
          grupo.chaves.forEach(chave => {
            objetoExportacao[chave] = localStorage.getItem(chave);
            temItem = true;
          });
        }
      });

      if (!temItem) {
        alert("Por favor, selecione ao menos uma categoria para gerar o arquivo.");
        return;
      }

      const blob = new Blob([JSON.stringify(objetoExportacao, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Obtém o nome limpo do usuário e monta a nomenclatura inteligente
      const nomeUsuario = obterNomeUsuarioDoStorage();
      const sufixoNome = nomeUsuario ? `_${nomeUsuario}` : "";
      
      a.download = `backup_icmlyrics${sufixoNome}.json`;
      
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erro ao gerar o arquivo de backup.");
    }
  };

  const importarLocalStorageCompleto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const dadosImportados = JSON.parse(ev.target.result);
        if (dadosImportados && typeof dadosImportados === "object" && !Array.isArray(dadosImportados)) {
          Object.keys(dadosImportados).forEach((chave) => {
            localStorage.setItem(chave, dadosImportados[chave]);
          });
          alert("Dados restaurados com sucesso no icmlyrics!");
          navigate("/dashboard");
          window.location.reload();
        } else {
          alert("Este arquivo de backup não é válido.");
        }
      } catch {
        alert("Não foi possível ler o arquivo selecionado.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Gerenciar Meus Dados</h1>
      </div>
      <div className="p-4 space-y-4 max-w-md mx-auto mt-2">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3">
          <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Cópia de Segurança</h3>
            <p className="text-xs text-slate-400 mt-1 px-2 leading-relaxed">
              Escolha abaixo quais dados você deseja salvar no seu arquivo. Você poderá usar este arquivo para restaurar suas informações a qualquer momento.
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" /> Categorias:
            </span>
            <div className="flex gap-3 text-[11px] font-semibold text-indigo-600">
              <button onClick={() => toggleAll(true)}>Selecionar Tudo</button>
              <button onClick={() => toggleAll(false)} className="text-slate-400">Limpar</button>
            </div>
          </div>
          {groupedItems.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Nenhum histórico ou dado salvo neste dispositivo.</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {groupedItems.map((grupo) => (
                <button
                  key={grupo.id}
                  onClick={() => toggleGroup(grupo.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border text-xs transition-all ${
                    selectedGroups[grupo.id]
                      ? "bg-indigo-50/40 border-indigo-100 text-slate-800 font-medium"
                      : "bg-white border-slate-100 text-slate-400"
                  }`}
                >
                  <span className="truncate max-w-[240px]">{grupo.label}</span>
                  {selectedGroups[grupo.id] ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
          <Button 
            onClick={exportarBackupAgrupado} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-xl text-xs h-11 gap-2"
          >
            <Download className="w-4 h-4" /> Baixar Backup.json
          </Button>
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-300 font-bold uppercase tracking-wider">Ou</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <label className="w-full flex items-center justify-center gap-2 h-11 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer bg-slate-50/50 transition-colors">
            <Upload className="w-4 h-4" /> Restaurar Backup.json
            <input type="file" accept=".json" className="hidden" onChange={importarLocalStorageCompleto} />
          </label>
        </div>
      </div>
    </div>
  );
}