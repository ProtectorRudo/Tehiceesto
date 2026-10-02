"use client";

import { useMemo, useState } from "react";
import type { Experience } from "@/data/experiences";

type Props = { experience: Experience };

const photos = [
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85",
];

export default function ExperienceEngine({ experience }: Props) {
  const [scene, setScene] = useState(0);
  const [stars, setStars] = useState<number[]>([]);
  const [letterOpen, setLetterOpen] = useState(false);
  const [scratched, setScratched] = useState(false);

  const total = 7;
  const progress = ((scene + 1) / total) * 100;

  const memory = useMemo(
    () => [
      "Ese día todavía no sabíamos todo lo que iba a venir.",
      "Después aprendimos que los mejores recuerdos casi nunca avisan que van a ser importantes.",
      "Y sin darnos cuenta, empezamos a coleccionar un mundo propio.",
    ],
    []
  );

  const next = () => setScene((value) => Math.min(total - 1, value + 1));
  const previous = () => setScene((value) => Math.max(0, value - 1));

  const revealStar = (index: number) => {
    setStars((current) =>
      current.includes(index) ? current : [...current, index]
    );
  };

  return (
    <main
      className="experience-shell"
      style={{ "--accent": experience.accent } as React.CSSProperties}
    >
      <div className="experience-topbar">
        <button onClick={previous} disabled={scene === 0} aria-label="Volver">←</button>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <span>{scene + 1}/{total}</span>
      </div>

      {scene === 0 && (
        <section className="scene scene-intro">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <p className="scene-kicker">{experience.demoGiver} hizo algo para vos</p>
          <h1>{experience.demoRecipient}</h1>
          <p className="scene-lead">{experience.opening}</p>
          <button className="primary-action" onClick={next}>Entrar</button>
          <small>Mejor con auriculares · 6 min</small>
        </section>
      )}

      {scene === 1 && (
        <section className="scene scene-door">
          <p className="scene-kicker">Capítulo I</p>
          <h2>Todo empieza abriendo una puerta.</h2>
          <button className="door-wrap" onClick={next} aria-label="Abrir la puerta">
            <span className="door-glow" />
            <span className="door"><i className="door-knob" /></span>
          </button>
          <p className="scene-hint">Tocá la puerta</p>
        </section>
      )}

      {scene === 2 && (
        <section className="scene scene-memories">
          <p className="scene-kicker">Capítulo II · Los recuerdos</p>
          <h2>Hay días que terminan. Y otros que se quedan.</h2>
          <div className="film-strip">
            {photos.map((photo, index) => (
              <article key={photo} className="memory-card">
                <div className="memory-image" style={{ backgroundImage: `url("${photo}")` }} />
                <p>{memory[index]}</p>
                <span>0{index + 1}</span>
              </article>
            ))}
          </div>
          <button className="primary-action" onClick={next}>Seguir</button>
        </section>
      )}

      {scene === 3 && (
        <section className="scene scene-stars">
          <p className="scene-kicker">Cinco cosas que quiero que recuerdes</p>
          <h2>Tocá las estrellas.</h2>
          <div className="star-field">
            {[
              "Tu forma de hacer hogar.",
              "Cómo te reís cuando te olvidás de cuidarte.",
              "La calma que traés sin darte cuenta.",
              "Todo lo que todavía soñamos.",
              "Que te volvería a elegir.",
            ].map((text, index) => (
              <button
                key={text}
                className={`star-button ${stars.includes(index) ? "revealed" : ""}`}
                onClick={() => revealStar(index)}
              >
                <span>✦</span>
                <em>{stars.includes(index) ? text : "Tocame"}</em>
              </button>
            ))}
          </div>
          <button className="primary-action" onClick={next} disabled={stars.length < 3}>
            {stars.length < 3 ? `Descubrí ${3 - stars.length} más` : "Continuar"}
          </button>
        </section>
      )}

      {scene === 4 && (
        <section className="scene scene-scratch">
          <p className="scene-kicker">Hay algo escondido</p>
          <h2>Esto sí tenés que descubrirlo.</h2>
          <button
            className={`scratch-card ${scratched ? "scratched" : ""}`}
            onPointerMove={(event) => {
              if (event.buttons === 1 || event.pointerType === "touch") setScratched(true);
            }}
            onClick={() => setScratched(true)}
          >
            <div className="scratch-prize">
              <span>Vale por</span>
              <strong>un recuerdo nuevo juntos</strong>
              <small>Fecha a elección · sin vencimiento</small>
            </div>
            <div className="scratch-cover">
              <span>RASPÁ ACÁ</span>
              <small>deslizá el dedo</small>
            </div>
          </button>
          <button className="primary-action" onClick={next} disabled={!scratched}>Ya lo descubrí</button>
        </section>
      )}

      {scene === 5 && (
        <section className="scene scene-letter">
          <p className="scene-kicker">La parte que no podía entrar en una foto</p>
          <h2>Hay palabras que merecen abrirse despacio.</h2>
          <button className={`envelope ${letterOpen ? "open" : ""}`} onClick={() => setLetterOpen(true)}>
            <span className="envelope-back" />
            <span className="paper">
              <small>Para {experience.demoRecipient}</small>
              <strong>Gracias por convertir tantos días comunes en recuerdos extraordinarios.</strong>
              <em>— {experience.demoGiver}</em>
            </span>
            <span className="envelope-front" />
            <span className="wax">♥</span>
          </button>
          {!letterOpen && <p className="scene-hint">Rompé el sello</p>}
          {letterOpen && <button className="primary-action" onClick={next}>Última parte</button>}
        </section>
      )}

      {scene === 6 && (
        <section className="scene scene-finale">
          <div className="finale-ring" />
          <p className="scene-kicker">Una última cosa</p>
          <h2>{experience.closing}</h2>
          <p>Este lugar va a seguir acá para cuando quieras volver.</p>
          <div className="reaction-row">
            {["🥹", "❤️", "😭", "✨"].map((reaction) => <button key={reaction}>{reaction}</button>)}
          </div>
          <button className="ghost-action" onClick={() => setScene(0)}>Volver al comienzo</button>
          <small>creado con ♥ en Te Hice Esto</small>
        </section>
      )}
    </main>
  );
}
