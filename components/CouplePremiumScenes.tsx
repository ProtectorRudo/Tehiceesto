"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExperiencePhoto } from "./ExperienceEngine";
import type { SceneType } from "@/data/experiences";
import "./CouplePremiumScenes.css";

type Props = {
  scene: SceneType;
  photos: ExperiencePhoto[];
  memory: string[];
  date: string;
  recipient: string;
  giver: string;
  letterText?: string;
  next: () => void;
};

const starMessages = [
  "Tu forma de hacer hogar.",
  "Cómo te reís cuando te olvidás de cuidarte.",
  "La calma que traés sin darte cuenta.",
  "Todo lo que todavía soñamos.",
  "Que te volvería a elegir.",
];

function useQuietEffects() {
  const audioRef = useRef<AudioContext | null>(null);
  useEffect(() => () => { const audio = audioRef.current; if (audio) void audio.close(); }, []);
  return useCallback((kind: "touch" | "star" | "paper" | "scratch") => {
    try {
      const AudioContextType = window.AudioContext;
      if (!AudioContextType) return;
      const ctx = audioRef.current ?? new AudioContextType();
      audioRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      if (kind === "scratch" || kind === "paper") {
        const length = Math.floor(ctx.sampleRate * (kind === "scratch" ? .065 : .18));
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const values = buffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) values[i] = (Math.random() * 2 - 1) * (1 - i / length);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = kind === "scratch" ? 1650 : 630;
        source.connect(filter);
        filter.connect(gain);
        gain.gain.setValueAtTime(kind === "scratch" ? .012 : .026, now);
        gain.gain.exponentialRampToValueAtTime(.0001, now + length / ctx.sampleRate);
        source.start(now);
        source.stop(now + length / ctx.sampleRate);
      } else {
        const oscillator = ctx.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(kind === "star" ? 620 : 260, now);
        oscillator.frequency.exponentialRampToValueAtTime(kind === "star" ? 830 : 180, now + .2);
        oscillator.connect(gain);
        gain.gain.setValueAtTime(.0001, now);
        gain.gain.exponentialRampToValueAtTime(kind === "star" ? .045 : .015, now + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, now + .3);
        oscillator.start(now);
        oscillator.stop(now + .31);
      }
    } catch {
      // Web Audio is optional; never block the experience.
    }
  }, []);
}

function useHaptic() {
  return useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
  }, []);
}

function ScratchFoil({ onComplete, sound }: { onComplete: () => void; sound: (type: "scratch") => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const completed = useRef(false);
  const soundsAt = useRef(0);
  const [coverage, setCoverage] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const setup = () => {
      if (completed.current) return;
      const bounds = box.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * dpr);
      canvas.height = Math.round(bounds.height * dpr);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const w = bounds.width;
      const h = bounds.height;
      const metal = ctx.createLinearGradient(0, 0, w, h);
      metal.addColorStop(0, "#59452e");
      metal.addColorStop(.16, "#c0a069");
      metal.addColorStop(.38, "#e1cda0");
      metal.addColorStop(.51, "#8d6b3b");
      metal.addColorStop(.73, "#d5b77d");
      metal.addColorStop(1, "#5d4329");
      ctx.fillStyle = metal;
      ctx.fillRect(0, 0, w, h);
      // Real metallic grain, rendered once; no large repaint loops.
      for (let i = 0; i < 3500; i += 1) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = i % 2 ? "rgba(255,255,235,.12)" : "rgba(44,27,8,.12)";
        ctx.fillRect(x, y, 1, Math.random() * 2 + .5);
      }
      ctx.fillStyle = "rgba(33,23,12,.65)";
      ctx.font = "600 11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("UNA SORPRESA BAJO EL DORADO", w / 2, h * .43);
      ctx.font = "italic 25px Georgia";
      ctx.fillText("Raspá despacio", w / 2, h * .55);
      ctx.globalCompositeOperation = "destination-out";
      setReady(true);
    };
    setup();
    const observer = new ResizeObserver(setup);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const canvas = e.currentTarget;
    return { x: (e.clientX - rect.left) * canvas.width / rect.width, y: (e.clientY - rect.top) * canvas.height / rect.height };
  };
  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (completed.current) return;
    const ctx = e.currentTarget.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const to = point(e);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = Math.max(32, e.currentTarget.width * .085);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (lastPoint.current) ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    else ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
    lastPoint.current = to;
    if (performance.now() - soundsAt.current > 140) { soundsAt.current = performance.now(); sound("scratch"); }
  };
  const evaluate = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let erased = 0;
    let samples = 0;
    const skip = 14;
    for (let y = skip; y < canvas.height - skip; y += skip) {
      for (let x = skip; x < canvas.width - skip; x += skip) {
        samples += 1;
        if (image[(y * canvas.width + x) * 4 + 3] < 110) erased += 1;
      }
    }
    const progress = samples ? erased / samples : 0;
    setCoverage(Math.round(progress * 100));
    if (progress >= .55 && !completed.current) {
      completed.current = true;
      onComplete();
      canvas.classList.add("finished");
    }
  };

  return (
    <div className="couple-scratch-artifact" ref={boxRef}>
      <div className="couple-voucher">
        <span>VALE POR</span>
        <strong>un recuerdo nuevo juntos</strong>
        <em>Fecha a elección · sin vencimiento</em>
        <div className="couple-voucher-line" />
        <small>PARA NOSOTROS DOS</small>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Raspar el dorado para descubrir el vale"
        role="img"
        className="couple-scratch-canvas"
        style={{ opacity: ready ? 1 : 0 }}
        onPointerDown={(e) => {
          if (completed.current) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          scratch(e);
        }}
        onPointerMove={(e) => { if (drawing.current) { e.preventDefault(); scratch(e); } }}
        onPointerUp={(e) => {
          if (!drawing.current) return;
          drawing.current = false;
          lastPoint.current = null;
          evaluate(e.currentTarget);
        }}
        onPointerCancel={(e) => {
          drawing.current = false;
          lastPoint.current = null;
          evaluate(e.currentTarget);
        }}
      />
      <div className="couple-foil-progress" aria-live="polite">{coverage >= 55 ? "Descubierto" : coverage + "% descubierto"}</div>
    </div>
  );
}

