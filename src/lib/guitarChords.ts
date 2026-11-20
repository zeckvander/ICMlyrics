export interface GuitarChordShape {
  frets: number[];
  fingers: number[];
  baseFret?: number;
  barres?: number[];
}

export const GUITAR_CHORDS: Record<string, GuitarChordShape[]> = {
  'C': [
    { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    { frets: [-1, 3, 5, 5, 5, 3], fingers: [0, 1, 2, 3, 4, 1], baseFret: 3, barres: [3] },
    { frets: [8, 10, 10, 9, 8, 8], fingers: [1, 3, 4, 2, 1, 1], baseFret: 8, barres: [8] },
  ],
  'Cm': [
    { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [3] },
    { frets: [8, 10, 10, 8, 8, 8], fingers: [1, 3, 4, 1, 1, 1], baseFret: 8, barres: [8] },
  ],
  'C7': [
    { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
    { frets: [-1, 3, 5, 3, 5, 3], fingers: [0, 1, 3, 1, 4, 1], baseFret: 3, barres: [3] },
  ],
  'C7M': [
    { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
    { frets: [-1, 3, 5, 4, 5, 3], fingers: [0, 1, 3, 2, 4, 1], baseFret: 3, barres: [3] },
  ],
  'D': [
    { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    { frets: [-1, 5, 7, 7, 7, 5], fingers: [0, 1, 2, 3, 4, 1], baseFret: 5, barres: [5] },
    { frets: [10, 12, 12, 11, 10, 10], fingers: [1, 3, 4, 2, 1, 1], baseFret: 10, barres: [10] },
  ],
  'Dm': [
    { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
    { frets: [-1, 5, 7, 7, 6, 5], fingers: [0, 1, 3, 4, 2, 1], baseFret: 5, barres: [5] },
  ],
  'D7': [
    { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 3, 1, 2] },
    { frets: [-1, 5, 7, 5, 7, 5], fingers: [0, 1, 3, 1, 4, 1], baseFret: 5, barres: [5] },
  ],
  'D7M': [
    { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
    { frets: [-1, 5, 7, 6, 7, 5], fingers: [0, 1, 3, 2, 4, 1], baseFret: 5, barres: [5] },
  ],
  'E': [
    { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    { frets: [-1, 7, 9, 9, 9, 7], fingers: [0, 1, 2, 3, 4, 1], baseFret: 7, barres: [7] },
  ],
  'Em': [
    { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    { frets: [-1, 7, 9, 9, 8, 7], fingers: [0, 1, 3, 4, 2, 1], baseFret: 7, barres: [7] },
    { frets: [12, 14, 14, 12, 12, 12], fingers: [1, 3, 4, 1, 1, 1], baseFret: 12, barres: [12] },
  ],
  'E7': [
    { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
    { frets: [-1, 7, 9, 7, 9, 7], fingers: [0, 1, 3, 1, 4, 1], baseFret: 7, barres: [7] },
  ],
  'Em7': [
    { frets: [0, 2, 2, 0, 3, 0], fingers: [0, 2, 3, 0, 4, 0] },
    { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
    { frets: [-1, 7, 9, 7, 8, 7], fingers: [0, 1, 3, 1, 2, 1], baseFret: 7, barres: [7] },
  ],
  'F': [
    { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1] },
    { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1] },
    { frets: [-1, 8, 10, 10, 10, 8], fingers: [0, 1, 2, 3, 4, 1], baseFret: 8, barres: [8] },
  ],
  'Fm': [
    { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [1] },
    { frets: [-1, 8, 10, 10, 9, 8], fingers: [0, 1, 3, 4, 2, 1], baseFret: 8, barres: [8] },
  ],
  'F7M': [
    { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
    { frets: [1, -1, 2, 2, 1, -1], fingers: [1, 0, 3, 4, 2, 0] },
  ],
  'F#m': [
    { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [2] },
    { frets: [-1, 9, 11, 11, 10, 9], fingers: [0, 1, 3, 4, 2, 1], baseFret: 9, barres: [9] },
  ],
  'G': [
    { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
    { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
    { frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], baseFret: 3, barres: [3] },
  ],
  'Gm': [
    { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [3] },
    { frets: [-1, -1, 5, 3, 3, 3], fingers: [0, 0, 3, 1, 1, 1], baseFret: 3, barres: [3] },
  ],
  'G7': [
    { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
    { frets: [3, 5, 3, 4, 3, 3], fingers: [1, 3, 1, 2, 1, 1], baseFret: 3, barres: [3] },
  ],
  'G7M': [
    { frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3] },
    { frets: [3, -1, 4, 4, 3, -1], fingers: [1, 0, 3, 4, 2, 0], baseFret: 3 },
  ],
  'A': [
    { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    { frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], baseFret: 5, barres: [5] },
  ],
  'Am': [
    { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    { frets: [5, 7, 7, 5, 5, 5], fingers: [1, 3, 4, 1, 1, 1], baseFret: 5, barres: [5] },
  ],
  'A7': [
    { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
    { frets: [5, 7, 5, 6, 5, 5], fingers: [1, 3, 1, 2, 1, 1], baseFret: 5, barres: [5] },
  ],
  'Am7': [
    { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
    { frets: [5, 7, 5, 5, 5, 5], fingers: [1, 3, 1, 1, 1, 1], baseFret: 5, barres: [5] },
  ],
  'A7M': [
    { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
    { frets: [5, -1, 6, 6, 5, -1], fingers: [1, 0, 3, 4, 2, 0], baseFret: 5 },
  ],
  'Bb': [
    { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1] },
    { frets: [6, 8, 8, 7, 6, 6], fingers: [1, 3, 4, 2, 1, 1], baseFret: 6, barres: [6] },
  ],
  'Bbm': [
    { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
    { frets: [6, 8, 8, 6, 6, 6], fingers: [1, 3, 4, 1, 1, 1], baseFret: 6, barres: [6] },
  ],
  'B': [
    { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [2] },
    { frets: [7, 9, 9, 8, 7, 7], fingers: [1, 3, 4, 2, 1, 1], baseFret: 7, barres: [7] },
  ],
  'Bm': [
    { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [2] },
    { frets: [7, 9, 9, 7, 7, 7], fingers: [1, 3, 4, 1, 1, 1], baseFret: 7, barres: [7] },
  ],
  'B7': [
    { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
    { frets: [-1, 2, 4, 2, 4, 2], fingers: [0, 1, 3, 1, 4, 1], baseFret: 2, barres: [2] },
    { frets: [7, 9, 7, 8, 7, 7], fingers: [1, 3, 1, 2, 1, 1], baseFret: 7, barres: [7] },
  ],
  'Bm7': [
    { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barres: [2] },
    { frets: [7, 9, 7, 7, 7, 7], fingers: [1, 3, 1, 1, 1, 1], baseFret: 7, barres: [7] },
  ],
};

export function getGuitarChordShapes(normalizedKey: string): GuitarChordShape[] {
  if (GUITAR_CHORDS[normalizedKey]) {
    return GUITAR_CHORDS[normalizedKey];
  }

  const withoutBass = normalizedKey.split('/')[0];
  if (GUITAR_CHORDS[withoutBass]) {
    return GUITAR_CHORDS[withoutBass];
  }

  const rootMatch = withoutBass.match(/^[A-G][#b]?m?/);
  if (rootMatch && GUITAR_CHORDS[rootMatch[0]]) {
    return GUITAR_CHORDS[rootMatch[0]];
  }

  return [];
}