"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";

type Word={id:string;label:string;category:string;difficulty:string};
type Category={name:string;symbol:string;tone:string};
type Bank={words:Word[];categories:Record<string,Category>};
type Access="checking"|"login"|"purchase"|"error"|"ready";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
export default function TrazoCompleto(){
 const [state,setState]=useState<Access>("checking");
 const [bank,setBank]=useState<Bank|null>(null);
 const [retry,setRetry]=useState(0);
 const auth=useMemo(()=>url&&key?createClient(url,key,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}):null,[]);
 useEffect(()=>{
  let active=true;
  (async()=>{
   setState("checking");
   if(!auth){if(active)setState("error");return;}
   try{
    const {data,error}=await auth.auth.getSession();
    if(error||!data.session){if(active)setState("login");return;}
    const response=await fetch(url+"/functions/v1/trazo-complice-words",{
     method:"POST",cache:"no-store",
     headers:{"authorization":"Bearer "+data.session.access_token,"apikey":key,"content-type":"application/json"},
     body:"{}",signal:AbortSignal.timeout(18000),
    });
    if(!active)return;
    if(response.status===401){setState("login");return;}
    if(response.status===403){setState("purchase");return;}
    if(!response.ok){setState("error");return;}
    const payload=await response.json() as Bank;
    if(!Array.isArray(payload.words)||payload.words.length<1000||!payload.categories){setState("error");return;}
    setBank(payload);setState("ready");
   }catch{if(active)setState("error");}
  })();
  return ()=>{active=false};
 },[auth,retry]);
 const html=useMemo(()=>{
  if(!bank)return "";
  const safe=JSON.stringify(bank).replace(/</g,"\\u003c").replace(/>/g,"\\u003e");
  return [
    '<!doctype html><html lang="es-AR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/><meta name="theme-color" content="#211522"/>',
    '<link rel="stylesheet" href="/juegos/trazo-complice/styles.css"/>',
    '<script>const data=',safe,';window.TRAZO_WORD_BANK=data.words;window.TRAZO_CATEGORIES=data.categories;window.TRAZO_IS_DEMO=false;</script>',
    '<script defer src="/juegos/trazo-complice/game.js"></script></head><body>',
    '<div id="trazo-app" class="trazo-root"><div class="trazo-orb trazo-orb--a" aria-hidden="true"></div><div class="trazo-orb trazo-orb--b" aria-hidden="true"></div><div class="trazo-noise" aria-hidden="true"></div>',
    '<header class="trazo-topbar"><div class="trazo-brand"><span class="trazo-brandmark" aria-hidden="true">✳</span><span>TE HICE ESTO <i> / </i> JUEGOS</span></div><span class="trazo-status"><i aria-hidden="true"></i> JUEGO COMPLETO</span></header>',
    '<div class="trazo-main" id="game-root" aria-live="polite"></div><footer class="trazo-footer"><span>1.274 PALABRAS · UN SOLO CELULAR</span><span>HECHO CON ♥</span></footer><div class="trazo-toast" id="trazo-toast" role="status" aria-live="polite"></div></div></body></html>',
  ].join("");
 },[bank]);
 if(state==="ready")return <iframe title="Trazo Cómplice — juego completo" srcDoc={html} style={{display:"block",height:"100dvh",width:"100%",border:0,background:"#211522"}} />;
 const message=state==="checking"?{title:"Preparando tus cartas…",description:"Estamos comprobando tu compra de manera segura."}:state==="login"?{title:"Primero, tu acceso privado",description:"Entrá a Mis regalos con el mismo email que usaste al comprar. Después vas a poder jugar las 1.274 palabras."}:state==="purchase"?{title:"El juego completo te está esperando",description:"No encontramos una compra aprobada de Trazo Cómplice para el correo que inició sesión."}:{title:"No pudimos cargar las cartas",description:"No conseguimos verificar tu compra en este momento. Reintentá sin volver a pagar."};
 return <main style={{minHeight:"100dvh",display:"grid",placeItems:"center",background:"radial-gradient(circle at 50% 0,#60324e,#1d1123 75%)",color:"#fff1e8",padding:24,fontFamily:"system-ui,sans-serif"}}>
   <section style={{width:"min(100%,460px)",textAlign:"center",padding:28,border:"1px solid #fff6e02e",borderRadius:26,background:"#fffbf510"}}>
    <div aria-hidden="true" style={{fontSize:48}}>✳</div><h1 style={{fontFamily:"Georgia,serif",fontSize:34,margin:"14px 0"}}>{message.title}</h1><p style={{lineHeight:1.65,color:"#e8d2d7"}}>{message.description}</p>
    <div style={{display:"grid",gap:12,marginTop:26}}>
      {(state==="login"||state==="purchase")&&<Link href="/mis-regalos" style={{display:"block",padding:15,borderRadius:99,background:"#e34c7d",color:"white",textDecoration:"none",fontWeight:750}}>Ir a Mis regalos</Link>}
      {state==="purchase"&&<Link href="/comprar/trazo-complice" style={{color:"#ffdac9",padding:12}}>Comprar juego completo</Link>}
      {state==="error"&&<button type="button" onClick={()=>setRetry(n=>n+1)} style={{border:0,borderRadius:99,padding:15,color:"white",background:"#e34c7d",fontWeight:700}}>Reintentar</button>}
      <Link href="/juegos/trazo-complice" style={{color:"#f0c8b6",padding:12}}>Volver a la demo</Link>
    </div>
   </section>
 </main>;
}
