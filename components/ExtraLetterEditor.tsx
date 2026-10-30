"use client";
import {useEffect,useState} from "react";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
const fallback="Todavía hay algo más que quiero decirte. Gracias por formar parte de mi vida.";

export default function ExtraLetterEditor({code,editorToken}:{code:string;editorToken:string}){
 const [active,setActive]=useState(false);
 const [text,setText]=useState(fallback);
 const [saved,setSaved]=useState(fallback);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 async function call(action:string,fields:Record<string,unknown>={}){
  const response=await fetch(url+"/functions/v1/upsell-api",{
   method:"POST",cache:"no-store",headers:{"apikey":key,"content-type":"application/json"},
   body:JSON.stringify({action,code,editorToken,...fields})
  });
  const result=await response.json();
  if(!response.ok||result.error)throw Error("request_failed");
  return result;
 }
 useEffect(()=>{
  let alive=true;
  void call("status").then(data=>{
   if(!alive||!data.letterReady)return;
   setActive(true);
   return call("editor-read").then(result=>{
    if(!alive)return;
    if(typeof result.text==="string"){setText(result.text);setSaved(result.text);}
   });
  }).catch(()=>{});
  return()=>{alive=false;};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[code,editorToken]);
 const save=async()=>{
  if(busy||!text.trim()||text===saved)return;
  setBusy(true);setMessage("");
  try{await call("save-letter",{text:text.trim()});setSaved(text.trim());setMessage("Tu carta extra quedó guardada.");}
  catch{setMessage("No pudimos guardar la carta. Probá otra vez.");}
  finally{setBusy(false);}
 };
 if(!active)return null;
 return <section style={{background:"linear-gradient(140deg,#fffaf7,#f9ebf1)",border:"1px solid #e9ccd7",borderRadius:22,padding:"clamp(19px,4vw,30px)",margin:"24px 0"}}>
  <span style={{color:"#a45d7d",letterSpacing:".15em",fontWeight:800,fontSize:10}}>TU COMPLEMENTO · COMPRA CONFIRMADA</span>
  <h2 style={{font:"normal clamp(30px,5vw,43px) Georgia,serif",color:"#563746",margin:"13px 0"}}>Una carta <i style={{color:"#b63870"}}>solo para esa persona.</i></h2>
  <p style={{fontSize:13,lineHeight:1.7,color:"#987c8b"}}>Escribí tu carta adicional. Quedará disponible en un enlace propio cuando publiques el regalo, sin cambiar la experiencia que elegiste.</p>
  <label style={{display:"grid",gap:8,color:"#775164",fontWeight:700,fontSize:12}}>Tu carta sorpresa
    <textarea maxLength={4000} rows={8} value={text} onChange={e=>setText(e.target.value)}
      style={{font:"normal 17px/1.6 Georgia,serif",padding:14,borderRadius:14,border:"1px solid #ddbfcd",background:"white",resize:"vertical",color:"#563846"}}/>
  </label>
  <button type="button" onClick={()=>void save()} disabled={!text.trim()||text===saved||busy}
    style={{marginTop:15,padding:"13px 21px",borderRadius:40,border:0,color:"#fff",background:"#a8396c",fontWeight:800,opacity:busy||text===saved?.5:1,cursor:"pointer"}}>
    {busy?"Guardando…":text===saved?"Carta guardada ✓":"Guardar mi carta"}
  </button>
  <p role="status" style={{fontSize:12,color:"#8f4b69"}}>{message}</p>
  <a href={"/sorpresa/"+code} target="_blank" rel="noopener noreferrer" style={{color:"#9d3e6c",fontWeight:800,fontSize:12}}>Ver enlace de mi carta (disponible cuando publiques) ↗</a>
 </section>;
}
