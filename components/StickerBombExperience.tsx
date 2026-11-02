"use client";

import {useMemo,useState} from "react";
import {stickerBombChapters,stickerBombDefaults,stickerBombNoteKeys} from "@/data/sticker-bomb-content";
import styles from "./sticker-bomb-experience.module.css";

type ChapterKey=typeof stickerBombNoteKeys[number];
export type StickerBombCopy={
 relationship:string;date:string;coverText:string;
 notes:Record<string,string[]>;future:string[];finalLetter:string[];
};
type Photo={url:string;caption?:string;fit?:"contain"|"cover";position?:string};
type Audio={url:string;caption?:string};
type Props={recipient:string;sender:string;copy?:unknown;photos?:Photo[];audios?:Audio[];isPreview?:boolean};

export function normalizeStickerBomb(value:unknown):StickerBombCopy {
 const raw=value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
 const defaults=stickerBombDefaults;
 const provided=raw.notes&&typeof raw.notes==="object"&&!Array.isArray(raw.notes)?raw.notes as Record<string,unknown>:{};
 const notes:Record<string,string[]>={};
 for(const id of stickerBombNoteKeys){
  const fallback=defaults.notes[id];
  const candidate=provided[id];
  notes[id]=Array.isArray(candidate)&&candidate.length===fallback.length&&candidate.every(v=>typeof v==="string")
   ?candidate.map(String):[...fallback];
 }
 const list=(value:unknown,def:readonly string[])=>Array.isArray(value)&&value.length===def.length&&value.every(v=>typeof v==="string")?value.map(String):[...def];
 return {
  relationship:typeof raw.relationship==="string"?raw.relationship:defaults.relationship,
  date:typeof raw.date==="string"?raw.date:defaults.date,
  coverText:typeof raw.coverText==="string"?raw.coverText:defaults.coverText,
  notes,future:list(raw.future,defaults.future),finalLetter:list(raw.finalLetter,defaults.finalLetter)
 };
}

