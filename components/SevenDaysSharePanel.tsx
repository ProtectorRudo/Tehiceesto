"use client";

import {useState} from "react";

type DayLink={day:number;url:string};
const titles=["Asalto de besos","Ridículamente besable","El caso del corazón robado",
  "Abrazo de emergencia","El privilegio de tus besos","Hay algo que confesarte",
  "Todo lo que sos para mí"];

const textError=(status:number,code:unknown)=>{
 if(status===403||code==="unauthorized")return "Tu acceso de edición venció. Volvé a «Mis regalos», abrí esta experiencia y probá otra vez.";
 if(status===503||code==="unavailable")return "El servicio de enlaces privados no está disponible en este momento. Tu regalo y sus textos siguen guardados; probá de nuevo más tarde.";
 return "No pudimos preparar los siete enlaces. Comprobá tu conexión e intentá otra vez.";
};

function validLinks(value:unknown,code:string):value is DayLink[]{
 if(!Array.isArray(value)||value.length!==7)return false;
 return value.every((item,index)=>{
  if(!item||typeof item!=="object"||item.day!==index+1||typeof item.url!=="string")return false;
  try{
   const link=new URL(item.url);
   return link.origin==="https://tehiceesto.com" &&
     link.pathname.startsWith("/r/"+code+"/dia/"+item.day+"/") &&
     /^[a-f0-9]{64}$/.test(link.pathname.split("/").at(-1)||"") &&
     !link.search && !link.hash;
  }catch{return false;}
 });
}

export default function SevenDaysSharePanel({code,editorToken}:{code:string;editorToken:string}){
 const [links,setLinks]=useState<DayLink[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [published,setPublished]=useState(false);
 const [copiedDay,setCopiedDay]=useState<number|null>(null);

 const load=async()=>{
  if(loading)return;
  setLoading(true);setError("");setCopiedDay(null);
  try{
   const response=await fetch("/api/seven-days-links",{
    method:"POST",cache:"no-store",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({code,editorToken})
   });
   const result=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(textError(response.status,result?.error));
   if(!validLinks(result?.links,code))throw new Error("La respuesta de enlaces está incompleta. Intentá nuevamente.");
   setLinks(result.links);
   setPublished(result.published===true);
  }catch(reason){
   setError(reason instanceof Error?reason.message:"No pudimos preparar los enlaces. Probá de nuevo.");
  }finally{setLoading(false);}
 };

 const copy=async(link:DayLink)=>{
  setCopiedDay(null);setError("");
  try{
   await navigator.clipboard.writeText(link.url);
   setCopiedDay(link.day);
  }catch{
   setError("No se pudo copiar automáticamente. Mantené presionado el enlace del día para seleccionarlo.");
  }
 };

 return <section aria-label="Tus siete enlaces privados" style={{border:"1px solid #e9d3dc",background:"#fffaf8",borderRadius:24,padding:"clamp(20px,4vw,30px)",margin:"24px 0",color:"#49313d"}}>
  <span style={{fontWeight:800,letterSpacing:".13em",fontSize:11,color:"#a83c6e"}}>UN POQUITO DE MÍ, CADA DÍA · SIETE ENLACES</span>
  <h3 style={{fontFamily:"Georgia,serif",fontSize:"clamp(28px,5vw,38px)",margin:"12px 0"}}>Una sorpresa por día.</h3>
  <p style={{lineHeight:1.65,color:"#806878"}}>Después de publicar tu regalo, prepará los siete enlaces. Cada día tiene una dirección privada y distinta: compartí solamente la sorpresa de ese día.</p>
  <button type="button" onClick={()=>void load()} disabled={loading} aria-busy={loading} style={{border:0,borderRadius:50,padding:"14px 19px",background:"#b93468",color:"#fff",fontWeight:800,cursor:loading?"wait":"pointer",maxWidth:"100%"}}>
   {loading?"Preparando enlaces…":links.length?"Verificar enlaces":"Preparar mis siete enlaces"}
  </button>
  {error&&<p role="alert" style={{marginTop:15,color:"#873353",lineHeight:1.5}}>{error}</p>}
  {links.length===7&&<div style={{display:"grid",gap:12,marginTop:20}}>
   {!published&&<p role="status" style={{color:"#a53b68",fontWeight:700,lineHeight:1.5}}>Estos enlaces están preparados, pero todavía no están activos. Primero tocá «Publicar mi regalo» y después «Verificar enlaces» para habilitar el envío.</p>}
   {published&&<p role="status" style={{color:"#66445a",fontWeight:700}}>Tu regalo está publicado. Elegí qué día querés enviar.</p>}
   {links.map(link=><div key={link.day} style={{display:"grid",gap:10,background:"#fff",border:"1px solid #eed5de",borderRadius:18,padding:"14px 15px",minWidth:0}}>
    <div><strong style={{fontSize:16}}>{String(link.day).padStart(2,"0")} · {titles[link.day-1]}</strong><small style={{display:"block",marginTop:4,color:"#8f7281"}}>Sorpresa privada del día {link.day}</small></div>
    {published&&<>
     <input readOnly aria-label={"Enlace privado del día "+link.day} value={link.url} onFocus={event=>event.currentTarget.select()} style={{boxSizing:"border-box",width:"100%",minWidth:0,border:"1px solid #ead8de",borderRadius:10,padding:"10px 12px",background:"#fffaf8",color:"#6c5360",fontSize:12}}/>
     <div style={{display:"flex",flexWrap:"wrap",gap:9}}>
      <button type="button" onClick={()=>void copy(link)} style={{border:"1px solid #dfbdce",background:"#fff7fa",borderRadius:22,padding:"10px 16px",color:"#6c3450",cursor:"pointer"}}>{copiedDay===link.day?"✓ Copiado":"Copiar enlace"}</button>
      <a href={"https://api.whatsapp.com/send?text="+encodeURIComponent("Te hice algo para vos ♥ Abrí tu sorpresa del día "+link.day+":\n"+link.url)} target="_blank" rel="noopener noreferrer" style={{background:"#b93468",color:"white",borderRadius:22,padding:"10px 16px",textDecoration:"none",fontWeight:700}}>Enviar por WhatsApp</a>
     </div>
    </>}
   </div>)}
  </div>}
 </section>;
}
