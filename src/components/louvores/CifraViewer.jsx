import React, { useState, useEffect } from "react";
import { transporAcorde } from "@/components/louvores/escalas";

export default function CifraViewer({ textoCifra, transposicao = 0 }) {
  const [tema, setTema] = useState(() => localStorage.getItem('icmlyrics_tema') || 'escuro');
  const eEscuro = tema === 'escuro';

  useEffect(() => {
    const handleStorage = () => {
      setTema(localStorage.getItem('icmlyrics_tema') || 'escuro');
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (!textoCifra) return null;

  const linhas = textoCifra.split("\n");
  const semitonsEfetivos = ((transposicao % 12) + 12) % 12;

  const processarLinha = (linha) => {
    if (linha.trim() === "") {
      return <div className="h-4" />;
    }

    if (!linha.includes("[") && linha.trim().endsWith(":")) {
      return (
        <div className={`font-bold my-2 text-left ${eEscuro ? 'text-slate-100' : 'text-slate-900'}`}>
          {linha}
        </div>
      );
    }

    let blocos = [];
    let regex = /\[(.*?)\]/g;
    let match;
    let ultimoIndex = 0;
    let textoLimpo = "";

    while ((match = regex.exec(linha)) !== null) {
      const textoAntes = linha.substring(ultimoIndex, match.index);
      textoLimpo += textoAntes;
      blocos.push({
        posicao: textoLimpo.length,
        acorde: transporAcorde(match[1], semitonsEfetivos)
      });
      ultimoIndex = regex.lastIndex;
    }
    textoLimpo += linha.substring(ultimoIndex);

    if (blocos.length === 0) {
      return (
        <div className={`font-mono text-left ${eEscuro ? 'text-slate-200' : 'text-slate-800'}`}>
          {renderizarLetraComBarras(linha)}
        </div>
      );
    }

    let linhaAcordesFormatada = "";
    let posicaoAtual = 0;

    blocos.forEach((bloco) => {
      if (bloco.posicao > posicaoAtual) {
        linhaAcordesFormatada += " ".repeat(bloco.posicao - posicaoAtual);
      }
      linhaAcordesFormatada += bloco.acorde;
      posicaoAtual = bloco.posicao + bloco.acorde.length;
    });

    return (
      <div className="mb-2 font-mono leading-tight text-left">
        <div className="text-red-600 dark:text-red-400 font-bold whitespace-pre text-left">
          {linhaAcordesFormatada.trimStart()}
        </div>
        <div className={`whitespace-pre text-left ${eEscuro ? 'text-slate-100' : 'text-slate-900'}`}>
          {renderizarLetraComBarras(textoLimpo)}
        </div>
      </div>
    );
  };

  const renderizarLetraComBarras = (texto) => {
    const partes = texto.split("|");
    return partes.map((parte, i) => (
      <React.Fragment key={i}>
        {parte}
        {i < partes.length - 1 && (
          <span className="text-red-600 dark:text-red-400 font-bold">|</span>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className={`p-4 rounded-xl border overflow-x-auto text-left transition-colors ${eEscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
      {linhas.map((linha, index) => (
        <div key={index} className="text-left">{processarLinha(linha)}</div>
      ))}
    </div>
  );
}