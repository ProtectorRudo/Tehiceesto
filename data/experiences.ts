export type SceneType =
  | "intro"
  | "door"
  | "memories"
  | "stars"
  | "scratch"
  | "letter"
  | "finale"
  | "candles"
  | "balloons"
  | "timeline"
  | "voices"
  | "quiz"
  | "vault"
  | "capsule"
  | "proposal"
  | "video"
  | "archive"
  | "home"
  | "legacy"
  | "rituals"
  | "chapters"
  | "future"
  | "origin"
  | "reasons"
  | "certainty"
  | "threshold"
  | "light"
  | "hold"
  | "childhood"
  | "care"
  | "sacrifices"
  | "return"
  | "lessons"
  | "presence"
  | "inheritance"
  | "lookback"
  | "casefile"
  | "insidejokes"
  | "incidents"
  | "proof"
  | "pact";

export type Experience = {
  slug: string;
  eyebrow: string;
  title: string;
  short: string;
  description: string;
  icon: string;
  accent: string;
  demoRecipient: string;
  demoGiver: string;
  opening: string;
  closing: string;
  tags: string[];
  recipe: SceneType[];
};

export const experiences: Experience[] = [
  {
    slug: "pareja",
    eyebrow: "Para tu persona",
    title: "Nuestra historia",
    short: "Un recorrido por lo que fueron, lo que son y todo lo que todavía falta vivir.",
    description: "Fotos, recuerdos, pequeñas pruebas, cartas escondidas y un final creado para emocionar.",
    icon: "♥",
    accent: "#ff7a9b",
    demoRecipient: "Emma",
    demoGiver: "Julián",
    opening: "Hay miles de lugares en Internet. Este existe solamente para vos.",
    closing: "Y si pudiera elegir de nuevo, volvería a encontrarte.",
    tags: ["Pareja", "Amor", "Sorpresa"],
    recipe: ["intro", "door", "memories", "stars", "scratch", "letter", "finale"],
  },
  {
    slug: "cumpleanos",
    eyebrow: "Un año merece más",
    title: "Tu día, convertido en experiencia",
    short: "Velas, recuerdos, mensajes y sorpresas que se van desbloqueando.",
    description: "Un cumpleaños que no se mira: se juega, se descubre y se recuerda.",
    icon: "✦",
    accent: "#ffb35c",
    demoRecipient: "Sofi",
    demoGiver: "Tus personas favoritas",
    opening: "Hoy no queríamos mandarte solamente un mensaje. Queríamos hacerte un lugar.",
    closing: "Que este año te encuentre rodeada de todo lo que te hace bien.",
    tags: ["Cumpleaños", "Amigos", "Familia"],
    recipe: ["intro", "candles", "balloons", "memories", "voices", "letter", "finale"],
  },
  {
    slug: "hijos",
    eyebrow: "Para guardar una vida",
    title: "Desde que llegaste",
    short: "Una cápsula emocional de mamá, papá o familia para un hijo.",
    description: "Primeras fotos, audios, hitos, cartas y mensajes para hoy o para abrir en el futuro.",
    icon: "☼",
    accent: "#8fd9cb",
    demoRecipient: "Lola",
    demoGiver: "Mamá y Papá",
    opening: "Antes de que puedas recordar todo esto, nosotros ya lo estábamos guardando para vos.",
    closing: "Crezcas cuanto crezcas, siempre vas a tener un lugar al que volver.",
    tags: ["Hijos", "Familia", "Cápsula"],
    recipe: ["intro", "timeline", "memories", "light", "stars", "capsule", "hold", "letter", "finale"],
  },
  {
    slug: "abuelos",
    eyebrow: "Una vida que merece quedar",
    title: "El museo de tu historia",
    short: "Décadas de recuerdos convertidas en un recorrido familiar inolvidable.",
    description: "Fotos antiguas, voces, anécdotas, recetas, lugares y mensajes de toda la familia.",
    icon: "⌛",
    accent: "#d8b987",
    demoRecipient: "Abuela Elena",
    demoGiver: "Toda tu familia",
    opening: "Hay historias que no deberían quedar guardadas en una caja de fotos.",
    closing: "Tu historia también es la nuestra. Gracias por haberla empezado.",
    tags: ["Abuelos", "Legado", "Familia"],
    recipe: ["intro", "archive", "timeline", "memories", "home", "voices", "letter", "legacy", "finale"],
  },
  {
    slug: "aniversario",
    eyebrow: "Otro capítulo juntos",
    title: "Todo lo que construimos",
    short: "Una experiencia íntima para volver a recorrer la relación desde el comienzo.",
    description: "Línea del tiempo, preguntas de pareja, recuerdos secretos y una carta final.",
    icon: "∞",
    accent: "#d197ff",
    demoRecipient: "Martina",
    demoGiver: "Nico",
    opening: "No quiero celebrar solamente el día en que empezamos. Quiero celebrar todo lo que fuimos construyendo después.",
    closing: "Feliz nosotros. Por todo lo que fuimos, por todo lo que somos y por todo lo que todavía nos falta construir.",
    tags: ["Aniversario", "Pareja", "Recuerdos"],
    recipe: ["intro", "timeline", "memories", "rituals", "chapters", "letter", "future", "finale"],
  },
  {
    slug: "propuesta",
    eyebrow: "La pregunta más importante",
    title: "Antes de preguntarte algo…",
    short: "Un recorrido íntimo por las razones, la certeza y todo lo que lleva a una sola pregunta.",
    description: "Fotografías, razones, una carta y un último gesto. Después, la interfaz desaparece y queda solamente la pregunta.",
    icon: "◇",
    accent: "#f6d58f",
    demoRecipient: "Clara",
    demoGiver: "Tomás",
    opening: "Hay algo que quiero preguntarte. Pero antes necesito que vuelvas conmigo a algunas cosas que me trajeron hasta acá.",
    closing: "¿Querés casarte conmigo?",
    tags: ["Propuesta", "Casamiento", "Pareja"],
    recipe: ["intro", "origin", "memories", "reasons", "certainty", "letter", "threshold", "proposal"],
  },
  {
    slug: "mama",
    eyebrow: "Para la mujer que estuvo antes que todos",
    title: "Todo lo que hiciste sin pedir aplausos",
    short: "Una experiencia sobre infancia, cuidado, gestos invisibles y ese lugar al que siempre se puede volver.",
    description: "Fotos, voces y escenas creadas para agradecer no sólo los grandes momentos, sino todo lo cotidiano que sostuvo una vida.",
    icon: "✿",
    accent: "#e8a99b",
    demoRecipient: "Mamá",
    demoGiver: "Tus hijos",
    opening: "Hay una edad en la que uno cree que mamá simplemente puede con todo. Después crece y empieza a entender cuánto había detrás.",
    closing: "Gracias por ser hogar mucho antes de que yo entendiera lo que significaba esa palabra.",
    tags: ["Mamá", "Gratitud", "Infancia"],
    recipe: ["intro", "childhood", "memories", "care", "sacrifices", "voices", "letter", "return", "finale"],
  },
  {
    slug: "papa",
    eyebrow: "Para el hombre que me enseñó más de lo que decía",
    title: "Las cosas tuyas que quedaron en mí",
    short: "Un recorrido por aprendizajes, presencia, códigos y todo lo que uno entiende distinto cuando crece.",
    description: "Fotos, voces y escenas creadas para mirar a papá desde otro lugar: no sólo como padre, sino como la persona detrás de todo lo que enseñó.",
    icon: "⌁",
    accent: "#a9b7c9",
    demoRecipient: "Papá",
    demoGiver: "Tus hijos",
    opening: "De chico pensé que simplemente sabías cómo hacer las cosas. De grande entendí que muchas veces estabas aprendiendo mientras me enseñabas.",
    closing: "Hay cosas tuyas que ya forman parte de mí. Gracias por haberlas dejado sin siquiera proponértelo.",
    tags: ["Papá", "Legado", "Gratitud"],
    recipe: ["intro", "memories", "lessons", "presence", "inheritance", "voices", "letter", "lookback", "finale"],
  },
  {
    slug: "amistad",
    eyebrow: "Archivo confidencial · sólo para ustedes",
    title: "Expediente: nosotras",
    short: "Pruebas, códigos secretos, malas decisiones y todo eso que convirtió una amistad en parte de la vida.",
    description: "Una experiencia que empieza como un archivo absurdo de anécdotas y termina mostrando por qué esa persona se volvió familia elegida.",
    icon: "✹",
    accent: "#79b7ff",
    demoRecipient: "Vale",
    demoGiver: "Cami",
    opening: "Antes de que esto se ponga sentimental, considero necesario dejar constancia oficial de demasiadas cosas que hicimos juntas.",
    closing: "Entre todas las personas que la vida podía cruzarme, qué suerte que me tocaste vos.",
    tags: ["Amistad", "Códigos", "Recuerdos"],
    recipe: ["intro", "casefile", "memories", "insidejokes", "incidents", "proof", "letter", "pact", "finale"],
  },
];

export function getExperience(slug: string) {
  if (slug === "mama-papa") return experiences.find((experience) => experience.slug === "mama");
  return experiences.find((experience) => experience.slug === slug);
}
