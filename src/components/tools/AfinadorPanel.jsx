import React, { useState, useRef, useEffect } from "react";
import { Minus, X, Mic, MicOff, ChevronDown, Settings2 } from "lucide-react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const INSTRUMENTOS_PRESETS = {
  chromatic: { nome: "Cromático", cordas: [] },
  guitarra: {
    nome: "Guitarra / Violão",
    cordas: [
      { nota: "E", oitava: 4, freqAlvo: 329.63 },
      { nota: "B", oitava: 3, freqAlvo: 246.94 },
      { nota: "G", oitava: 3, freqAlvo: 196.00 },
      { nota: "D", oitava: 3, freqAlvo: 146.83 },
      { nota: "A", oitava: 2, freqAlvo: 110.00 },
      { nota: "E", oitava: 2, freqAlvo: 82.41 }
    ]
  },
  baixo4: {
    nome: "Baixo (4 Cordas)",
    cordas: [
      { nota: "G", oitava: 2, freqAlvo: 98.00 },
      { nota: "D", oitava: 2, freqAlvo: 73.42 },
      { nota: "A", oitava: 1, freqAlvo: 55.00 },
      { nota: "E", oitava: 1, freqAlvo: 41.20 }
    ]
  },
  baixo5: {
    nome: "Baixo (5 Cordas)",
    cordas: [
      { nota: "G", oitava: 2, freqAlvo: 98.00 },
      { nota: "D", oitava: 2, freqAlvo: 73.42 },
      { nota: "A", oitava: 1, freqAlvo: 55.00 },
      { nota: "E", oitava: 1, freqAlvo: 41.20 },
      { nota: "B", oitava: 0, freqAlvo: 30.87 }
    ]
  },
  ukulele: {
    nome: "Ukulele",
    cordas: [
      { nota: "A", oitava: 4, freqAlvo: 440.00 },
      { nota: "E", oitava: 4, freqAlvo: 329.63 },
      { nota: "C", oitava: 4, freqAlvo: 261.63 },
      { nota: "G", oitava: 4, freqAlvo: 392.00 }
    ]
  },
  violino: {
    nome: "Violino",
    cordas: [
      { nota: "E", oitava: 5, freqAlvo: 659.25 },
      { nota: "A", oitava: 4, freqAlvo: 440.00 },
      { nota: "D", oitava: 4, freqAlvo: 293.66 },
      { nota: "G", oitava: 3, freqAlvo: 196.00 }
    ]
  },
  viola: {
    nome: "Viola de Arco",
    cordas: [
      { nota: "A", oitava: 4, freqAlvo: 440.00 },
      { nota: "D", oitava: 4, freqAlvo: 293.66 },
      { nota: "G", oitava: 3, freqAlvo: 196.00 },
      { nota: "C", oitava: 3, freqAlvo: 130.81 }
    ]
  },
  violoncelo: {
    nome: "Violoncelo",
    cordas: [
      { nota: "A", oitava: 3, freqAlvo: 220.00 },
      { nota: "D", oitava: 3, freqAlvo: 146.83 },
      { nota: "G", oitava: 2, freqAlvo: 98.00 },
      { nota: "C", oitava: 2, freqAlvo: 65.41 }
    ]
  }
};

function freqToNote(freq) {
  const noteNum = 12 * (Math.log(freq / 440) / Math.log(2)) + 69;
  const note = Math.round(noteNum);
  const cents = Math.round((noteNum - note) * 100);
  const octave = Math.floor(note / 12) - 1;
  return { name: NOTE_NAMES[note % 12], octave, cents };
}

