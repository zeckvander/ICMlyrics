export interface ParsedChord {
  original: string;
  normalizedKey: string;
  root: string;
  suffix: string;
  bass: string | null;
  midiNotes: number[];
  noteNames: string[];
}

const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

const SEMITONE_TO_DISPLAY: string[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'
];

const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  'M': [0, 4, 7],
  'm': [0, 3, 7],
  '7': [0, 4, 7, 10],
  'm7': [0, 3, 7, 10],
  '7M': [0, 4, 7, 11],
  'maj7': [0, 4, 7, 11],
  'm7M': [0, 3, 7, 11],
  '6': [0, 4, 7, 9],
  'm6': [0, 3, 7, 9],
  '9': [0, 4, 7, 10, 14],
  'add9': [0, 4, 7, 14],
  'm9': [0, 3, 7, 10, 14],
  '4': [0, 5, 7],
  'sus4': [0, 5, 7],
  '7(4)': [0, 5, 7, 10],
  '7sus4': [0, 5, 7, 10],
  'sus2': [0, 2, 7],
  'dim': [0, 3, 6, 9],
  'º': [0, 3, 6, 9],
  'm7(b5)': [0, 3, 6, 10],
  'm7b5': [0, 3, 6, 10],
  'aug': [0, 4, 8],
  '5+': [0, 4, 8],
};

function normalizeSuffix(suffix: string): string {
  return suffix
    .replace('maj7', '7M')
    .replace('sus4', '4')
    .replace('7sus4', '7(4)')
    .replace('dim', 'º')
    .replace('m7b5', 'm7(b5)')
    .trim();
}

export function parseChord(chordStr: string): ParsedChord | null {
  const clean = chordStr.trim();
  const match = clean.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);

  if (!match) return null;

  const [, rawRoot, rawSuffix, rawBass] = match;
  const rootSemitone = NOTE_TO_SEMITONE[rawRoot];
  if (rootSemitone === undefined) return null;

  const displayRoot = SEMITONE_TO_DISPLAY[rootSemitone];
  const displayBass = rawBass && NOTE_TO_SEMITONE[rawBass] !== undefined
    ? SEMITONE_TO_DISPLAY[NOTE_TO_SEMITONE[rawBass]]
    : null;

  let intervals = CHORD_INTERVALS[rawSuffix];
  if (!intervals) {
    const fallbackSuffix = rawSuffix.startsWith('m') && !rawSuffix.startsWith('maj') ? 'm' : '';
    intervals = CHORD_INTERVALS[fallbackSuffix];
  }

  const baseMidi = 60 + rootSemitone;
  const midiNotes: number[] = [];

  if (displayBass && displayBass !== displayRoot) {
    const bassSemitone = NOTE_TO_SEMITONE[displayBass];
    midiNotes.push(48 + bassSemitone);
  }

  intervals.forEach((interval) => {
    midiNotes.push(baseMidi + interval);
  });

  const noteNames = midiNotes.map((midi) => SEMITONE_TO_DISPLAY[midi % 12]);
  const normSuffix = normalizeSuffix(rawSuffix);

  return {
    original: clean,
    normalizedKey: `${displayRoot}${normSuffix}`,
    root: displayRoot,
    suffix: rawSuffix,
    bass: displayBass,
    midiNotes,
    noteNames,
  };
}

export function getChordInversion(midiNotes: number[], inversionIndex: number): number[] {
  if (midiNotes.length === 0 || inversionIndex === 0) return midiNotes;
  const notes = [...midiNotes];
  const shifts = inversionIndex % notes.length;

  for (let i = 0; i < shifts; i++) {
    const lowest = notes.shift();
    if (lowest !== undefined) {
      notes.push(lowest + 12);
    }
  }
  return notes;
}