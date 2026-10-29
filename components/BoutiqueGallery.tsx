"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Experience } from "@/data/experiences";

type Props = { experiences: Experience[] };

const cardDesign: Record<string,{name:string;tagline:string;figure:string;note:string}> = {
 pareja:{name:"Para mi amor",tagline:"Cada momento nos trajo hasta acá.",figure:"♡",note:"LO QUE SOMOS"},
 cumpleanos:{name:"Feliz vuelta al sol",tagline:"Un día que se convierte en mundo.",figure:"✷",note:"QUE EMPIECE LA MAGIA"},
 hijos:{name:"Desde que llegaste",tagline:"Para que nunca olvides cuánto amor había.",figure:"☾",note:"UN AMOR INFINITO"},
 abuelos:{name:"Una vida de historias",tagline:"Todo lo que aprendimos de vos.",figure:"❦",note:"EL ÁLBUM DE UNA VIDA"},
 aniversario:{name:"Nuestro aniversario",tagline:"Por cada día, por cada nosotros.",figure:"∞",note:"SIEMPRE VOS"},
 propuesta:{name:"Tengo una pregunta",tagline:"Una historia antes del gran sí.",figure:"◇",note:"UN NUEVO COMIENZO"},
 mama:{name:"Para mamá",tagline:"Gracias por cada gesto invisible.",figure:"✿",note:"TODO LO QUE ME DISTE"},
 papa:{name:"Para papá",tagline:"Esas cosas tuyas que viven en mí.",figure:"✦",note:"APRENDÍ DE VOS"},
 amistad:{name:"Nuestra amistad",tagline:"Un expediente de momentos inolvidables.",figure:"✳",note:"CÓMPLICES DESDE SIEMPRE"},
 secreto:{name:"Te guardé un secreto",tagline:"Hay noticias que merecen otro final.",figure:"✧",note:"UNA SORPRESA PARA VOS"}
};

