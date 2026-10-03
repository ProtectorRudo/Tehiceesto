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
  storyContext?: {
    keyDate?: string;
    anecdote?: string;
  };
};

const photos = [
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85",
];

const motherDemoPhotos = [
  "https://unsplash.com/photos/82NHIKIvKNc/download?force=true&w=1200",
  "https://unsplash.com/photos/NEZHjs1Oi04/download?force=true&w=1200",
  "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=1200&q=85",
];

const fatherDemoPhotos = [
  "https://unsplash.com/photos/WnsQxkepmiY/download?force=true&w=1200",
  "https://unsplash.com/photos/HptxPPct2d4/download?force=true&w=1200",
  "https://unsplash.com/photos/vMP8lfhxPi4/download?force=true&w=1200",
];

const friendshipDemoPhotos = [
  "https://unsplash.com/photos/rjnIYeC6rmA/download?force=true&w=1200",
  "https://unsplash.com/photos/juCtUKs7z68/download?force=true&w=1200",
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85",
];

export default function ExperienceEngine({
  experience,
  letterText,
  photoUrls,
  photoMedia,
  audioMedia,
  videoMedia,
  storyContext,
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
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState<number[]>([]);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [ritualsOpen, setRitualsOpen] = useState<number[]>([]);
  const [chapterOpen, setChapterOpen] = useState<number[]>([]);
  const [futureOpen, setFutureOpen] = useState(false);
  const [reasonsOpen, setReasonsOpen] = useState<number[]>([]);
  const [certaintyOpen, setCertaintyOpen] = useState<number[]>([]);
  const [thresholdHolding, setThresholdHolding] = useState(false);
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [proposalAccepted, setProposalAccepted] = useState(false);
  const [lightOpen, setLightOpen] = useState(false);
  const [holdHolding, setHoldHolding] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [careOpen, setCareOpen] = useState<number[]>([]);
  const [sacrificesOpen, setSacrificesOpen] = useState<number[]>([]);
  const [lessonsOpen, setLessonsOpen] = useState<number[]>([]);
  const [presenceOpen, setPresenceOpen] = useState<number[]>([]);
  const [inheritanceOpen, setInheritanceOpen] = useState<number[]>([]);
  const [returnOpen, setReturnOpen] = useState(false);
  const [lookbackOpen, setLookbackOpen] = useState(false);
  const [casefileOpen, setCasefileOpen] = useState(false);
  const [insideJokesOpen, setInsideJokesOpen] = useState<number[]>([]);
  const [incidentsOpen, setIncidentsOpen] = useState<number[]>([]);
  const [proofOpen, setProofOpen] = useState<number[]>([]);
  const [pactOpen, setPactOpen] = useState<number[]>([]);

  const scenes = experience.recipe;
  const isGrandparents = experience.slug === "abuelos";
  const isAnniversary = experience.slug === "aniversario";
  const isProposal = experience.slug === "propuesta";
  const isMother = experience.slug === "mama" || experience.slug === "mama-papa";
  const isFather = experience.slug === "papa";
  const isFriendship = experience.slug === "amistad";
  const introKicker = isProposal
    ? `Una experiencia privada de ${experience.demoGiver}`
    : isFriendship
      ? `ARCHIVO 021 · preparado por ${experience.demoGiver}`
      : isMother
        ? `${experience.demoGiver} quiso volver a mirar tu historia`
        : isFather
          ? `${experience.demoGiver} guardó algunas cosas que aprendió de vos`
          : isGrandparents
            ? `Un archivo familiar preparado por ${experience.demoGiver}`
            : isAnniversary
              ? `${experience.demoGiver} volvió a recorrer todo lo que construyeron`
              : experience.slug === "hijos"
                ? `Una cápsula hecha por ${experience.demoGiver}`
                : experience.slug === "cumpleanos"
                  ? `${experience.demoGiver} preparó algo que no entra en un mensaje`
                  : experience.slug === "pareja"
                    ? `Una historia privada hecha por ${experience.demoGiver}`
                    : `${experience.demoGiver} hizo algo para vos`;

  const introAction = isProposal
    ? "Quiero seguir"
    : isFriendship
      ? "Abrir expediente"
      : isMother
        ? "Volver a esos recuerdos"
        : isFather
          ? "Mirar de nuevo"
          : isGrandparents
            ? "Abrir el archivo"
            : isAnniversary
              ? "Volver a recorrerlo"
              : experience.slug === "hijos"
                ? "Abrir esta cápsula"
                : experience.slug === "cumpleanos"
                  ? "Empezar"
                  : experience.slug === "pareja"
                    ? "Entrar despacio"
                    : "Entrar";

  const introNote = isProposal
    ? "Sin apuro · llegá hasta el final"
    : isFriendship
      ? "Material sensible · risas probablemente inevitables"
      : isMother
        ? "Mejor sin apuro"
        : isFather
          ? "Hay cosas que se entienden distinto de grande"
          : isGrandparents
            ? "Fotos, voces y recuerdos de familia"
            : isAnniversary
              ? "No es sobre cómo empezó. Es sobre todo lo que vino después."
              : experience.slug === "hijos"
                ? "Un recorrido para volver hoy o dentro de muchos años"
                : experience.slug === "cumpleanos"
                  ? "Hay gente esperando del otro lado"
                  : experience.slug === "pareja"
                    ? "Hecho para una sola persona"
                    : "Una experiencia privada";
  const demoPhotos = isMother ? motherDemoPhotos : isFather ? fatherDemoPhotos : isFriendship ? friendshipDemoPhotos : photos;
  const displayPhotos: ExperiencePhoto[] =
    photoMedia && photoMedia.length > 0
      ? photoMedia.slice(0, 8)
      : photoUrls && photoUrls.length > 0
        ? photoUrls.slice(0, 8).map((url) => ({ url }))
        : demoPhotos.map((url) => ({ url }));
  const currentScene = scenes[sceneIndex];
  const total = scenes.length;
  const progress = ((sceneIndex + 1) / total) * 100;
  const storyDateLabel = storyContext?.keyDate
    ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(`${storyContext.keyDate}T12:00:00`))
    : "";

  const memory = useMemo(
    () => isProposal
      ? [
          "Acá todavía no sabía que un día iba a pedirte que te quedaras para todos los días que vienen.",
          "En algún punto dejé de imaginar planes con vos y empecé a imaginar una vida.",
          "No fue una señal enorme. Fueron cientos de pequeñas certezas.",
        ]
      : isMother
        ? [
            "En ese momento yo veía una foto. Hoy veo todo lo que estabas haciendo para que ese día existiera.",
            "Hay recuerdos en los que tu amor está más en los bordes que en el centro de la imagen.",
            "Muchas de las cosas que llamé infancia fueron, en realidad, cosas que vos construiste todos los días.",
          ]
        : isFather
          ? [
              "Antes sólo recordaba lo que estábamos haciendo. Hoy también recuerdo que vos estabas ahí.",
              "Hay gestos que parecían normales hasta que crecí y entendí lo que costaba sostenerlos.",
              "En muchas escenas de mi infancia tu presencia no hacía ruido. Pero estaba.",
            ]
          : isFriendship
            ? [
                "EXHIBIT A · No existe una explicación razonable para esta foto.",
                "EXHIBIT B · Sobrevivimos. Los detalles quedan clasificados.",
                "EXHIBIT C · Claramente alguien debería habernos frenado.",
              ]
            : [
                "Ese día todavía no sabíamos todo lo que iba a venir.",
                "Después aprendimos que los mejores recuerdos casi nunca avisan que van a ser importantes.",
                "Y sin darnos cuenta, empezamos a coleccionar un mundo propio.",
              ],
    [isProposal, isMother, isFather, isFriendship]
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
          <section className={`scene scene-intro ${isProposal ? "scene-intro-proposal" : ""} ${isMother ? "scene-intro-mother" : ""} ${isFather ? "scene-intro-father" : ""} ${isFriendship ? "scene-intro-friendship" : ""}`}>
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <p className="scene-kicker">{introKicker}</p>
            <h1>{experience.demoRecipient}</h1>
            <p className="scene-lead">{experience.opening}</p>
            <button className="primary-action" onClick={next}>{introAction}</button>
            <small>{introNote}</small>
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
          <section className={`scene scene-memories ${isGrandparents ? "scene-memories-archive" : ""} ${isAnniversary ? "scene-memories-anniversary" : ""} ${isProposal ? "scene-memories-proposal" : ""} ${isMother ? "scene-memories-mother" : ""} ${isFather ? "scene-memories-father" : ""} ${isFriendship ? "scene-memories-friendship" : ""}`}>
            <p className="scene-kicker">{isGrandparents ? "Álbum familiar · piezas rescatadas" : isAnniversary ? "Pruebas de que esto pasó de verdad" : isProposal ? "Algunas pruebas de cómo llegué hasta acá" : isMother ? "Fotos que ahora miro distinto" : isFather ? "Escenas que quedaron sin necesidad de explicarlas" : isFriendship ? "Evidencia fotográfica · lamentablemente irrefutable" : "Los recuerdos"}</p>
            <h2>{isGrandparents ? "Algunas fotos guardan más de lo que muestran." : isAnniversary ? "No fueron sólo grandes momentos. También fueron todos los días del medio." : isProposal ? "No fue un solo momento. Fueron muchos momentos haciendo la misma pregunta en silencio." : isMother ? "En muchas de estas fotos yo era el centro. Hoy también veo todo lo que estaba haciendo mamá alrededor." : isFather ? "Antes veía una foto. Hoy veo quién estaba sosteniendo, enseñando, esperando o simplemente estando." : isFriendship ? "Algunas fotos demuestran que claramente nadie estaba tomando buenas decisiones." : "Hay días que terminan. Y otros que se quedan."}</h2>
            {storyDateLabel && <p className="memory-date-stamp">{storyDateLabel}</p>}
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
                  <p>{photo.caption || (index === 0 && storyContext?.anecdote?.trim() ? storyContext.anecdote.trim() : memory[index % memory.length])}</p>
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
          <section className={`scene scene-letter ${isGrandparents ? "scene-letter-archive" : ""} ${isAnniversary ? "scene-letter-anniversary" : ""} ${isProposal ? "scene-letter-proposal" : ""} ${isMother ? "scene-letter-mother" : ""} ${isFather ? "scene-letter-father" : ""} ${isFriendship ? "scene-letter-friendship" : ""}`}>
            <p className="scene-kicker">{isGrandparents ? "Una carta que debía existir" : isAnniversary ? "Después de todo este tiempo" : isProposal ? "Antes de hacerte la pregunta" : isMother ? "Ahora que puedo entender un poco más" : isFather ? "Hay cosas que de chico no sabía decir" : isFriendship ? "Bueno. Ahora sí me voy a poner sentimental." : "La parte que no podía entrar en una foto"}</p>
            <h2>{isGrandparents ? "Hay gracias que no deberían quedarse para después." : isAnniversary ? "Hay cosas que sigo eligiendo decirte." : isProposal ? "Primero quiero que sepas por qué llegué hasta acá." : isMother ? "Quiero agradecerte también por lo que nunca vi mientras estaba pasando." : isFather ? "Quiero decirte lo que aprendí incluso cuando vos no estabas intentando enseñarme." : isFriendship ? "Porque entre tanto chiste hay algo que sí quiero que sepas en serio." : "Hay palabras que merecen abrirse despacio."}</h2>
            <button className={`envelope ${letterOpen ? "open" : ""}`} onClick={() => setLetterOpen(true)}>
              <span className="envelope-back" />
              <span className="paper">
                <small>Para {experience.demoRecipient}</small>
                <strong>{letterText || (isGrandparents ? "Gracias por todo lo que hiciste cuando nadie estaba sacando una foto. Por las veces que cuidaste, esperaste, cocinaste, llamaste, abrazaste y seguiste. Muchas de las cosas que hoy somos empezaron en vos." : isAnniversary ? "No te quiero sólo por todo lo lindo que vivimos. Te quiero también por lo que arreglamos, por lo que aprendimos, por las veces que volvimos a encontrarnos y por la vida común que, sin hacer ruido, se volvió nuestra." : isProposal ? "No llegué a esta pregunta por un día perfecto. Llegué por todos los días: por cómo me hacés sentir acompañado, por lo que aprendimos juntos, por la paz de imaginarte en mi futuro y porque cuando pienso en una vida que valga la pena construir, estás vos." : isMother ? "Gracias por todas las veces que hiciste que algo difícil pareciera simple. Por cuidar cuando estabas cansada, por recordar lo que a mí se me olvidaba, por hacer lugar y por seguir estando incluso cuando crecer también significó alejarme un poco." : isFather ? "Gracias por las veces que me mostraste cómo hacer algo y por las veces que simplemente te quedaste cerca mientras yo aprendía. Hoy entiendo mejor tus esfuerzos, tus dudas y muchas formas de querer que antes me pasaban por al lado." : isFriendship ? "Gracias por conocer versiones mías que ya ni existen y quererme también en esas. Por celebrar conmigo sin competir, por decirme la verdad cuando no era lo que quería escuchar y por aparecer tantas veces sin que tuviera que pedirlo." : "Gracias por convertir tantos días comunes en recuerdos extraordinarios.")}</strong>
                <em>— {experience.demoGiver}</em>
              </span>
              <span className="envelope-front" />
              <span className="wax">{isProposal ? "◇" : "♥"}</span>
            </button>
            {!letterOpen && <p className="scene-hint">Rompé el sello</p>}
            {letterOpen && <button className="primary-action" onClick={next}>{isMother || isFather || isFriendship ? "Hay algo más" : "Última parte"}</button>}
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
          <section className={`scene scene-timeline ${isGrandparents ? "scene-timeline-archive" : ""} ${isAnniversary ? "scene-timeline-anniversary" : ""}`}>
            <p className="scene-kicker">{isGrandparents ? "Una vida no entra en una fecha" : isAnniversary ? "No fue de golpe. Fue de a poco." : "El tiempo también cuenta historias"}</p>
            <h2>{isGrandparents ? "Antes de ser abuela, ya habías vivido un mundo entero." : isAnniversary ? "Un día éramos dos personas con planes. Después empezamos a tener planes nuestros." : "Tres momentos. Una misma historia."}</h2>
            <div className="timeline">
              {isGrandparents ? (
                <>
                  <article><span>1958</span><strong>Antes de nosotros</strong><p>Una versión tuya que conocemos por historias, fotos y esas anécdotas que siempre vuelven a la mesa.</p></article>
                  <article><span>1979</span><strong>La casa empieza a llenarse</strong><p>Nombres nuevos, rutinas, domingos, preocupaciones y una familia tomando forma.</p></article>
                  <article><span>1998</span><strong>Otra generación</strong><p>De pronto llegaron nietos que aprendieron tu voz antes de entender todo lo que significaba.</p></article>
                  <article><span>HOY</span><strong>La historia sigue acá</strong><p>En gestos, recetas, frases y maneras de querer que ya son parte de todos nosotros.</p></article>
                </>
              ) : isAnniversary ? (
                <>
                  <article><span>01</span><strong>Nos conocimos</strong><p>Dos vidas completas que todavía no sabían cuánto iban a mezclarse.</p></article>
                  <article><span>02</span><strong>Empezó el “nosotros”</strong><p>Planes compartidos, primeras costumbres y lugares que dejaron de ser sólo lugares.</p></article>
                  <article><span>03</span><strong>La vida real</strong><p>Días increíbles, días difíciles y todos esos días normales que terminaron construyéndonos.</p></article>
                  <article><span>HOY</span><strong>Seguimos eligiendo</strong><p>No porque todo sea igual que al principio. Justamente porque ya no lo es.</p></article>
                </>
              ) : (
                <>
                  <article><span>01</span><strong>El comienzo</strong><p>Cuando todavía no sabíamos en qué se iba a convertir todo esto.</p></article>
                  <article><span>02</span><strong>El día que cambió algo</strong><p>Uno de esos momentos que después entendemos que fueron gigantes.</p></article>
                  <article><span>03</span><strong>Hoy</strong><p>La historia sigue. Y por suerte todavía no sabemos cómo termina.</p></article>
                </>
              )}
            </div>
            <button className="primary-action" onClick={next}>{isGrandparents ? "Abrir el álbum" : isAnniversary ? "Ver lo que fuimos guardando" : "Seguir la historia"}</button>
          </section>
        );

      case "voices": {
        const voiceNames = isGrandparents
          ? ["Marta", "Carlos", "Lucía", "Nico"]
          : isMother
            ? ["Sofi", "Martín", "Cande", "Nico"]
            : isFather
              ? ["Vale", "Lucas", "Mica", "Fede"]
              : ["Mamá", "Tomás", "Caro", "Fran"];
        const voiceQuote = isGrandparents
          ? "“Hay cosas tuyas que hacemos sin darnos cuenta. Ahí entendemos cuánto de vos vive en nosotros.”"
          : isMother
            ? "“Ahora que soy grande entiendo mejor todo lo que hacías cuando yo sólo veía que mamá estaba ahí.”"
            : isFather
              ? "“Hay cosas que hago igual que vos y recién me doy cuenta cuando alguien me lo señala.”"
              : "“Te quiero muchísimo. Gracias por estar siempre.”";

        return (
          <section className={`scene scene-voices ${isGrandparents ? "scene-voices-archive" : ""} ${isMother ? "scene-voices-mother" : ""} ${isFather ? "scene-voices-father" : ""}`}>
            <p className="scene-kicker">
              {isGrandparents
                ? "Hay sonidos que también son hogar"
                : isMother
                  ? "Hay voces que crecieron alrededor tuyo"
                  : isFather
                    ? "Hay cosas que a veces se dicen mejor de frente"
                    : "Hay gente esperando decirte algo"}
            </p>
            <h2>
              {isGrandparents
                ? "Escuchá lo que dejaste en nosotros."
                : isMother
                  ? "Escuchá todo lo que hoy podemos ver distinto."
                  : isFather
                    ? "Escuchá cómo quedó tu forma de estar en nosotros."
                    : "Elegí una voz."}
            </h2>
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
                : voiceNames.map((name, index) => (
                    <button
                      key={name}
                      className={voicesPlayed.includes(index) ? "played" : ""}
                      onClick={() => playVoice(index)}
                    >
                      <span>{voicesPlayed.includes(index) ? "▶" : "●"}</span>
                      <strong>{name}</strong>
                      <small>{voicesPlayed.includes(index) ? voiceQuote : "Tocar para escuchar"}</small>
                    </button>
                  ))}
            </div>
            <button className="primary-action" onClick={next} disabled={voicesPlayed.length < 1}>Continuar</button>
          </section>
        );
      }

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

      case "origin":
        return (
          <section className="scene scene-origin">
            <p className="scene-kicker">Antes de la pregunta</p>
            <h2>Hubo un momento en que todavía no sabía todo lo que ibas a significar.</h2>
            <div className="origin-frame">
              <div
                className="origin-photo"
                style={{
                  backgroundImage: `url("${displayPhotos[0]?.url || photos[0]}")`,
                  backgroundSize: displayPhotos[0]?.fit || "cover",
                  backgroundPosition: displayPhotos[0]?.position || "center",
                }}
              />
              <div className="origin-caption">
                <small>CAPÍTULO 01</small>
                <strong>Acá todavía no sabía.</strong>
                <p>Que ibas a convertirte en la persona con la que iba a querer compartir las noticias buenas, los días comunes y también los difíciles.</p>
              </div>
            </div>
            <button className="primary-action" onClick={next}>Seguir recordando</button>
          </section>
        );

      case "reasons":
        return (
          <section className="scene scene-reasons">
            <p className="scene-kicker">No es una lista. Es una certeza que se fue formando.</p>
            <h2>Hay razones que fui entendiendo de a poco.</h2>
            <div className="reason-ledger">
              {[
                ["01", "Cómo se siente estar con vos", "No tengo que actuar, impresionar ni medir cada palabra. Puedo estar."],
                ["02", "Cómo hacemos equipo", "No porque siempre pensemos igual, sino porque aprendimos a volver al mismo lado."],
                ["03", "Cómo cambia el futuro cuando te imagino ahí", "Los planes dejan de ser ideas sueltas y empiezan a parecer una vida."],
                ["04", "La tranquilidad de elegirte", "No es vértigo. Es esa calma rara de saber hacia dónde quiero ir."],
              ].map(([number, title, copy], index) => (
                <button
                  key={title}
                  className={reasonsOpen.includes(index) ? "open" : ""}
                  onClick={() => setReasonsOpen((items) => items.includes(index) ? items : [...items, index])}
                >
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{reasonsOpen.includes(index) ? copy : "Tocá para leer"}</p>
                  </div>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={reasonsOpen.length < 3}>
              {reasonsOpen.length < 3 ? `Abrí ${3 - reasonsOpen.length} más` : "Hay algo más"}
            </button>
          </section>
        );

      case "certainty":
        return (
          <section className="scene scene-certainty">
            <p className="scene-kicker">Quiero decirlo bien</p>
            <h2>No te estoy prometiendo una vida perfecta.</h2>
            <div className="certainty-lines">
              {[
                ["No prometo", "que nada vaya a cambiar."],
                ["No prometo", "que siempre sepamos qué hacer."],
                ["Sí prometo", "seguir construyendo, aprendiendo y volviendo a elegirte."],
              ].map(([lead, copy], index) => (
                <button
                  key={index}
                  className={certaintyOpen.includes(index) ? "open" : ""}
                  onClick={() => setCertaintyOpen((items) => items.includes(index) ? items : [...items, index])}
                >
                  <span>{certaintyOpen.includes(index) ? lead : "···"}</span>
                  <strong>{certaintyOpen.includes(index) ? copy : "Tocá para revelar"}</strong>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={certaintyOpen.length < 3}>Seguir</button>
          </section>
        );

      case "threshold":
        return (
          <section className={`scene scene-threshold ${thresholdOpen ? "open" : ""}`}>
            <div className="threshold-aura" />
            <p className="scene-kicker">Último paso</p>
            <h2>{thresholdOpen ? "Ya no queda nada entre vos y la pregunta." : "Lo que sigue cambia esta historia."}</h2>
            {!thresholdOpen ? (
              <>
                <button
                  className={`threshold-hold ${thresholdHolding ? "holding" : ""}`}
                  onPointerDown={() => setThresholdHolding(true)}
                  onPointerUp={() => setThresholdHolding(false)}
                  onPointerLeave={() => setThresholdHolding(false)}
                  onPointerCancel={() => setThresholdHolding(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setThresholdOpen(true); }
                  }}
                  aria-label="Mantener presionado para continuar"
                >
                  <span onAnimationEnd={() => {
                    if (thresholdHolding) {
                      setThresholdOpen(true);
                      setThresholdHolding(false);
                    }
                  }} />
                  <strong>Mantené presionado</strong>
                  <small>No es un botón para tocar rápido.</small>
                </button>
              </>
            ) : (
              <button className="primary-action threshold-continue" onClick={next}>Continuar</button>
            )}
          </section>
        );

      case "light": {
        const lightCopy =
          experience.slug === "hijos"
            ? "Crezcas cuanto crezcas, siempre vamos a reconocer la luz que trajiste a nuestra vida."
            : experience.slug === "cumpleanos"
              ? "Ojalá nunca se te olvide cuánta gente se alegra de que existas."
              : experience.slug === "pareja"
                ? "Hay personas que no iluminan una habitación. Iluminan la forma de vivirla."
                : "Hay cosas importantes que se entienden mejor cuando todo lo demás hace silencio.";

        return (
          <section className={`scene scene-light ${lightOpen ? "open" : ""}`}>
            <div className="light-darkness" />
            <p className="scene-kicker">Un momento sin ruido</p>
            <h2>{lightOpen ? lightCopy : "Tocá la luz."}</h2>
            <button className="light-source" onClick={() => setLightOpen(true)} aria-label="Encender la luz">
              <span />
            </button>
            {!lightOpen && <p className="scene-hint">Hay una frase esperando atrás de la oscuridad.</p>}
            {lightOpen && <button className="primary-action" onClick={next}>Seguir</button>}
          </section>
        );
      }

      case "hold": {
        const holdCopy =
          experience.slug === "hijos"
            ? "Pase lo que pase, este lugar en nosotros siempre va a ser tuyo."
            : experience.slug === "cumpleanos"
              ? "Que nunca te falten personas con quienes valga la pena celebrar estar acá."
              : experience.slug === "pareja"
                ? "No prometo que todo sea fácil. Prometo no dejar de elegirme con vos."
                : "Algunas promesas merecen más que un toque rápido.";

        return (
          <section className={`scene scene-hold ${holdOpen ? "open" : ""}`}>
            <p className="scene-kicker">Esto sí quiero que quede</p>
            <h2>{holdOpen ? holdCopy : "Hay una promesa guardada acá."}</h2>
            {!holdOpen ? (
              <button
                className={`hold-button ${holdHolding ? "holding" : ""}`}
                onPointerDown={() => setHoldHolding(true)}
                onPointerUp={() => setHoldHolding(false)}
                onPointerLeave={() => setHoldHolding(false)}
                onPointerCancel={() => setHoldHolding(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setHoldOpen(true); }
                }}
              >
                <span onAnimationEnd={() => {
                  if (holdHolding) {
                    setHoldOpen(true);
                    setHoldHolding(false);
                  }
                }} />
                <strong>Mantené presionado</strong>
              </button>
            ) : (
              <button className="primary-action" onClick={next}>Guardar y seguir</button>
            )}
          </section>
        );
      }

      case "childhood":
        return (
          <section className="scene scene-childhood">
            <div className="childhood-light" aria-hidden="true" />
            <p className="scene-kicker">Volver un segundo atrás</p>
            <h2>Hubo un tiempo en que el mundo era enorme y mamá era el lugar conocido.</h2>
            <div className="childhood-memory">
              <div
                className="childhood-photo"
                style={{
                  backgroundImage: `url("${displayPhotos[0]?.url || photos[0]}")`,
                  backgroundSize: displayPhotos[0]?.fit || "cover",
                  backgroundPosition: displayPhotos[0]?.position || "center",
                }}
              />
              <div className="childhood-note">
                <small>RECUERDO · 01</small>
                <strong>Yo no veía todo.</strong>
                <p>Veía la comida servida, la ropa lista, el cumpleaños, la mano que aparecía cuando tenía miedo. No veía el cansancio, las cuentas, las dudas ni todo lo que acomodabas para que yo pudiera ser chico.</p>
              </div>
            </div>
            <button className="primary-action" onClick={next}>Mirar esas fotos otra vez</button>
          </section>
        );

      case "care":
        return (
          <section className="scene scene-care">
            <p className="scene-kicker">Las cosas que parecían pequeñas</p>
            <h2>Gran parte del amor estaba escondido en tareas que nadie aplaudía.</h2>
            <div className="care-grid">
              {[
                ["01", "Recordar por todos", "Turnos, horarios, gustos, lo que faltaba, lo que había que llevar y hasta cosas que yo ya había olvidado."],
                ["02", "Hacer lugar", "En la mesa, en el día, en el presupuesto, en el cansancio. De alguna manera siempre aparecía espacio."],
                ["03", "Estar antes de que lo pidiera", "Muchas veces entendiste qué me pasaba antes de que yo pudiera ponerle palabras."],
                ["04", "Convertir rutina en hogar", "No eran grandes gestos. Era repetir pequeñas cosas durante años hasta volverlas parte de mí."],
              ].map(([n,title,copy],index)=>(
                <button key={title} className={careOpen.includes(index) ? "open" : ""} onClick={()=>setCareOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{n}</span>
                  <strong>{title}</strong>
                  <p>{careOpen.includes(index) ? copy : "Tocá para recordar"}</p>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={careOpen.length < 3}>
              {careOpen.length < 3 ? `Descubrí ${3-careOpen.length} más` : "Hay algo que de chico no veía"}
            </button>
          </section>
        );

      case "sacrifices":
        return (
          <section className="scene scene-sacrifices">
            <p className="scene-kicker">Lo invisible también cuenta</p>
            <h2>Ahora entiendo que muchas veces vos quedabas última para que nosotros pudiéramos ir primero.</h2>
            <div className="sacrifice-thread" aria-hidden="true" />
            <div className="sacrifice-list">
              {[
                ["TIEMPO", "Horas que eran tuyas y terminaron siendo nuestras."],
                ["ENERGÍA", "Días en los que estabas cansada y aun así había algo más que resolver."],
                ["PREOCUPACIÓN", "Miedos que muchas veces llevaste en silencio para no pasármelos."],
                ["VOS", "Y también quiero agradecerte por la mujer que siguió existiendo detrás de ser mamá."],
              ].map(([title,copy],index)=>(
                <button key={title} className={sacrificesOpen.includes(index) ? "open" : ""} onClick={()=>setSacrificesOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{title}</span>
                  <p>{sacrificesOpen.includes(index) ? copy : "Abrir"}</p>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={sacrificesOpen.length < 3}>Escuchar a la familia</button>
          </section>
        );

      case "return":
        return (
          <section className={`scene scene-return ${returnOpen ? "open" : ""}`}>
            <div className="return-window" aria-hidden="true"><i /></div>
            <p className="scene-kicker">Hay algo que no cambia del todo</p>
            <h2>{returnOpen ? "No importa cuánto crezca: hay una parte de mí que siempre sabe volver a vos." : "Algunas personas se vuelven una dirección."}</h2>
            {!returnOpen ? (
              <button className="return-key" onClick={()=>setReturnOpen(true)}>
                <span>⌂</span><strong>Abrir la puerta</strong>
              </button>
            ) : (
              <button className="primary-action" onClick={next}>Una última cosa</button>
            )}
          </section>
        );

      case "lessons":
        return (
          <section className="scene scene-lessons">
            <div className="lesson-line" aria-hidden="true" />
            <p className="scene-kicker">Todo lo que me enseñaste sin dar una clase</p>
            <h2>Muchas lecciones tuyas tardaron años en hacer sentido.</h2>
            <div className="lesson-ledger">
              {[
                ["01", "Resolver", "No saber no era una excusa para quedarse quieto. Primero se mira, se prueba, se pregunta y se vuelve a intentar."],
                ["02", "Cumplir", "Llegar, llamar, hacerse cargo, sostener la palabra incluso cuando nadie está mirando."],
                ["03", "Cuidar", "Entendí que proteger no siempre es hablar. A veces es estar cerca, prever, acompañar y dejar que el otro intente."],
                ["04", "Seguir", "Hay días en los que el coraje se parece menos a una hazaña y más a levantarse y hacer lo que toca."],
              ].map(([n,title,copy],index)=>(
                <button key={title} className={lessonsOpen.includes(index) ? "open" : ""} onClick={()=>setLessonsOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{n}</span><div><strong>{title}</strong><p>{lessonsOpen.includes(index) ? copy : "Abrir lección"}</p></div>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={lessonsOpen.length < 3}>
              {lessonsOpen.length < 3 ? `Faltan ${3-lessonsOpen.length}` : "Seguir"}
            </button>
          </section>
        );

      case "presence":
        return (
          <section className="scene scene-presence">
            <p className="scene-kicker">Las formas de estar</p>
            <h2>No todos los recuerdos importantes tienen una conversación.</h2>
            <div className="presence-track">
              {[
                ["LA MANO", "La que sostenía la bici, señalaba cómo hacerlo o aparecía en un hombro cuando hacía falta."],
                ["LA ESPERA", "Quedarte hasta que terminara. Ir a buscarme. Esperar despierto. Estar cuando volvía."],
                ["LA MIRADA", "Ese gesto que podía decir “bien”, “ojo”, “seguí” o “estoy acá” sin una sola palabra."],
              ].map(([title,copy],index)=>(
                <button key={title} className={presenceOpen.includes(index) ? "open" : ""} onClick={()=>setPresenceOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{String(index+1).padStart(2,"0")}</span>
                  <strong>{title}</strong>
                  <p>{presenceOpen.includes(index) ? copy : "Tocá para recordar"}</p>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={presenceOpen.length < 2}>Ver lo que quedó</button>
          </section>
        );

      case "inheritance":
        return (
          <section className="scene scene-inheritance">
            <p className="scene-kicker">La herencia que no se firma</p>
            <h2>Hay cosas tuyas que un día descubrí viviendo en mí.</h2>
            <div className="inheritance-board">
              {[
                ["LA FORMA DE MIRAR UN PROBLEMA", "Antes de pedir ayuda, trato de entender cómo funciona."],
                ["ALGUNAS FRASES", "Juraba que nunca las iba a decir. Ahora salen solas."],
                ["CIERTOS GESTOS", "Maneras de ordenar, manejar, cocinar, arreglar o pensar que aparecieron sin permiso."],
                ["UNA PARTE DE TU CARÁCTER", "No todo. Pero lo suficiente como para reconocerte en mí de vez en cuando."],
              ].map(([title,copy],index)=>(
                <button key={title} className={inheritanceOpen.includes(index) ? "open" : ""} onClick={()=>setInheritanceOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>0{index+1}</span><strong>{title}</strong><p>{inheritanceOpen.includes(index) ? copy : "Revelar"}</p>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={inheritanceOpen.length < 3}>Escuchar a la familia</button>
          </section>
        );

      case "lookback":
        return (
          <section className={`scene scene-lookback ${lookbackOpen ? "open" : ""}`}>
            <div className="lookback-horizon" aria-hidden="true" />
            <p className="scene-kicker">Ahora te miro distinto</p>
            <h2>{lookbackOpen ? "De grande dejé de verte sólo como “papá”. Empecé a ver también al hombre que estaba haciendo lo mejor que podía con lo que tenía." : "Hay una parte de crecer que también es volver a conocer a nuestros padres."}</h2>
            {!lookbackOpen ? (
              <button className="lookback-button" onClick={()=>setLookbackOpen(true)}><span>→</span><strong>Mirar de nuevo</strong></button>
            ) : (
              <button className="primary-action" onClick={next}>Una última cosa</button>
            )}
          </section>
        );

      case "casefile":
        return (
          <section className="scene scene-casefile">
            <div className="casefile-scan" aria-hidden="true" />
            <p className="scene-kicker">EXPEDIENTE 021 · NIVEL DE ACCESO: CUESTIONABLE</p>
            <h2>Hay pruebas suficientes para confirmar que esto se nos fue de las manos hace años.</h2>
            <button className={`casefile-folder ${casefileOpen ? "open" : ""}`} onClick={() => setCasefileOpen(true)}>
              <span className="casefile-tab">{experience.demoRecipient.toUpperCase()} + {experience.demoGiver.toUpperCase()}</span>
              <span className="casefile-cover">
                <small>ARCHIVO CONFIDENCIAL</small>
                <strong>AMISTAD<br/>BAJO INVESTIGACIÓN</strong>
                <em>Incidentes · evidencia · códigos · reincidencia</em>
                <b>CLASIFICADO</b>
              </span>
              <span className="casefile-sheet">
                <small>INFORME PRELIMINAR</small>
                <strong>Conclusión:</strong>
                <p>Demasiadas historias compartidas como para fingir que esto sigue siendo una amistad normal.</p>
              </span>
            </button>
            {!casefileOpen && <p className="scene-hint">Tocá para desclasificar</p>}
            {casefileOpen && <button className="primary-action" onClick={next}>Ver evidencia</button>}
          </section>
        );

      case "insidejokes":
        return (
          <section className="scene scene-insidejokes">
            <p className="scene-kicker">DICCIONARIO NO AUTORIZADO</p>
            <h2>Hay un idioma que sólo existe porque nos conocemos demasiado.</h2>
            <div className="joke-decoder">
              {[
                ["“YA FUE”", "Frase históricamente pronunciada segundos antes de una decisión que no debía tomarse."],
                ["ESA CARA", "Sistema de comunicación completo. Traducción simultánea innecesaria."],
                ["“5 MINUTOS”", "Unidad temporal sin relación demostrable con cinco minutos reales."],
                ["EL NOMBRE PROHIBIDO", "No hace falta escribirlo. Ya sabés perfectamente de quién estamos hablando."],
              ].map(([code,meaning],index)=>(
                <button key={code} className={insideJokesOpen.includes(index) ? "open" : ""} onClick={()=>setInsideJokesOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>CODE 0{index+1}</span>
                  <strong>{code}</strong>
                  <p>{insideJokesOpen.includes(index) ? meaning : "Tocá para decodificar"}</p>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={insideJokesOpen.length < 3}>
              {insideJokesOpen.length < 3 ? `Decodificá ${3-insideJokesOpen.length} más` : "Pasar a antecedentes"}
            </button>
          </section>
        );

      case "incidents":
        return (
          <section className="scene scene-incidents">
            <p className="scene-kicker">ANTECEDENTES · REINCIDENCIA CONFIRMADA</p>
            <h2>No digo que esta dupla tome malas decisiones. Digo que hay evidencia.</h2>
            <div className="incident-stack">
              {[
                ["CASO 001", "La salida que iba a ser tranqui", "Duración estimada: 2 horas. Duración real: información reservada."],
                ["CASO 014", "El mensaje que no había que mandar", "Se discutió. Se analizó. Se mandó igual."],
                ["CASO 028", "El plan sin plan", "Logística inexistente. Presupuesto dudoso. Resultado: inexplicablemente memorable."],
                ["CASO 041", "La vez que dijimos “nunca más”", "El archivo registra múltiples reincidencias posteriores."],
              ].map(([caseNo,title,copy],index)=>(
                <button key={caseNo} className={incidentsOpen.includes(index) ? "open" : ""} onClick={()=>setIncidentsOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{caseNo}</span>
                  <strong>{title}</strong>
                  <p>{incidentsOpen.includes(index) ? copy : "ABRIR INFORME"}</p>
                  {incidentsOpen.includes(index) && <em>CONFIRMADO</em>}
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={incidentsOpen.length < 3}>
              {incidentsOpen.length < 3 ? "La investigación continúa" : "Hay otra clase de pruebas"}
            </button>
          </section>
        );

      case "proof":
        return (
          <section className="scene scene-proof">
            <div className="proof-shift" aria-hidden="true" />
            <p className="scene-kicker">Y después están las pruebas que sí importan</p>
            <h2>Porque estar de verdad también fue aparecer cuando no había nada divertido para contar.</h2>
            <div className="proof-list">
              {[
                ["ESTUVISTE", "Cuando no sabía bien qué decir y tampoco hacía falta que arreglaras nada."],
                ["TE ALEGRASTE", "Por cosas buenas que me pasaban aunque no tuvieran absolutamente nada que ver con vos."],
                ["ME DIJISTE LA VERDAD", "Incluso cuando hubiera sido mucho más cómodo darme la razón."],
                ["TE QUEDASTE", "En versiones mías que ni yo sabía cuánto iban a durar."],
              ].map(([title,copy],index)=>(
                <button key={title} className={proofOpen.includes(index) ? "open" : ""} onClick={()=>setProofOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{String(index+1).padStart(2,"0")}</span>
                  <strong>{title}</strong>
                  <p>{proofOpen.includes(index) ? copy : "Tocá"}</p>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={proofOpen.length < 3}>Ahora sí</button>
          </section>
        );

      case "pact":
        return (
          <section className="scene scene-pact">
            <p className="scene-kicker">PACTO NO LEGAL · VIGENCIA INDEFINIDA</p>
            <h2>Para que quede por escrito, por si alguna vez la vida se pone demasiado seria.</h2>
            <div className="pact-paper">
              <small>ACUERDO ENTRE {experience.demoRecipient.toUpperCase()} Y {experience.demoGiver.toUpperCase()}</small>
              {[
                ["I", "Podemos pasar semanas sin hablar y retomar como si hubieran sido veinte minutos."],
                ["II", "Si alguien está haciendo una estupidez, la otra persona tiene obligación moral de avisar. Una vez."],
                ["III", "Los logros de una se festejan sin medirlos contra la vida de la otra."],
                ["IV", "Si todo se complica, existe siempre el derecho irrestricto a mandar “¿estás?”."],
              ].map(([n,copy],index)=>(
                <button key={n} className={pactOpen.includes(index) ? "signed" : ""} onClick={()=>setPactOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{n}</span>
                  <p>{copy}</p>
                  <strong>{pactOpen.includes(index) ? "✓ ACEPTADO" : "ACEPTAR"}</strong>
                </button>
              ))}
              <div className="pact-signatures">
                <span>{experience.demoGiver}</span><i>+</i><span>{experience.demoRecipient}</span>
              </div>
            </div>
            <button className="primary-action" onClick={next} disabled={pactOpen.length < 3}>Cerrar expediente</button>
          </section>
        );

      case "rituals":
        return (
          <section className="scene scene-rituals">
            <p className="scene-kicker">Las cosas que nadie sube a Instagram</p>
            <h2>También somos todo esto.</h2>
            <div className="ritual-grid">
              {[
                ["01", "El mensaje de siempre", "Ese “avisame cuando llegues” que parece pequeño hasta que un día entendés todo lo que contiene."],
                ["02", "Nuestra comida", "Ese pedido, plato o improvisación que ya sabe a nosotros aunque nadie más entienda por qué."],
                ["03", "El lado de la cama", "Pequeñas negociaciones que hace años dejaron de negociarse."],
                ["04", "El idioma propio", "Palabras, caras y chistes que serían incomprensibles para cualquier otra persona."],
              ].map(([number, title, copy], index) => (
                <button key={title} className={ritualsOpen.includes(index) ? "open" : ""} onClick={() => setRitualsOpen((items) => items.includes(index) ? items : [...items, index])}>
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <p>{ritualsOpen.includes(index) ? copy : "Tocá para abrir"}</p>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={ritualsOpen.length < 3}>
              {ritualsOpen.length < 3 ? `Abrí ${3 - ritualsOpen.length} más` : "Y también atravesamos cosas"}
            </button>
          </section>
        );

      case "chapters":
        return (
          <section className="scene scene-chapters">
            <p className="scene-kicker">No todo fue una foto linda</p>
            <h2>Hay capítulos que valen por haberlos atravesado juntos.</h2>
            <div className="chapter-stack">
              {[
                ["Lo que tuvimos que aprender", "Que amar no era adivinar al otro. Era aprender a hablar, escuchar y volver a intentar."],
                ["Lo que cambió", "Nosotros también. Y aun así encontramos maneras nuevas de reconocernos."],
                ["Lo que sostuvimos", "Cuando era más fácil encerrarse cada uno en lo suyo, hubo veces en que elegimos acercarnos."],
              ].map(([title, copy], index) => (
                <button key={title} className={chapterOpen.includes(index) ? "open" : ""} onClick={() => setChapterOpen((items) => items.includes(index) ? items : [...items, index])}>
                  <span>CAPÍTULO {String(index + 1).padStart(2, "0")}</span>
                  <strong>{title}</strong>
                  <p>{chapterOpen.includes(index) ? copy : "Abrir capítulo"}</p>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={chapterOpen.length < 2}>
              {chapterOpen.length < 2 ? "Abrí al menos dos capítulos" : "Seguir"}
            </button>
          </section>
        );

      case "future":
        return (
          <section className="scene scene-future">
            <div className="future-line" aria-hidden="true" />
            <p className="scene-kicker">No estamos celebrando sólo lo que pasó</p>
            <h2>También estamos celebrando que todavía hay cosas que no vivimos.</h2>
            <button className={`future-card ${futureOpen ? "open" : ""}`} onClick={() => setFutureOpen(true)}>
              <small>PRÓXIMO CAPÍTULO</small>
              <strong>{futureOpen ? "Todavía no sabemos exactamente qué viene." : "Abrir lo que sigue"}</strong>
              <p>{futureOpen ? "Pero quiero conocerlo con vos: más domingos, más lugares, más conversaciones, más versiones nuestras y algunos planes que hoy ni siquiera existen." : "Hay futuro guardado acá."}</p>
              <span>{futureOpen ? "∞" : "→"}</span>
            </button>
            {futureOpen && <button className="primary-action" onClick={next}>Llegar al final</button>}
          </section>
        );

      case "archive":
        return (
          <section className="scene scene-archive">
            <div className="archive-dust" aria-hidden="true" />
            <p className="scene-kicker">Archivo familiar · reservado</p>
            <h2>Hay una vida entera guardada acá adentro.</h2>
            <button className={`archive-folder ${archiveOpen ? "open" : ""}`} onClick={() => setArchiveOpen(true)}>
              <span className="archive-tab">FAMILIA · {experience.demoRecipient.toUpperCase()}</span>
              <span className="archive-cover">
                <small>ARCHIVO Nº 01</small>
                <strong>Una vida<br/>que merece quedar.</strong>
                <em>Fotografías · historias · voces · recetas</em>
              </span>
              <span className="archive-paper">
                <small>PRIMERA NOTA</small>
                <strong>Antes de seguir:</strong>
                <p>esto no es un resumen de tu vida. Es apenas una colección de las huellas que fuiste dejando en la nuestra.</p>
              </span>
            </button>
            {!archiveOpen && <p className="scene-hint">Tocá el archivo para abrirlo</p>}
            {archiveOpen && <button className="primary-action" onClick={next}>Empezar por el principio</button>}
          </section>
        );

      case "home":
        return (
          <section className="scene scene-home">
            <p className="scene-kicker">La casa también se acuerda</p>
            <h2>No heredamos sólo historias. Heredamos pequeñas cosas.</h2>
            <div className="home-memory">
              {[
                ["La cocina", "Ese olor que alcanzaba para saber qué estabas haciendo antes de entrar."],
                ["La mesa", "Donde siempre aparecía lugar para uno más, incluso cuando parecía imposible."],
                ["Tus manos", "La manera de arreglar, preparar, señalar, acariciar y hacer que todo siguiera funcionando."],
                ["Tus frases", "Las repetimos riéndonos. Y un día descubrimos que empezamos a decirlas igual que vos."],
              ].map(([title, copy], index) => (
                <button key={title} className={homeOpen.includes(index) ? "open" : ""} onClick={() => setHomeOpen((items) => items.includes(index) ? items : [...items, index])}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{title}</strong>
                  <p>{homeOpen.includes(index) ? copy : "Tocá para recordar"}</p>
                </button>
              ))}
            </div>
            <button className="primary-action" onClick={next} disabled={homeOpen.length < 3}>
              {homeOpen.length < 3 ? `Encontrá ${3 - homeOpen.length} recuerdos más` : "Escuchar a la familia"}
            </button>
          </section>
        );

      case "legacy":
        return (
          <section className="scene scene-legacy">
            <div className="legacy-roots" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>
            <p className="scene-kicker">Y entonces entendimos algo</p>
            <h2>Una familia también se parece a quien la enseñó a querer.</h2>
            <button className={`legacy-seal ${legacyOpen ? "open" : ""}`} onClick={() => setLegacyOpen(true)}>
              <span>⌁</span>
              <strong>{legacyOpen ? "Mirá todo lo que empezó en vos" : "Tocá acá"}</strong>
            </button>
            {legacyOpen && (
              <div className="legacy-names">
                <span>historias</span><span>costumbres</span><span>recetas</span><span>frases</span><span>abrazos</span><span>nosotros</span>
              </div>
            )}
            {legacyOpen && <p className="legacy-copy">No todo legado lleva apellido. A veces es una forma de poner la mesa, de llamar para saber si llegamos bien o de hacer sentir a alguien que siempre puede volver.</p>}
            {legacyOpen && <button className="primary-action" onClick={next}>Una última cosa</button>}
          </section>
        );

      case "proposal":
        return (
          <section className={`scene scene-proposal scene-proposal-premium ${proposalAccepted ? "accepted" : ""}`}>
            <div className="proposal-halo" />
            {!proposalAccepted ? (
              <>
                <p className="scene-kicker">{experience.demoRecipient}</p>
                <span className="ring-symbol">◇</span>
                <h2>{experience.closing}</h2>
                <p className="proposal-subline">Quiero elegirte para todos los capítulos que todavía no existen.</p>
                <button className="proposal-yes" onClick={() => setProposalAccepted(true)}>Sí, quiero</button>
              </>
            ) : (
              <div className="proposal-after">
                <span>∞</span>
                <p>Entonces esta pantalla ya hizo su trabajo.</p>
                <h2>Mirá a {experience.demoGiver}.</h2>
                <small>Lo demás no pasa acá.</small>
              </div>
            )}
          </section>
        );

      case "finale":
      default:
        return (
          <section className={`scene scene-finale ${isGrandparents ? "scene-finale-legacy" : ""} ${isAnniversary ? "scene-finale-anniversary" : ""} ${isMother ? "scene-finale-mother" : ""} ${isFather ? "scene-finale-father" : ""} ${isFriendship ? "scene-finale-friendship" : ""}`}>
            <div className="finale-ring" />
            <p className="scene-kicker">Una última cosa</p>
            <h2>{experience.closing}</h2>
            <p>{isGrandparents ? "Y mientras alguien de la familia recuerde una historia tuya, una parte de este lugar también va a seguir viviendo afuera de la pantalla." : isAnniversary ? "No celebro que sigamos siendo los mismos. Celebro todo lo que cambió y que, aun así, seguimos encontrando una manera de ser nosotros." : isMother ? "Ahora que crecí, puedo volver a muchas escenas de mi infancia y encontrarte ahí haciendo cosas que entonces parecían normales. Hoy sé que no lo eran." : isFather ? "Crecer también fue empezar a entenderte como persona. Y descubrir que muchas de las cosas que admiro en mí tuvieron alguna vez tu forma." : isFriendship ? "La familia no siempre llega dada. A veces aparece un día cualquiera, se queda después de demasiadas historias y un día te das cuenta de que ya era casa." : "Este lugar va a seguir acá para cuando quieras volver."}</p>
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
    <main className={`experience-shell experience-shell--${experience.slug} ${sceneIndex > 0 ? "experience-entered" : ""}`} style={{ "--accent": experience.accent } as React.CSSProperties}>
      <div className="experience-topbar">
        <button onClick={previous} disabled={sceneIndex === 0} aria-label="Volver">←</button>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <span>{sceneIndex + 1}/{total}</span>
      </div>
      {renderScene(currentScene)}
    </main>
  );
}
