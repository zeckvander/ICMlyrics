export const ESCALAS_MUSICAIS = {
  "C": ["C", "D", "E", "F", "G", "A", "B"],
  "Am": ["A", "B", "C", "D", "E", "F", "G"],
  "G": ["G", "A", "B", "C", "D", "E", "F#"],
  "Em": ["E", "F#", "G", "A", "B", "C", "D"],
  "D": ["D", "E", "F#", "G", "A", "B", "C#"],
  "Bm": ["B", "C#", "D", "E", "F#", "G", "A"],
  "A": ["A", "B", "C#", "D", "E", "F#", "G#"],
  "F#m": ["F#", "G#", "A", "B", "C#", "D", "E"],
  "E": ["E", "F#", "G#", "A", "B", "C#", "D#"],
  "C#m": ["C#", "D#", "E", "F#", "G#", "A", "B"],
  "B": ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  "G#m": ["G#", "A#", "B", "C#", "D#", "E", "F#"],
  "F#": ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
  "D#m": ["D#", "E#", "F#", "G#", "A#", "B", "C#"],
  "F": ["F", "G", "A", "Bb", "C", "D", "E"],
  "Dm": ["D", "E", "F", "G", "A", "Bb", "C"],
  "Bb": ["Bb", "C", "D", "Eb", "F", "G", "A"],
  "Gm": ["G", "A", "Bb", "C", "D", "Eb", "F"],
  "Eb": ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
  "Cm": ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
  "Ab": ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
  "Fm": ["F", "G", "Ab", "Bb", "C", "Db", "Eb"],
  "Db": ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
  "Bbm": ["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"]
};

const ESCALA_BASE_SUSTENIDOS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ESCALA_BASE_BEMOIS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const equivalencias = {
  "Cb": "B", "B#": "C", "E#": "F", "Fb": "E",
  "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#"
};

export function transporNota(nota, semitons) {
  if (!nota) return "";
  let raiz = equivalencias[nota] || nota;
  let index = ESCALA_BASE_SUSTENIDOS.indexOf(raiz);
  if (index === -1) index = ESCALA_BASE_BEMOIS.indexOf(raiz);
  if (index === -1) return nota;

  let novoIndex = (index + semitons) % 12;
  if (novoIndex < 0) novoIndex += 12;
  return ESCALA_BASE_SUSTENIDOS[novoIndex];
}

export function transporAcorde(acorde, semitons) {
  if (!acorde) return "";
  
  if (semitons === 0) return acorde;

  const regex = /^([A-G][b#]?)(.*?)(\/[A-G][b#]?)?$/;
  const match = acorde.match(regex);
  
  if (!match) return acorde;

  let [, raiz, resto, baixo] = match;
  let novaRaiz = transporNota(raiz, semitons);

  let novoBaixo = "";
  if (baixo) {
    const notaBaixo = baixo.substring(1);
    novoBaixo = "/" + transporNota(notaBaixo, semitons);
  }

  return novaRaiz + resto + (novoBaixo || "");
}