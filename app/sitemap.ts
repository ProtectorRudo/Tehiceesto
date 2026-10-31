import type {MetadataRoute} from "next";

const site="https://tehiceesto.com";
const pages=[
  ["/",1],
  ["/crear",0.95],
  ["/coleccion/todos",0.75],
  ["/coleccion/pareja",0.8],
  ["/coleccion/amigos",0.8],
  ["/coleccion/mama",0.75],
  ["/coleccion/papa",0.75],
  ["/juegos/pack",0.85],
  ["/escapes",0.65],
  ["/experiencias/pareja",0.8],
  ["/experiencias/mama",0.75],
  ["/experiencias/papa",0.75],
  ["/experiencias/cumpleanos",0.75],
  ["/experiencias/amistad",0.75],
  ["/experiencias/club-amigos",0.75],
  ["/experiencias/sticker-bomb-amistad",0.85],
  ["/experiencias/frasco365",0.75],
  ["/experiencias/siete-dias",0.75],
  ["/juegos/trazo-complice",0.65],
  ["/juegos/entre-dos",0.65],
  ["/juegos/complices",0.65],
] as const;

export default function sitemap():MetadataRoute.Sitemap{
  return pages.map(([path,priority])=>({
    url:site+path,
    priority,
    changeFrequency:"weekly" as const,
  }));
}
