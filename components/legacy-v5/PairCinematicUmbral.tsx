"use client";

import { useEffect, useRef, useState } from "react";
import "./PairCinematicUmbral.css";
import DoorAtmosphere from "../DoorAtmosphere";

type Props = {
  kicker: string;
  title: string[];
  cta: string;
  onOpen: () => void;
  onAdvance: () => void;
  invitation?: string;
  recipient?: string;
  tone?: "romance" | "friendship" | "neutral";
};

type DoorPhase = "closed" | "opening" | "open" | "entering";

export default function PairCinematicUmbral({ kicker, title, cta, onOpen, onAdvance, invitation = "Del otro lado estamos nosotros.", recipient, tone = "romance" }: Props) {
  const [phase, setPhase] = useState<DoorPhase>("closed");
  const phaseRef = useRef<DoorPhase>("closed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }, []);

  const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const gentleHaptic = (pattern: number | number[]) => {
    try { if ("vibrate" in navigator) navigator.vibrate?.(pattern); } catch { /* optional */ }
  };
  const setDoorPhase = (next: DoorPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const openDoor = () => {
    if (phaseRef.current !== "closed") return;
    setDoorPhase("opening");
    gentleHaptic(12);
    timers.current.push(setTimeout(() => {
      setDoorPhase("open");
      onOpen();
    }, reducedMotion() ? 30 : 1190));
  };

  const proceed = () => {
    if (phaseRef.current !== "open") return;
    setDoorPhase("entering");
    gentleHaptic([8, 32, 10]);
    timers.current.push(setTimeout(onAdvance, reducedMotion() ? 30 : 1160));
  };

  const opened = phase === "open" || phase === "entering";
  return (
    <section className={"thi-scene pair-cinematic-umbral pcu-tone-" + tone + " is-" + phase} data-cinematic-umbral="closed-then-open-v2">
      <div className="pcu-atmosphere" aria-hidden="true">
        <div className="pcu-orbit pcu-orbit-one" />
        <div className="pcu-orbit pcu-orbit-two" />
        <div className="pcu-airlight" />
        <div className="pcu-dust" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{"--dust":i} as React.CSSProperties}/>)}</div>
      </div>

      <div className="pcu-content">
        <div className="pcu-heading">
          <p className="pcu-eyebrow">{kicker}</p>
          <h2>{title.map((line, index) => <span key={index}>{line}</span>)}</h2>
        </div>

        <button
          type="button"
          data-action="open-door"
          className="pcu-door-hit"
          onClick={openDoor}
          disabled={phase !== "closed"}
          aria-label={phase === "closed" ? "Tocá la puerta para abrirla" : opened ? "La puerta está abierta" : "La puerta se está abriendo"}
        >
          <span className="pcu-door-scene" aria-hidden="true">
            <span className="pcu-door-bloom" />
            <span className="pcu-door-picture"><DoorAtmosphere/></span>
            <span className="pcu-door-frame-depth"/>
            <span className="pcu-door-lightspill"/>
            <span className="pcu-door-closed-leaf">
              <i className="pcu-door-panel-upper" />
              <i className="pcu-door-panel-lower" />
              <i className="pcu-door-knob" />
              {recipient&&<span className="pcu-door-friend-name">{recipient}</span>}
            </span>
            <span className="pcu-threshold-glimmer" />
          <span className="pcu-camera-glow" />
          </span>
        </button>

        <div className="pcu-invitation">
          <p>{invitation}</p>
          {!opened ? (
            <span className="pcu-open-instruction" role="status">
              {phase === "opening" ? "Abriendo para vos…" : "Tocá la puerta para abrir"}
            </span>
          ) : (
            <button data-action="advance" type="button" onClick={proceed} disabled={phase === "entering"} aria-label={cta.replace(/\s*→\s*$/, "")}>
              <span>{cta.replace(/\s*→\s*$/, "")}</span><b aria-hidden="true">→</b>
            </button>
          )}
        </div>
      </div>
      <div className="pcu-veil" aria-hidden="true"/>
    </section>
  );
}
