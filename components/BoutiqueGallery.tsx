"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Experience } from "@/data/experiences";
import DemoFullscreen from "@/components/DemoFullscreen";

type Props = { experiences: Experience[] };
/** Render a 375px mobile viewport, then scale it to the preview phone. */
const PREVIEW_WIDTH = 375;
export function ScaledDemoFrame({ slug, epoch, title, onReady, onSwipe }: {
  slug: string; epoch: number; title: string; onReady: () => void; onSwipe: (direction: number) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const detachSwipeRef = useRef<() => void>(()=>{});
  const [dimensions, setDimensions] = useState({ scale: 0.6, height: 760 });
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const { width, height } = viewport.getBoundingClientRect();
      if (!width || !height) return;
      const scale = width / PREVIEW_WIDTH;
      setDimensions(previous => {
        const next = { scale, height: height / scale };
        return Math.abs(previous.scale-next.scale)<0.001 && Math.abs(previous.height-next.height)<0.5 ? previous : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);
  // Same-origin demo. A background swipe across the glass moves the catalog,
  // but buttons, scratch canvases and interactive scene elements keep their gestures.
  useEffect(() => () => detachSwipeRef.current(), []);
  const onFrameLoaded = () => {
    detachSwipeRef.current();
    const documentInFrame = frameRef.current?.contentDocument;
    if (documentInFrame) {
      let initial: { x: number; y: number } | null = null;
      const isInteractive = (target: EventTarget | null) =>
        (target as Element | null)?.nodeType === 1 &&
        !!(target as Element).closest("button,a,input,textarea,select,canvas,video,[role=button],[contenteditable=true],.scene-scratch,.scene-light");
      const begin = (x: number, y: number, target: EventTarget | null) => {
        initial = isInteractive(target) ? null : {x,y};
      };
      const end = (x: number, y: number) => {
        if (!initial) return;
        const dx=x-initial.x, dy=y-initial.y;
        initial=null;
        if (Math.abs(dx)>65 && Math.abs(dx)>Math.abs(dy)*1.4) onSwipe(dx<0?1:-1);
      };
      const onTouchStart = (event: TouchEvent) => {
        if (event.touches.length!==1) return;
        begin(event.touches[0].clientX,event.touches[0].clientY,event.target);
      };
      const onTouchEnd = (event: TouchEvent) => {
        if (event.changedTouches.length===1) end(event.changedTouches[0].clientX,event.changedTouches[0].clientY);
      };
      const onTouchCancel = () => {initial=null;};
      const onMouseDown = (event: MouseEvent) => begin(event.clientX,event.clientY,event.target);
      const onMouseUp = (event: MouseEvent) => end(event.clientX,event.clientY);
      documentInFrame.addEventListener("touchstart",onTouchStart,{passive:true});
      documentInFrame.addEventListener("touchend",onTouchEnd,{passive:true});
      documentInFrame.addEventListener("touchcancel",onTouchCancel,{passive:true});
      documentInFrame.addEventListener("mousedown",onMouseDown);
      documentInFrame.addEventListener("mouseup",onMouseUp);
      detachSwipeRef.current=()=>{
        documentInFrame.removeEventListener("touchstart",onTouchStart);
        documentInFrame.removeEventListener("touchend",onTouchEnd);
        documentInFrame.removeEventListener("touchcancel",onTouchCancel);
        documentInFrame.removeEventListener("mousedown",onMouseDown);
        documentInFrame.removeEventListener("mouseup",onMouseUp);
      };
    }
    onReady();
  };
  return (
    <div className="ethos-scaled-viewport" ref={viewportRef}>
      <iframe
        ref={frameRef}
        key={slug+"-"+epoch}
        className="ethos-scaled-iframe"
        title={"Demo interactiva de "+title}
        src={"/experiencias/"+encodeURIComponent(slug)+"?embed=1"}
        allow="autoplay; microphone"
        onLoad={onFrameLoaded}
        loading="eager"
        style={{
          width: PREVIEW_WIDTH,
          height: dimensions.height,
          transform: "scale("+dimensions.scale+")",
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

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
  frasco365: { title: "Un año de cosas lindas", mood: "365 papelitos. Un mensaje de verdad, cada día.", gesture: "Tocá el frasco y sacá tu primer papelito" },
  "siete-dias": { title: "Un poquito de mí, cada día", mood: "Siete sorpresas distintas. Una semana de amor.", gesture: "Probá los siete capítulos originales" },
  secreto: { title: "Te guardé un secreto", mood: "Una noticia que merece su momento.", gesture: "Seguí las pistas hasta la revelación" },
};
const favorites = ["frasco365","siete-dias", "pareja", "mama", "cumpleanos", "amistad", "papa"];
export default function BoutiqueGallery({ experiences }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState<{slug:string;title:string}|null>(null);
  const start = (slug: string) => {
    setLoaded(false);
    if (active === slug) setEpoch((value) => value + 1);
    else { setActive(slug); setEpoch(0); }
  };
  const stop = () => {setActive(null); setLoaded(false);};
  const openFullscreen=(slug:string,title:string)=>{stop();setFullscreen({slug,title});};
  const move = (direction: number) => {
    const track = trackRef.current;
    const first = track?.querySelector<HTMLElement>(".ethos-like-card");
    if (track && first) track.scrollBy({left:direction * (first.offsetWidth + 22), behavior:"smooth"});
  };
  useEffect(() => {
    const collection = trackRef.current?.closest(".boutique-collection");
    if (!collection) return;
    const observer = new IntersectionObserver(
      ([entry]) => document.body.classList.toggle("boutique-catalog-visible",entry.isIntersecting),
      { threshold: 0.08 }
    );
    observer.observe(collection);
    return () => {observer.disconnect();document.body.classList.remove("boutique-catalog-visible");};
  }, []);
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
        <div className={"ethos-catalog-track"+(active?" ethos-catalog-track--demo-active":"")} ref={trackRef} onScroll={onScroll} role="region" aria-label="Catálogo de regalos digitales para probar directamente" tabIndex={0}>
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
                        <ScaledDemoFrame slug={experience.slug} epoch={epoch} title={demo.title} onReady={()=>setLoaded(true)} onSwipe={move}/>
                      </> : <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={experience.slug==="frasco365"?"/demo-previews/frasco365.svg":experience.slug==="siete-dias"?"/demo-previews/siete-dias.svg":"/demo-previews/"+experience.slug+".jpg"} alt={"Vista previa real de "+demo.title} loading={i<3?"eager":"lazy"} />
                        <div className="ethos-phone-screen-shade" aria-hidden="true"/>
                        <button className="ethos-phone-start" onClick={()=>start(experience.slug)} type="button" aria-label={"Iniciar demo de "+demo.title}><span className="ethos-phone-start-icon">▶</span><span>PROBAR EN VIVO</span></button>
                      </>}
                    </div>
                    <span className="ethos-phone-homebar" aria-hidden="true" />
                  </div>

                </div>
                <div className="ethos-card-corner-flower" aria-hidden="true">✽</div>
              </div>
              <div className="ethos-card-info">
                <div className="ethos-card-information"><span className="ethos-card-eyebrow">{experience.eyebrow}</span>{isActive&&<span className="ethos-inline-live"><i/> DEMO EN VIVO</span>}<h3>{demo.title}</h3><p>{demo.mood}</p></div>
                <p className="ethos-card-gesture">{demo.gesture}</p>
                <button type="button" className="demo-expand-trigger" onClick={()=>openFullscreen(experience.slug,demo.title)} aria-label={"Ver "+demo.title+" en pantalla completa"}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M8 21H4a1 1 0 0 1-1-1v-4M16 21h4a1 1 0 0 0 1-1v-4"/></svg>
                  Ver en pantalla completa
                </button>
                <div className="ethos-card-cta">
                  <button type="button" className="ethos-card-test" onClick={()=>start(experience.slug)}>{isActive?"↻  Reiniciar demo":"▶  Probar acá mismo"}</button>
                  {isActive && <button type="button" className="ethos-card-stop" onClick={stop}>Detener</button>}
                  <Link href={experience.slug==="frasco365"?"/comprar/frasco365":experience.slug==="siete-dias"?"/comprar/siete-dias":"/crear"} className="ethos-card-select">{experience.slug==="frasco365"?"Regalar 365 papelitos":experience.slug==="siete-dias"?"Comprar los 7 días":"Elegir regalo"} <span aria-hidden="true">↗</span></Link>
                </div>
              </div>
            </article>;
          })}
        </div>
      </div>
      {fullscreen&&<DemoFullscreen slug={fullscreen.slug} title={fullscreen.title} onClose={()=>setFullscreen(null)} />}
      <div className="ethos-carousel-footer">
        <div className="ethos-carousel-progress"><strong>{String(index+1).padStart(2,"0")}</strong><div className="ethos-carousel-progress-bar"><i style={{width:(((index+1)/experiences.length)*100)+"%"}} /></div><span>{String(experiences.length).padStart(2,"0")}</span></div>
        <p>La experiencia se maneja dentro del teléfono; las flechas cambian de regalo y podés seguir bajando por la Home.</p>
        <div className="ethos-carousel-nav"><button aria-label="Experiencia anterior" onClick={()=>move(-1)} type="button" disabled={index===0}>←</button><button aria-label="Experiencia siguiente" onClick={()=>move(1)} type="button" disabled={index>=experiences.length-1}>→</button></div>
      </div>
    </section>
  );
}

