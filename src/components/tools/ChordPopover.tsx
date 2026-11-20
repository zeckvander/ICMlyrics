import React, { useEffect, useMemo, useState } from 'react';
import * as Tone from 'tone';
import { getChordInversion, parseChord } from '@/lib/chordUtils';
import { getGuitarChordShapes, GuitarChordShape } from '@/lib/guitarChords';

interface ChordPopoverProps {
  chordName: string | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
}

interface WhiteKeyItem {
  midi: number;
  label: string;
}

interface BlackKeyItem {
  midi: number;
  x: number;
}

const WHITE_KEYS_SEMITONES: number[] = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEY_AFTER_WHITE_INDEX: Record<number, { semitone: number }> = {
  0: { semitone: 1 },
  1: { semitone: 3 },
  3: { semitone: 6 },
  4: { semitone: 8 },
  5: { semitone: 10 },
};
const OPEN_STRINGS_MIDI: number[] = [40, 45, 50, 55, 59, 64];
const KEYBOARD_OCTAVES: number[] = [3, 4, 5];

function midiToToneNote(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteNames[midi % 12]}${octave}`;
}

function getPreferredInstrument(): 'violao' | 'teclado' {
  const saved = localStorage.getItem('icmlyrics_instrumento');
  return saved === 'teclado' ? 'teclado' : 'violao';
}

function shapeToGuitarNotes(shape: GuitarChordShape): string[] {
  if (!shape || !Array.isArray(shape.frets)) return [];
  const notes: string[] = [];
  shape.frets.forEach((fret, idx) => {
    if (fret >= 0 && OPEN_STRINGS_MIDI[idx] !== undefined) {
      notes.push(midiToToneNote(OPEN_STRINGS_MIDI[idx] + fret));
    }
  });
  return notes;
}

function normalizeVoicingForKeyboard(notes: number[], minMidi: number, maxMidi: number): number[] {
  if (!notes || notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => a - b);
  let shift = 0;

  while (sorted.some((n) => n + shift < minMidi) && shift < 24) {
    shift += 12;
  }

  while (sorted.some((n) => n + shift > maxMidi) && shift > -24) {
    shift -= 12;
  }

  const targetStartMax = minMidi + 12;
  while (Math.min(...sorted.map((n) => n + shift)) > targetStartMax && shift - 12 >= -24) {
    const candidateShift = shift - 12;
    if (sorted.every((n) => n + candidateShift >= minMidi && n + candidateShift <= maxMidi)) {
      shift = candidateShift;
    } else {
      break;
    }
  }

  return sorted.map((n) => {
    let adjusted = n + shift;
    while (adjusted < minMidi) adjusted += 12;
    while (adjusted > maxMidi) adjusted -= 12;
    return adjusted;
  });
}

async function ensureAudioStarted(): Promise<void> {
  await Tone.start();
  const rawCtx = Tone.getContext().rawContext as AudioContext;
  if (rawCtx && rawCtx.state === 'suspended') {
    await rawCtx.resume();
  }
}

async function playGuitarStrum(notes: string[], strumStepMs = 40): Promise<void> {
  if (!notes || notes.length === 0) return;

  await ensureAudioStarted();

  const filter = new Tone.Filter({
    type: 'lowpass',
    frequency: 2200,
    Q: 1,
  }).toDestination();

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle',
    },
    envelope: {
      attack: 0.008,
      decay: 0.45,
      sustain: 0.15,
      release: 0.9,
    },
  }).connect(filter);

  synth.volume.value = -2;

  const baseTime = Tone.now() + 0.03;
  notes.forEach((note, idx) => {
    synth.triggerAttackRelease(note, '0.9n', baseTime + (idx * strumStepMs) / 1000);
  });

  setTimeout(() => {
    try {
      synth.dispose();
      filter.dispose();
    } catch {}
  }, 2000);
}

async function playKeyboardChord(notes: string[]): Promise<void> {
  if (!notes || notes.length === 0) return;

  await ensureAudioStarted();

  const filter = new Tone.Filter({
    type: 'lowpass',
    frequency: 1900,
    Q: 0.7,
  }).toDestination();

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle',
    },
    envelope: {
      attack: 0.006,
      decay: 0.38,
      sustain: 0.1,
      release: 0.3,
    },
  }).connect(filter);

  synth.volume.value = -3;

  const baseTime = Tone.now() + 0.02;
  notes.forEach((note, idx) => {
    const humanOffset = idx * 0.018;
    synth.triggerAttackRelease(note, '0.65n', baseTime + humanOffset);
  });

  setTimeout(() => {
    try {
      synth.dispose();
      filter.dispose();
    } catch {}
  }, 1400);
}

function GuitarDiagram({ shape }: { shape: GuitarChordShape }) {
  const width = 132;
  const height = 148;
  const startX = 24;
  const startY = 30;
  const stringGap = 16;
  const fretGap = 21;
  const numStrings = 6;
  const numFrets = 5;
  const baseFret = shape.baseFret ?? 1;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="select-none">
      {baseFret > 1 && (
        <text
          x={5}
          y={startY + fretGap * 0.65}
          className="fill-slate-400 text-[9px] font-semibold"
        >
          {baseFret}ª
        </text>
      )}

      <line
        x1={startX}
        y1={startY}
        x2={startX + stringGap * (numStrings - 1)}
        y2={startY}
        stroke={baseFret === 1 ? '#f8fafc' : '#64748b'}
        strokeWidth={baseFret === 1 ? 2.5 : 1.2}
      />

      {Array.from({ length: numFrets }).map((_, i) => {
        const y = startY + (i + 1) * fretGap;
        return (
          <line
            key={`fret-${i}`}
            x1={startX}
            y1={y}
            x2={startX + stringGap * (numStrings - 1)}
            y2={y}
            stroke="#334155"
            strokeWidth={1}
          />
        );
      })}

      {Array.from({ length: numStrings }).map((_, sIdx) => {
        const x = startX + sIdx * stringGap;
        const fretVal = shape.frets[sIdx];

        return (
          <React.Fragment key={`string-${sIdx}`}>
            <line
              x1={x}
              y1={startY}
              x2={x}
              y2={startY + numFrets * fretGap}
              stroke="#475569"
              strokeWidth={1 + sIdx * 0.12}
            />

            {fretVal === -1 && (
              <text
                x={x}
                y={startY - 9}
                textAnchor="middle"
                className="fill-rose-400 text-[10px] font-bold"
              >
                ×
              </text>
            )}

            {fretVal === 0 && (
              <circle
                cx={x}
                cy={startY - 11.5}
                r={4}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={1.3}
              />
            )}
          </React.Fragment>
        );
      })}

      {shape.barres?.map((barreFret) => {
        const relativeFret = barreFret - baseFret + 1;
        if (relativeFret < 1 || relativeFret > numFrets) return null;

        const indicesWithFret = shape.frets
          .map((f, idx) => (f === barreFret ? idx : -1))
          .filter((idx) => idx !== -1);

        if (indicesWithFret.length < 2) return null;

        const firstIdx = Math.min(...indicesWithFret);
        const lastIdx = Math.max(...indicesWithFret);
        const y = startY + (relativeFret - 0.5) * fretGap;

        return (
          <rect
            key={`barre-${barreFret}`}
            x={startX + firstIdx * stringGap - 5.5}
            y={y - 5.5}
            width={(lastIdx - firstIdx) * stringGap + 11}
            height={11}
            rx={5.5}
            fill="#f8fafc"
          />
        );
      })}

      {shape.frets.map((fretVal, sIdx) => {
        if (fretVal <= 0) return null;
        const relativeFret = fretVal - baseFret + 1;
        if (relativeFret < 1 || relativeFret > numFrets) return null;

        const x = startX + sIdx * stringGap;
        const y = startY + (relativeFret - 0.5) * fretGap;
        const finger = shape.fingers?.[sIdx] ?? 0;

        return (
          <g key={`note-${sIdx}`}>
            <circle cx={x} cy={y} r={6.5} fill="#f97316" />
            {finger > 0 && (
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                className="fill-slate-950 text-[9px] font-bold"
              >
                {finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function MiniKeyboard({ activeMidiNotes }: { activeMidiNotes: number[] }) {
  const whiteWidth = 13.5;
  const whiteHeight = 64;
  const blackWidth = 8.5;
  const blackHeight = 39;

  const whiteKeys: WhiteKeyItem[] = [];
  const blackKeys: BlackKeyItem[] = [];

  KEYBOARD_OCTAVES.forEach((oct, octIdx) => {
    WHITE_KEYS_SEMITONES.forEach((semi, wIdx) => {
      const midi = (oct + 1) * 12 + semi;
      const globalWhiteIndex = octIdx * 7 + wIdx;
      const noteLabels = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

      whiteKeys.push({
        midi,
        label: noteLabels[wIdx],
      });

      const blackInfo = BLACK_KEY_AFTER_WHITE_INDEX[wIdx];
      if (blackInfo) {
        const blackMidi = (oct + 1) * 12 + blackInfo.semitone;
        const x = (globalWhiteIndex + 1) * whiteWidth - blackWidth / 2;
        blackKeys.push({
          midi: blackMidi,
          x,
        });
      }
    });
  });

  const totalWidth = whiteKeys.length * whiteWidth;

  return (
    <svg width={totalWidth} height={whiteHeight + 2} viewBox={`0 0 ${totalWidth} ${whiteHeight + 2}`} className="select-none">
      {whiteKeys.map((wk: WhiteKeyItem, idx: number) => {
        const isActive = activeMidiNotes.includes(wk.midi);
        const x = idx * whiteWidth;

        return (
          <g key={`wk-${wk.midi}`}>
            <rect
              x={x}
              y={1}
              width={whiteWidth}
              height={whiteHeight}
              rx={2}
              fill={isActive ? '#f97316' : '#f1f5f9'}
              stroke="#1e293b"
              strokeWidth={0.9}
            />
            <text
              x={x + whiteWidth / 2}
              y={whiteHeight - 5}
              textAnchor="middle"
              className={`text-[7px] font-semibold ${isActive ? 'fill-slate-950' : 'fill-slate-500'}`}
            >
              {wk.label}
            </text>
          </g>
        );
      })}

      {blackKeys.map((bk: BlackKeyItem) => {
        const isActive = activeMidiNotes.includes(bk.midi);

        return (
          <rect
            key={`bk-${bk.midi}`}
            x={bk.x}
            y={1}
            width={blackWidth}
            height={blackHeight}
            rx={1.8}
            fill={isActive ? '#fb923c' : '#090d16'}
            stroke="#020617"
            strokeWidth={0.9}
          />
        );
      })}
    </svg>
  );
}

export function ChordPopover({ chordName, anchorRect, onClose }: ChordPopoverProps) {
  const [instrument, setInstrument] = useState<'violao' | 'teclado'>(() => getPreferredInstrument());
  const [variationIndex, setVariationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setInstrument(getPreferredInstrument());
    setVariationIndex(0);
  }, [chordName]);

  useEffect(() => {
    if (!chordName) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chordName, onClose]);

  const parsed = useMemo(() => {
    if (!chordName) return null;
    return parseChord(chordName);
  }, [chordName]);

  const shapes = useMemo(() => {
    if (!parsed) return [];
    return getGuitarChordShapes(parsed.normalizedKey);
  }, [parsed]);

  const activeShape = shapes[variationIndex % Math.max(shapes.length, 1)] ?? shapes[0] ?? null;

  const activeMidiNotes = useMemo(() => {
    if (!parsed) return [];
    const baseNotes = parsed.midiNotes.map((m) => (m < 48 ? m + 12 : m));
    const inverted = getChordInversion(baseNotes, variationIndex);
    const minMidi = (KEYBOARD_OCTAVES[0] + 1) * 12;
    const maxMidi = (KEYBOARD_OCTAVES[KEYBOARD_OCTAVES.length - 1] + 1) * 12 + 11;
    return normalizeVoicingForKeyboard(inverted, minMidi, maxMidi);
  }, [parsed, variationIndex]);

  const activeNoteNames = useMemo(() => {
    const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
    return Array.from(new Set(activeMidiNotes.map((m) => names[m % 12])));
  }, [activeMidiNotes]);

  const handlePlayChord = async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    try {
      if (instrument === 'violao' && activeShape) {
        const guitarNotes = shapeToGuitarNotes(activeShape);
        await playGuitarStrum(guitarNotes, 40);
      } else if (activeMidiNotes.length > 0) {
        await playKeyboardChord(activeMidiNotes.map(midiToToneNote));
      }
    } catch (err) {
      console.error('Erro ao reproduzir acorde:', err);
    } finally {
      setTimeout(() => {
        setIsPlaying(false);
      }, 650);
    }
  };

  if (!chordName || !anchorRect || !parsed) return null;

  const popoverWidth = instrument === 'teclado' ? 312 : 196;
  const estimatedHeight = instrument === 'teclado' ? 210 : 250;
  const margin = 12;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  const centeredLeft = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
  const left = Math.min(
    Math.max(margin, centeredLeft),
    Math.max(margin, viewportWidth - popoverWidth - margin)
  );

  const belowTop = anchorRect.bottom + 8;
  const aboveTop = anchorRect.top - estimatedHeight - 8;
  const shouldPlaceAbove = belowTop + estimatedHeight > viewportHeight - margin && aboveTop >= margin;

  const rawTop = shouldPlaceAbove ? aboveTop : belowTop;
  const top = Math.min(
    Math.max(margin, rawTop),
    Math.max(margin, viewportHeight - estimatedHeight - margin)
  );

  const cycleVariation = (delta: number) => {
    if (instrument === 'violao') {
      if (shapes.length <= 1) return;
      setVariationIndex((prev) => (prev + delta + shapes.length) % shapes.length);
    } else {
      const count = Math.max(activeMidiNotes.length, 1);
      setVariationIndex((prev) => (prev + delta + count) % count);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        style={{ top, left, width: popoverWidth }}
        className="fixed z-50 rounded-2xl border border-slate-700/80 bg-zinc-900/95 p-3 text-slate-100 shadow-2xl backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePlayChord}
            disabled={isPlaying}
            className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 transition hover:bg-zinc-700 disabled:opacity-50"
            title="Ouvir acorde"
          >
            {isPlaying ? '•••' : '▶ Ouvir'}
          </button>

          <span className="text-sm font-bold text-orange-400">{parsed.original}</span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-1.5 py-0.5 text-xs text-slate-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mt-2 flex items-center justify-center">
          {instrument === 'violao' ? (
            activeShape ? (
              <GuitarDiagram shape={activeShape} />
            ) : (
              <div className="flex h-[148px] items-center justify-center px-2 text-center text-[11px] text-slate-400">
                Sem forma cadastrada para {parsed.normalizedKey}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="text-[11px] font-medium text-slate-300">
                {activeNoteNames.join(' · ')}
              </div>
              <MiniKeyboard activeMidiNotes={activeMidiNotes} />
            </div>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => cycleVariation(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-xs text-slate-300 transition hover:bg-zinc-700"
            aria-label="Variação anterior"
          >
            ‹
          </button>

          <div className="flex-1 rounded-lg bg-zinc-800/90 py-1 text-center text-xs font-semibold text-slate-200">
            {instrument === 'violao'
              ? shapes.length > 1
                ? `Variar (${(variationIndex % shapes.length) + 1}/${shapes.length})`
                : 'Variar'
              : `Inversão ${(variationIndex % Math.max(activeMidiNotes.length, 1)) + 1}`}
          </div>

          <button
            type="button"
            onClick={() => cycleVariation(1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-xs text-slate-300 transition hover:bg-zinc-700"
            aria-label="Próxima variação"
          >
            ›
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] leading-tight text-zinc-400">
          Para alterar entre violão e teclado, configure em <strong className="text-zinc-300">Perfil</strong>.
        </p>
      </div>
    </>
  );
}