export default function BoutiqueGallery({ experiences }: Props) {
  const trackRef=useRef<HTMLDivElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const triggerRef=useRef<HTMLElement|null>(null);
  const [active,setActive]=useState<Experience|null>(null);
  const [loading,setLoading]=useState(false);
  const [index,setIndex]=useState(0);
  const [soundHint,setSoundHint]=useState(true);
  const onClose=useCallback(()=>{setActive(null);setLoading(false);setSoundHint(true);},[]);
  const onOpen=useCallback((experience:Experience, trigger:HTMLElement)=>{
    triggerRef.current=trigger;
    setActive(experience);setLoading(true);setSoundHint(true);
  },[]);
  useEffect(()=>{
    if(!active)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const handleKey=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
    document.addEventListener("keydown",handleKey);
    const raf=requestAnimationFrame(()=>closeRef.current?.focus());
    return ()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",handleKey);cancelAnimationFrame(raf);triggerRef.current?.focus();};
  },[active,onClose]);
  const move=(dir:number)=>{
    const track=trackRef.current;if(!track)return;
    const card=track.querySelector<HTMLElement>(".boutique-card");
    track.scrollBy({left:dir*((card?.offsetWidth||350)+20),behavior:"smooth"});
  };
  const onScroll=()=>{
    const track=trackRef.current;const card=track?.querySelector<HTMLElement>(".boutique-card");
    if(!track||!card)return;
    setIndex(Math.min(experiences.length-1,Math.round(track.scrollLeft/(card.offsetWidth+20))));
  };
  return (
    <section className="boutique-collection" id="coleccion" aria-labelledby="collection-title">
      <div className="boutique-collection-intro">
        <div><span className="boutique-kicker">LA COLECCIÓN · EXPERIENCIAS PARA REGALAR</span><h2 id="collection-title">Elegí a quién<br/><em>querés emocionar.</em></h2><p>Cada historia es un mundo distinto. Deslizá, elegí la que te gusta y entrá a probarla acá mismo, sin salir de esta página.</p></div>
        <div className="boutique-collection-side"><span>01—{String(experiences.length).padStart(2,"0")} / COLECCIÓN</span><p>Regalos para tocar,<br/>escuchar y descubrir.</p></div>
      </div>
      <div className="boutique-carousel-shell">
        <div className="boutique-gallery-track" ref={trackRef} onScroll={onScroll} role="region" aria-label="Colección de experiencias; deslizar horizontalmente" tabIndex={0}>
          {experiences.map((experience,i)=>{
            const info=cardDesign[experience.slug]||{name:experience.title,tagline:experience.short,figure:experience.icon,note:"HECHO PARA VOS"};
            return <article className={"boutique-card boutique-card--"+experience.slug} key={experience.slug}>
              <button type="button" className={"boutique-card-visual boutique-card-visual--"+experience.slug} onClick={e=>onOpen(experience,e.currentTarget)} aria-label={"Probar demo de "+info.name}>
                <span className="boutique-card-upper"><small>TE HICE ESTO</small><small>{String(i+1).padStart(2,"0")} / {String(experiences.length).padStart(2,"0")}</small></span>
                <span className="boutique-visual-halo" aria-hidden="true"/>
                <span className="boutique-visual-figure" aria-hidden="true">{info.figure}</span>
                <span className="boutique-visual-paper" aria-hidden="true"><small>{info.note}</small><strong>{experience.demoRecipient}</strong><em>Hecho sólo para vos.</em></span>
                <span className="boutique-card-glow" aria-hidden="true">✦</span>
                <span className="boutique-play"><span>↗</span> PROBAR EN VIVO</span>
              </button>
              <div className="boutique-card-details"><div><span className="boutique-card-category">{experience.eyebrow}</span><h3>{info.name}</h3><p>{info.tagline}</p></div><div className="boutique-card-actions"><button type="button" onClick={e=>onOpen(experience,e.currentTarget)}>Probar experiencia <span aria-hidden="true">↗</span></button><Link href="/crear" aria-label={"Elegir "+info.name+" para regalar"}>Elegir <span aria-hidden="true">→</span></Link></div></div>
            </article>;
          })}
        </div>
      </div>
      <div className="boutique-gallery-bottom"><div className="boutique-gallery-progress"><span className="boutique-gallery-current">{String(index+1).padStart(2,"0")}</span><div className="boutique-gallery-line"><i style={{width:((index+1)/experiences.length*100)+"%"}} /></div><span>{String(experiences.length).padStart(2,"0")}</span></div><p>DESLIZÁ PARA VER MÁS <span aria-hidden="true">⟶</span></p><div className="boutique-gallery-nav"><button type="button" aria-label="Ver experiencia anterior" onClick={()=>move(-1)} disabled={index===0}>←</button><button type="button" aria-label="Ver experiencia siguiente" onClick={()=>move(1)} disabled={index>=experiences.length-1}>→</button></div></div>
      {active&&(
        <div className="boutique-demo-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
          <section className="boutique-demo-dialog" role="dialog" aria-modal="true" aria-label={"Demo interactiva de "+active.title}>
            <div className="boutique-demo-top"><span>TE HICE ESTO <b>♥</b><small> / DEMO EN VIVO</small></span><button ref={closeRef} type="button" className="boutique-demo-close" onClick={onClose}>Cerrar <span aria-hidden="true">✕</span></button></div>
            <div className="boutique-demo-content">
              <aside className="boutique-demo-aside"><span className="boutique-kicker">UNA EXPERIENCIA REAL</span><h2>{(cardDesign[active.slug]||{}).name||active.title}<em>.</em></h2><p>{active.short}</p><div className="boutique-demo-instruction"><span>01</span> Tocá, deslizá y descubrí.</div><div className="boutique-demo-instruction"><span>02</span> El recorrido es completamente interactivo.</div><div className="boutique-demo-instruction"><span>03</span> Después lo hacemos con tus recuerdos.</div><Link href="/crear" className="boutique-demo-buy">Quiero regalar esta experiencia <span>↗</span></Link><small>LA DEMO NO GUARDA TUS DATOS PERSONALES.</small></aside>
              <div className="boutique-demo-device"><div className="boutique-demo-device-top"><span>VISTA PREVIA INTERACTIVA</span><span><i /> ACTIVA</span></div><div className="boutique-demo-screen">{loading&&<div className="boutique-demo-loading" role="status">Preparando tu experiencia…</div>}<iframe key={active.slug} src={"/experiencias/"+encodeURIComponent(active.slug)+"?embed=1"} title={"Demo de "+active.title} allow="autoplay; microphone" loading="eager" onLoad={()=>setLoading(false)} /></div></div>
            </div>
            <div className="boutique-demo-mobile-bar"><span>{active.title}</span><Link href="/crear">Quiero regalar esta experiencia ↗</Link></div>
            {soundHint&&<div className="boutique-demo-sound"><span>♪</span> Para vivirla completa, activá el sonido cuando lo pida la demo.<button type="button" onClick={()=>setSoundHint(false)} aria-label="Ocultar aviso">✕</button></div>}
          </section>
        </div>
      )}
    </section>
  );
}

