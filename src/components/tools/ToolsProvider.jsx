import React, { useState, createContext, useContext } from "react";
import MetronomoPanel from "./MetronomoPanel";
import AfinadorPanel from "./AfinadorPanel";

const ToolsContext = createContext(null);

export function useTools() {
  return useContext(ToolsContext);
}

export function ToolsProvider({ children }) {
  const [metronomoOpen, setMetronomoOpen] = useState(false);
  const [afinadorOpen, setAfinadorOpen] = useState(false);

  const [metronomoMin, setMetronomoMin] = useState(false);
  const [afinadorMin, setAfinadorMin] = useState(false);

  const afinadorSubiu = afinadorMin && metronomoMin;

  return (
    <ToolsContext.Provider value={{
      openMetronomo: () => { setMetronomoOpen(true); setMetronomoMin(false); },
      openAfinador: () => { setAfinadorOpen(true); setAfinadorMin(false); },
    }}>
      {children}
      
      {metronomoOpen && (
        <MetronomoPanel 
          onClose={() => { setMetronomoOpen(false); setMetronomoMin(false); }} 
          minimized={metronomoMin}
          setMinimized={setMetronomoMin}
          isStacked={false} 
        />
      )}
      
      {afinadorOpen && (
        <AfinadorPanel 
          onClose={() => { setAfinadorOpen(false); setAfinadorMin(false); }} 
          minimized={afinadorMin}
          setMinimized={setAfinadorMin}
          isStacked={afinadorSubiu}
        />
      )}
    </ToolsContext.Provider>
  );
}