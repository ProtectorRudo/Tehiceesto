"use client";

import { useEffect, useRef, useState } from "react";

type Voice = { oscillator: OscillatorNode; gain: GainNode };
type Engine = { context: AudioContext; voices: Voice[]; output: GainNode; lfo: OscillatorNode; lfoGain: GainNode; timer: ReturnType<typeof setInterval> };

const chords = [
  [130.81, 196.0, 261.63],
  [110.0, 164.81, 220.0],
  [87.31, 130.81, 174.61],
  [98.0, 146.83, 196.0],
];

export default function CoupleSoundscape() {
  const engine = useRef<Engine | null>(null);
  const [playing, setPlaying] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    return () => {
      const active = engine.current;
      if (!active) return;
      clearInterval(active.timer);
      active.voices.forEach(({ oscillator }) => { try { oscillator.stop(); } catch {} });
      active.lfo.stop();
      void active.context.close();
      engine.current = null;
    };
  }, []);

  const initialize = async () => {
    try {
      if (engine.current) { await engine.current.context.resume(); setPlaying(true); return; }
      const context = new AudioContext();
      const output = context.createGain();
      output.gain.value = .0001;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 470;
      filter.Q.value = .45;
      filter.connect(output);
      output.connect(context.destination);

      const voices: Voice[] = chords[0].map((hz, i) => {
        const oscillator = context.createOscillator();
        oscillator.type = i === 1 ? "triangle" : "sine";
        oscillator.frequency.value = hz;
        const gain = context.createGain();
        gain.gain.value = i === 1 ? .15 : .23;
        oscillator.connect(gain).connect(filter);
        oscillator.start();
        return { oscillator, gain };
      });
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.frequency.value = .075;
      lfoGain.gain.value = .018;
      lfo.connect(lfoGain).connect(output.gain);
      lfo.start();

      let index = 0;
      const timer = setInterval(() => {
        index = (index + 1) % chords.length;
        const now = context.currentTime;
        for (let i = 0; i < voices.length; i++) {
          voices[i].oscillator.frequency.setTargetAtTime(chords[index][i], now, 1.7);
        }
      }, 7300);
      engine.current = { context, voices, output, lfo, lfoGain, timer };
      await context.resume();
      output.gain.setTargetAtTime(.16, context.currentTime, 1.8);
      setPlaying(true);
      setInitialized(true);
    } catch {
      // Audio permission is browser dependent. Visual experience is fully usable without sound.
    }
  };

  useEffect(() => {
    const root = document.querySelector(".experience-shell--pareja");
    if (!root) return;
    const onFirstGesture = () => { void initialize(); root.removeEventListener("pointerdown", onFirstGesture); };
    root.addEventListener("pointerdown", onFirstGesture, { once: true });
    return () => root.removeEventListener("pointerdown", onFirstGesture);
    // Once per mounted soundscape; never reset music as the scene changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async () => {
    const active = engine.current;
    if (!active) { await initialize(); return; }
    if (playing) {
      active.output.gain.setTargetAtTime(.0001, active.context.currentTime, .18);
      setPlaying(false);
    } else {
      await active.context.resume();
      active.output.gain.setTargetAtTime(.16, active.context.currentTime, .45);
      setPlaying(true);
    }
  };
  return (
    <button type="button" className={"couple-soundscape-toggle" + (playing ? " is-playing" : "")}
      onClick={() => { void toggle(); }} aria-label={playing ? "Pausar ambiente musical" : "Activar ambiente musical"} aria-pressed={playing}>
      <span className="couple-soundscape-dot" aria-hidden="true" />
      <span>{playing ? "Ambiente activado" : initialized ? "Ambiente en pausa" : "Escuchar con sonido"}</span>
    </button>
  );
}
