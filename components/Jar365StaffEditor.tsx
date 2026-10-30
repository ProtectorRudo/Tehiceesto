"use client";
import { useEffect,useState } from "react";
import {JAR365_CATEGORIES,type Jar365Note,type Jar365Category} from "@/data/jar365-notes";
import "./jar365-editor.css";

export default function Jar365StaffEditor({code}:{code:string}){
 const [notes,setNotes]=useState<Jar365Note[]>([]);
 const [idx,setIdx]=useState(1);
 const [text,setText]=useState("");
 const [category,setCategory]=useState<Jar365Category>("detalles");
 const [saving,setSaving]=useState(false);
 const [notice,setNotice]=useState("");
 const [filter,setFilter]=useState("");
 async function call(action:string,extra:Record<string,unknown>={}){
  const result=await fetch("/api/jar365",{method:"POST",cache:"no-store",headers:{"content-type":"application/json"},
    body:JSON.stringify({action,code,...extra})});
  if(!result.ok)throw new Error("request_failed");
  return result.json();
 }
 useEffect(()=>{
   void call("admin-read").then(data=>{
     const list=(data.notes||[]) as Jar365Note[];
     setNotes(list);const first=list[0];if(first){setText(first.message);setCategory(first.category);}
   }).catch(()=>setNotice("No se pudieron cargar los mensajes."));
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[code]);
 const choose=(n:Jar365Note)=>{
   setIdx(n.position);setText(n.message);setCategory(n.category);setNotice("");
 };
 const save=async()=>{
   if(!text.trim()||saving)return;
   setSaving(true);setNotice("");
   try{
     await call("admin-save",{note:{position:idx,message:text.trim(),category}});
     setNotes(old=>old.map(n=>n.position===idx?{...n,message:text.trim(),category}:n));
     setNotice("Mensaje #"+idx+" guardado.");
   }catch{setNotice("No se pudo guardar. Revisá el acceso de administrador.");}
   finally{setSaving(false);}
 };
 return <section className="jar365-editor" aria-label="Edición administrativa de los 365 papelitos">
  <div className="jar365-editor-head"><div><span className="jar365-editor-eyebrow">ADMINISTRACIÓN · FRASCO 365</span>
   <h2>Los 365 <em>papelitos.</em></h2>
   <p>Modificá textos y colores de esta compra sin alterar el frasco modelo. Los cambios se guardan en la misma colección del destinatario.</p></div>
   <div className="jar365-editor-total">365<span>NOTAS</span></div></div>
  <div className="jar365-editor-tools"><input placeholder="Buscar frase o número..." value={filter} onChange={e=>setFilter(e.target.value)}/></div>
  <div className="jar365-editor-grid">
    <div className="jar365-editor-list" style={{maxHeight:550,overflowY:"auto"}}>
      {notes.filter(n=>n.message.toLowerCase().includes(filter.toLowerCase())||String(n.position).includes(filter)).map(n=><button
       type="button" key={n.position} className={n.position===idx?"selected":""} onClick={()=>choose(n)}>
       <i style={{background:JAR365_CATEGORIES.find(c=>c.key===n.category)?.color}}/><span><b>#{String(n.position).padStart(3,"0")}</b><small>{n.message}</small></span><span>›</span>
      </button>)}
    </div>
    <div className="jar365-editor-sheet" style={{"--edit-color":JAR365_CATEGORIES.find(c=>c.key===category)?.color||"#f0c4c8"} as React.CSSProperties}>
      <span className="jar365-editor-sheet-number">PAPELITO #{String(idx).padStart(3,"0")}</span>
      <label>Texto<textarea rows={7} maxLength={600} value={text} onChange={e=>setText(e.target.value)}/></label>
      <label>Color / categoría<select value={category} onChange={e=>setCategory(e.target.value as Jar365Category)}>
        {JAR365_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
      </select></label>
      <button type="button" disabled={saving||!notes.length} onClick={()=>void save()}>{saving?"Guardando…":"Guardar este mensaje"}</button>
      {notice&&<p role="status">{notice}</p>}
    </div>
  </div>
 </section>;
}
