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
      return <div className="h-3" />;
    }

    // Tratamento especial para a linha de Introdução / Instrumental / Final sem colchetes
    const ehIntroOuFinal = linha.toLowerCase().startsWith("introdução:") || 
                           linha.toLowerCase().startsWith("final:") ||
                           linha.toLowerCase().startsWith("instrumentos:");

    if (ehIntroOuFinal && linha.includes(":")) {
      const partesLinha = linha.split(":");
      const rotulo = partesLinha[0] + ":";
      const resto = partesLinha.slice(1).join(":");

      const acordesTranspostos = resto.split(",").map(item => {
        const limpo = item.trim().replace(/[\[\]]/g, '');
        if (!limpo) return "";
        return transporAcorde(limpo, semitonsEfetivos);
      }).join(", ");

      return (
        <div className={`font-mono text-left my-1 ${eEscuro ? 'text-slate-200' : 'text-slate-800'}`}>
          <span className="font-bold">{rotulo}</span>{" "}
          <span className="text-red-600 dark:text-red-400 font-bold">
            {acordesTranspostos}
          </span>
        </div>
      );
    }

    if (!linha.includes("[") && linha.trim().endsWith(":")) {
      return (
        <div className={`font-bold my-1 text-left ${eEscuro ? 'text-slate-100' : 'text-slate-900'}`}>
          {renderizarTextoFormatado(linha)}
        </div>
      );
    }

    let regex = /\[(.*?)\]/g;
    let match;
    let ultimoIndex = 0;
    let blocos = [];

    while ((match = regex.exec(linha)) !== null) {
      const textoAntes = linha.substring(ultimoIndex, match.index);
      const acordeTransposto = transporAcorde(match[1], semitonsEfetivos);

      if (textoAntes || blocos.length > 0) {
        if (blocos.length === 0) {
          blocos.push({ texto: textoAntes, acorde: "", temAcorde: false });
        } else {
          blocos[blocos.length - 1].texto = textoAntes;
        }
      }

      blocos.push({
        acorde: acordeTransposto,
        texto: "",
        temAcorde: true
      });

      ultimoIndex = regex.lastIndex;
    }

    const textoRestante = linha.substring(ultimoIndex);
    if (blocos.length > 0) {
      blocos[blocos.length - 1].texto = textoRestante;
    } else {
      blocos.push({ acorde: "", texto: textoRestante, temAcorde: false });
    }

    return (
      <div className="flex flex-wrap mb-1.5 font-mono leading-tight text-left items-end">
        {blocos.map((bloco, i) => (
          <div key={i} className="flex flex-col inline-block align-bottom">
            {/* Acorde */}
            <span className="text-red-600 dark:text-red-400 font-bold whitespace-pre">
              {bloco.acorde}
            </span>
            {/* Letra da música com a barra vertical injetada automaticamente onde há acorde */}
            <span className={`whitespace-pre font-mono ${eEscuro ? 'text-slate-100' : 'text-slate-900'}`}>
              {bloco.temAcorde && bloco.texto.length > 0 ? (
                <>
                  <span className="text-red-600 dark:text-red-400 font-bold mx-[1px]">|</span>
                  {renderizarTextoFormatado(bloco.texto)}
                </>
              ) : (
                renderizarTextoFormatado(bloco.texto)
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderizarTextoFormatado = (texto) => {
    const partesNegrito = texto.split(/\*(.*?)\*/g);

    return partesNegrito.map((trecho, idx) => {
      const ehNegrito = idx % 2 === 1;

      if (ehNegrito) {
        return (
          <strong key={idx} className="font-bold">
            {trecho}
          </strong>
        );
      }

      return <React.Fragment key={idx}>{trecho}</React.Fragment>;
    });
  };

  return (
    <div className={`p-4 rounded-xl border overflow-x-auto text-left transition-colors ${eEscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
      {linhas.map((linha, index) => (
        <div key={index} className="text-left">{processarLinha(linha)}</div>
      ))}
    </div>
  );
}