function autoCorrelate(buf, sampleRate, rmsThreshold) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < rmsThreshold) return -1;

  let r1 = 0, r2 = SIZE - 1;
  const threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < threshold) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
  }

  const buf2 = buf.slice(r1, r2);
  const SIZE2 = buf2.length;
  if (SIZE2 < 2) return -1;

  const c = new Array(SIZE2).fill(0);
  for (let i = 0; i < SIZE2; i++) {
    for (let j = 0; j < SIZE2 - i; j++) {
      c[i] += buf2[j] * buf2[j + i];
    }
  }

  let d = 0;
  while (d < SIZE2 - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE2; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  let T0 = maxpos;
  if (T0 <= 0) return -1;

  const x1 = c[T0 - 1] || 0, x2 = c[T0] || 0, x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export default function AfinadorPanel({ onClose, minimized, setMinimized, isStacked }) {
  const [instrumento, setInstrumento] = useState("chromatic");
  const [cordaSelecionada, setCordaSelecionada] = useState(null);
  const [sensibilidade, setSensibilidade] = useState("normal");
  const [micDenied, setMicDenied] = useState(false);
  const [note, setNote] = useState("--");
  const [octave, setOctave] = useState("");
  const [cents, setCents] = useState(0);
  const [freq, setFreq] = useState(0);
  const [active, setActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSensMenu, setShowSensMenu] = useState(false);

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const analyserRef = useRef(null);
  const lastDetectionTimeRef = useRef(0);
  
  const cordaRef = useRef(cordaSelecionada);
  const sensRef = useRef(sensibilidade);

  useEffect(() => { cordaRef.current = cordaSelecionada; }, [cordaSelecionada]);
  useEffect(() => { sensRef.current = sensibilidade; }, [sensibilidade]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        
        streamRef.current = stream;
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        detect();
      } catch (e) {
        setMicDenied(true);
      }
    }

    function detect() {
      if (!analyserRef.current || cancelled) return;
      
      const buffer = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(buffer);

      let rmsL = 0.015;
      if (sensRef.current === "pouco") rmsL = 0.035;
      if (sensRef.current === "muito") rmsL = 0.005;

      const detected = autoCorrelate(buffer, audioCtxRef.current.sampleRate, rmsL);
      
      if (detected > 25 && detected < 2000) {
        if (cordaRef.current) {
          setNote(cordaRef.current.nota);
          setOctave(cordaRef.current.oitava);
          const nAlvo = 12 * (Math.log(cordaRef.current.freqAlvo / 440) / Math.log(2)) + 69;
          const nDet = 12 * (Math.log(detected / 440) / Math.log(2)) + 69;
          setCents(Math.round((nDet - nAlvo) * 100));
        } else {
          const { name, octave: oct, cents: ct } = freqToNote(detected);
          setNote(name);
          setOctave(oct);
          setCents(ct);
        }
        setFreq(detected);
        setActive(true);
        lastDetectionTimeRef.current = Date.now();
      } else if (Date.now() - lastDetectionTimeRef.current > 800) {
        setActive(false);
      }
      
      rafRef.current = requestAnimationFrame(detect);
    }

    init();

    return () => { 
      cancelled = true; 
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const handleClose = () => {
    if (onClose) onClose();
  };

  const needlePos = Math.max(-50, Math.min(50, cents));
  const inTune = Math.abs(cents) <= 4;

  if (minimized) {
    return (
      <div className={`fixed ${isStacked ? "bottom-20" : "bottom-5"} left-5 z-50 bg-slate-900 text-white rounded-full shadow-lg flex items-center gap-2 pr-4 pl-3 py-2.5 border border-slate-800 transition-all duration-200`}>
        <button onClick={() => setMinimized(false)} className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
          <Mic className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-medium whitespace-nowrap">Afinador</span>
        </button>
        <button onClick={handleClose} className="ml-1 text-slate-400 hover:text-white focus:outline-none" aria-label="Fechar Afinador">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 w-80 overflow-hidden font-sans">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${active ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Afinador</span>
        </div>
        <div className="flex gap-2">
            <Minus className="w-4 h-4 cursor-pointer text-slate-400 hover:text-white" onClick={() => setMinimized(true)} />
            <X className="w-4 h-4 cursor-pointer text-slate-400 hover:text-white" onClick={handleClose} />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex justify-between items-center text-sm font-bold text-emerald-400">
            <span>{INSTRUMENTOS_PRESETS[instrumento].nome}</span>
            <ChevronDown className={`w-4 h-4 transition ${showMenu ? 'rotate-180' : ''}`} />
          </button>
          {showMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
              {Object.keys(INSTRUMENTOS_PRESETS).map(k => (
                <button key={k} onClick={() => { setInstrumento(k); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 transition text-slate-300">{INSTRUMENTOS_PRESETS[k].nome}</button>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-40">
            <button onClick={() => setShowSensMenu(!showSensMenu)} className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-slate-400 hover:text-white transition uppercase tracking-wider">
              <Settings2 className="w-3 h-3" /> 
              <span>Sensibilidade: <span className="text-emerald-400">{sensibilidade}</span></span>
            </button>
            {showSensMenu && (
                <div className="absolute top-full left-0 mt-1 flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-1 min-w-[100px] shadow-xl">
                    {['pouco', 'normal', 'muito'].map(s => (
                        <button key={s} onClick={() => { setSensibilidade(s); setShowSensMenu(false); }} className={`w-full text-left px-2 py-1 rounded text-[10px] font-bold capitalize ${sensibilidade === s ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                          {s}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <div className="text-center py-2">
            <span className={`text-7xl font-black block transition-all ${active ? (inTune ? "text-emerald-400" : "text-amber-400") : "text-slate-800"}`}>{active ? note : "--"}</span>
            {active && <div className="text-[10px] font-mono text-slate-500 mt-1">Oitava {octave} • {freq.toFixed(1)} Hz</div>}
        </div>

        {instrumento !== "chromatic" && (
            <div className="flex justify-center gap-1.5 bg-slate-900/50 p-2 rounded-xl border border-slate-900">
                {INSTRUMENTOS_PRESETS[instrumento].cordas.map((c, i) => {
                    const focus = cordaSelecionada?.nota === c.nota && cordaSelecionada?.oitava === c.oitava;
                    return (
                        <button key={i} onClick={() => setCordaSelecionada(focus ? null : c)} className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition ${focus ? "bg-emerald-500 text-slate-950 border-emerald-400 scale-105" : "bg-slate-950 text-slate-500 border-slate-800 hover:text-white"}`}>
                            {c.nota}<span className="block opacity-40 text-[8px]">{c.oitava}</span>
                        </button>
                    );
                })}
            </div>
        )}

        <div className="relative pt-4">
            <div className="h-1.5 bg-slate-900 rounded-full border border-slate-800" />
            <div className="absolute left-1/2 top-3 w-0.5 h-3 bg-slate-700" />
            {active && <div className="absolute top-1 w-1.5 h-6 rounded-full transition-all duration-75" style={{ left: `calc(50% + ${needlePos * 0.9}%)`, transform: 'translateX(-50%)', backgroundColor: inTune ? '#10b981' : '#fbbf24'}} />}
            <div className="flex justify-between text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-tighter"><span>♭ Baixo</span><span>OK</span><span>Alto ♯</span></div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-900">
            <p className={`text-[10px] font-black uppercase tracking-widest ${active ? (inTune ? "text-emerald-400" : "text-amber-400") : "text-slate-600"}`}>
                {!active ? (micDenied ? "Erro de microfone" : cordaSelecionada ? `Toque a corda ${cordaSelecionada.nota}` : "Aguardando som...") : inTune ? "Perfeito!" : cents > 0 ? `${cents} cents alto` : `${Math.abs(cents)} cents baixo`}
            </p>
        </div>
      </div>
    </div>
  );
}