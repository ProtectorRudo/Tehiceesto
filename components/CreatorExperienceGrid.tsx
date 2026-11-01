"use client";

import { useState } from "react";
import { ScaledDemoFrame } from "@/components/BoutiqueGallery";
import DemoFullscreen from "@/components/DemoFullscreen";
import type { Experience } from "@/data/experiences";

type Props = { experiences: Experience[]; onChoose: (slug: string) => void };
const highlights: Record<string,string> = {
  "dragon-ball-pareja":"Goku, Vegeta, nueve stickers y una saga de pareja",
  pareja:"Una historia solo de ustedes",
  cumpleanos:"Un cumpleaños para recordar",
  mama:"Un gracias que se siente",
  papa:"Lo que aprendiste a su lado",
  amistad:"Sus códigos, sus recuerdos",

  "sticker-bomb-amistad":"12 stickers, risas y una carta final inolvidable",
  "siete-dias":"Siete sorpresas, una por día",
  frasco365:"365 papelitos. Uno cada día",
};
const order=["dragon-ball-pareja","sticker-bomb-amistad","frasco365","siete-dias","pareja","cumpleanos","mama","papa","amistad"];
function previewPath(slug:string) {
  if (slug==="frasco365"||slug==="siete-dias"||slug==="sticker-bomb-amistad"||slug==="dragon-ball-pareja") return "/demo-previews/"+slug+".svg";
  return "/demo-previews/"+slug+".jpg";
}

export default function CreatorExperienceGrid({experiences,onChoose}:Props) {
  const [playing,setPlaying]=useState<string|null>(null);
  const [ready,setReady]=useState(false);
  const [epoch,setEpoch]=useState(0);
  const [fullscreen,setFullscreen]=useState<{slug:string;title:string}|null>(null);
  const sorted=[...experiences].sort((a,b)=>{
    const ai=order.indexOf(a.slug),bi=order.indexOf(b.slug);
    return (ai<0?100:ai)-(bi<0?100:bi);
  });
  const start=(slug:string)=>{
    setReady(false);
    if(playing===slug)setEpoch(n=>n+1);
    else {setPlaying(slug);setEpoch(0);}
  };
  const stop=()=>{setPlaying(null);setReady(false);};
  const openFullscreen=(slug:string,title:string)=>{stop();setFullscreen({slug,title});};

  return <section className="create-gallery" aria-labelledby="create-gallery-title">
    <div className="create-gallery-heading">
      <div>
        <span className="create-gallery-kicker"><i aria-hidden="true">✦</i> 01 / ELEGÍ TU EXPERIENCIA</span>
        <h2 id="create-gallery-title">Primero elegí <em>cómo sorprender.</em></h2>
        <p>Probá los recorridos reales, tocá sus escenas y elegí el que más te guste. Solo necesitás tu email y WhatsApp para comprar. Después personalizás el regalo a tu ritmo.</p>
      </div>
      <div className="create-gallery-aside"><span>{String(sorted.length).padStart(2,"0")}</span><small>EXPERIENCIAS DISPONIBLES</small><b>Para vivir.<br/>No solo mirar.</b></div>
    </div>

    <div className="create-gallery-grid">
      {sorted.map((item,index)=>{
        const isPlaying=playing===item.slug;
        return <article key={item.slug} className={"create-gallery-card"+(isPlaying?" is-playing":"")} style={{"--gallery-accent":item.accent} as React.CSSProperties}>
          <div className="create-gallery-visual">
            <div className="create-gallery-topline"><span>DEMO INTERACTIVA</span><span>{String(index+1).padStart(2,"0")}/{String(sorted.length).padStart(2,"0")}</span></div>
            <div className="create-gallery-phone" aria-label={"Vista previa móvil de "+item.title}>
              <i className="create-gallery-camera" aria-hidden="true"/>
              <div className="create-gallery-screen">
                {isPlaying ? <>
                  {!ready&&<div className="create-gallery-loading" role="status">Preparando la experiencia…</div>}
                  <ScaledDemoFrame slug={item.slug} title={item.title} epoch={epoch} onReady={()=>setReady(true)} onSwipe={()=>{}}/>
                </> : <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewPath(item.slug)} alt={"Vista real de la demo "+item.title} loading={index<3?"eager":"lazy"} />
                  <button className="create-gallery-play" type="button" onClick={()=>start(item.slug)} aria-label={"Probar demo de "+item.title}>
                    <span className="create-gallery-play-icon" aria-hidden="true">▶</span>
                    <span>PROBAR DEMO</span>
                  </button>
                </>}
              </div>
              <span className="create-gallery-homebar" aria-hidden="true"/>
            </div>
            {isPlaying&&<button className="create-gallery-stop" type="button" onClick={stop}>Cerrar demo ×</button>}
          </div>
          <div className="create-gallery-info">
            <span className="create-gallery-eyebrow">{item.eyebrow}</span>
            <h3>{item.title}</h3>
            <p>{highlights[item.slug]||item.short}</p>
            <button className="demo-expand-trigger demo-expand-trigger--create" type="button" onClick={()=>openFullscreen(item.slug,item.title)} aria-label={"Ver "+item.title+" en pantalla completa"}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M8 21H4a1 1 0 0 1-1-1v-4M16 21h4a1 1 0 0 0 1-1v-4"/></svg>
              Ver en pantalla completa
            </button>
            <div className="create-gallery-actions">
              <button type="button" className="create-gallery-choose" onClick={()=>onChoose(item.slug)}>Comprar esta experiencia <span aria-hidden="true">↗</span></button>
              {!isPlaying&&<button type="button" className="create-gallery-try" onClick={()=>start(item.slug)}>Ver demo</button>}
              {isPlaying&&<button type="button" className="create-gallery-try" onClick={()=>start(item.slug)}>Reiniciar</button>}
            </div>
          </div>
        </article>;
      })}
    </div>
    {fullscreen&&<DemoFullscreen slug={fullscreen.slug} title={fullscreen.title} onClose={()=>setFullscreen(null)} />}
    <p className="create-gallery-after">El diseño y los efectos se mantienen. Lo que hace único cada regalo es lo que vos quieras contar.</p>
  </section>;
}
