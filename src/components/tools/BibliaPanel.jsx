import React, { useState, useEffect } from 'react';
import { ChevronLeft, X, Minus, BookOpen } from 'lucide-react';

export default function BibliaPanel({ onClose, minimized, setMinimized }) {
  const [testamento, setTestamento] = useState(null); // 'antigo-testamento' ou 'novo-testamento'
  const [livro, setLivro] = useState(null);
  const [dadosLivro, setDadosLivro] = useState(null);
  const [capIndex, setCapIndex] = useState(0);

  const carregarLivro = async (t, l) => {
    try {
      const response = await fetch(`/data/biblia/${t}/${l}.json`);
      if (!response.ok) throw new Error("Livro não encontrado");
      const data = await response.json();
      setDadosLivro(data);
      setLivro(l);
      setTestamento(t);
      setCapIndex(0); // Sempre inicia no capítulo 1 (index 0)
    } catch (error) {
      console.error("Erro ao carregar livro:", error);
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white rounded-full shadow-lg flex items-center gap-2 px-4 py-2.5 border border-slate-800 cursor-pointer" onClick={() => setMinimized(false)}>
        <BookOpen className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium">Bíblia</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 w-80 h-96 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Bíblia Sagrada</span>
        <div className="flex gap-2 text-slate-400">
          <Minus className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => setMinimized(true)} />
          <X className="w-4 h-4 cursor-pointer hover:text-white" onClick={onClose} />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4 text-slate-300">
        {!testamento ? (
          <div className="space-y-2">
            <button className="w-full p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-sm transition" onClick={() => setTestamento('antigo-testamento')}>Antigo Testamento</button>
            <button className="w-full p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-sm transition" onClick={() => setTestamento('novo-testamento')}>Novo Testamento</button>
          </div>
        ) : !livro ? (
          <div>
            <button className="flex items-center text-xs mb-4 text-emerald-400 hover:underline" onClick={() => setTestamento(null)}>
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="space-y-1">
              {/* Exemplo: Adicione os livros que você já tem na pasta */}
              <button className="block w-full p-2 text-left text-sm hover:bg-slate-900 rounded" onClick={() => carregarLivro(testamento, 'genesis')}>Gênesis</button>
              <button className="block w-full p-2 text-left text-sm hover:bg-slate-900 rounded" onClick={() => carregarLivro(testamento, 'mateus')}>Mateus</button>
            </div>
          </div>
        ) : (
          <div>
            <button className="flex items-center text-xs mb-2 text-emerald-400 hover:underline" onClick={() => setLivro(null)}>
              <ChevronLeft className="w-4 h-4" /> Voltar aos livros
            </button>
            <h2 className="font-bold text-lg mb-1 text-white">{dadosLivro.nome}</h2>
            <div className="flex gap-2 mb-4">
              <select className="bg-slate-900 text-xs p-1 rounded" value={capIndex} onChange={(e) => setCapIndex(Number(e.target.value))}>
                {dadosLivro.capitulos.map((_, i) => <option key={i} value={i}>Capítulo {i + 1}</option>)}
              </select>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">{dadosLivro.capitulos[capIndex].join(" ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}