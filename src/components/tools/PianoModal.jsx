import React, { useState, useRef } from "react";
import { Piano, Minus, X, Maximize2, ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";

const buildKeyboardData = () => {
  const whiteNotes = [
    { note: "C", label: "Dó" },
    { note: "D", label: "Ré" },
    { note: "E", label: "Mi" },
    { note: "F", label: "Fá" },
    { note: "G", label: "Sol" },
    { note: "A", label: "Lá" },
    { note: "B", label: "Si" },
  ];

  const blackNotesTemplate = [
    { note: "C#", label: "Dó#", afterOffset: 0 },
    { note: "D#", label: "Ré#", afterOffset: 1 },
    { note: "F#", label: "Fá#", afterOffset: 3 },
    { note: "G#", label: "Sol#", afterOffset: 4 },
    { note: "A#", label: "Lá#", afterOffset: 5 },
  ];

  const allWhite = [];
  const allBlack = [];
  let whiteIndex = 0;

  for (let oct = 1; oct <= 6; oct++) {
    const startWhiteForOct = whiteIndex;

    whiteNotes.forEach((w) => {
      allWhite.push({
        id: `${w.note}${oct}`,
        note: w.note,
        octave: oct,
        label: w.label,
        globalIndex: whiteIndex,
      });
      whiteIndex++;
    });

    blackNotesTemplate.forEach((b) => {
      allBlack.push({
        id: `${b.note}${oct}`,
        note: b.note,
        octave: oct,
        label: b.label,
        afterGlobalIndex: startWhiteForOct + b.afterOffset,
      });
    });
  }

  return { allWhite, allBlack };
};

const { allWhite, allBlack } = buildKeyboardData();

const playSynthesizerNote = (noteName, octave) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const notesMap = {
      "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
      "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11
    };

    const semitonesFromC4 = notesMap[noteName] + (octave - 4) * 12;
    const freq = 261.63 * Math.pow(2, semitonesFromC4 / 12);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq + 0.6, now);

    const hammerOsc = ctx.createOscillator();
    hammerOsc.type = "sine";
    hammerOsc.frequency.setValueAtTime(freq * 4, now);

    const hammerGain = ctx.createGain();
    hammerGain.gain.setValueAtTime(0.25, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    hammerOsc.connect(hammerGain);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(freq * 5, 5500), now);
    filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 1.2, 500), now + 1.2);

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(0.5, now + 0.005);
    mainGain.gain.exponentialRampToValueAtTime(0.18, now + 0.3);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc1.connect(filter);
    osc2.connect(filter);
    hammerGain.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    hammerOsc.start(now);

    const stopTime = now + 1.8;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    hammerOsc.stop(stopTime);

    setTimeout(() => {
      if (ctx.state !== "closed") ctx.close();
    }, 2000);
  } catch (err) {
    console.error(err);
  }
};

