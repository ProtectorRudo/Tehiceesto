"use client";

import { useMemo, useState } from "react";
import type { Experience, SceneType } from "@/data/experiences";

export type ExperiencePhoto = {
  url: string;
  caption?: string;
  fit?: "cover" | "contain";
  position?: "center" | "top" | "bottom" | "left" | "right";
};

export type ExperienceAudio = {
  url: string;
  caption?: string;
};

export type ExperienceVideo = {
  url: string;
  caption?: string;
};

type Props = {
  experience: Experience;
  letterText?: string;
  photoUrls?: string[];
  photoMedia?: ExperiencePhoto[];
  audioMedia?: ExperienceAudio[];
  videoMedia?: ExperienceVideo[];
};

const photos = [
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85",
];

export default function ExperienceEngine({
  experience,
  letterText,
  photoUrls,
  photoMedia,
  audioMedia,
  videoMedia,
}: Props) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [stars, setStars] = useState<number[]>([]);
  const [letterOpen, setLetterOpen] = useState(false);
  const [scratched, setScratched] = useState(false);
  const [candlesOut, setCandlesOut] = useState(false);
  const [popped, setPopped] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [voicesPlayed, setVoicesPlayed] = useState<number[]>([]);

  const scenes = experience.recipe;
  const displayPhotos: ExperiencePhoto[] =
    photoMedia && photoMedia.length > 0
      ? photoMedia.slice(0, 8)
      : photoUrls && photoUrls.length > 0
        ? photoUrls.slice(0, 8).map((url) => ({ url }))
        : photos.map((url) => ({ url }));
  const currentScene = scenes[sceneIndex];
  const total = scenes.length;
  const progress = ((sceneIndex + 1) / total) * 100;

  const memory = useMemo(
    () => [
      "Ese día todavía no sabíamos todo lo que iba a venir.",
      "Después aprendimos que los mejores recuerdos casi nunca avisan que van a ser importantes.",
      "Y sin darnos cuenta, empezamos a coleccionar un mundo propio.",
    ],
    []
  );

  const next = () => setSceneIndex((value) => Math.min(total - 1, value + 1));
  const previous = () => setSceneIndex((value) => Math.max(0, value - 1));
  const revealStar = (index: number) => {
    setStars((current) => current.includes(index) ? current : [...current, index]);
  };
  const popBalloon = (index: number) => {
    setPopped((current) => current.includes(index) ? current : [...current, index]);
  };
  const playVoice = (index: number) => {
    setVoicesPlayed((current) => current.includes(index) ? current : [...current, index]);
  };

  const renderScene = (scene: SceneType) => {
    switch (scene) {
      case "intro":
        return (
          <section className="scene scene-intro">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <p className="scene-kicker">{experience.demoGiver} hizo algo para vos</p>
            <h1>{experience.demoRecipient}</h1>
            <p className="scene-lead">{experience.opening}</p>
            <button className="primary-action" onClick={next}>Entrar</button>
            <small>Mejor con auriculares · 6 min</small>
          </section>
        );

      case "door":
        return (
          <section className="scene scene-door">
            <p className="scene-kicker">Hay algo del otro lado</p>
            <h2>Todo empieza abriendo una puerta.</h2>
            <button className="door-wrap" onClick={next} aria-label="Abrir la puerta">
              <span className="door-glow" />
              <span className="door"><i className="door-knob" /></span>
            </button>
            <p className="scene-hint">Tocá la puerta</p>
          </section>
        );

      case "memories":
        return (
          <section className="scene scene-memories">
            <p className="scene-kicker">Los recuerdos</p>
            <h2>Hay días que terminan. Y otros que se quedan.</h2>
            <div className="film-strip">
              {displayPhotos.map((photo, index) => (
                <article key={photo.url} className="memory-card">
                  <div
                    className="memory-image"
                    style={{
                      backgroundImage: `url("${photo.url}")`,
                      backgroundSize: photo.fit || "cover",
                      backgroundPosition: photo.position || "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                  <p>{photo.caption || memory[index % memory.length]}</p>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </article>
              ))}
            </div>
            <button className="primary-action" onClick={next}>Seguir</button>
          </section>
        );

      case "stars":
        return (
          <section className="scene scene-stars">
            <p className="scene-kicker">Cosas que no quiero que olvides</p>
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
        );

      case "scratch":
        return (
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
        );

      case "letter":
        return (
          <section className="scene scene-letter">
            <p className="scene-kicker">La parte que no podía entrar en una foto</p>
            <h2>Hay palabras que merecen abrirse despacio.</h2>
            <button className={`envelope ${letterOpen ? "open" : ""}`} onClick={() => setLetterOpen(true)}>
              <span className="envelope-back" />
              <span className="paper">
                <small>Para {experience.demoRecipient}</small>
                <strong>{letterText || "Gracias por convertir tantos días comunes en recuerdos extraordinarios."}</strong>
                <em>— {experience.demoGiver}</em>
              </span>
              <span className="envelope-front" />
              <span className="wax">♥</span>
            </button>
            {!letterOpen && <p className="scene-hint">Rompé el sello</p>}
            {letterOpen && <button className="primary-action" onClick={next}>Última parte</button>}
          </section>
        );

      case "candles":
        return (
          <section className="scene scene-candles">
            <p className="scene-kicker">Pedí un deseo</p>
            <h2>Antes de seguir, faltan las velitas.</h2>
            <div className={`cake ${candlesOut ? "candles-out" : ""}`}>
              <div className="cake-top" />
              <div className="candle-row">
                {[0,1,2,3,4].map((item) => <span className="candle" key={item}><i /></span>)}
              </div>
            </div>
            <button className="primary-action" onClick={() => setCandlesOut(true)}>
              {candlesOut ? "Deseo pedido ✦" : "Soplar las velitas"}
            </button>
            {candlesOut && <button className="ghost-action scene-secondary" onClick={next}>Seguir</button>}
          </section>
        );

      case "balloons":
        return (
          <section className="scene scene-balloons">
            <p className="scene-kicker">No todos los globos están vacíos</p>
            <h2>Reventá tres.</h2>
            <div className="balloon-field">
              {[
                "Una razón por la que te queremos.",
                "Ese abrazo que siempre llega a tiempo.",
                "Tu risa mejora cualquier mesa.",
                "Hoy mandás vos.",
                "Te debemos una salida.",
                "Nunca dejes de ser así.",
              ].map((text, index) => (
                <button
                  key={text}
                  onClick={() => popBalloon(index)}
                  className={`balloon ${popped.includes(index) ? "popped" : ""}`}
                >
                  <span>{popped.includes(index) ? "✦" : ""}</span>
                  <em>{popped.includes(index) ? text : "POP"}</em>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={popped.length < 3}>
              {popped.length < 3 ? `Faltan ${3 - popped.length}` : "Seguir celebrando"}
            </button>
          </section>
        );

      case "timeline":
        return (
          <section className="scene scene-timeline">
            <p className="scene-kicker">El tiempo también cuenta historias</p>
            <h2>Tres momentos. Una misma historia.</h2>
            <div className="timeline">
              <article><span>01</span><strong>El comienzo</strong><p>Cuando todavía no sabíamos en qué se iba a convertir todo esto.</p></article>
              <article><span>02</span><strong>El día que cambió algo</strong><p>Uno de esos momentos que después entendemos que fueron gigantes.</p></article>
              <article><span>03</span><strong>Hoy</strong><p>La historia sigue. Y por suerte todavía no sabemos cómo termina.</p></article>
            </div>
            <button className="primary-action" onClick={next}>Seguir la historia</button>
          </section>
        );

      case "voices":
        return (
          <section className="scene scene-voices">
            <p className="scene-kicker">Hay gente esperando decirte algo</p>
            <h2>Elegí una voz.</h2>
            <div className="voice-grid">
              {audioMedia && audioMedia.length > 0
                ? audioMedia.map((audio, index) => (
                    <article
                      key={audio.url}
                      className={voicesPlayed.includes(index) ? "voice-audio-card played" : "voice-audio-card"}
                    >
                      <span>♪</span>
                      <strong>{audio.caption || `Mensaje ${index + 1}`}</strong>
                      <audio
                        src={audio.url}
                        controls
                        preload="metadata"
                        onPlay={() => playVoice(index)}
                      />
                    </article>
                  ))
                : ["Mamá", "Tomás", "Caro", "Fran"].map((name, index) => (
                    <button
                      key={name}
                      className={voicesPlayed.includes(index) ? "played" : ""}
                      onClick={() => playVoice(index)}
                    >
                      <span>{voicesPlayed.includes(index) ? "▶" : "●"}</span>
                      <strong>{name}</strong>
                      <small>{voicesPlayed.includes(index) ? "“Te quiero muchísimo. Gracias por estar siempre.”" : "Tocar para escuchar"}</small>
                    </button>
                  ))}
            </div>
            <button className="primary-action" onClick={next} disabled={voicesPlayed.length < 1}>Continuar</button>
          </section>
        );

      case "video":
        return (
          <section className="scene scene-video">
            <p className="scene-kicker">Un momento para mirar sin apuro</p>
            <h2>Hay recuerdos que necesitan movimiento y sonido.</h2>
            {videoMedia && videoMedia.length > 0 ? (
              <div className="cinematic-video-wrap">
                <video
                  src={videoMedia[0].url}
                  controls
                  playsInline
                  preload="metadata"
                />
                {videoMedia[0].caption && <p>{videoMedia[0].caption}</p>}
              </div>
            ) : (
              <div className="video-placeholder">
                <span>▶</span>
                <p>Acá puede vivir un video especial.</p>
              </div>
            )}
            <button className="primary-action" onClick={next}>Continuar</button>
          </section>
        );

      case "quiz":
        return (
          <section className="scene scene-quiz">
            <p className="scene-kicker">A ver cuánto te acordás</p>
            <h2>¿Dónde empezó esta historia?</h2>
            <div className="quiz-options">
              {["En un mensaje", "En una salida que casi se cancela", "En un lugar que ya no existe"].map((answer, index) => (
                <button key={answer} onClick={() => setQuizDone(true)} className={quizDone && index === 1 ? "correct" : ""}>
                  {answer}
                </button>
              ))}
            </div>
            {quizDone && <p className="quiz-reveal">La respuesta importa menos que todo lo que vino después.</p>}
            <button className="primary-action" onClick={next} disabled={!quizDone}>Seguir</button>
          </section>
        );

      case "vault":
        return (
          <section className="scene scene-vault">
            <p className="scene-kicker">Última cerradura</p>
            <h2>Hay algo guardado para vos.</h2>
            <button className={`vault ${vaultOpen ? "open" : ""}`} onClick={() => setVaultOpen(true)}>
              <span className="vault-ring">◇</span>
              <strong>{vaultOpen ? "ABIERTO" : "TOCÁ PARA ABRIR"}</strong>
            </button>
            {vaultOpen && <p className="vault-message">No era un objeto. Era una pregunta.</p>}
            {vaultOpen && <button className="primary-action" onClick={next}>Abrir la última carta</button>}
          </section>
        );

      case "capsule":
        return (
          <section className="scene scene-capsule">
            <p className="scene-kicker">Para volver algún día</p>
            <h2>Guardamos algo para tu yo del futuro.</h2>
            <button className={`capsule ${capsuleOpen ? "open" : ""}`} onClick={() => setCapsuleOpen(true)}>
              <span>2036</span>
              <strong>{capsuleOpen ? "Abriste una cápsula del tiempo" : "Abrir cápsula"}</strong>
              <p>{capsuleOpen ? "Ojalá cuando leas esto sigas teniendo esa misma curiosidad por el mundo." : "Hay palabras que pueden esperar."}</p>
            </button>
            {capsuleOpen && <button className="primary-action" onClick={next}>Guardar este momento</button>}
          </section>
        );

      case "proposal":
        return (
          <section className="scene scene-proposal">
            <div className="proposal-halo" />
            <p className="scene-kicker">Y ahora sí</p>
            <span className="ring-symbol">◇</span>
            <h2>{experience.closing}</h2>
            <p>No hace falta tocar nada más. Este momento es de ustedes.</p>
            <div className="reaction-row">
              {["Sí ❤️", "😭", "✨"].map((reaction) => <button key={reaction}>{reaction}</button>)}
            </div>
            <small>creado con ♥ en Te Hice Esto</small>
          </section>
        );

      case "finale":
      default:
        return (
          <section className="scene scene-finale">
            <div className="finale-ring" />
            <p className="scene-kicker">Una última cosa</p>
            <h2>{experience.closing}</h2>
            <p>Este lugar va a seguir acá para cuando quieras volver.</p>
            <div className="reaction-row">
              {["🥹", "❤️", "😭", "✨"].map((reaction) => <button key={reaction}>{reaction}</button>)}
            </div>
            <button className="ghost-action" onClick={() => setSceneIndex(0)}>Volver al comienzo</button>
            <small>creado con ♥ en Te Hice Esto</small>
          </section>
        );
    }
  };

  return (
    <main className="experience-shell" style={{ "--accent": experience.accent } as React.CSSProperties}>
      <div className="experience-topbar">
        <button onClick={previous} disabled={sceneIndex === 0} aria-label="Volver">←</button>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <span>{sceneIndex + 1}/{total}</span>
      </div>
      {renderScene(currentScene)}
    </main>
  );
}
