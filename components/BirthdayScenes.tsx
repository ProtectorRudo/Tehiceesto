"use client";

import { useEffect, useRef, useState } from "react";
import "./BirthdayScenes.css";

function gentleHaptic(pattern: number | number[] = 14) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(pattern);
}

const BALLOON_MESSAGES = [
  "Tu forma de estar hace más lindos nuestros días.",
  "Ese abrazo tuyo que siempre llega a tiempo.",
  "Tu risa convierte cualquier día en una fiesta.",
  "Ojalá hoy te mimen como te merecés.",
  "Todavía nos quedan miles de planes juntos.",
  "Nunca olvides lo importante que sos para nosotros.",
];

const YEAR_PROMISES = [
  { title: "Estar más cerca", copy: "Hacernos tiempo para compartir más momentos con vos." },
  { title: "Acompañarte", copy: "Estar también en los días que no tengan nada para festejar." },
  { title: "Crear recuerdos", copy: "Buscar nuevas excusas para reírnos, encontrarnos y celebrar." },
];

const HUG_MESSAGES = [
  "Uno por cada día en que nos hiciste sonreír.",
  "Uno por las veces que estuviste, incluso sin decir nada.",
  "Uno por todos los recuerdos que tenemos con vos.",
  "Uno por las cosas lindas que todavía te esperan.",
  "Uno para los días en que necesites un poquito más de cariño.",
  "Y el más grande de todos... simplemente porque existís.",
];

export function BirthdayCakeScene({ onContinue }: { onContinue: () => void }) {
  const [phase, setPhase] = useState<"lit" | "blowing" | "out">("lit");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const blow = () => {
    if (phase !== "lit") return;
    gentleHaptic([9, 45, 17]);
    setPhase("blowing");
    timer.current = setTimeout(() => setPhase("out"), 1000);
  };
  return (
    <section className={"scene birthday-scene birthday-candles birthday-candles--" + phase}>
      <div className="birthday-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <p className="birthday-eyebrow">UN PEQUEÑO RITUAL · SÓLO PARA VOS</p>
      <h2>Antes de pedir algo al mundo,<br/><em>pedí un deseo.</em></h2>
      <p className="birthday-deck">Cerrá los ojos un segundo. Pensá en eso que te haría inmensamente feliz.</p>
      <div className="birthday-cake-stage" aria-label={phase === "out" ? "Las cinco velitas están apagadas" : "Torta de cumpleaños con cinco velitas encendidas"}>
        <div className="birthday-cake-glow" aria-hidden="true" />
        <div className="birthday-cake-art" aria-hidden="true">
          <div className="birthday-cake-platter" />
          <div className="birthday-cake-lower-tier"><span className="birthday-icing-lower" /></div>
          <div className="birthday-cake-upper-tier"><span className="birthday-icing-upper" /></div>
          <div className="birthday-cake-fruit fruit-left" />
          <div className="birthday-cake-fruit fruit-right" />
          <div className="birthday-candle-line">
            {[0, 1, 2, 3, 4].map(i => (
              <div className="birthday-candle" key={i}>
                <i className="birthday-flame" />
                <i className="birthday-smoke" />
                <span />
              </div>
            ))}
          </div>
        </div>
        <div className="birthday-cake-lightparticles" aria-hidden="true">{Array.from({ length: 15 }, (_, i) => <i key={i} style={{ "--particle": i } as React.CSSProperties} />)}</div>
      </div>
      <div className="birthday-wish-reveal" role="status" aria-live="polite">
        {phase === "out" ? <><small>DESEO GUARDADO EN SECRETO</small><strong>Ojalá la vida te sorprenda mucho más de lo que imaginás.</strong></> : <small>Cuando estés lista, apagá las cinco llamitas.</small>}
      </div>
      {phase !== "out" ? <button className="birthday-button" onClick={blow} disabled={phase === "blowing"}>{phase === "blowing" ? "Tu deseo está volando..." : "Soplar las velitas"} <span aria-hidden="true">✧</span></button>
       : <button className="birthday-button" onClick={onContinue}>Seguir celebrando <span aria-hidden="true">→</span></button>}
    </section>
  );
}

export function BirthdayBalloonsScene({ onContinue }: { onContinue: () => void }) {
  const [popped, setPopped] = useState<number[]>([]);
  const pop = (index: number) => {
    if (popped.includes(index)) return;
    gentleHaptic([13, 20, 9]);
    setPopped(current => [...current, index]);
  };
  return (
    <section className="scene birthday-scene birthday-balloons">
      <div className="birthday-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <p className="birthday-eyebrow">CADA GLOBO GUARDA ALGO PARA VOS</p>
      <h2>Hay palabras que estaban<br/><em>esperando este día.</em></h2>
      <p className="birthday-deck">Tocá los globos para liberar los mensajes. Descubrí al menos tres.</p>
      <div className="birthday-balloons-grid">
        {BALLOON_MESSAGES.map((message, index) => {
          const open = popped.includes(index);
          return (
            <button key={index} type="button" onClick={() => pop(index)} disabled={open} aria-label={open ? message : "Reventar globo " + (index + 1)}
              className={"birthday-balloon-item birthday-balloon-color-" + index + (open ? " is-popped" : "")}>
              <span className="birthday-balloon-body"><i className="birthday-balloon-reflection" /><i className="birthday-balloon-knot" /><i className="birthday-balloon-string" /><b>✧</b></span>
              <span className="birthday-balloon-burst" aria-hidden="true">{Array.from({length: 8}, (_, i) => <i key={i} style={{"--burst":i} as React.CSSProperties} />)}</span>
              <span className="birthday-balloon-note"><small>PARA VOS · {String(index + 1).padStart(2,"0")}</small><strong>{message}</strong><span>✦</span></span>
            </button>
          );
        })}
      </div>
      <p className="birthday-discovery-count" aria-live="polite">{popped.length === 0 ? "Seis mensajes están esperando." : popped.length + " de 6 mensajes descubiertos"}</p>
      <button className="birthday-button" onClick={onContinue} disabled={popped.length < 3}>{popped.length < 3 ? "Descubrí " + (3 - popped.length) + " más" : "Guardar estos mensajes"} <span aria-hidden="true">→</span></button>
    </section>
  );
}

