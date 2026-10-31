export type RecipientCategoryId = "pareja" | "mama" | "papa" | "amigos" | "juegos" | "todos";

export type RecipientCategory = {
  id: RecipientCategoryId;
  title: string;
  description: string;
  titleLong: string;
  heading: string;
  subheading: string;
  slugs: readonly string[];
};

export const recipientCategories: readonly RecipientCategory[] = [
  {
    id: "pareja",
    title: "Pareja",
    description: "Para quien elegís cada día",
    titleLong: "Para tu pareja",
    heading: "Para esa persona que hace todo distinto.",
    subheading: "Historias, pequeños rituales y sorpresas para celebrar lo que tienen entre ustedes.",
    slugs: ["pareja", "frasco365", "siete-dias"],
  },
  {
    id: "mama",
    title: "Mamá",
    description: "Un gracias que llega al corazón",
    titleLong: "Para mamá",
    heading: "Hay un amor que merece su propio lugar.",
    subheading: "Recuerdos, palabras y momentos para decirle lo que quizá todavía no le dijiste.",
    slugs: ["mama"],
  },
  {
    id: "papa",
    title: "Papá",
    description: "Lo que dejó en vos",
    titleLong: "Para papá",
    heading: "Lo que te enseñó merece quedar.",
    subheading: "Una forma de agradecer su presencia, sus gestos y esa huella que vive en vos.",
    slugs: ["papa"],
  },
  {
    id: "amigos",
    title: "Amigos",
    description: "Historias que solo ustedes entienden",
    titleLong: "Para tus amigos",
    heading: "Para quienes se volvieron familia elegida.",
    subheading: "Anécdotas, risas, códigos secretos y emociones en experiencias para la amistad.",
    slugs: ["club-amigos", "amistad", "cumpleanos"],
  },
  {
    id: "juegos",
    title: "Juegos",
    description: "Momentos para compartir y reír",
    titleLong: "Juegos para compartir",
    heading: "Los mejores recuerdos también se juegan.",
    subheading: "Jugá con alguien que querés. Una excusa perfecta para reírse y crear una historia más.",
    slugs: [],
  },
  {
    id: "todos",
    title: "Todos",
    description: "Explorá toda la colección",
    titleLong: "Todas las experiencias",
    heading: "Algo especial para cada persona.",
    subheading: "Encontrá el regalo que mejor cuenta lo que querés decir.",
    slugs: [],
  },
] as const;

export function recipientCategory(id: string) {
  return recipientCategories.find((item) => item.id === id);
}
