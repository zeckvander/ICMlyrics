import React, { useState, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ListaRow({ row, index, onChange, onRemove, louvores }) {
  const [suggestions, setSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (row.type !== "divider") {
      const temNumeroValido = row.numero && !String(row.numero).startsWith("local_");
      setInputValue(temNumeroValido ? `${row.numero} - ${row.nome}` : row.nome || "");
    }
  }, [row.id, row.nome, row.numero]);

  const handleInputChange = (value) => {
    setInputValue(value);

    if (!value.trim()) {
      setSuggestions([]);
      // Mantém a categoria atual ou define "--", sem forçar "Avulsos"
      onChange({ ...row, nome: "", numero: "", id_louvor_db: null, categoria: row.categoria || "--" });
      return;
    }

    const filtered = (louvores || [])
      .filter((l) => {
        const nomeLouvor = l.nome || l.text || "";
        const numeroLouvor = l.numero && !String(l.numero).startsWith("local_") ? l.numero : "";
        
        const porNumero = numeroLouvor ? String(numeroLouvor).toLowerCase().includes(value.toLowerCase()) : false;
        const porNome = String(nomeLouvor).toLowerCase().includes(value.toLowerCase());
        
        return porNumero || porNome;
      })
      .slice(0, 5);

    setSuggestions(filtered);
  };

  const handleSelectSuggestion = (louvor) => {
    const nomeFinal = louvor.nome || louvor.text || "";
    const numeroFinal = louvor.numero && !String(louvor.numero).startsWith("local_") ? louvor.numero : "";
    
    const formattedText = numeroFinal ? `${numeroFinal} - ${nomeFinal}` : nomeFinal;
    setInputValue(formattedText);
    setSuggestions([]);
    
    onChange({
      ...row,
      nome: nomeFinal,
      numero: numeroFinal,
      // Preserva a categoria do banco de dados ou mantém a atual
      categoria: louvor.categoria || row.categoria || "--",
      id_louvor_db: louvor.id 
    });
  };

  const handleBlur = () => {
    setTimeout(() => {
      setSuggestions([]);
      const temNumeroValido = row.numero && !String(row.numero).startsWith("local_");
      const atual = temNumeroValido ? `${row.numero} - ${row.nome}` : row.nome;
      if (inputValue !== atual) {
        onChange({ ...row, nome: inputValue });
      }
    }, 250);
  };

  if (row.type === "divider") {
    return (
      <Draggable draggableId={row.id} index={index}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps} className="bg-amber-50 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-amber-100">
            <span {...provided.dragHandleProps} className="cursor-grab text-amber-400 touch-none">
              <GripVertical className="w-4 h-4" />
            </span>
            <Input
              value={row.text || ""}
              onChange={(e) => onChange({ ...row, text: e.target.value })}
              placeholder="Ex: Palavra, Oração, Avisos..."
              className="flex-1 h-9 text-sm text-center font-medium bg-transparent border-0 focus-visible:ring-0"
            />
            <button type="button" onClick={onRemove} className="text-amber-400 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </Draggable>
    );
  }

  return (
    <Draggable draggableId={row.id} index={index}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.draggableProps} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <span {...provided.dragHandleProps} className="cursor-grab text-slate-300 hover:text-slate-500 touch-none mt-2">
              <GripVertical className="w-5 h-5" />
            </span>
            <div className="flex-1 space-y-2 relative">
              <div className="flex gap-2 items-center">
                {/* Exibe o valor atual da categoria sem permitir cliques */}
                <div className="h-9 px-3 text-xs w-28 shrink-0 bg-slate-100 text-slate-600 font-medium rounded-md border border-slate-200 flex items-center justify-center select-none">
                  {row.categoria || "--"}
                </div>
                
                <div className="flex-1 relative">
                  <Input 
                    value={inputValue} 
                    onChange={(e) => handleInputChange(e.target.value)} 
                    onFocus={(e) => handleInputChange(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Nome ou Número do Louvor" 
                    className="h-9 text-sm w-full" 
                  />

                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {suggestions.map((l, idx) => {
                        const nomeExibir = l.nome || l.text || "";
                        const numeroExibir = l.numero && !String(l.numero).startsWith("local_") ? l.numero : "";
                        return (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => handleSelectSuggestion(l)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 border-b last:border-0 block truncate text-slate-700 font-medium"
                          >
                            {numeroExibir ? `${numeroExibir} - ` : ""}{nomeExibir} <span className="text-slate-400 font-normal">({l.categoria || "--"})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <Input value={row.observacao || ""} onChange={(e) => onChange({ ...row, observacao: e.target.value })} placeholder="Observação (opcional)" className="h-9 text-xs text-slate-500" />
            </div>
            <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-400 mt-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}