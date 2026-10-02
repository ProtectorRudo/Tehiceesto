"use client";

import { useState } from "react";
import Link from "next/link";
import { experiences } from "@/data/experiences";

const feelings = ["Emoción", "Amor", "Sorpresa", "Diversión", "Nostalgia"];

export default function CreatorWizard() {
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState("pareja");
  const [recipient, setRecipient] = useState("");
  const [feeling, setFeeling] = useState("Emoción");

  return (
    <div className="creator-card">
      <div className="creator-progress">
        <span style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>

      {step === 0 && (
        <div className="creator-step">
          <span className="eyebrow">01 · Elegí el momento</span>
          <h1>¿Qué querés convertir en algo inolvidable?</h1>
          <div className="choice-grid">
            {experiences.map((item) => (
              <button
                key={item.slug}
                onClick={() => setExperience(item.slug)}
                className={experience === item.slug ? "selected" : ""}
              >
                <span>{item.icon}</span>
                {item.title}
              </button>
            ))}
          </div>
          <button className="primary-action" onClick={() => setStep(1)}>
            Continuar
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="creator-step">
          <span className="eyebrow">02 · La persona</span>
          <h1>¿Para quién existe este lugar?</h1>
          <label className="big-input">
            <span>Su nombre</span>
            <input
              autoFocus
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Ej. Ailín"
            />
          </label>
          <button
            className="primary-action"
            disabled={!recipient.trim()}
            onClick={() => setStep(2)}
          >
            Es para {recipient || "esa persona"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="creator-step">
          <span className="eyebrow">03 · La intención</span>
          <h1>¿Qué querés que sienta?</h1>
          <div className="feeling-row">
            {feelings.map((item) => (
              <button
                key={item}
                onClick={() => setFeeling(item)}
                className={feeling === item ? "selected" : ""}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="creator-note">
            Después te vamos a preguntar por recuerdos, fotos, audios y pequeñas cosas que sólo ustedes conocen. El sistema usa eso para elegir las escenas.
          </p>
          <button className="primary-action" onClick={() => setStep(3)}>
            Diseñar la experiencia
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="creator-step creator-success">
          <span className="eyebrow">Tu experiencia empieza acá</span>
          <div className="success-orb">♥</div>
          <h1>Vamos a crear algo para {recipient}.</h1>
          <p>
            Elegiste una experiencia de <strong>{feeling.toLowerCase()}</strong>. La siguiente etapa conecta historia, archivos, pago y generación automática.
          </p>
          <div className="creator-actions">
            <Link className="primary-action" href={`/experiencias/${experience}`}>
              Ver demo relacionado
            </Link>
            <button className="ghost-action" onClick={() => setStep(0)}>
              Crear otro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
