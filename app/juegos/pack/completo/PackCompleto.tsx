"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
type Phase="checking"|"login"|"purchase"|"error"|"ready"|"loading";
type GameKey="meme-match"|"complices"|"entre-dos";
type Game={id:GameKey|"trazo-complice";emoji:string;title:string;detail:string};
const games:Game[]=[
 {id:"trazo-complice",emoji:"🎨",title:"Trazo Cómplice",detail:"1.274 palabras"},
 {id:"entre-dos",emoji:"💌",title:"Entre Dos",detail:"90 preguntas"},
 {id:"complices",emoji:"🔐",title:"Cómplices",detail:"7 desafíos"},
 {id:"meme-match",emoji:"🧠",title:"Meme Match",detail:"48 parejas · hasta 96 cartas"}
];
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
export default function PackCompleto(){
 const [phase,setPhase]=useState<Phase>("checking"),[active,setActive]=useState<GameKey|null>(null),[html,setHtml]=useState(""),[retry,setRetry]=useState(0);
 const client=useMemo(()=>url&&key?createClient(url,key,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}):null,[]);
 async function fetchPack(game:string){if(!client)throw Error("missing_environment");const {data,error}=await client.auth.getSession();if(error||!data.session){setPhase("login");return null;}
 const response=await fetch(url+"/functions/v1/pack-juegos-content",{method:"POST",cache:"no-store",headers:{"authorization":"Bearer "+data.session.access_token,"apikey":key,"content-type":"application/json"},body:JSON.stringify({game}),signal:AbortSignal.timeout(22000)});
 if(response.status===401){setPhase("login");return null}if(response.status===403){setPhase("purchase");return null}if(!response.ok)throw Error("verification_failed");return await response.json();}
 useEffect(()=>{let live=true;(async()=>{setPhase("checking");try{const result=await fetchPack("access");if(!live||!result)return;if(result.entitled!==true||!Array.isArray(result.games)||!result.games.includes("meme-match")){setPhase("error");return}setPhase("ready")}catch{if(live)setPhase("error")}})();return()=>{live=false}},[client,retry]);
 async function openGame(game:GameKey){setActive(game);setHtml("");setPhase("loading");try{const value=await fetchPack(game);if(!value)return;if(value.game!==game||typeof value.html!=="string"||value.html.length<5000)throw Error("invalid_pack_payload");setHtml(value.html);setPhase("ready")}catch{setActive(null);setPhase("error")}}
 const bg={background:"radial-gradient(circle at 50% 0%,#47315b,#130e22 77%)",color:"#fff3fb",fontFamily:"system-ui,sans-serif"} as const;
 if(phase==="ready"&&active&&html)return <main style={{height:"100dvh",background:"#111"}}>
   <nav style={{position:"fixed",top:9,left:10,zIndex:100,display:"flex",gap:9}}>
     <button onClick={()=>{setActive(null);setHtml("");}} style={{border:"1px solid #ffffff55",background:"#170e25ea",color:"#fff",borderRadius:12,padding:"10px 14px",cursor:"pointer",fontWeight:900}}>← Mis juegos</button>
   </nav><iframe title={"Juego completo "+active} srcDoc={html} style={{width:"100%",height:"100%",border:0,display:"block"}} allow="autoplay"/>
 </main>;
 if(phase==="ready")return <main style={{...bg,minHeight:"100dvh",padding:"30px 17px 70px"}}>
  <div style={{maxWidth:760,margin:"auto"}}><nav style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:48}}><Link href="/mis-regalos" style={{color:"#e1b7d1"}}>← Mis regalos</Link><span>ACCESO VERIFICADO ✓</span></nav>
  <h1 style={{fontSize:"clamp(38px,8vw,64px)",letterSpacing:"-.045em",lineHeight:1}}>Tus cuatro <span style={{color:"#ffca77"}}>juegos completos.</span></h1><p style={{color:"#d3c6dc",lineHeight:1.7}}>Elegí tu próximo desafío. La versión completa de Meme Match incluye las 48 parejas diferentes y tableros de hasta 96 cartas.</p>
  <div style={{display:"grid",gap:13,marginTop:25}}>{games.map(g=><button type="button" key={g.id} onClick={()=>{if(g.id==="trazo-complice"){window.location.assign("/juegos/trazo-complice/completo")}else void openGame(g.id)}} style={{textAlign:"left",display:"flex",alignItems:"center",gap:18,padding:20,border:"1px solid #ffffff35",borderRadius:18,background:"#ffffff12",color:"white",cursor:"pointer"}}><span style={{fontSize:38}}>{g.emoji}</span><span style={{flex:1}}><strong style={{display:"block",fontSize:20}}>{g.title}</strong><small style={{color:"#d6bddc"}}>{g.detail}</small></span><b>→</b></button>)}</div>
 </div></main>;
 const title=phase==="checking"?"Verificando tu pack…":phase==="loading"?"Preparando el juego…":phase==="login"?"Iniciá sesión para jugar":phase==="purchase"?"Este pack necesita una compra aprobada":"No pudimos comprobar tu acceso";
 const msg=phase==="login"?"Usá el mismo correo de tu compra en Mis regalos.":phase==="purchase"?"Si ya pagaste, verificá que entraste con el mismo correo.":phase==="error"?"Probá nuevamente. No es necesario volver a pagar.":"Comprobamos tu acceso privado de forma segura.";
 return <main style={{...bg,minHeight:"100dvh",display:"grid",placeItems:"center",padding:24}}><section style={{maxWidth:460,textAlign:"center",borderRadius:24,background:"#ffffff0e",padding:28,border:"1px solid #ffffff33"}}><div style={{fontSize:45}}>🎮</div><h1>{title}</h1><p style={{lineHeight:1.7,color:"#d7c9de"}}>{msg}</p><div style={{display:"grid",gap:12,marginTop:24}}>{phase==="error"&&<button onClick={()=>{setActive(null);setRetry(n=>n+1)}} style={{padding:14,borderRadius:12,cursor:"pointer"}}>Volver a intentar</button>}{(phase==="login"||phase==="purchase")&&<Link href="/mis-regalos" style={{color:"#1c1127",background:"#ffe38b",borderRadius:12,padding:14,textDecoration:"none",fontWeight:900}}>Ir a Mis regalos</Link>}{phase==="purchase"&&<Link href="/comprar/pack-juegos" style={{color:"#ffe5a6"}}>Ver el pack</Link>}</div></section></main>
}
