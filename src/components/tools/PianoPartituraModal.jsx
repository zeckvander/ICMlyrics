import React, { useState } from "react";
import PianoModal from "./PianoModal";

// ==== IMPORTS DO REPRODUTOR SALVOS PARA DEPOIS ====
// import * as Tone from "tone";
// import { Midi } from "@tonejs/midi";
// import { Play, Square } from "lucide-react";
// ==================================================

export default function PianoPartituraModal({ onClose, midiUrl, tituloHino }) {
  const [resetKey, setResetKey] = useState(0);

  // ==== LÓGICA DO REPRODUTOR SALVA PARA DEPOIS ====
  /*
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  const handleCloseAudio = () => {
    if (isPlaying) {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    }
    onClose();
  };

  const handlePlayMidi = async () => {
    if (isPlaying) {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      setIsPlaying(false);
      setActiveNote(null);
      return;
    }

    if (!midiUrl) return;

    try {
      await Tone.start();
      const midi = await Midi.fromUrl(midiUrl);
      const now = Tone.now() + 0.1;
      setIsPlaying(true);

      const synth = new Tone.PolySynth(Tone.Synth).toDestination();

      midi.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          synth.triggerAttackRelease(
            note.name,
            note.duration,
            now + note.time
          );

          Tone.getDraw().schedule(() => {
            setActiveNote(note.name);
          }, now + note.time);

          Tone.getDraw().schedule(() => {
            setActiveNote(null);
          }, now + note.time + note.duration);
        });
      });

      const totalDuration = midi.duration || 10;
      setTimeout(() => {
        setIsPlaying(false);
        setActiveNote(null);
      }, (totalDuration + 0.5) * 1000);

    } catch (err) {
      console.error("Erro ao carregar ou tocar o MIDI:", err);
      setIsPlaying(false);
    }
  };
  */
  // ==================================================

  const handleReset = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col w-full animate-in slide-in-from-bottom duration-300">
      <PianoModal 
        key={resetKey}
        hideClose={true}
        visibleKeysCount={9}
        onReset={handleReset}
        // externalActiveNote={activeNote} // Descomente essa linha quando restaurar o áudio
      />
    </div>
  );
}