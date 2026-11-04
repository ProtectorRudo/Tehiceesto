"use client";

import {useEffect,useRef,useState} from "react";
import styles from "./GiftVoiceCollection.module.css";

export type GiftVoice={url:string;caption?:string;scene?:string};

/**
 * A complete, optional voice collection for purchased gifts.
 * The original experience and its native voice scene stay intact: this only
 * exposes the extra recorded messages that a model cannot show in its scene.
 * It is intentionally NOT a sales CTA and never appears in public demos.
 */
export default function GiftVoiceCollection({
  audios,
  embedded=false,
}:{
  audios?:readonly GiftVoice[];
  embedded?:boolean;
}){
  const voices=(audios||[]).filter(voice=>typeof voice.url==="string"&&voice.url.length>0);
  const [open,setOpen]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const closeButton=useRef<HTMLButtonElement>(null);
  const collection=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!open||embedded)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    closeButton.current?.focus();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();setOpen(false);return;}
      if(event.key==="Tab"){
        const focusable=Array.from(collection.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),audio[controls],a[href],input:not([disabled])'
        )||[]).filter(element=>element.getClientRects().length>0);
        if(focusable.length===0)return;
        const first=focusable[0],last=focusable[focusable.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener("keydown",onKey);
    return()=>{
      document.body.style.overflow=previousOverflow;
      document.removeEventListener("keydown",onKey);
      collection.current?.querySelectorAll<HTMLAudioElement>("audio").forEach(audio=>audio.pause());
      trigger.current?.focus();
    };
  },[open,embedded]);

  const playOnly=(selected:HTMLAudioElement)=>{
    // Playing one message pauses other recorded messages and background tracks,
    // including a same-origin experience iframe, so two voices never overlap.
    for(const audio of document.querySelectorAll<HTMLAudioElement>("audio")){
      if(audio!==selected&&!audio.paused)audio.pause();
    }
    for(const frame of document.querySelectorAll<HTMLIFrameElement>("iframe")){
      try{
        frame.contentDocument?.querySelectorAll<HTMLAudioElement>("audio").forEach(audio=>{
          if(!audio.paused)audio.pause();
        });
      }catch{/* Cross-origin iframe media cannot be controlled. */}
    }
  };

  if(voices.length===0)return null;

  const archive=<div className={styles.content} data-voice-count={voices.length}>
    <p className={styles.kicker}>PARA ESCUCHAR CON EL CORAZÓN</p>
    <h2 className={styles.title} id="gift-voice-collection-title">Voces que quedaron para vos</h2>
    <p className={styles.subtitle}>
      {voices.length===1
        ?"Un mensaje de voz para acompañar este recuerdo."
        :`${voices.length} mensajes de voz guardados en esta experiencia. Podés escucharlos todos, a tu ritmo.`}
    </p>
    <ol className={styles.list}>
      {voices.map((voice,index)=><li className={styles.item} key={index+"-"+voice.url}>
        <span className={styles.ordinal} aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
        <div className={styles.voiceBody}>
          <strong className={styles.voiceTitle}>{voice.caption?.trim()||`Mensaje de voz ${index+1}`}</strong>
          <audio
            className={styles.player}
            controls
            preload="none"
            playsInline
            src={voice.url}
            aria-label={`Escuchar ${voice.caption?.trim()||"mensaje de voz "+(index+1)}`}
            onPlay={event=>playOnly(event.currentTarget)}
          />
        </div>
      </li>)}
    </ol>
    <p className={styles.footer}>Todas las voces de este regalo están acá para escucharlas cuando quieras.</p>
  </div>;

  if(embedded)return <section className={styles.inline} aria-label="Todas las grabaciones de este regalo">
    {archive}
  </section>;

  return <div className={styles.root} data-gift-voice-collection>
    <button
      ref={trigger}
      type="button"
      className={styles.trigger}
      aria-label={`Escuchar ${voices.length} ${voices.length===1?"mensaje de voz":"mensajes de voz"}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={()=>setOpen(true)}
    >
      <span className={styles.triggerIcon} aria-hidden="true">♫</span>
      <span>{voices.length===1?"Escuchar una voz":`Escuchar ${voices.length} voces`}</span>
    </button>
    {open&&<div className={styles.overlay}>
      <button type="button" className={styles.backdrop} aria-label="Cerrar colección de voces" onClick={()=>setOpen(false)}/>
      <div ref={collection} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="gift-voice-collection-title">
        <button ref={closeButton} type="button" className={styles.close} aria-label="Cerrar mensajes de voz" onClick={()=>setOpen(false)}>×</button>
        {archive}
      </div>
    </div>}
  </div>;
}
