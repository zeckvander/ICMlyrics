import React, { useState, useRef, useEffect } from "react";
import { Minus, X, Play, Square, Settings2, Plus, ListMusic, Gauge, Volume2, Move, Anchor, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MetronomoPanel({ onClose, minimized, setMinimized, isStacked }) {
  const [bpm, setBpm] = useState(80);
  const [beatsPerCompasso, setBeatsPerCompasso] = useState(4); 
  const [notaValor, setNotaValor] = useState(4); 
  const [playing, setPlaying] = useState(false);
  const [subdivision, setSubdivision] = useState("seminima");
  const [accent, setAccent] = useState(true);
  const [volume, setVolume] = useState(0.6); 
  
  const [showPresets, setShowPresets] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Estado de travamento do METRÔNOMO INTEIRO
  const [mainLocked, setMainLocked] = useState(true);

  // Posição do METRÔNOMO INTEIRO
  const [mainPos, setMainPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const beatCountRef = useRef(0);
  
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beatsPerCompasso);
  const notaValorRef = useRef(notaValor);
  const subdivRef = useRef(subdivision);
  const accentRef = useRef(accent);
  const volumeRef = useRef(volume);

  const isComposto = beatsPerCompasso >= 6 && beatsPerCompasso % 3 === 0;

  useEffect(() => {
    if (isComposto) {
      setSubdivision("composto_macro");
    } else {
      setSubdivision("seminima");
    }
  }, [beatsPerCompasso, notaValor]);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsRef.current = beatsPerCompasso; }, [beatsPerCompasso]);
  useEffect(() => { notaValorRef.current = notaValor; }, [notaValor]);
  useEffect(() => { subdivRef.current = subdivision; }, [subdivision]);
  useEffect(() => { accentRef.current = accent; }, [accent]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  useEffect(() => {
    return () => stop();
  }, []);

  const handleMouseDown = (e) => {
    if (mainLocked) return; 
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return; 
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - mainPos.x,
      y: e.clientY - mainPos.y
    };

    const handleMouseMove = (moveEvent) => {
      setMainPos({
        x: moveEvent.clientX - dragStartRef.current.x,
        y: moveEvent.clientY - dragStartRef.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const playClick = (time, isAccent) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = isAccent ? 880 : 440;
    
    gain.gain.setValueAtTime(volumeRef.current, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  };

  const scheduleBeat = (beatIdx, time) => {
    const isFirst = beatIdx % beatsRef.current === 0;
    const sub = subdivRef.current;

    if (isComposto && sub === "composto_macro") {
      if (beatIdx % 3 === 0) {
        const isRealFirst = beatIdx === 0 || (beatIdx / 3) % (beatsRef.current / 3) === 0;
        playClick(time, accentRef.current && isRealFirst);
      }
      return;
    }

    playClick(time, accentRef.current && isFirst);
    
    const baseSeconds = (60 / bpmRef.current) * (4 / notaValorRef.current);

    if (sub === "colcheia") {
      playClick(time + baseSeconds * 0.5, false);
    } else if (sub === "semicolcheia") {
      for (let i = 1; i < 4; i++) playClick(time + baseSeconds * (i / 4), false);
    } else if (sub === "fusa") {
      for (let i = 1; i < 8; i++) playClick(time + baseSeconds * (i / 8), false);
    } else if (sub === "semifusa") {
      for (let i = 1; i < 16; i++) playClick(time + baseSeconds * (i / 16), false);
    } else if (sub === "tercina_seminima") {
      if (beatIdx % 2 === 0) {
        playClick(time + baseSeconds * (2 / 3), false);
        playClick(time + baseSeconds * (4 / 3), false);
      }
    } else if (sub === "tercina_colcheia") {
      for (let i = 1; i < 3; i++) playClick(time + baseSeconds * (i / 3), false);
    } else if (sub === "tercina_semicolcheia") {
      for (let i = 1; i < 6; i++) playClick(time + baseSeconds * (i / 6), false);
    } else if (sub === "sextina") {
      for (let i = 1; i < 6; i++) playClick(time + baseSeconds * (i / 6), false);
    }
  };

  const runScheduler = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      scheduleBeat(beatCountRef.current, nextNoteTimeRef.current);
      nextNoteTimeRef.current += (60 / bpmRef.current) / (4 / notaValorRef.current);
      beatCountRef.current++;
    }
  };

  const start = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    nextNoteTimeRef.current = ctx.currentTime + 0.1;
    beatCountRef.current = 0;
    setPlaying(true);
    intervalRef.current = setInterval(runScheduler, 25);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setPlaying(false);
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  if (minimized) {
  return (
    <div className={`fixed ${isStacked ? "bottom-20" : "bottom-5"} left-5 z-50 bg-slate-900 text-white rounded-full shadow-lg flex items-center gap-2 pr-4 pl-3 py-2.5 border border-slate-800`}>
      <button onClick={() => setMinimized(false)} className="flex items-center gap-2">
        <Square className={`w-4 h-4 ${playing ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
        <span className="text-sm font-medium">Metrônomo</span>
        {playing && <span className="text-xs text-slate-400">{bpm} BPM ({beatsPerCompasso}/{notaValor})</span>}
      </button>
      <button onClick={handleClose} className="ml-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
    </div>
  );
}

  return (
    <div 
      style={{ transform: `translate(${mainPos.x}px, ${mainPos.y}px)` }}
      className="fixed bottom-5 left-5 z-50 bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 w-72 h-[460px] flex flex-col overflow-hidden select-none transition-transform font-sans"
    >
      {/* CABEÇALHO ESCURO PRINCIPAL */}
      <div 
        onMouseDown={handleMouseDown}
        className={`bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0 ${mainLocked ? 'cursor-default' : 'cursor-move'}`}
      >
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          {!mainLocked && <Move className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
          Metrônomo
        </span>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              if (!mainLocked) setMainPos({ x: 0, y: 0 }); 
              setMainLocked(!mainLocked);
            }}
            className="text-slate-400 hover:text-white p-1 transition-colors"
            title={mainLocked ? "Clique para liberar o movimento" : "Clique para fixar de volta na origem"}
          >
            {mainLocked ? <Anchor className="w-4 h-4" /> : <Hand className="w-4 h-4 text-emerald-400" />}
          </button>
          
          <button onClick={() => setMinimized(true)} className="text-slate-400 hover:text-white p-1"><Minus className="w-4 h-4" /></button>
          <button onClick={handleClose} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col overflow-hidden space-y-4">
        
        {/* CONTEÚDO CONDICIONAL: SE ESTIVER NOS PRESETS (PADRÕES) */}
        {showPresets ? (
          <div className="flex-grow flex flex-col overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center bg-slate-900/50 border border-slate-900 -mx-4 -mt-4 px-4 py-2.5 mb-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-slate-400">
                <ListMusic className="w-4 h-4 text-emerald-400" />
                <p className="text-[10px] font-black uppercase tracking-widest">Padrões</p>
              </div>
              <button onClick={() => setShowPresets(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DUAS COLUNAS COM 4 ELEMENTOS SEGUINDO A ORDEM EXATA PEDIDA */}
            <div className="flex-grow overflow-y-auto pr-1 pb-1 grid grid-cols-2 gap-2.5 auto-rows-max">
              {[ 
                { n: 2, d: 4 }, { n: 2, d: 2 }, 
                { n: 3, d: 4 }, { n: 6, d: 8 }, 
                { n: 4, d: 4 }, { n: 9, d: 8 }, 
                { n: 5, d: 4 }, { n: 12, d: 8 }
              ].map((item) => (
                <button
                  key={`${item.n}/${item.d}`}
                  onClick={() => { setBeatsPerCompasso(item.n); setNotaValor(item.d); setShowPresets(false); }}
                  className={`h-11 rounded-xl text-xs font-black transition-all border ${
                    beatsPerCompasso === item.n && notaValor === item.d
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg scale-102" 
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {item.n}/{item.d}
                </button>
              ))}
            </div>
          </div>
        ) : showManual ? (
          /* CONTEÚDO CONDICIONAL: SE ESTIVER NO MANUAL */
          <div className="flex-grow flex flex-col overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center bg-slate-900/50 border border-slate-900 -mx-4 -mt-4 px-4 py-2.5 mb-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-slate-400">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <p className="text-[10px] font-black uppercase tracking-widest">Ajuste Manual</p>
              </div>
              <button onClick={() => setShowManual(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-grow flex flex-col justify-center space-y-5 py-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase text-center block">Numerador</label>
                <div className="flex items-center justify-center gap-6">
                  <button onClick={() => setBeatsPerCompasso(b => Math.max(1, b - 1))} className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white font-bold text-xl text-slate-400 transition">−</button>
                  <span className="text-3xl font-black text-slate-100 w-12 text-center tabular-nums">{beatsPerCompasso}</span>
                  <button onClick={() => setBeatsPerCompasso(b => Math.min(99, b + 1))} className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white font-bold text-xl text-slate-400 transition">+</button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase text-center block">Denominador</label>
                <div className="flex items-center justify-center gap-6">
                  <button onClick={() => setNotaValor(v => Math.max(1, v - 1))} className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white font-bold text-xl text-slate-400 transition">−</button>
                  <span className="text-3xl font-black text-slate-100 w-12 text-center tabular-nums">{notaValor}</span>
                  <button onClick={() => setNotaValor(v => Math.min(99, v + 1))} className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white font-bold text-xl text-slate-400 transition">+</button>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowManual(false)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 h-11 rounded-xl font-black shadow-lg flex-shrink-0 mt-auto transition border border-emerald-400 uppercase tracking-wider text-xs">Aplicar Ajuste</Button>
          </div>
        ) : (
          /* TELA PADRÃO DO METRÔNOMO */
          <div className="flex-grow flex flex-col justify-between overflow-hidden space-y-4">
            {/* BOTÕES DE GATILHO */}
            <div className="flex items-center justify-between gap-2">
              <Button 
                variant="ghost" 
                onClick={() => { setShowPresets(true); setShowManual(false); }} 
                className="h-8 flex-1 text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-lg px-2 justify-start gap-1.5 uppercase tracking-wider transition"
              >
                <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fórmulas</span>
              </Button>

              <button 
                onClick={() => { setShowManual(true); setShowPresets(false); }}
                className="flex flex-1 items-center justify-center border border-slate-800 rounded-lg p-0.5 bg-slate-900 hover:bg-slate-800 transition h-8 gap-1.5 px-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider"
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums">{beatsPerCompasso}/{notaValor}</span>
                <div className="flex flex-col leading-none text-slate-500">
                   <Plus className="w-2 h-2" />
                   <Minus className="w-2 h-2" />
                </div>
              </button>
            </div>

            {/* CONTROLES DO BPM */}
            <div className="flex items-center justify-center gap-5">
              <button onClick={() => setBpm((b) => Math.max(40, b - 1))} className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-bold text-lg flex items-center justify-center hover:bg-slate-800 hover:text-white transition">−</button>
              <div className="text-center">
                <p className={`text-5xl font-black block transition-all ${playing ? "text-emerald-400" : "text-slate-100"} tabular-nums`}>{bpm}</p>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-0.5">BPM</p>
              </div>
              <button onClick={() => setBpm((b) => Math.min(240, b + 1))} className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-bold text-lg flex items-center justify-center hover:bg-slate-800 hover:text-white transition">+</button>
            </div>

            <input type="range" min="40" max="240" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer" />

            {/* SELEÇÃO DE SUBDIVISÃO */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {isComposto ? "Modo de Compasso Composto" : "Subdivisão"}
              </Label>
              <Select value={subdivision} onValueChange={setSubdivision}>
                <SelectTrigger className="h-9 text-xs bg-slate-900 border-slate-800 text-slate-300 focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                  {isComposto ? (
                    <>
                      <SelectItem value="composto_macro" className="focus:bg-slate-800 focus:text-white text-xs">Pulso Principal (Macro Ternário)</SelectItem>
                      <SelectItem value="composto_micro" className="focus:bg-slate-800 focus:text-white text-xs">Subdividido por Figura (Micro)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="seminima" className="focus:bg-slate-800 focus:text-white text-xs">Semínima (1 tempo)</SelectItem>
                      <SelectItem value="colcheia" className="focus:bg-slate-800 focus:text-white text-xs">Colcheia (1/2 tempo)</SelectItem>
                      <SelectItem value="semicolcheia" className="focus:bg-slate-800 focus:text-white text-xs">Semicolcheia (1/4 tempo)</SelectItem>
                      <SelectItem value="fusa" className="focus:bg-slate-800 focus:text-white text-xs">Fusa (1/8 tempo)</SelectItem>
                      <SelectItem value="semifusa" className="focus:bg-slate-800 focus:text-white text-xs">Semifusa (1/16 tempo)</SelectItem>
                      <SelectItem value="tercina_seminima" className="focus:bg-slate-800 focus:text-white text-xs">Tercina de Semínima</SelectItem>
                      <SelectItem value="tercina_colcheia" className="focus:bg-slate-800 focus:text-white text-xs">Tercina de Colcheia</SelectItem>
                      <SelectItem value="tercina_semicolcheia" className="focus:bg-slate-800 focus:text-white text-xs">Tercina de Semicolcheia</SelectItem>
                      <SelectItem value="sextina" className="focus:bg-slate-800 focus:text-white text-xs">Sextina</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* ACENTUAÇÃO */}
            <div className="flex items-center justify-between bg-slate-900/30 border border-slate-900/80 p-2 rounded-xl">
              <Label htmlFor="accent" className="text-xs text-slate-400 font-medium">Acentuar 1º tempo</Label>
              <Switch id="accent" checked={accent} onCheckedChange={setAccent} className="data-[state=checked]:bg-emerald-500" />
            </div>

            {/* CONTROLE DE VOLUME */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1"><Volume2 className="w-3.5 h-3.5 text-slate-400" /> Volume</span>
                <span className="tabular-nums text-emerald-400">{Math.round(volume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))} 
                className="w-full h-1.5 accent-emerald-500 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* BOTÃO PLAY/STOP */}
            <Button
              onClick={playing ? stop : start}
              className={`w-full h-11 rounded-xl font-black uppercase tracking-wider text-xs border transition shadow-lg gap-2 ${
                playing 
                  ? "bg-red-950/40 text-red-400 border-red-900 hover:bg-red-900 hover:text-white" 
                  : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-400"
              }`}
            >
              {playing ? <><Square className="w-4 h-4 fill-current" /> Parar</> : <><Play className="w-4 h-4 fill-current" /> Iniciar</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}