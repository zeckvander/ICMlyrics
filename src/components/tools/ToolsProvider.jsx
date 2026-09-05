import React, { useState, createContext, useContext } from "react";
import MetronomoPanel from "./MetronomoPanel";
import AfinadorPanel from "./AfinadorPanel";
import PianoModal from "./PianoModal";

const ToolsContext = createContext(null);

export function useTools() {
  return useContext(ToolsContext);
}

export function ToolsProvider({ children }) {
  const [metronomoOpen, setMetronomoOpen] = useState(false);
  const [afinadorOpen, setAfinadorOpen] = useState(false);
  const [pianoOpen, setPianoOpen] = useState(false);

  const [metronomoMin, setMetronomoMin] = useState(false);
  const [afinadorMin, setAfinadorMin] = useState(false);
  const [pianoMin, setPianoMin] = useState(false);

  const minimizedStack = [
    metronomoOpen && metronomoMin && "metronomo",
    afinadorOpen && afinadorMin && "afinador",
    pianoOpen && pianoMin && "piano",
  ].filter(Boolean);

  return (
    <ToolsContext.Provider
      value={{
        openMetronomo: () => {
          setMetronomoOpen(true);
          setMetronomoMin(false);
        },
        openAfinador: () => {
          setAfinadorOpen(true);
          setAfinadorMin(false);
        },
        openPiano: () => {
          setPianoOpen(true);
          setPianoMin(false);
        },
      }}
    >
      {children}

      {metronomoOpen && (
        <MetronomoPanel
          onClose={() => {
            setMetronomoOpen(false);
            setMetronomoMin(false);
          }}
          minimized={metronomoMin}
          setMinimized={setMetronomoMin}
          stackLevel={minimizedStack.indexOf("metronomo")}
          isStacked={minimizedStack.indexOf("metronomo") > 0}
        />
      )}

      {afinadorOpen && (
        <AfinadorPanel
          onClose={() => {
            setAfinadorOpen(false);
            setAfinadorMin(false);
          }}
          minimized={afinadorMin}
          setMinimized={setAfinadorMin}
          stackLevel={minimizedStack.indexOf("afinador")}
          isStacked={minimizedStack.indexOf("afinador") > 0}
        />
      )}

      {pianoOpen && (
        <PianoModal
          onClose={() => {
            setPianoOpen(false);
            setPianoMin(false);
          }}
          minimized={pianoMin}
          setMinimized={setPianoMin}
          isFloating={true}
          stackLevel={minimizedStack.indexOf("piano")}
          isStacked={minimizedStack.indexOf("piano") > 0}
        />
      )}
    </ToolsContext.Provider>
  );
}

export default ToolsProvider;