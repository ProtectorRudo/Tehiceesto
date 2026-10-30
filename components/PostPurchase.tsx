"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import "./postpurchase.css";

type OrderState={stage:string;order?:{status:string;checkoutUrl:string|null};experienceSlug?:string};
type Offer={mainPaid:boolean;mainStatus:string;title:string;status:string;canOffer:boolean;checkoutUrl?:string|null;letterReady:boolean;oneClick:boolean};
const backend=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
export default function PostPurchase({code}:{code:string}){
 const [order,setOrder]=useState<OrderState|null>(null);
 const [offer,setOffer]=useState<Offer|null>(null);
 const [loading,setLoading]=useState(true);
 const [actionBusy,setActionBusy]=useState(false);
 const [error,setError]=useState("");
 const [hidden,setHidden]=useState(false);
 const [attempts,setAttempts]=useState(0);
 const check=useCallback(async()=>{
  if(!backend||!key)return;
  try{
   const response=await fetch(backend+"/functions/v1/order-status?code="+encodeURIComponent(code),{
     headers:{"apikey":key},cache:"no-store"});
   if(!response.ok)throw Error("status");
   const data=await response.json() as OrderState;
   setOrder(data);
   if(data.order?.status==="approved"){
     const r=await fetch(backend+"/functions/v1/upsell-api",{
       method:"POST",cache:"no-store",headers:{"apikey":key,"content-type":"application/json"},
       body:JSON.stringify({action:"status",code})
     });
     if(r.ok)setOffer(await r.json() as Offer);
   }
   setError("");
  }catch{setError("No pudimos actualizar el pago en este momento. Tu compra no se pierde.");}
  finally{setLoading(false);}
 },[code]);
 useEffect(()=>{void check()},[check]);
 useEffect(()=>{
  if(order?.order?.status==="approved"||attempts>=12)return;
  const timer=window.setTimeout(()=>{setAttempts(a=>a+1);void check();},8000);
  return()=>window.clearTimeout(timer);
 },[order?.order?.status,attempts,check]);
 const act=async(action:"accept"|"decline")=>{
  if(actionBusy||!backend||!key)return;
  setActionBusy(true);setError("");
  try{
   const response=await fetch(backend+"/functions/v1/upsell-api",{
    method:"POST",cache:"no-store",headers:{"apikey":key,"content-type":"application/json"},
    body:JSON.stringify({action,code})
   });
   const data=await response.json();
   if(!response.ok||data.error)throw Error(data.error||"request_failed");
   if(action==="accept"){
     if(!data.checkoutReady||!/^https:\/\//.test(String(data.checkoutUrl||"")))throw Error("payment_unavailable");
     window.location.assign(data.checkoutUrl);
     return;
   }
   setHidden(true);await check();
  }catch{
   setError("No pudimos preparar el pago adicional. No se realizó ningún cargo. Podés continuar con tu regalo.");
  }finally{setActionBusy(false);}
 };
 const purchased=order?.order?.status==="approved";
 const completed=offer?.status==="approved";
 const shouldOffer=purchased&&offer?.canOffer&&offer?.status!=="declined"&&!hidden&&!completed;
 return <main className="postpurchase-shell">
  <header><Link href="/" className="postpurchase-brand">TE HICE ESTO <b>♥</b></Link><span>UN REGALO PARA RECORDAR</span></header>
  <div className="postpurchase-inner">
   {loading?<section className="postpurchase-panel"><span className="postpurchase-kicker">COMPROBANDO TU COMPRA</span><h1>Un momento <em>especial.</em></h1><p>Estamos consultando la confirmación de Mercado Pago…</p></section>:
   purchased?<section className="postpurchase-panel">
     <span className="postpurchase-check" aria-hidden="true">✓</span>
     <span className="postpurchase-kicker">PAGO CONFIRMADO</span>
     <h1>¡Ya es <em>tuya!</em></h1>
     <p>Tu compra está confirmada. Nuestro equipo va a preparar tu experiencia con los nombres, mensajes, fotos y recuerdos que quieras incluir, sin cambiar el diseño ni los efectos del modelo que elegiste.</p>
     {shouldOffer&&<div className="postpurchase-offer" aria-label="Oferta opcional después de la compra">
       <span className="postpurchase-offer-kicker">ANTES DE TERMINAR · UNA SORPRESA MÁS</span>
       <div className="postpurchase-offer-head">
        <div><h2>¿Sumamos una <em>carta secreta?</em></h2><p>Una carta extra con tus propias palabras, que nuestro equipo incorporará a la experiencia que elegiste.</p></div>
        <strong>+$10.000 <small>ARS</small></strong>
       </div>
       <button type="button" className="postpurchase-yes" disabled={actionBusy} onClick={()=>void act("accept")}>
        {actionBusy?"Preparando tu oferta…":"Sí, agregar mi carta extra"} <span aria-hidden="true">↗</span>
       </button>
       <button type="button" className="postpurchase-no" disabled={actionBusy} onClick={()=>void act("decline")}>No, gracias. Continuar con mi regalo</button>
       <small className="postpurchase-disclosure">Es una compra opcional y separada. Mercado Pago te pedirá confirmar el importe antes de cobrarlo.</small>
     </div>}
     {offer?.status==="pending"&&offer.checkoutUrl&&<div className="postpurchase-offer">
       <h2>Tu carta extra está pendiente de pago.</h2>
       <p>No te cobramos nada adicional todavía. Podés continuar el pago seguro en Mercado Pago.</p>
       <a className="postpurchase-yes postpurchase-link" href={offer.checkoutUrl}>Continuar el pago de $10.000</a>
     </div>}
     {completed&&<div className="postpurchase-thanks"><strong>♡ Tu carta extra también está confirmada.</strong><p>Nuestro equipo coordinará con vos el texto de esa carta y la incorporará antes de publicar la experiencia.</p></div>}
     <a className="postpurchase-my" href={"https://wa.me/5492215653163?text="+encodeURIComponent("¡Hola! Ya pagué mi regalo en Te Hice Esto. Mi número de pedido es "+code+". Quiero coordinar su personalización con el equipo.")} target="_blank" rel="noopener noreferrer">Coordinar mi regalo por WhatsApp <span aria-hidden="true">↗</span></a>
     <p className="postpurchase-assistance">Te confirmamos la compra en el correo que usaste. También podés escribirnos por WhatsApp para empezar a preparar tu regalo.</p>
   </section>:
   <section className="postpurchase-panel">
     <span className="postpurchase-kicker">TU COMPRA ESTÁ EN PROCESO</span>
     <h1>Ya casi <em>está.</em></h1>
     <p>Estamos verificando el pago. No vuelvas a comprar si ya completaste la operación: en cuanto Mercado Pago lo confirme, vas a poder continuar.</p>
     {order?.order?.checkoutUrl&&<a className="postpurchase-my" href={order.order.checkoutUrl}>Volver a Mercado Pago ↗</a>}
     <button className="postpurchase-retry" type="button" onClick={()=>{setAttempts(0);void check()}}>Actualizar estado del pago</button>
   </section>}
   {error&&<p className="postpurchase-error" role="alert">{error}</p>}
  </div>
  <footer>HECHO CON AMOR, ESPECIALMENTE PARA VOS ♡</footer>
 </main>;
}
