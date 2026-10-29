"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { JAR365_CATEGORIES, type Jar365Category, type Jar365Note } from "@/data/jar365-notes";
import "./jar365-editor.css";

type Props={code:string;editorToken:string;onNotesChange?:(notes:Jar365Note[])=>void};
type Message={notes?:Jar365Note[];error?:string;ok?:boolean};

export default function Jar365Editor({code,editorToken,onNotesChange}:Props){
 const [notes,setNotes]=useState<Jar365Note[]>([]);
 const [selected,setSelected]=useState(1);
 const [draft,setDraft]=useState<Jar365Note|null>(null);
 const [search,setSearch]=useState("");
 const [filter,setFilter]=useState("todos");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [notice,setNotice]=useState("");
 const [bulk,setBulk]=useState("");
 const [bulkMode,setBulkMode]=useState(false);
 const [page,setPage]=useState(0);
 const [version,setVersion]=useState(0);

 const send=useCallback(async(action:string,extra:Record<string,unknown>={})=>{
  const response=await fetch("/api/jar365",{method:"POST",cache:"no-store",
   headers:{"content-type":"application/json"},
   body:JSON.stringify({action,code,editorToken,...extra})});
  const data=await response.json() as Message;
  if(!response.ok||data.error)throw new Error("request_failed");
  return data;
 },[code,editorToken]);

 useEffect(()=>{
   let alive=true;setLoading(true);
   void send("studio-read").then(data=>{
     if(!alive)return;
     const list=Array.isArray(data.notes)?data.notes:[];
     setNotes(list);setDraft(list.find(n=>n.position===selected)||null);onNotesChange?.(list);
   }).catch(()=>{if(alive)setNotice("No pudimos cargar tus papelitos. Volvé a abrir el editor.");})
   .finally(()=>{if(alive)setLoading(false);});
   return()=>{alive=false};
 // Explicitly load once per gift identity; later edits are local.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[send,version]);

 const visible=useMemo(()=>notes.filter(n=>(filter==="todos"||filter===n.category)
    &&(!search||n.message.toLowerCase().includes(search.toLowerCase())||String(n.position).includes(search))),[notes,filter,search]);
 const currentPage=visible.slice(page*12,page*12+12);
 const totalPages=Math.max(1,Math.ceil(visible.length/12));
 const original=notes.find(n=>n.position===selected);
 const modified=Boolean(draft && original && (draft.message!==original.message||draft.category!==original.category));

 const choose=(position:number)=>{
  if(modified&&!window.confirm("Tenés un cambio sin guardar. ¿Querés salir de este papelito?"))return;
  setSelected(position);
  setDraft(notes.find(n=>n.position===position)||null);
  setNotice("");
 };
 const save=async()=>{
  if(!draft||busy)return;
  if(!draft.message.trim()){setNotice("Escribí algo en el papelito antes de guardar.");return;}
  setBusy(true);setNotice("");
  try{
   await send("studio-save",{note:draft});
   const next=notes.map(n=>n.position===draft.position?{...draft,message:draft.message.trim()}:n);
   setNotes(next);onNotesChange?.(next);setNotice("Papelito "+draft.position+" guardado. Ya está listo para regalar.");
  }catch{setNotice("No se pudo guardar. Intentá de nuevo.");}
  finally{setBusy(false);}
 };
 const importMany=async()=>{
  if(busy)return;
  const lines=bulk.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(lines.length===0||lines.length>365||lines.some(s=>s.length>600)){
    setNotice("Pegá entre 1 y 365 frases, una por línea, de hasta 600 caracteres.");return;
  }
  const replacements=lines.map((message,i)=>({position:i+1,message,
    category:notes[i]?.category||"detalles" as Jar365Category}));
  if(!window.confirm(`Vas a reemplazar los primeros ${lines.length} papelitos. Los demás quedan intactos. ¿Continuar?`))return;
  setBusy(true);setNotice("");
  try{
   await send("studio-save-many",{notes:replacements});
   const map=new Map(replacements.map(n=>[n.position,n]));
   const next=notes.map(n=>map.get(n.position)||n);
   setNotes(next);onNotesChange?.(next);setDraft(next.find(n=>n.position===selected)||null);
   setBulk("");setBulkMode(false);setNotice(lines.length+" papelitos personalizados y guardados.");
  }catch{setNotice("No se pudo importar. No se modificó tu colección.");}
  finally{setBusy(false);}
 };
 const exportTxt=()=>{
   const text=notes.map(n=>n.message).join("\n");
   const file=new Blob([text],{type:"text/plain;charset=utf-8"});
   const url=URL.createObjectURL(file);const a=document.createElement("a");a.href=url;a.download="mis-365-papelitos.txt";a.click();
   window.setTimeout(()=>URL.revokeObjectURL(url),1500);
 };
 if(loading)return <section className="jar365-editor"><p className="jar365-editor-loading">Preparando tus 365 papelitos…</p></section>;
 return <section className="jar365-editor">
  <div className="jar365-editor-head"><div><span className="jar365-editor-eyebrow">TALLER PERSONAL · FRASCO 365</span><h2>Escribí lo que <em>de verdad sentís.</em></h2>
   <p>Los 365 papelitos ya tienen frases reales y sencillas para empezar. Podés cambiar <strong>cualquiera de ellas</strong>, sus colores/categorías, y guardar las tuyas. No cambia ni el frasco ni sus efectos.</p></div>
   <div className="jar365-editor-total">365<span>MENSAJES</span></div></div>
  <div className="jar365-editor-tools">
   <input aria-label="Buscar entre los papelitos" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Buscá una palabra o un número…"/>
   <select aria-label="Filtrar por categoría" value={filter} onChange={e=>{setFilter(e.target.value);setPage(0);}}>
    <option value="todos">Todos los colores</option>{JAR365_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
   </select>
   <button type="button" onClick={()=>setBulkMode(!bulkMode)}>{bulkMode?"Cerrar importación":"Pegar muchas frases"}</button>
   <button type="button" onClick={exportTxt}>Descargar mis textos ↓</button>
  </div>
  {bulkMode&&<div className="jar365-editor-bulk"><h3>¿Ya tenés tus propias frases?</h3><p>Pegalas una debajo de otra, en orden. Reemplazarán desde el papelito 1; los que no incluyas quedan como estaban.</p>
    <textarea rows={8} placeholder={"Me gusta cuando te reís de mis chistes malos.\nGracias por acompañarme en mis días difíciles.\nTe debo una merienda preparada por mí."}
      value={bulk} onChange={e=>setBulk(e.target.value)} maxLength={215000}/>
    <button type="button" disabled={busy||!bulk.trim()} onClick={()=>void importMany()}>Guardar lista de papelitos</button>
   </div>}
  <div className="jar365-editor-grid">
   <div className="jar365-editor-list">
    {currentPage.map(n=><button type="button" key={n.position} onClick={()=>choose(n.position)}
      className={n.position===selected?"selected":""}>
     <i style={{background:JAR365_CATEGORIES.find(c=>c.key===n.category)?.color}}/>
     <span><b>#{String(n.position).padStart(3,"0")}</b><small>{n.message}</small></span>
     <span>›</span>
    </button>)}
    {!currentPage.length&&<p>No encontramos frases con ese filtro.</p>}
    <div className="jar365-editor-pager"><button type="button" disabled={page===0} onClick={()=>setPage(x=>x-1)}>←</button><span>{page+1} / {totalPages}</span>
      <button type="button" disabled={page>=totalPages-1} onClick={()=>setPage(x=>x+1)}>→</button></div>
   </div>
   {draft&&<div className="jar365-editor-sheet" style={{"--edit-color":JAR365_CATEGORIES.find(c=>c.key===draft.category)?.color||"#f5d1d6"} as React.CSSProperties}>
    <span className="jar365-editor-sheet-number">PAPELITO #{String(draft.position).padStart(3,"0")}</span>
    <label>¿Qué querés decirle en este papelito?
      <textarea rows={6} maxLength={600} value={draft.message}
        onChange={e=>setDraft({...draft,message:e.target.value})}/>
    </label>
    <label>Color y tipo de mensaje
      <select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value as Jar365Category})}>
       {JAR365_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
      </select>
    </label>
    <span className="jar365-editor-remaining">{draft.message.length} / 600 caracteres</span>
    <button type="button" disabled={busy||!modified} onClick={()=>void save()}>{busy?"Guardando…":modified?"Guardar este papelito":"Guardado ✓"}</button>
    <div className="jar365-editor-sheet-navigation"><button type="button" disabled={selected===1} onClick={()=>choose(selected-1)}>← Anterior</button>
      <button type="button" disabled={selected===365} onClick={()=>choose(selected+1)}>Siguiente →</button></div>
    <small>Consejo: una frase concreta que solo ustedes entienden vale más que veinte frases grandilocuentes.</small>
   </div>}
  </div>
  {notice&&<p className="jar365-editor-notice" role="status">{notice}</p>}
  <button type="button" className="jar365-editor-reload" onClick={()=>setVersion(v=>v+1)}>Volver a cargar los textos guardados</button>
 </section>;
}
