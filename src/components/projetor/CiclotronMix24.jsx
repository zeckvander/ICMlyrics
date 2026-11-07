import React, { useState } from 'react';

export default function CiclotronMix24() {
  const [faders, setFaders] = useState(Array(24).fill(70));
  const [masterLeft, setMasterLeft] = useState(75);
  const [masterRight, setMasterRight] = useState(75);
  const [mutes, setMutes] = useState(Array(24).fill(false));

  const handleFaderChange = (index, value) => {
    const newFaders = [...faders];
    newFaders[index] = Number(value);
    setFaders(newFaders);
  };

  const toggleMute = (index) => {
    const newMutes = [...mutes];
    newMutes[index] = !newMutes[index];
    setMutes(newMutes);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white font-sans select-none overflow-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="bg-red-600 text-white font-black px-3 py-1 rounded text-sm tracking-wider shadow">WATTSOM / CICLOTRON</span>
          <span className="text-xl font-bold tracking-wide">CMBW 24 XDF</span>
        </div>
        <div className="text-xs text-zinc-400 font-mono tracking-widest">ICMLYRICS - PAINEL DE CONTROLO DE ÁUDIO</div>
      </div>

      {/* Console Frame */}
      <div className="flex p-4 bg-zinc-900 border-4 border-amber-950 rounded-xl shadow-2xl m-4 gap-2 w-fit mx-auto">
        
        {/* 24 Channels Strip */}
        <div className="flex gap-1">
          {Array.from({ length: 24 }).map((_, i) => {
            const chNum = i + 1;
            return (
              <div key={chNum} className="flex flex-col bg-zinc-200 text-zinc-900 w-10 p-1 rounded border border-zinc-400 text-xs justify-between shadow-inner">
                
                {/* Top Connectors: XLR + Line */}
                <div className="flex flex-col items-center space-y-1 pb-1 border-b border-zinc-300">
                  <span className="font-bold text-[9px] text-zinc-700">{chNum < 10 ? `0${chNum}` : chNum}</span>
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-600 flex items-center justify-center shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-600 shadow-sm"></div>
                </div>

                {/* Gain & EQ Knobs */}
                <div className="flex flex-col items-center space-y-1.5 py-2">
                  <div className="w-4 h-4 rounded-full bg-red-600 border border-red-800 shadow flex items-center justify-center text-[7px] text-white font-bold" title="Gain">G</div>
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-800 shadow" title="High"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-800 shadow" title="Mid"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-800 shadow" title="Low"></div>
                </div>

                {/* Aux Sends & Pan */}
                <div className="flex flex-col items-center space-y-1 py-1.5 border-y border-zinc-300">
                  <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-700"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-700"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-700"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700 border border-zinc-900" title="Pan"></div>
                </div>

                {/* Mute Button */}
                <div className="flex flex-col items-center py-1">
                  <button 
                    onClick={() => toggleMute(i)}
                    className={`w-full py-0.5 rounded text-[8px] font-bold uppercase transition-colors shadow-sm ${
                      mutes[i] ? 'bg-red-600 text-white' : 'bg-zinc-300 text-zinc-800 hover:bg-zinc-400 border border-zinc-400'
                    }`}
                  >
                    Mute
                  </button>
                </div>

                {/* Fader Vertical Container */}
                <div className="flex flex-col items-center py-1 my-auto">
                  <div className="h-32 relative flex items-center justify-center w-full">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={faders[i]} 
                      onChange={(e) => handleFaderChange(i, e.target.value)}
                      className="absolute w-28 h-4 origin-center -rotate-90 cursor-pointer accent-zinc-800"
                    />
                  </div>
                </div>

                {/* Channel Label Footer */}
                <span className="bg-zinc-900 text-white font-bold w-full text-center py-0.5 rounded text-[9px] shadow">
                  {chNum < 10 ? `0${chNum}` : chNum}
                </span>

              </div>
            );
          })}
        </div>

        {/* Master Section (Right Side matching CMBW 24 XDF) */}
        <div className="flex bg-zinc-200 text-zinc-900 w-52 p-2 rounded border border-zinc-400 text-xs justify-between ml-1 shadow-inner gap-1">
          
          {/* Master Controls & Aux Returns */}
          <div className="flex flex-col items-center justify-between flex-1 pr-2 border-r border-zinc-300">
            <span className="font-bold text-[10px] text-zinc-800 tracking-wider">MASTER / AUX</span>
            
            <div className="flex flex-col items-center space-y-1.5 my-1">
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-full bg-red-600 border border-red-800 shadow"></div>
                <div className="w-4 h-4 rounded-full bg-blue-600 border border-blue-800"></div>
              </div>
              <div className="flex gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-800"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-800"></div>
              </div>
            </div>

            {/* Master Faders L & R */}
            <div className="flex space-x-4 items-center py-1 my-auto">
              <div className="flex flex-col items-center relative h-32 w-6">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={masterLeft} 
                  onChange={(e) => setMasterLeft(e.target.value)}
                  className="absolute w-28 h-4 origin-center -rotate-90 cursor-pointer accent-red-600 top-12 -left-11"
                />
                <span className="text-[9px] font-bold mt-auto text-zinc-800">L</span>
              </div>
              <div className="flex flex-col items-center relative h-32 w-6">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={masterRight} 
                  onChange={(e) => setMasterRight(e.target.value)}
                  className="absolute w-28 h-4 origin-center -rotate-90 cursor-pointer accent-red-600 top-12 -left-11"
                />
                <span className="text-[9px] font-bold mt-auto text-zinc-800">R</span>
              </div>
            </div>
            <span className="text-[8px] font-bold text-zinc-700">STEREO MASTER</span>
          </div>

          {/* LED VU Meter Column & Monitor Output */}
          <div className="flex flex-col items-center justify-between pl-1 w-14">
            <span className="text-[9px] font-bold text-center text-zinc-700">VU LED</span>
            
            {/* Vertical LED Meter Representation */}
            <div className="w-8 h-32 bg-zinc-900 border border-zinc-600 rounded flex justify-around p-0.5 my-auto shadow-inner">
              <div className="w-2 bg-gradient-to-t from-emerald-500 via-amber-400 to-red-600 h-full rounded-sm"></div>
              <div className="w-2 bg-gradient-to-t from-emerald-500 via-amber-400 to-red-600 h-full rounded-sm"></div>
            </div>

            <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-600 shadow mt-1"></div>
            <span className="text-[7px] font-semibold text-zinc-600">PHONES</span>
          </div>

        </div>

      </div>
    </div>
  );
}