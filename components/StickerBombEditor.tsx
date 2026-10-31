"use client";

import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import {stickerBombChapters,stickerBombDefaults,stickerBombNoteKeys} from "@/data/sticker-bomb-content";
import styles from "./sticker-bomb-editor.module.css";

type Access={code:string;editorToken:string};
type Gift={giver_name:string;recipient_name:string;story_data?:Record<string,unknown>|null};
type Media={kind:"image"|"audio"|"video";url?:string|null;metadata?:{role?:string}|null};
type Config={
 relationship:string;date:string;coverText:string;
 notes:Record<string,string[]>;future:string[];finalLetter:string[];
};
type Props={access:Access;gift:Gift;media:Media[];onError:(text:string)=>void;onNotice:(text:string)=>void};
const endpoint=(process.env.NEXT_PUBLIC_SUPABASE_URL||"")+"/functions/v1/creator-api";
const apiKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
const originalNotes=stickerBombDefaults.notes as Record<string,readonly string[]>;
function initialConfig(gift:Gift):Config {
 const story=gift.story_data||{};
 const raw=(story.stickerBomb&&typeof story.stickerBomb==="object"&&!Array.isArray(story.stickerBomb)?story.stickerBomb:{}) as Record<string,unknown>;
 const notesRaw=raw.notes&&typeof raw.notes==="object"&&!Array.isArray(raw.notes)?raw.notes as Record<string,unknown>:{};
 const notes:Record<string,string[]>={};
 for(const key of stickerBombNoteKeys){
  const def=originalNotes[key];
  const candidate=notesRaw[key];
  notes[key]=Array.isArray(candidate)&&candidate.length===def.length&&candidate.every(x=>typeof x==="string")?candidate.map(String):[...def];
 }
 const array=(value:unknown,defaults:readonly string[])=>Array.isArray(value)&&value.length===defaults.length&&value.every(x=>typeof x==="string")?value.map(String):[...defaults];
 return {
  relationship:typeof raw.relationship==="string"?raw.relationship:String(story.relationship||stickerBombDefaults.relationship),
  date:typeof raw.date==="string"?raw.date:String(story.keyDate||stickerBombDefaults.date),
  coverText:typeof raw.coverText==="string"?raw.coverText:String(stickerBombDefaults.coverText),
  notes,future:array(raw.future,stickerBombDefaults.future),finalLetter:array(raw.finalLetter,stickerBombDefaults.finalLetter)
 };
}
const sceneName:Record<string,string>={
 confidente:"Psicóloga gratis",familia:"Familia elegida",memes:"Meme dealer",audios:"Audios eternos",
 plans:"Plan B oficial",rescue:"Rescatista emocional",chaos:"Partner del caos",
 moments:"Momentos épicos",code:"Nuestro idioma",time:"A prueba de tiempo",
};
export default function StickerBombEditor({access,gift,media,onError,onNotice}:Props){
 const [content,setContent]=useState<Config>(()=>initialConfig(gift));
 const [saving,setSaving]=useState(false),[preview,setPreview]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null);
 const setField=(key:"coverText"|"relationship"|"date",v:string)=>setContent(old=>({...old,[key]:v}));
 const setNote=(key:string,index:number,value:string)=>setContent(old=>({...old,notes:{...old.notes,[key]:old.notes[key].map((text,i)=>i===index?value:text)}}));
 const setArray=(key:"future"|"finalLetter",index:number,value:string)=>setContent(old=>({...old,[key]:old[key].map((text,i)=>i===index?value:text)}));
 const deliver=useCallback(()=>{
  if(!frame.current?.contentWindow)return;
  const photos=media.filter(m=>m.kind==="image"&&m.url).map(m=>m.url as string).slice(0,8);
  const audios=media.filter(m=>m.kind==="audio"&&m.url&&m.metadata?.role!=="soundtrack").map(m=>m.url as string).slice(0,8);
  frame.current.contentWindow.postMessage({type:"tehiceesto-sticker-preview",
   payload:{...content,recipient:gift.recipient_name||stickerBombDefaults.recipient,
    sender:gift.giver_name||stickerBombDefaults.sender,photos,audioUrls:audios}},
   "https://tehiceesto.com");
 },[content,media,gift.giver_name,gift.recipient_name]);
 useEffect(()=>{if(preview)deliver()},[preview,deliver]);
 const save=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(saving)return;
  if(!apiKey||!process.env.NEXT_PUBLIC_SUPABASE_URL){onError("El editor no está configurado. Intentá nuevamente más tarde.");return;}
  setSaving(true);
  try{
   const res=await fetch(endpoint,{method:"POST",cache:"no-store",headers:{"content-type":"application/json",apikey:apiKey},
    body:JSON.stringify({action:"saveStickerBomb",code:access.code,editorToken:access.editorToken,content})});
   const json=await res.json().catch(()=>({}));
   if(!res.ok||!json.ok)throw Error(json.error||"save_failed");
   onNotice("Los recuerdos y la carta se guardaron. La experiencia conserva su diseño original.");
  }catch{onError("No pudimos guardar los stickers. Volvé a intentar; tus cambios siguen en pantalla.");}
  finally{setSaving(false)}
 };
 return <section className={styles.section} aria-label="Editor de Sticker Bomb Amistad">
   <div className={styles.heading}><span className={styles.kicker}>STICKER BOMB · PERSONALIZACIÓN</span>
     <h2>Los mismos stickers. <em>Tu propia historia.</em></h2>
     <p>El diseño, el orden de los 12 momentos y las animaciones quedan intactos. Cambiá las frases, los recuerdos y la carta. Los nombres se guardan arriba, en «Datos de la experiencia».</p>
   </div>
   <form onSubmit={save} className={styles.form}>
    <div className={styles.top}>
     <label>La frase que presenta la amistad<input maxLength={180} value={content.relationship} onChange={e=>setField("relationship",e.target.value)}/></label>
     <label>Desde cuándo se conocen<input maxLength={180} value={content.date} onChange={e=>setField("date",e.target.value)}/></label>
    </div>
    <label>Mensaje de bienvenida<textarea rows={3} maxLength={1200} value={content.coverText} onChange={e=>setField("coverText",e.target.value)}/></label>
    <div className={styles.groupTitle}><strong>Los diez momentos para contar su amistad</strong><span>Elegí cada sticker y editá sus frases.</span></div>
    <div className={styles.chapters}>
     {stickerBombNoteKeys.map((id,index)=><details key={id} className={styles.chapter}>
       <summary><span className={styles.num}>{String(index+1).padStart(2,"0")}</span><span>{sceneName[id]}</span><span className={styles.arrow}>⌄</span></summary>
       <div className={styles.lines}>
        {content.notes[id].map((line,i)=><label key={i}>Mensaje {i+1}<textarea rows={3} maxLength={1800} value={line} onChange={e=>setNote(id,i,e.target.value)}/></label>)}
       </div>
      </details>)}
    </div>
    <details className={styles.chapter}><summary><span className={styles.num}>11</span>Los planes que todavía les faltan<span className={styles.arrow}>⌄</span></summary>
      <div className={styles.lines}>{content.future.map((line,i)=><label key={i}>Plan {i+1}<textarea rows={2} maxLength={1800} value={line} onChange={e=>setArray("future",i,e.target.value)}/></label>)}</div>
    </details>
    <details className={styles.chapter}><summary><span className={styles.num}>12</span>La carta final (el momento más especial)<span className={styles.arrow}>⌄</span></summary>
      <div className={styles.lines}>{content.finalLetter.map((line,i)=><label key={i}>Párrafo {i+1}<textarea rows={5} maxLength={4500} value={line} onChange={e=>setArray("finalLetter",i,e.target.value)}/></label>)}</div>
    </details>
    <div className={styles.actions}><button className={styles.save} type="submit" disabled={saving}>{saving?"Guardando recuerdos…":"Guardar mis stickers y la carta →"}</button>
      <button className={styles.previewButton} type="button" onClick={()=>setPreview(!preview)}>{preview?"Cerrar vista previa":"Ver cómo queda en el celular"}</button>
    </div>
   </form>
   {preview&&<div className={styles.preview}><div className={styles.previewHead}><span>VISTA PREVIA CON TUS DATOS</span><button type="button" onClick={deliver}>Actualizar vista ↻</button></div>
     <iframe ref={frame} onLoad={deliver} title="Vista previa personalizada Sticker Bomb Amistad" src="https://tehiceesto.com/experiencias/sticker-bomb-amistad?preview=1" className={styles.iframe}/>
   </div>}
   <p className={styles.help}>Tus fotos y audios se cargan más abajo en «Materiales personales». Se incorporan automáticamente al recorrido cuando publiques. Las ilustraciones de los stickers son parte del diseño y no se modifican.</p>
 </section>;
}