export default function PianoModal({ onClose, minimized, setMinimized }) {
  const [startIndex, setStartIndex] = useState(21);
  const [activeNote, setActiveNote] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const miniMapRef = useRef(null);

  // Modo normal = 8 teclas brancas (1 oitava completa: ex. Dó a Dó)
  // Tela cheia = 15 teclas brancas (2 oitavas completas: ex. Dó a Dó)
  const visibleCount = isFullscreen ? 15 : 8;
  const whiteWidthPercent = 100 / visibleCount;
  const blackWidthPercent = whiteWidthPercent * 0.64;

  const visibleWhiteKeys = allWhite.slice(startIndex, startIndex + visibleCount);
  const visibleBlackKeys = allBlack.filter(
    (b) => b.afterGlobalIndex >= startIndex && b.afterGlobalIndex < startIndex + (visibleCount - 1)
  );

  const firstKey = visibleWhiteKeys[0] || allWhite[0];
  const lastKey = visibleWhiteKeys[visibleWhiteKeys.length - 1] || allWhite[allWhite.length - 1];

  const handleKeyPress = (item) => {
    setActiveNote(item.id);
    playSynthesizerNote(item.note, item.octave);
    setTimeout(() => setActiveNote(null), 150);
  };

  const exitFullscreenAndUnlock = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      if (window.screen?.orientation?.unlock) {
        window.screen.orientation.unlock();
      }
    } catch (err) {
      console.log("Saindo da tela cheia / desbloqueando orientação.");
    }
    setIsFullscreen(false);
  };

  const handleCloseModal = async () => {
    if (isFullscreen || document.fullscreenElement) {
      await exitFullscreenAndUnlock();
    }
    onClose();
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock("landscape");
        }
      } catch (err) {
        console.log("Tela cheia ativada em modo CSS.");
      }
    } else {
      await exitFullscreenAndUnlock();
    }
  };

  const updatePositionFromPointer = (e) => {
    if (!miniMapRef.current) return;
    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetCenter = ratio * allWhite.length;
    const calculatedStart = Math.round(targetCenter - (visibleCount / 2));
    const maxStart = allWhite.length - visibleCount;
    setStartIndex(Math.max(0, Math.min(maxStart, calculatedStart)));
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePositionFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      updatePositionFromPointer(e);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  if (minimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-3">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => setMinimized(false)}
        >
          <Piano className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold">Piano Virtual</span>
        </div>

        <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
          <button 
            onClick={() => setMinimized(false)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Expandir"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleCloseModal}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center ${isFullscreen ? "p-0" : "p-2 sm:p-4"}`}>
      <div className={`bg-[#0c1322] border border-slate-800 text-white overflow-hidden shadow-2xl flex flex-col justify-between transition-all ${
        isFullscreen
          ? "w-screen h-screen rounded-none border-none p-3"
          : "rounded-3xl w-full max-w-xl p-4 sm:p-5"
      }`}>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Piano className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
              Piano Virtual
              <span className="text-cyan-400 font-semibold text-xs sm:text-sm">
                ({firstKey.label}{firstKey.octave} - {lastKey.label}{lastKey.octave})
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setStartIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
              title="Mover para esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setStartIndex((prev) => Math.min(allWhite.length - visibleCount, prev + 1))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
              title="Mover para direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMinimized(true)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
              title="Minimizar"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleCloseModal}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-2 px-1">
          <div 
            ref={miniMapRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-full h-8 sm:h-9 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden cursor-pointer touch-none select-none my-0.5"
          >
            <div className="absolute inset-0 flex">
              {allWhite.map((w) => (
                <div 
                  key={`mini-${w.id}`}
                  style={{ width: `${100 / allWhite.length}%` }}
                  className="h-full border-r-[0.5px] border-slate-400/30 bg-slate-200/80"
                />
              ))}
            </div>

            <div className="absolute inset-0 pointer-events-none">
              {allBlack.map((b) => {
                const miniWhiteWidth = 100 / allWhite.length;
                const miniBlackWidth = miniWhiteWidth * 0.65;
                const leftPos = ((b.afterGlobalIndex + 1) * miniWhiteWidth) - (miniBlackWidth / 2);
                return (
                  <div
                    key={`mini-${b.id}`}
                    style={{
                      left: `${leftPos}%`,
                      width: `${miniBlackWidth}%`
                    }}
                    className="absolute h-[58%] bg-slate-900 rounded-b-[1px]"
                  />
                );
              })}
            </div>

            <div
              style={{
                left: `${(startIndex / allWhite.length) * 100}%`,
                width: `${(visibleCount / allWhite.length) * 100}%`
              }}
              className="absolute top-0 bottom-0 bg-cyan-500/35 border-2 border-cyan-400 rounded-md shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-75 pointer-events-none"
            />
          </div>
        </div>

        <div className={`relative bg-slate-950/90 p-2 sm:p-3 rounded-2xl border border-slate-800 select-none my-1 shadow-inner w-full overflow-hidden ${
          isFullscreen ? "flex-1 my-2 flex items-center" : ""
        }`}>
          <div className={`relative w-full flex ${isFullscreen ? "h-full" : "h-44 sm:h-48"}`}>
            
            {visibleWhiteKeys.map((item) => (
              <button
                key={item.id}
                onClick={() => handleKeyPress(item)}
                style={{ width: `${whiteWidthPercent}%` }}
                className={`h-full bg-slate-100 hover:bg-white text-slate-900 rounded-b-lg border-[0.5px] border-slate-300 flex flex-col justify-end items-center pb-2 transition-all active:translate-y-1 shadow-md ${
                  activeNote === item.id ? "bg-cyan-200 translate-y-1" : ""
                }`}
              >
                <span className="text-[9px] sm:text-xs font-bold leading-none">{item.label}</span>
                <span className="text-[7px] sm:text-[9px] text-slate-400 font-mono mt-0.5 leading-none">{item.octave}</span>
              </button>
            ))}

            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
              {visibleBlackKeys.map((item) => {
                const relIdx = item.afterGlobalIndex - startIndex;
                const leftPos = ((relIdx + 1) * whiteWidthPercent) - (blackWidthPercent / 2);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleKeyPress(item)}
                    style={{
                      left: `${leftPos}%`,
                      width: `${blackWidthPercent}%`
                    }}
                    className={`pointer-events-auto absolute h-[60%] bg-slate-900 hover:bg-slate-800 text-white rounded-b-md z-10 flex flex-col justify-end items-center pb-1.5 border border-slate-700 shadow-xl transition-all ${
                      activeNote === item.id ? "bg-cyan-600 border-cyan-400 translate-y-0.5" : ""
                    }`}
                  >
                    <span className="text-[6px] sm:text-[8px] font-bold leading-none whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold transition-colors border border-slate-700/80 flex items-center justify-center gap-2"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          {isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        </button>

      </div>
    </div>
  );
}