/** Same personalizable scrapbook for catalog demo, buyer preview and published gift. */
export default function StickerBombExperience({recipient,sender,copy,photos=[],audios=[],isPreview=false}:Props){
 const content=useMemo(()=>normalizeStickerBomb(copy),[copy]);
 const [step,setStep]=useState(-1);
 const [openNote,setOpenNote]=useState(0);
 const [openedLetter,setOpenedLetter]=useState(false);
 const total=stickerBombChapters.length;
 const active=step>=0?stickerBombChapters[step]:null;
 const lines=active&&stickerBombNoteKeys.includes(active.id as ChapterKey)
  ?content.notes[active.id]||[]:[];
 const go=(next:number)=>{setStep(Math.min(Math.max(next,-1),total-1));setOpenNote(0);setOpenedLetter(false);};
 return <main className={styles.world} aria-label="Sticker Bomb · Expediente de nuestra amistad">
  <div className={styles.noise} aria-hidden="true"/>
  <div className={styles.frame}>
   <header className={styles.top}>
    <span className={styles.brand}>TE HICE ESTO <span>✳</span></span>
    <span className={styles.series}>EXPEDIENTE / AMISTAD {isPreview?"· VISTA PREVIA":""}</span>
   </header>
   {step<0?
    <section className={styles.cover} aria-labelledby="sticker-title">
     <div className={styles.coverArt} aria-hidden="true">
      <span className={styles.labelStamp}>CONFIDENCIAL</span>
      <div className={styles.stickerStar}>✳</div>
      <span className={styles.coverHeart}>♡</span><span className={styles.coverSpark}>✦</span>
      <span className={styles.scribble}>forever & siempre</span>
     </div>
     <div className={styles.coverCopy}>
      <p className={styles.eyebrow}>ARCHIVO Nº 001 · NO DIVULGAR</p>
      <h1 id="sticker-title">Hay amistades que merecen <em>su propio expediente.</em></h1>
      <p className={styles.names}>PARA <strong>{recipient}</strong> · DE <strong>{sender}</strong></p>
      <p className={styles.description}>{content.coverText}</p>
      <div className={styles.meta}><span>{content.relationship}</span><span>{content.date}</span></div>
      <button className={styles.bigButton} type="button" onClick={()=>go(0)}>Abrir nuestro expediente <span aria-hidden>↗</span></button>
     </div>
    </section>:
    <section className={styles.chapter} key={active?.id} aria-label={"Capítulo "+(step+1)}>
     <div className={styles.chapterHeading}>
      <p className={styles.eyebrow}>PRUEBA {String(step+1).padStart(2,"0")} / {String(total).padStart(2,"0")}</p>
      <div className={styles.chapterIcon} style={{background:active?.color}} aria-hidden="true">{step===total-1?"✉":step===total-2?"✈":"✳"}</div>
      <h1>{active?.title}</h1>
      <p>{active?.subtitle}</p>
     </div>
     <div className={styles.stickerPanel}>
      <span className={styles.tape} aria-hidden="true"/>
      {active?.id==="moments"&&photos.length>0?
        <div className={styles.photos}>{photos.slice(0,6).map((photo,i)=>
         <figure key={photo.url+"-"+i} className={styles.polaroid}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.caption||"Nuestro recuerdo "+(i+1)} loading="lazy" style={{objectFit:photo.fit||"cover",objectPosition:photo.position||"center"}}/>
          <figcaption>{photo.caption||"Nuestro recuerdo "+(i+1)+" ♡"}</figcaption>
         </figure>
        )}</div>:null}
      {active?.id==="audios"&&audios.length>0?
       <div className={styles.voiceList}>{audios.slice(0,5).map((audio,i)=>
        <div key={audio.url+"-"+i} className={styles.voice}><span>NOTA DE VOZ {String(i+1).padStart(2,"0")}</span><audio controls preload="none" src={audio.url}/></div>
       )}</div>:null}
      {active?.id==="future"?
       <div className={styles.futureGrid}>{content.future.map((line,i)=><div key={i} className={styles.futureNote}><b>{String(i+1).padStart(2,"0")}</b><p>{line}</p></div>)}</div>:
       active?.id==="letter"?
       <div className={styles.letterArea}>
        {!openedLetter?<button className={styles.envelope} type="button" onClick={()=>setOpenedLetter(true)} aria-label="Abrir la carta"><span>✉</span><strong>PARA {recipient}</strong><small>Tocá para abrir</small></button>:
         <article className={styles.letter}><p className={styles.letterTo}>Querida persona favorita, {recipient}:</p>{content.finalLetter.map((para,i)=><p key={i}>{para}</p>)}<p className={styles.letterSign}>Con todo mi cariño,<br/><strong>{sender} ♡</strong></p></article>}
       </div>:
       <div className={styles.notes}>
        {lines.map((line,i)=><button key={i} type="button" aria-expanded={openNote===i} onClick={()=>setOpenNote(i)} className={styles.note+" "+(openNote===i?styles.noteSelected:"")}>
         <span className={styles.noteIndex}>{String(i+1).padStart(2,"0")}</span>
         {openNote===i?<span className={styles.noteText}>{line}</span>:<span className={styles.noteClosed}>Tocá para descubrir este recuerdo</span>}
         <span aria-hidden="true" className={styles.noteArrow}>{openNote===i?"♥":"↗"}</span>
        </button>)}
       </div>
      }
      <span className={styles.panelSeal}>SOLO PARA NOSOTROS ✳</span>
     </div>
     <div className={styles.chapterFooter}>
      <span>{step===total-1?"LO QUE IMPORTA QUEDA":"RECUERDOS QUE NOS HACEN ÚNICOS"}</span>
      <span>{active?.label}</span>
     </div>
    </section>}
   <nav className={styles.navigation} aria-label="Navegación del regalo">
    <button type="button" disabled={step===-1} onClick={()=>go(step-1)}>← Anterior</button>
    <div className={styles.dots} aria-label={"Capítulo "+(step+1)+" de "+total}>{stickerBombChapters.map((chapter,i)=><button key={chapter.id} aria-label={"Ir al capítulo "+(i+1)} aria-current={step===i?"step":undefined} className={step===i?styles.dotActive:""} onClick={()=>go(i)}/>)}</div>
    <button type="button" onClick={()=>go(step===total-1?-1:step+1)}>{step===total-1?"Volver al inicio ↺":"Siguiente →"}</button>
   </nav>
   <footer className={styles.footer}>UNA HISTORIA ESCRITA ENTRE DOS <span>✳</span> TE HICE ESTO</footer>
  </div>
 </main>;
}
