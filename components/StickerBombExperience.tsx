"use client";

import {useMemo,useRef,useState,type TouchEvent} from "react";
import {stickerBombChapters,stickerBombDefaults,stickerBombNoteKeys} from "@/data/sticker-bomb-content";
import styles from "./sticker-bomb-experience.module.css";

type ChapterKey=typeof stickerBombNoteKeys[number];
export type StickerBombCopy={
 relationship:string;date:string;coverText:string;
 notes:Record<string,string[]>;future:string[];finalLetter:string[];
};
type Photo={url:string;caption?:string;fit?:"contain"|"cover";position?:string};
type Audio={url:string;caption?:string};
type Props={recipient:string;sender:string;copy?:unknown;photos?:Photo[];audios?:Audio[];isPreview?:boolean;demoMode?:boolean};

// These photos appear only in the public catalog demo. Purchased gifts and
// editor previews always show their own media, never another person's demo.
const demoPhotos:Photo[]=[
 {url:"https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=82",caption:"Esos días que se vuelven historia"},
 {url:"https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=82",caption:"Siempre hay lugar para otra aventura"},
 {url:"https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=82",caption:"Por todos los momentos que vienen"},
];
const chapterSymbols:Record<string,string>={
 confidente:"☏",familia:"♡",memes:"✳",audios:"♫",plans:"↗",rescue:"♥",
 chaos:"✦",moments:"▧",code:"❝",time:"∞",future:"✈",letter:"✉",
};

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

