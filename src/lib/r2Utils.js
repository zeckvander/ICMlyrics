const R2_HINOS_BASE = "https://pub-55a3ef1c05ef41b8abe84ad12fe61214.r2.dev/icmlyrics-hinos";

export function getHinoMedia(nomeHino, extAudio = "mid") {
  const pastaEncoded = encodeURIComponent(nomeHino);
  const pdfEncoded = encodeURIComponent(`${nomeHino}.pdf`);
  const audioEncoded = encodeURIComponent(`${nomeHino}.${extAudio}`);

  return {
    pdfUrl: `${R2_HINOS_BASE}/${pastaEncoded}/${pdfEncoded}`,
    midiUrl: `${R2_HINOS_BASE}/${pastaEncoded}/${audioEncoded}`
  };
}