export default function CouplePremiumScenes({ scene, photos, memory, date, recipient, giver, letterText, next }: Props) {
  const [leaving, setLeaving] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [revealedStars, setRevealedStars] = useState<number[]>([]);
  const [scratchDone, setScratchDone] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const dragStart = useRef<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sound = useQuietEffects();
  const haptic = useHaptic();
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  const advance = () => {
    if (leaving) return;
    setLeaving(true);
    later(next, 660);
  };
  const beginDoor = () => {
    if (doorOpen) return;
    sound("touch");
    haptic();
    setDoorOpen(true);
    later(advance, 1220);
  };
  const reveal = (index: number) => {
    if (revealedStars.includes(index)) return;
    sound("star");
    haptic();
    setRevealedStars((v) => [...v, index]);
  };
  const starPositions = [[18,21],[77,17],[48,44],[24,73],[78,78]];
  const photo = photos[Math.min(currentPhoto, photos.length - 1)];
  const showNextPhoto = (step: number) => setCurrentPhoto((v) => Math.max(0, Math.min(photos.length - 1, v + step)));
  const nextAction = (disabled: boolean, label: string) => (
    <button className="couple-continue" disabled={disabled || leaving} onClick={advance}>
      <span>{label}</span><span aria-hidden="true">↗</span>
    </button>
  );
  return (
    <div className={"couple-premium-host" + (leaving ? " is-leaving" : "")} data-premium-scene={scene}>
      <div className="couple-scene-wipe" aria-hidden="true" />
      {scene === "door" && (
        <section className={"scene couple-scene couple-door-scene" + (doorOpen ? " door-opened" : "")}>
          <div className="couple-door-atmosphere" aria-hidden="true" />
          <div className="couple-scene-header">
            <span>CAPÍTULO I · EL UMBRAL</span>
            <h2>Hay lugares a los que sólo se llega <em>de a dos.</em></h2>
          </div>
          <button className="couple-real-door-button" onClick={beginDoor} aria-label="Abrir la puerta">
            <span className="couple-door-frame">
              <span className="couple-door-interior" />
              <span className="couple-door-slab">
                <span className="couple-door-wood" />
                <span className="couple-door-panel panel-top" />
                <span className="couple-door-panel panel-bottom" />
                <span className="couple-door-handle" />
              </span>
              <span className="couple-door-beam" />
            </span>
          </button>
          <p className="couple-object-instruction">{doorOpen ? "Lo que importa está del otro lado…" : "Tocá el picaporte para entrar"}</p>
        </section>
      )}
      {scene === "memories" && (
        <section className="scene couple-scene couple-memories-scene">
          <div className="couple-memory-wash" aria-hidden="true" />
          <div className="couple-scene-header">
            <span>CAPÍTULO II · NUESTRO ÁLBUM</span>
            <h2>Hay días que terminan. <em>Y otros que se quedan.</em></h2>
            {date && <small>{date}</small>}
          </div>
          <div className="couple-album-stage">
            <button className="couple-photo-arrow prev" disabled={currentPhoto === 0} onClick={() => showNextPhoto(-1)} aria-label="Fotografía anterior">‹</button>
            <div
              className="couple-album-photo"
              onTouchStart={(e) => { dragStart.current = e.touches[0]?.clientX ?? null; }}
              onTouchEnd={(e) => {
                const start = dragStart.current;
                dragStart.current = null;
                if (start === null) return;
                const dx = e.changedTouches[0].clientX - start;
                if (Math.abs(dx) > 45) showNextPhoto(dx < 0 ? 1 : -1);
              }}
            >
              {photo && (
                <div key={photo.url + currentPhoto} className="couple-print">
                  <div className="couple-print-image" style={{
                    backgroundImage: "url(" + JSON.stringify(photo.url) + ")",
                    backgroundPosition: photo.position || "center",
                    backgroundSize: photo.fit || "cover",
                  }} />
                  <div className="couple-print-foot">
                    <p>{photo.caption || memory[currentPhoto % memory.length]}</p>
                    <small>{String(currentPhoto + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</small>
                  </div>
                </div>
              )}
            </div>
            <button className="couple-photo-arrow next" disabled={currentPhoto >= photos.length - 1} onClick={() => showNextPhoto(1)} aria-label="Siguiente fotografía">›</button>
          </div>
          <div className="couple-film-dots" aria-label="Progreso del álbum">
            {photos.map((item, index) => (
              <button aria-label={"Ver fotografía " + (index + 1)} aria-current={currentPhoto === index ? "true" : undefined} key={item.url + index} onClick={() => setCurrentPhoto(index)} className={currentPhoto === index ? "current" : ""} />
            ))}
          </div>
          {nextAction(false, "Guardar este instante")}
        </section>
      )}
      {scene === "stars" && (
        <section className="scene couple-scene couple-stars-scene">
          <div className="couple-night-sky" aria-hidden="true" />
          <div className="couple-scene-header">
            <span>CAPÍTULO III · PEQUEÑAS CERTEZAS</span>
            <h2>Hay cosas que <em>siguen brillando.</em></h2>
          </div>
          <div className="couple-constellation">
            <div className="couple-stardust" aria-hidden="true" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="couple-star-lines" aria-hidden="true">
              {revealedStars.slice(1).map((value, i) => (
                <line key={value} x1={starPositions[revealedStars[i]][0]} y1={starPositions[revealedStars[i]][1]} x2={starPositions[value][0]} y2={starPositions[value][1]} />
              ))}
            </svg>
            {starPositions.map(([x, y], i) => (
              <button
                key={i} className={"couple-real-star" + (revealedStars.includes(i) ? " lit" : "")}
                style={{ left: x + "%", top: y + "%" }}
                aria-label={"Descubrir estrella " + (i + 1)}
                aria-pressed={revealedStars.includes(i)}
                onClick={() => reveal(i)}
              ><span /></button>
            ))}
            <div className="couple-stars-copy" aria-live="polite">
              {revealedStars.length ? <p key={revealedStars.length}>{starMessages[revealedStars[revealedStars.length - 1]]}</p> : <p>Tocá una luz. Cada una guarda algo para vos.</p>}
            </div>
          </div>
          {nextAction(revealedStars.length < 3, revealedStars.length < 3 ? "Descubrí " + (3 - revealedStars.length) + " más" : "Llevar estas luces conmigo")}
        </section>
      )}
      {scene === "scratch" && (
        <section className="scene couple-scene couple-scratch-scene">
          <div className="couple-scene-header">
            <span>CAPÍTULO IV · ALGO POR DESCUBRIR</span>
            <h2>Las mejores sorpresas <em>todavía nos esperan.</em></h2>
          </div>
          <ScratchFoil onComplete={() => { setScratchDone(true); haptic(); sound("star"); }} sound={sound} />
          <p className="couple-object-instruction">{scratchDone ? "Hay un nuevo recuerdo esperándonos." : "Deslizá el dedo sobre el dorado hasta revelar el mensaje"}</p>
          {nextAction(!scratchDone, "Ya lo descubrí")}
        </section>
      )}
      {scene === "letter" && (
        <section className={"scene couple-scene couple-letter-scene" + (letterOpen ? " letter-opened" : "")}>
          <div className="couple-scene-header">
            <span>CAPÍTULO V · UNA CARTA PARA VOS</span>
            <h2>Hay palabras que merecen <em>abrirse despacio.</em></h2>
          </div>
          <div className="couple-letter-object">
            <div className="couple-letter-shadow" aria-hidden="true" />
            <div className="couple-envelope-back" />
            <div className="couple-letter-sheet" aria-hidden={!letterOpen}>
              <small>PARA {recipient}</small>
              <p>{letterText || "Gracias por convertir tantos días comunes en recuerdos extraordinarios."}</p>
              <em>Con amor, {giver}</em>
            </div>
            <div className="couple-envelope-flap" />
            <div className="couple-envelope-front" />
            {!letterOpen && (
              <button
                className="couple-wax-seal"
                onClick={() => { sound("paper"); haptic(); setLetterOpen(true); }}
                aria-label="Romper el sello y abrir la carta"
              ><span>♥</span></button>
            )}
          </div>
          <p className="couple-object-instruction">{letterOpen ? "Tomate el tiempo que necesites." : "Tocá el sello para abrir"}</p>
          {letterOpen && nextAction(false, "Última parte")}
        </section>
      )}
    </div>
  );
}