/** Shared immutable visual model: demo, editor preview and published gifts. */
export default function StickerBombExperience({recipient,sender,copy,photos=[],audios=[],isPreview=false,demoMode=false}:Props){
 const content=useMemo(()=>normalizeStickerBomb(copy),[copy]);
 const [step,setStep]=useState(-1);
 const [openNote,setOpenNote]=useState(0);
 const [openedLetter,setOpenedLetter]=useState(false);
 const touch=useRef<{x:number;y:number}|null>(null);
 const total=stickerBombChapters.length;
 const active=step>=0?stickerBombChapters[step]:null;
 const lines=active&&stickerBombNoteKeys.includes(active.id as ChapterKey)
  ?content.notes[active.id]||[]:[];
 const visiblePhotos=demoMode&&photos.length===0?demoPhotos:photos;
 const go=(next:number)=>{
  setStep(Math.min(Math.max(next,-1),total-1));
  setOpenNote(0);
  setOpenedLetter(false);
 };
 const beginTouch=(event:TouchEvent<HTMLElement>)=>{
  if(event.touches.length!==1||step<0) return;
  const target=event.target as HTMLElement;
  if(target.closest("button,a,input,textarea,select,audio,video,[role=button]")) {touch.current=null;return;}
  touch.current={x:event.touches[0].clientX,y:event.touches[0].clientY};
 };
 const endTouch=(event:TouchEvent<HTMLElement>)=>{
  const origin=touch.current;touch.current=null;
  if(!origin||event.changedTouches.length!==1) return;
  const dx=event.changedTouches[0].clientX-origin.x;
  const dy=event.changedTouches[0].clientY-origin.y;
  if(Math.abs(dx)>72&&Math.abs(dx)>Math.abs(dy)*1.55) go(step+(dx<0?1:-1));
 };

 return <main className={styles.world} data-chapter={active?.id||"cover"} aria-label="Sticker Bomb · Expediente de nuestra amistad" onTouchStart={beginTouch} onTouchEnd={endTouch} onTouchCancel={()=>{touch.current=null;}}>
  <div className={styles.noise} aria-hidden="true"/>
  <div className={styles.frame}>
   <header className={styles.top}>
    <span className={styles.brand}>TE HICE ESTO <span>♥</span></span>
    <span className={styles.series}>ARCHIVO SECRETO Nº 001 {isPreview?"· VISTA PREVIA":demoMode?"· DEMO":""}</span>
   </header>
   {step<0?
    <section className={styles.cover} aria-labelledby="sticker-title">
     <div className={styles.coverArt} aria-hidden="true">
      <span className={styles.labelStamp}>SOLO PARA VOS</span>
      <div className={styles.coverTicket}><span>EXPEDIENTE CONFIDENCIAL</span><b>001</b><small>amistad de la buena</small></div>
      <div className={styles.coverPaper}><span>12 pruebas irrefutables</span><strong>DE QUE<br/>LO NUESTRO<br/>ES ÚNICO.</strong><i>✳</i></div>
      <div className={styles.stickerStar}>✳</div>
      <span className={styles.coverHeart}>♡</span><span className={styles.coverSpark}>✦</span>
      <span className={styles.scribble}>forever & siempre</span>
     </div>
     <div className={styles.coverCopy}>
      <p className={styles.eyebrow}>UNA EDICIÓN ÚNICA · HECHA PARA USTEDES</p>
      <h1 id="sticker-title">Hay amistades que merecen <em>su propio expediente.</em></h1>
      <p className={styles.names}>PARA <strong>{recipient}</strong> <span>♡</span> DE <strong>{sender}</strong></p>
      <p className={styles.description}>{content.coverText}</p>
      <div className={styles.meta}><span>{content.relationship}</span><span>{content.date}</span></div>
      <button className={styles.bigButton} type="button" onClick={()=>go(0)}>Abrir nuestro expediente <span aria-hidden="true">↗</span></button>
      <p className={styles.coverHint}>12 recuerdos · algunos te hacen reír, otros te abrazan</p>
     </div>
    </section>:
    <section className={styles.chapter} key={active?.id} aria-label={"Capítulo "+(step+1)}>
     <div className={styles.chapterHeading}>
      <p className={styles.eyebrow}>PRUEBA {String(step+1).padStart(2,"0")} / {String(total).padStart(2,"0")}</p>
      <div className={styles.chapterIcon} style={{background:active?.color}} aria-hidden="true">{chapterSymbols[active?.id||""]||"✳"}</div>
      <h1>{active?.title}</h1>
      <p>{active?.subtitle}</p>
     </div>
     <div className={styles.stickerPanel}>
      <span className={styles.tape} aria-hidden="true"/>
      <div className={styles.panelOverline}><span>ARCHIVO DE {recipient.toUpperCase()}</span><span>OBJETO {String(step+1).padStart(2,"0")}</span></div>
      {active?.id==="moments"&&visiblePhotos.length>0&&
       <div className={styles.photos}>{visiblePhotos.slice(0,6).map((photo,i)=>
        <figure key={photo.url+"-"+i} className={styles.polaroid}>
         <div className={styles.photoWindow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.caption||"Nuestro recuerdo "+(i+1)} loading="lazy" onError={e=>{e.currentTarget.style.visibility="hidden";}} style={{objectFit:photo.fit||"cover",objectPosition:photo.position||"center"}}/>
          <span className={styles.photoFallback}>✳<small>Un momento nuestro</small></span>
         </div>
         <figcaption>{photo.caption||"Nuestro recuerdo "+(i+1)+" ♡"}</figcaption>
        </figure>
       )}</div>}
      {active?.id==="moments"&&demoMode&&<p className={styles.demoDisclosure}>Fotos ilustrativas de la demo. Tu regalo lleva tus propias imágenes.</p>}
      {active?.id==="audios"&&audios.length>0&&
       <div className={styles.voiceList}>{audios.slice(0,5).map((audio,i)=>
        <div key={audio.url+"-"+i} className={styles.voice}>
         <div className={styles.voiceHeader}><span className={styles.voiceAvatar}>♫</span><div><strong>NOTA DE VOZ {String(i+1).padStart(2,"0")}</strong><small>{audio.caption||"Una voz que querés volver a escuchar"}</small></div></div>
         <audio controls preload="none" src={audio.url} aria-label={"Reproducir nota de voz "+(i+1)}/>
        </div>
       )}</div>}
      {active?.id==="audios"&&audios.length===0&&
       <div className={styles.voicePlaceholder}><div className={styles.waveIcon} aria-hidden="true">▂▆▃█▅▂▇▃▆</div><strong>Una voz puede decirlo todo.</strong><p>{demoMode?"En cada regalo podés sumar audios de verdad. Acá sonarán esas anécdotas que sólo ustedes entienden.":"Este capítulo también puede guardar notas de voz personales."}</p></div>}
      {active?.id==="future"?
       <div className={styles.futureGrid}>{content.future.map((line,i)=><div key={i} className={styles.futureNote}><b>PLAN Nº {String(i+1).padStart(2,"0")}</b><p>{line}</p><span aria-hidden="true">✦</span></div>)}</div>:
       active?.id==="letter"?
       <div className={styles.letterArea}>
        {!openedLetter?<button className={styles.envelope} type="button" onClick={()=>setOpenedLetter(true)} aria-label="Abrir la carta"><span className={styles.envelopeFlap}/><span className={styles.envelopeSeal}>♡</span><strong>PARA {recipient}</strong><small>Tocá el sobre para abrirlo</small></button>:
         <article className={styles.letter}><p className={styles.letterTo}>Para mi persona favorita, {recipient}:</p>{content.finalLetter.map((para,i)=><p key={i}>{para}</p>)}<p className={styles.letterSign}>Con todo mi cariño,<br/><strong>{sender} ♡</strong></p></article>}
       </div>:
       <div className={styles.notes}>
        {lines.map((line,i)=><button key={i} type="button" aria-expanded={openNote===i} onClick={()=>setOpenNote(i)} className={styles.note+" "+(openNote===i?styles.noteSelected:"")}>
         <span className={styles.noteIndex}>{String(i+1).padStart(2,"0")}</span>
         {openNote===i?<span className={styles.noteText}>{line}</span>:<span className={styles.noteClosed}>{active?.id==="code"?"Abrir mensaje":active?.id==="memes"?"Revelar sticker":"Tocá para descubrir"}</span>}
         <span aria-hidden="true" className={styles.noteArrow}>{openNote===i?"♥":"↗"}</span>
        </button>)}
       </div>
      }
      <span className={styles.panelSeal}>ARCHIVO PRIVADO · SOLO PARA NOSOTROS ✳</span>
     </div>
     <div className={styles.chapterFooter}><span>{step===total-1?"LO QUE IMPORTA QUEDA":"RECUERDOS QUE NOS HACEN ÚNICOS"}</span><span>{active?.label}</span></div>
    </section>}
   <nav className={styles.navigation} aria-label="Navegación del regalo">
    <button type="button" disabled={step===-1} onClick={()=>go(step-1)} aria-label="Volver al capítulo anterior">← <span>Anterior</span></button>
    <div className={styles.progressNav}><span className={styles.progressText}>{step<0?"Empezá cuando quieras":"Capítulo "+(step+1)+" de "+total}</span>
     <div className={styles.dots} aria-label="Elegir capítulo">{stickerBombChapters.map((chapter,i)=><button type="button" key={chapter.id} aria-label={"Ir al capítulo "+(i+1)+": "+chapter.label} aria-current={step===i?"step":undefined} className={step===i?styles.dotActive:""} onClick={()=>go(i)}><span/></button>)}</div>
    </div>
    <button type="button" onClick={()=>go(step===total-1?-1:step+1)} aria-label={step===total-1?"Reiniciar experiencia":"Ir al siguiente capítulo"}><span>{step===total-1?"Reiniciar":"Siguiente"}</span> {step===total-1?"↺":"→"}</button>
   </nav>
   <footer className={styles.footer}>UNA HISTORIA ESCRITA ENTRE DOS <span>✳</span> TE HICE ESTO</footer>
  </div>
 </main>;
}
