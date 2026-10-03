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
  | "hold";

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
    short: "La historia de ustedes conduce a una última puerta y una sola pregunta.",
    description: "Una propuesta de casamiento construida como una aventura emocional privada.",
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
    slug: "mama-papa",
    eyebrow: "Para quienes estuvieron primero",
    title: "Todo lo que quizá nunca te dije",
    short: "Un recorrido de gratitud hecho con recuerdos familiares y palabras que importan.",
    description: "Fotos, audios, cartas de hijos y una colección de pequeñas cosas que no queremos olvidar.",
    icon: "❋",
    accent: "#ff9a7a",
    demoRecipient: "Mamá",
    demoGiver: "Tus hijos",
    opening: "Hay cosas que uno siente toda la vida y tarda demasiado en decir.",
    closing: "Gracias por ser casa incluso cuando estamos lejos.",
    tags: ["Mamá", "Papá", "Gratitud"],
    recipe: ["intro", "memories", "voices", "stars", "letter", "scratch", "finale"],
  },
  {
    slug: "amistad",
    eyebrow: "Para tu persona elegida",
    title: "El archivo secreto de nuestra amistad",
    short: "Anécdotas, papelones, fotos y mensajes que sólo ustedes entienden.",
    description: "Una experiencia divertida y emotiva para cumpleaños, despedidas o porque sí.",
    icon: "✹",
    accent: "#79b7ff",
    demoRecipient: "Vale",
    demoGiver: "Cami",
    opening: "Advertencia: este archivo contiene pruebas de demasiadas malas decisiones juntas.",
    closing: "Gracias por estar en todas. Incluso en las que era mejor no estar.",
    tags: ["Amistad", "Humor", "Recuerdos"],
    recipe: ["intro", "quiz", "memories", "balloons", "scratch", "letter", "finale"],
  },
];

export function getExperience(slug: string) {
  return experiences.find((experience) => experience.slug === slug);
}
