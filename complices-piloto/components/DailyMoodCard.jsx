"use client";
import {useEffect,useState} from "react";
import {DAILY_MOODS,CARE_NEEDS,moodLabel,careNeedLabel} from "../lib/today-care.mjs";

export default function DailyMoodCard({current,today,busy=false,notice="",onSave,onClear}){
 const saved=Boolean(current?.day===today);
 const [editing,setEditing]=useState(!saved);
 const [mood,setMood]=useState("");
 const [need,setNeed]=useState("");
 const [share,setShare]=useState(false);

 useEffect(()=>{
  const active=current?.day===today;
  setMood(active?current.mood:"");
  setNeed(active?(current.care_need||""):"");
  setShare(active?Boolean(current.share_care_hint):false);
  setEditing(!active);
 },[current?.user_id,current?.updated_at,current?.day,today]);

 return <section className="daily-moment" aria-label="Mi momento de hoy">
  <div className="daily-moment-head">
   <div>
    <span className="tiny">UN MINUTO PARA VOS</span>
    <h2>¿Cómo te sentís hoy? <span aria-hidden="true">♡</span></h2>
    <p>Solo vos podés ver cómo te sentís. No hay respuestas correctas ni obligación de hacerlo.</p>
   </div>
   {saved&&!editing&&<button type="button" className="daily-moment-edit" onClick={()=>setEditing(true)}>Cambiar</button>}
  </div>
  {saved&&!editing?
   <div className="daily-moment-saved">
    <span aria-hidden="true">{DAILY_MOODS.find(item=>item.key===current.mood)?.emoji||"♡"}</span>
    <div>
     <strong>{moodLabel(current.mood)}</strong>
     <p>{current.care_need?"Te haría bien: "+careNeedLabel(current.care_need):"Guardaste tu momento de hoy."}</p>
     <small>{current.share_care_hint?"Autorizaste compartir una pista de cuidado, nunca tu emoción.":"Tu momento es completamente privado."}</small>
    </div>
    <button type="button" className="daily-moment-remove" disabled={busy} onClick={onClear} aria-label="Eliminar mi momento de hoy">Eliminar</button>
   </div>
  :<>
   <div className="daily-moment-choices" role="group" aria-label="Elegí cómo te sentís">
    {DAILY_MOODS.map(item=><button type="button" key={item.key}
      className={"daily-mood-choice"+(mood===item.key?" active":"")}
      aria-pressed={mood===item.key}
      onClick={()=>{setMood(item.key);setShare(false)}}
      disabled={busy}><span aria-hidden="true">{item.emoji}</span><small>{item.label}</small></button>)}
   </div>
   {mood&&<div className="daily-moment-more">
    <p className="daily-moment-label">¿Qué te haría bien? <span>(opcional)</span></p>
    <div className="daily-needs" role="group" aria-label="Elegí lo que te haría bien">
     {CARE_NEEDS.map(item=><button type="button" key={item.key} className={"daily-need-choice"+(need===item.key?" active":"")}
       aria-pressed={need===item.key} disabled={busy}
       onClick={()=>{setNeed(need===item.key?"":item.key);setShare(false)}}>{item.emoji} {item.label}</button>)}
    </div>
    <label className="daily-moment-consent">
     <input type="checkbox" checked={Boolean(need&&share)} disabled={!need||busy} onChange={e=>setShare(Boolean(e.target.checked))}/>
     <span>Compartir una pista de cuidado con mi pareja. <strong>Mi emoción nunca se comparte.</strong></span>
    </label>
    <p className="daily-moment-privacy">Si la habilitás, Cómplices sugerirá un gesto respetuoso basado solo en lo que elegiste que te haría bien. Podés revocarla o borrar tu respuesta.</p>
   </div>}
   <div className="daily-moment-footer">
    <button type="button" className="btn" disabled={!mood||busy} onClick={()=>onSave({mood,care_need:need||null,share_care_hint:Boolean(need&&share)})}>{busy?"Guardando…":"Guardar mi momento"}</button>
    {saved&&<button type="button" className="daily-moment-cancel" onClick={()=>setEditing(false)} disabled={busy}>Cancelar</button>}
   </div>
  </>}
  {notice&&<p className="daily-moment-notice" role="status">{notice}</p>}
 </section>;
}
