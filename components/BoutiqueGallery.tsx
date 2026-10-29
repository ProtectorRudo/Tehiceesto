"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Experience } from "@/data/experiences";

type Props = { experiences: Experience[] };
const labels: Record<string, { title: string; mood: string; gesture: string }> = {
  pareja: { title: "Para mi amor", mood: "Lo nuestro, contado de otra forma.", gesture: "Abrí la puerta y descubrí su historia" },
  cumpleanos: { title: "Feliz cumpleaños", mood: "Un día entero hecho sorpresa.", gesture: "Encendé la emoción, un momento a la vez" },
  hijos: { title: "Desde que llegaste", mood: "El primer capítulo de una vida.", gesture: "Recorré recuerdos que valen una vida" },
  abuelos: { title: "Para los abuelos", mood: "Una vida que sigue abrazándonos.", gesture: "Abrí el álbum de toda una familia" },
  aniversario: { title: "Nuestro aniversario", mood: "El tiempo pasa. Nosotros elegimos.", gesture: "Volvé a ese primer nosotros" },
  propuesta: { title: "La gran pregunta", mood: "Un instante para recordar siempre.", gesture: "Descubrí cada pista antes del gran sí" },
  mama: { title: "Para mamá", mood: "Gracias por cada gesto invisible.", gesture: "Descubrí todo lo que hizo por amor" },
  papa: { title: "Para papá", mood: "Hay cosas tuyas que viven en mí.", gesture: "Recorré su historia y lo que te enseñó" },
  amistad: { title: "Nuestra amistad", mood: "Anécdotas, códigos y una vida juntos.", gesture: "Abrí el expediente confidencial" },
  secreto: { title: "Te guardé un secreto", mood: "Una noticia que merece su momento.", gesture: "Seguí las pistas hasta la revelación" },
};
const favorites = ["pareja", "mama", "cumpleanos", "amistad", "papa"];
export default function BoutiqueGallery({ experiences }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const start = (slug: string) => {
    setLoaded(false);
    if (active === slug) setEpoch((value) => value + 1);
    else { setActive(slug); setEpoch(0); }
  };
  const stop = () => {setActive(null); setLoaded(false);};
  const move = (direction: number) => {
    const track = trackRef.current;
    const first = track?.querySelector<HTMLElement>(".ethos-like-card");
    if (track && first) track.scrollBy({left:direction * (first.offsetWidth + 22), behavior:"smooth"});
  };
  const onScroll = () => {
    const track=trackRef.current;
    const first=track?.querySelector<HTMLElement>(".ethos-like-card");
    if (track && first) setIndex(Math.min(experiences.length-1,Math.max(0,Math.round(track.scrollLeft/(first.offsetWidth+22)))));
  };
  const ordered = [...experiences].sort((a,b) => {
    const ai=favorites.indexOf(a.slug), bi=favorites.indexOf(b.slug);
    return (ai===-1?100:ai)-(bi===-1?100:bi);
  });
  return (
    <section className="boutique-collection ethos-collection" id="coleccion" aria-labelledby="collection-title">
      <div className="ethos-collection-head">
        <div className="ethos-heading-group">
          <span className="ethos-pink-kicker"><span aria-hidden="true">✦</span> LA COLECCIÓN DE TE HICE ESTO</span>
          <h2 id="collection-title">Cada regalo es<br/><em>una experiencia entera.</em></h2>
          <p>No mirás una foto de muestra. Entrás al regalo real, tocás sus escenas y descubrís sus sorpresas. <strong>Probalo acá, sin salir de esta página.</strong></p>
        </div>
        <div className="ethos-collection-note">
          <span>01 / {String(experiences.length).padStart(2,"0")}</span>
          <strong>Elegí. Tocá.<br/>Sentí.</strong>
          <p>El celular que ves es interactivo.</p>
        </div>
      </div>
      <div className="ethos-catalog-toolbar">
        <span><i aria-hidden="true" /> {experiences.length} experiencias personalizables</span>
        <span>DESLIZÁ PARA EXPLORAR <b aria-hidden="true">→</b></span>
      </div>
      <div className="ethos-catalog-viewport">
        <div className="ethos-catalog-track" ref={trackRef} onScroll={onScroll} role="region" aria-label="Catálogo de regalos digitales para probar directamente" tabIndex={0}>
          {ordered.map((experience,i) => {
            const demo=labels[experience.slug]||{title:experience.title,mood:experience.short,gesture:"Entrá a descubrirlo"};
            const isActive=active===experience.slug;
            return <article className={"ethos-like-card ethos-like-card--"+experience.slug+(isActive?" ethos-like-card--playing":"")} key={experience.slug}>
              <div className="ethos-card-showcase">
                <div className="ethos-card-topline"><span className="ethos-card-tag">EXPERIENCIA REAL</span><span className="ethos-card-count">{String(i+1).padStart(2,"0")}</span></div>
                <div className="ethos-phone-wrap">
                  <div className="ethos-phone" aria-label={"Celular interactivo: "+demo.title}>
                    <div className="ethos-phone-camera" aria-hidden="true" />
                    <div className="ethos-phone-screen">
                      {isActive ? <>
                        {!loaded&&<div className="ethos-phone-wait" role="status"><span className="ethos-wait-spark">✧</span> Preparando tu regalo…</div>}
                        <iframe key={experience.slug+"-"+epoch} title={"Demo interactiva de "+demo.title} src={"/experiencias/"+experience.slug+"?embed=1"} allow="autoplay; microphone" onLoad={()=>setLoaded(true)} loading="eager"/>
                      </> : <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={"/demo-previews/"+experience.slug+".jpg"} alt={"Vista previa real de "+demo.title} loading={i<3?"eager":"lazy"} />
                        <div className="ethos-phone-screen-shade" aria-hidden="true"/>
                        <button className="ethos-phone-start" onClick={()=>start(experience.slug)} type="button" aria-label={"Iniciar demo de "+demo.title}><span className="ethos-phone-start-icon">▶</span><span>PROBAR EN VIVO</span></button>
                      </>}
                    </div>
                    <span className="ethos-phone-homebar" aria-hidden="true" />
                  </div>
                  {isActive && <div className="ethos-phone-playing-label"><i/> DEMO EN CURSO · SEGUÍ EXPLORANDO LA HOME</div>}
                </div>
                <div className="ethos-card-corner-flower" aria-hidden="true">✽</div>
              </div>
              <div className="ethos-card-info">
                <div className="ethos-card-information"><span className="ethos-card-eyebrow">{experience.eyebrow}</span><h3>{demo.title}</h3><p>{demo.mood}</p></div>
                <p className="ethos-card-gesture">{demo.gesture}</p>
                <div className="ethos-card-cta">
                  <button type="button" className="ethos-card-test" onClick={()=>start(experience.slug)}>{isActive?"↻  Reiniciar demo":"▶  Probar acá mismo"}</button>
                  {isActive && <button type="button" className="ethos-card-stop" onClick={stop}>Detener</button>}
                  <Link href="/crear" className="ethos-card-select">Elegir regalo <span aria-hidden="true">↗</span></Link>
                </div>
              </div>
            </article>;
          })}
        </div>
      </div>
      <div className="ethos-carousel-footer">
        <div className="ethos-carousel-progress"><strong>{String(index+1).padStart(2,"0")}</strong><div className="ethos-carousel-progress-bar"><i style={{width:(((index+1)/experiences.length)*100)+"%"}} /></div><span>{String(experiences.length).padStart(2,"0")}</span></div>
        <p>Tocá dentro del teléfono para avanzar en la experiencia. Podés continuar recorriendo la Home.</p>
        <div className="ethos-carousel-nav"><button aria-label="Experiencia anterior" onClick={()=>move(-1)} type="button" disabled={index===0}>←</button><button aria-label="Experiencia siguiente" onClick={()=>move(1)} type="button" disabled={index>=experiences.length-1}>→</button></div>
      </div>
    </section>
  );
}

