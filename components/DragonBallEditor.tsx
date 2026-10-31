"use client";
import {useMemo,useState} from "react";
import type {StudioGift,StudioMedia,StudioAccess} from "@/components/StudioEnhancements";
type Part={title:string;message:string};
type Sticker={head:string;quote:string;tag:string};
type DragonCopy={
 heroBlurb:string;originSpeech:string;powerMessage:string;wish:string;audioNarration:string;posterLine:string;
 date:string;stickers:Sticker[];memories:Part[];rivals:Part[];orbs:Part[];photoMediaIds:string[];voiceMediaId:string;
};
const characterNames=["Goku","Vegeta","Piccolo","Bulma","Gohan","Krilin","Trunks","Shenron","Las 7 esferas"];
const stickerDefaults:Sticker[]=[
 {head:"El primer encuentro",quote:"Todo empezó sin saber que ese momento se convertiría en el primer capítulo de mi historia favorita.",tag:"EPISODIO 01"},
 {head:"Tu carácter",quote:"Tenés ese carácter inconfundible. Y sí: hasta cuando ponés cara de Vegeta, te elegiría otra vez.",tag:"SAIYAJIN ÉLITE"},
 {head:"Tu forma de cuidar",quote:"Hay un lado tuyo que protege sin hacer ruido. Lo veo, lo admiro y me hace sentir en casa.",tag:"GUARDIÁN"},
 {head:"Nuestra complicidad",quote:"Como Bulma y sus ideas imposibles: con vos, hasta las ocurrencias más locas terminan siendo recuerdos inolvidables.",tag:"CÓMPLICES"},
 {head:"Lo que llevás adentro",quote:"Me encanta descubrir tus distintas versiones: tu ternura, tu fuerza y ese lado que solo algunos conocemos.",tag:"PODER OCULTO"},
 {head:"Las risas",quote:"Me encantan nuestras pavadas y que podamos reírnos sin necesitar un plan perfecto.",tag:"HUMOR NIVEL Z"},
 {head:"Nuestro futuro",quote:"Si pudiera viajar al futuro, solo querría comprobar cuántas aventuras nos faltan vivir juntos.",tag:"VIAJERO DEL TIEMPO"},
 {head:"Mi único deseo",quote:"No pediría mil cosas. Pediría más tiempo con vos, más días nuestros, y muchas páginas para seguir llenando.",tag:"DESEO LEGENDARIO"},
 {head:"Nuestra historia",quote:"Son siete las cosas que quisiera conservar siempre: confianza, complicidad, admiración, risas, cuidado, hogar y futuro.",tag:"COLECCIÓN RARA"},
];
const defaults:DragonCopy={
 heroBlurb:"Una aventura con tus personajes favoritos… y un protagonista que significa mucho más para mí.",
 originSpeech:"No sé exactamente en qué momento pasó… pero de golpe, eras vos.",
 powerMessage:"Desde que estás en mi vida, la felicidad se disparó. No porque tengamos superpoderes, sino porque hacemos un equipo hermoso.",
 wish:"Pediría seguir compartiendo esta aventura con vos. Que nunca nos falten las risas, los abrazos, las pequeñas locuras y las ganas de seguir.",
 audioNarration:"De todas las aventuras que podría vivir, elijo la nuestra. Me gusta tu fuerza, tu humor y esa manera tan tuya de hacerme sentir acompañada. Te elijo hoy y en cada nueva saga que nos espere. Te quiero muchísimo.",
 posterLine:"LA MEJOR AVENTURA ES LA QUE VIVIMOS JUNTOS",
 date:"un día inesperado",
 stickers:stickerDefaults,
 memories:[{title:"EL PRIMER ENCUENTRO",message:"Cuando te conocí, no sabía que ibas a cambiar mi historia."},{title:"ESA PRIMERA RISA",message:"Ahí entendí que con vos todo podía ser mucho más divertido."},{title:"NUESTRA PRIMERA AVENTURA",message:"Y después llegaron los momentos que hoy guardo como tesoros."}],
 rivals:[{title:"La distancia",message:"Incluso lejos, supimos elegirnos."},{title:"Los malos días",message:"Nos acompañamos incluso sin tener todas las respuestas."},{title:"Los miedos",message:"Aprendimos a confiar en lo que construimos."}],
 orbs:[{title:"CONFIANZA",message:"Porque con vos puedo ser yo."},{title:"COMPLICIDAD",message:"Porque hay miradas que no necesitan explicación."},{title:"ADMIRACIÓN",message:"Porque siempre encuentro una razón más para admirarte."},{title:"RISAS",message:"Porque nuestra locura es mi lugar favorito."},{title:"CUIDADO",message:"Porque el amor también está en lo cotidiano."},{title:"HOGAR",message:"Porque hay personas que se sienten como volver a casa."},{title:"FUTURO",message:"Porque todavía nos quedan muchos capítulos por vivir."}],
 photoMediaIds:["","",""],voiceMediaId:""
};
const fields:[keyof Pick<DragonCopy,"heroBlurb"|"originSpeech"|"powerMessage"|"wish"|"audioNarration"|"posterLine"|"date">,string][]=[
 ["date","Cómo empezó todo"],["heroBlurb","Texto de portada"],["originSpeech","Frase del primer encuentro"],["powerMessage","Mensaje de la transformación"],["wish","Deseo de Shenron"],["audioNarration","Texto que acompaña al audio"],["posterLine","Frase del póster final"]
];
const merge=(v:unknown):DragonCopy=>{
 const d=v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
 const item=(name:keyof DragonCopy,max:number,base:string)=>typeof d[name]==="string"?(d[name] as string).slice(0,max):base;
 const array=(name:"stickers"|"orbs"|"rivals"|"memories",base:(Part|Sticker)[])=>{
  const current=Array.isArray(d[name])?d[name] as Record<string,unknown>[]:[];
  return base.map((row,i)=>({...row,...Object.fromEntries(Object.keys(row).map(k=>[k,typeof current[i]?.[k]==="string"?String(current[i][k]).slice(0,k==="quote"?1200:500):(row as unknown as Record<string,string>)[k]]))}));
 };
 return {
  ...defaults,
  date:item("date",80,defaults.date),
  heroBlurb:item("heroBlurb",1600,defaults.heroBlurb),
  originSpeech:item("originSpeech",1600,defaults.originSpeech),
  powerMessage:item("powerMessage",1600,defaults.powerMessage),
  wish:item("wish",1600,defaults.wish),
  audioNarration:item("audioNarration",1600,defaults.audioNarration),
  posterLine:item("posterLine",160,defaults.posterLine),
  stickers:array("stickers",stickerDefaults) as Sticker[],
  orbs:array("orbs",defaults.orbs) as Part[],
  rivals:array("rivals",defaults.rivals) as Part[],
  memories:array("memories",defaults.memories) as Part[],
  photoMediaIds:Array.isArray(d.photoMediaIds)?d.photoMediaIds.slice(0,3).map(String):["","",""],
  voiceMediaId:typeof d.voiceMediaId==="string"?d.voiceMediaId:""
 };
};
type Props={access:StudioAccess;gift:StudioGift;media:StudioMedia[];onError:(v:string)=>void;onNotice:(v:string)=>void};
export default function DragonBallEditor({access,gift,media,onError,onNotice}:Props){
 const [draft,setDraft]=useState<DragonCopy>(()=>merge(gift.story_data?.dragonBall));
 const [busy,setBusy]=useState(false);
 const images=useMemo(()=>media.filter(item=>item.kind==="image"),[media]);
 const audios=useMemo(()=>media.filter(item=>item.kind==="audio"),[media]);
 const change=(key:keyof DragonCopy,v:string)=>setDraft(p=>({...p,[key]:v}));
 const changeRow=(key:"stickers"|"memories"|"rivals"|"orbs",index:number,field:string,value:string)=>setDraft(p=>{
   const arr=[...p[key]] as Record<string,string>[];
   arr[index]={...arr[index],[field]:value};
   return {...p,[key]:arr};
 });
 const save=async()=>{
  if(busy)return;setBusy(true);onError("");
  try{
   const response=await fetch((process.env.NEXT_PUBLIC_SUPABASE_URL||"")+"/functions/v1/creator-api",{
     method:"POST",cache:"no-store",headers:{"content-type":"application/json",apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||""},
     body:JSON.stringify({action:"saveDragonBall",code:access.code,editorToken:access.editorToken,dragonBall:draft})
   });
   const result=await response.json().catch(()=>({}));
   if(!response.ok||result.error)throw Error(String(result.error||"save_failed"));
   onNotice("¡Saga guardada! Los textos, stickers, fotos y audio ya están vinculados a este regalo.");
  }catch{onError("No se pudo guardar la saga. Probá nuevamente. Los cambios locales siguen en pantalla.");}
  finally{setBusy(false)}
 };
 const labelStyle={display:"block",fontWeight:800,fontSize:13,marginBottom:7} as const;
 const inputStyle={width:"100%",border:"1px solid #d6c8b5",borderRadius:10,padding:"11px 12px",background:"#fff",color:"#231a18",font:"inherit"} as const;
 return <section style={{padding:"24px",margin:"24px 0",borderRadius:22,background:"#fff4db",color:"#2a2135",border:"1px solid #d7b578"}}>
  <div style={{fontSize:12,fontWeight:900,letterSpacing:2,color:"#9b5c17"}}>EDICIÓN ESPECIAL · DRAGON BALL</div>
  <h2 style={{fontSize:28,margin:"8px 0"}}>Personalizá Nuestra Saga</h2>
  <p>Conservamos a Goku, Vegeta, Shenron, las nueve escenas, las animaciones y el álbum. Vos editás cada mensaje, seleccionás tus fotos y elegís tu audio. Los nombres se cambian en el formulario principal del editor.</p>
  <div style={{display:"grid",gap:16,marginTop:20}}>
   {fields.map(([key,label])=><label key={key} style={labelStyle}>{label}
     {key==="date"||key==="posterLine"?<input style={{...inputStyle,marginTop:6}} maxLength={key==="date"?80:160} value={draft[key]} onChange={e=>change(key,e.target.value)}/>:<textarea style={{...inputStyle,marginTop:6,minHeight:90,resize:"vertical"}} maxLength={1600} value={draft[key]} onChange={e=>change(key,e.target.value)}/>}
   </label>)}
  </div>
  <h3 style={{margin:"28px 0 12px"}}>Los 9 stickers coleccionables</h3>
  <p style={{fontSize:13}}>Cambiá el título, el sello y el mensaje de cada sticker, sin modificar el personaje ilustrado.</p>
  <div style={{display:"grid",gap:12}}>
   {draft.stickers.map((item,i)=><details key={i} style={{borderRadius:12,padding:13,background:"#fff",border:"1px solid #d8c9b7"}}>
    <summary style={{fontWeight:900,cursor:"pointer"}}>#{i+1} · {characterNames[i]} · {item.head}</summary>
    <div style={{display:"grid",gap:12,marginTop:14}}>
     <label style={labelStyle}>Título<input style={inputStyle} maxLength={90} value={item.head} onChange={e=>changeRow("stickers",i,"head",e.target.value)}/></label>
     <label style={labelStyle}>Sello<input style={inputStyle} maxLength={90} value={item.tag} onChange={e=>changeRow("stickers",i,"tag",e.target.value)}/></label>
     <label style={labelStyle}>Mensaje<textarea style={{...inputStyle,minHeight:90}} maxLength={1200} value={item.quote} onChange={e=>changeRow("stickers",i,"quote",e.target.value)}/></label>
    </div>
   </details>)}
  </div>
  {([["memories","Los 3 recuerdos del origen"],["rivals","Los 3 rivales"],["orbs","Las 7 esferas"]] as const).map(([key,heading])=><div key={key}>
    <h3 style={{margin:"28px 0 12px"}}>{heading}</h3>
    <div style={{display:"grid",gap:12}}>{draft[key].map((item,i)=><details key={i} style={{borderRadius:12,padding:13,background:"#fff",border:"1px solid #d8c9b7"}}>
     <summary style={{fontWeight:900,cursor:"pointer"}}>{i+1}. {item.title}</summary>
     <label style={{...labelStyle,marginTop:12}}>Título<input style={inputStyle} maxLength={80} value={item.title} onChange={e=>changeRow(key,i,"title",e.target.value)}/></label>
     <label style={labelStyle}>Mensaje<textarea style={{...inputStyle,minHeight:80}} maxLength={500} value={item.message} onChange={e=>changeRow(key,i,"message",e.target.value)}/></label>
    </details>)}</div>
  </div>)}
  <h3 style={{margin:"28px 0 12px"}}>Fotografías y mensaje de voz</h3>
  <p style={{fontSize:13}}>Primero subí tus archivos en «Fotos, voces y momentos» más abajo. Luego seleccioná las tres fotos que aparecerán en los polaroids de la escena del origen y el audio para la cápsula de Bulma.</p>
  <div style={{display:"grid",gap:12}}>
   {[0,1,2].map(i=><label key={i} style={labelStyle}>Foto del recuerdo {i+1}
     <select style={inputStyle} value={draft.photoMediaIds[i]||""} onChange={e=>setDraft(p=>({...p,photoMediaIds:p.photoMediaIds.map((v,index)=>index===i?e.target.value:v)}))}>
       <option value="">Sin foto · mostrar ilustración</option>
       {images.map((item,index)=><option key={item.id} value={item.id}>Foto {index+1} · {item.caption||item.originalName||item.id.slice(0,7)}</option>)}
     </select>
   </label>)}
   <label style={labelStyle}>Audio de la cápsula
    <select style={inputStyle} value={draft.voiceMediaId} onChange={e=>change("voiceMediaId",e.target.value)}>
      <option value="">Sin audio · narración de muestra</option>
      {audios.map((item,index)=><option key={item.id} value={item.id}>Audio {index+1} · {item.caption||item.originalName||item.id.slice(0,7)}</option>)}
    </select>
   </label>
  </div>
  <div style={{marginTop:20,display:"flex",gap:12,flexWrap:"wrap"}}>
    <button type="button" disabled={busy} onClick={save} style={{background:"#ef9125",border:"none",color:"#241831",padding:"14px 22px",borderRadius:13,fontWeight:900,cursor:"pointer"}}>{busy?"Guardando…":"Guardar toda la saga"}</button>
  </div>
  <p style={{fontSize:12,marginTop:12}}>Para ver el resultado final, publicá el regalo desde este editor y entrá desde su enlace privado. Los cambios no alteran la demo ni los regalos de otros compradores.</p>
 </section>;
}
