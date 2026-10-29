"use client";
import {useState} from "react";

type DayLink={day:number;url:string};
const titles=["Asalto de besos","Ridículamente besable","El caso del corazón robado",
  "Abrazo de emergencia","El privilegio de tus besos","Hay algo que confesarte","Todo lo que sos para mí"];
export default function SevenDaysSharePanel({code,editorToken}:{code:string;editorToken:string}){
 const [links,setLinks]=useState<DayLink[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [published,setPublished]=useState(false);
 const load=async()=>{
   setLoading(true);setError("");
   try{
     const res=await fetch("/api/seven-days-links",{method:"POST",cache:"no-store",
       headers:{"content-type":"application/json"},body:JSON.stringify({code,editorToken})});
     if(!res.ok)throw new Error("failed");
     const data=await res.json();
     setLinks(data.links||[]);setPublished(Boolean(data.published));
   }catch{setError("No pudimos generar los enlaces privados. Probá de nuevo.");}
   finally{setLoading(false);}
 };
 return <section style={{border:"1px solid #e9d3dc",background:"#fffaf8",borderRadius:24,padding:24,margin:"24px 0",color:"#49313d"}}>
  <span style={{fontWeight:800,letterSpacing:".13em",fontSize:11,color:"#a83c6e"}}>SIETE DÍAS · SIETE ENLACES PRIVADOS</span>
  <h3 style={{fontFamily:"Georgia,serif",fontSize:30,margin:"10px 0"}}>Una sorpresa por día.</h3>
  <p style={{lineHeight:1.7,color:"#907080"}}>Cada capítulo tiene un enlace diferente e imposible de adivinar. Compartí únicamente el de ese día, sin revelar las sorpresas siguientes.</p>
  <button type="button" onClick={()=>void load()} disabled={loading} style={{border:0,borderRadius:50,padding:"13px 18px",background:"#b93468",color:"#fff",fontWeight:800,cursor:"pointer"}}>
   {loading?"Generando…":links.length?"Actualizar enlaces":"Preparar enlaces para WhatsApp"}
  </button>
  {error&&<p role="alert">{error}</p>}
  {links.length>0&&<div style={{display:"grid",gap:10,marginTop:18}}>
   {!published&&<p style={{color:"#aa416e",fontWeight:700}}>El regalo aún no está publicado: estos enlaces se activarán al publicarlo.</p>}
   {links.map(l=><div key={l.day} style={{display:"flex",gap:10,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",background:"white",border:"1px solid #f0dce3",borderRadius:15,padding:"10px 13px"}}>
    <div><strong>{String(l.day).padStart(2,"0")} · {titles[l.day-1]}</strong><small style={{display:"block",color:"#9b7b8d"}}>Enlace privado de esta sorpresa</small></div>
    <div style={{display:"flex",gap:8}}>
     <button type="button" onClick={()=>void navigator.clipboard.writeText(l.url)} style={{border:"1px solid #edd0db",background:"#fff7fa",borderRadius:18,padding:"9px 12px",cursor:"pointer"}}>Copiar</button>
     <a href={"https://api.whatsapp.com/send?text="+encodeURIComponent("Te hice algo para vos ♥ Abrí tu sorpresa del día "+l.day+":\n"+l.url)} target="_blank" rel="noopener noreferrer" style={{background:"#b93468",color:"white",borderRadius:18,padding:"9px 12px",textDecoration:"none"}}>WhatsApp</a>
    </div>
   </div>)}
  </div>}
 </section>;
}