export function BirthdayPromiseScene({ onContinue }: { onContinue: () => void }) {
  const [opened, setOpened] = useState<number[]>([]);
  const reveal = (index: number) => { if (!opened.includes(index)) { gentleHaptic(12); setOpened(values => [...values, index]); } };
  return (
    <section className="scene birthday-scene birthday-promise">
      <div className="birthday-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <p className="birthday-eyebrow">UN PACTO PARA EL AÑO QUE EMPIEZA</p>
      <h2>Ahora nos toca<br/><em>a nosotros.</em></h2>
      <p className="birthday-deck">Vos pediste un deseo. Nosotros tenemos tres promesas para acompañarte.</p>
      <div className="birthday-promise-stack">
        {YEAR_PROMISES.map((promise, index) => {
          const open = opened.includes(index);
          return (
            <button type="button" onClick={() => reveal(index)} key={index} className={"birthday-promise-ticket" + (open ? " is-unfolded" : "")} aria-expanded={open}>
              <span className="birthday-ticket-serial">{String(index + 1).padStart(2, "0")} <span>✶</span> PARA ESTE NUEVO AÑO</span>
              <span className="birthday-ticket-fold">
                <span className="birthday-ticket-front"><i>✧</i><strong>{promise.title}</strong><small>Tocá para abrir</small></span>
                <span className="birthday-ticket-back"><strong>{promise.title}</strong><span>{promise.copy}</span></span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="birthday-discovery-count" aria-live="polite">{opened.length === 3 ? "Tres promesas. Una sola certeza: contás con nosotros." : "Abrí los tres pequeños compromisos."}</p>
      <button onClick={onContinue} className="birthday-button" disabled={opened.length < 3}>{opened.length < 3 ? "Quedan " + (3 - opened.length) + " por descubrir" : "Guardarlas para siempre"} <span aria-hidden="true">→</span></button>
    </section>
  );
}

export function BirthdayHugsScene({ recipient, giver, closing, onRestart }: { recipient: string; giver: string; closing: string; onRestart: () => void }) {
  const [received, setReceived] = useState(0);
  const [started, setStarted] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  const begin = () => {
    if (started) return;
    setStarted(true);
    gentleHaptic([15, 55, 22]);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setReceived(HUG_MESSAGES.length); return; }
    HUG_MESSAGES.forEach((_, index) => {
      timers.current.push(setTimeout(() => {
        setReceived(index + 1);
        gentleHaptic(index === HUG_MESSAGES.length - 1 ? [25, 85, 28] : [10, 55, 10]);
      }, 360 + index * 1300));
    });
  };
  const again = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setReceived(0); setStarted(false);
  };
  const completed = received === HUG_MESSAGES.length;
  return (
    <section className={"scene birthday-scene birthday-hugs" + (started ? " is-embracing" : "") + (completed ? " is-complete" : "")}>
      <div className="birthday-hugs-stars" aria-hidden="true">{Array.from({length: 24}, (_, i) => <i key={i} style={{"--spark":i} as React.CSSProperties} />)}</div>
      <p className="birthday-eyebrow">ANTES DE TERMINAR, UNA ÚLTIMA COSA</p>
      <h2>{completed ? <>Que nunca te falte<br/><em>un abrazo.</em></> : <>Hay regalos que no<br/><em>entran en una caja.</em></>}</h2>
      <p className="birthday-deck">{completed ? closing : "Este viene de parte de todos los que te queremos."}</p>
      <div className="birthday-hug-world" aria-live="polite">
        <div className="birthday-hug-orbit" aria-hidden="true"><span /><span /><span /></div>
        <div className="birthday-hug-arms" aria-hidden="true"><span className="birthday-hug-arm arm-left" /><span className="birthday-hug-arm arm-right" /></div>
        <div className="birthday-hug-core">
          <small>PARA</small>
          <strong>{recipient}</strong>
          <span className="birthday-hug-heart">♥</span>
          <small>CON TODO NUESTRO CARIÑO</small>
        </div>
        {started && received > 0 && <div className="birthday-hug-floating-note" key={received}><span>ABRAZO {String(received).padStart(2,"0")}</span><strong>{HUG_MESSAGES[received - 1]}</strong></div>}
      </div>
      <div className="birthday-hugs-progress" aria-label={received + " de 6 abrazos recibidos"}>
        {HUG_MESSAGES.map((_, index) => <i key={index} className={index < received ? "delivered" : ""} />)}
      </div>
      {!started && <button className="birthday-button birthday-hug-start" onClick={begin}>Recibir mis abrazos <span aria-hidden="true">♥</span></button>}
      {started && !completed && <p className="birthday-hug-counter">Te están llegando {received} de 6 abrazos...</p>}
      {completed && <div className="birthday-hug-finish"><p>De {giver}, con todo el amor del mundo.</p><div className="birthday-hug-actions"><button className="birthday-button" onClick={again}>Volver a sentirlos <span aria-hidden="true">♡</span></button><button className="birthday-hug-restart" onClick={onRestart}>Volver al comienzo ↺</button></div><small>creado con ♥ en Te Hice Esto</small></div>}
    </section>
  );
}
