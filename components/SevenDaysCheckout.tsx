"use client";

import { useState, type FormEvent } from "react";

const projectUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
type CheckoutResult={code?:string;priceMinor?:number;currency?:string;checkoutUrl?:string|null;checkoutReady?:boolean;error?:string};
export default function SevenDaysCheckout(){
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [phone,setPhone]=useState("");
 const [consent,setConsent]=useState(false);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState("");
 const [order,setOrder]=useState<CheckoutResult|null>(null);
 const [requestId,setRequestId]=useState("");
 const [website,setWebsite]=useState("");
 async function submit(event:FormEvent){
   event.preventDefault();
   if(loading||website)return;
   setLoading(true);setMessage("");
   try{
     if(!projectUrl||!publicKey)throw new Error("unavailable");
     const id=requestId||crypto.randomUUID();
     setRequestId(id);
     const res=await fetch(projectUrl.replace(/\/$/,"")+"/functions/v1/order-create",{
       method:"POST",cache:"no-store",headers:{"apikey":publicKey,"content-type":"application/json"},
       body:JSON.stringify({experienceSlug:"siete-dias",customerName:name.trim(),email:email.trim(),
         whatsapp:phone.replace(/[^0-9+]/g,""),consent,clientRequestId:id,website}),
     });
     const data=await res.json() as CheckoutResult;
     if(!res.ok||data.error)throw new Error(data.error||"request_failed");
     setOrder(data);
     if(data.checkoutReady&&data.checkoutUrl&&data.checkoutUrl.startsWith("https://")){
       window.location.assign(data.checkoutUrl);
       return;
     }
     setMessage("Tu pedido quedó registrado. Aún no está habilitado el enlace de pago automático. Contactanos con el número de pedido.");
   }catch(e){
     const error=e instanceof Error?e.message:"";
     setMessage(error==="too_many_orders"?"Alcanzaste el límite de intentos. Probá un poco más tarde.":"No pudimos iniciar la compra. Revisá los datos o escribinos por WhatsApp.");
   }finally{setLoading(false);}
 }
 return <main style={{minHeight:"100svh",background:"radial-gradient(circle at 80% 8%,#ffe0e9,transparent 45%),#fff8f4",padding:"clamp(22px,5vw,64px) 18px",fontFamily:"Arial,Helvetica,sans-serif",color:"#49313d"}}>
  <div style={{maxWidth:740,margin:"0 auto"}}>
   <a href="/experiencias/siete-dias" style={{color:"#a83d6c",fontWeight:700,textDecoration:"none"}}>← Volver a probar la experiencia</a>
   <div style={{textAlign:"center",margin:"40px auto 30px",maxWidth:580}}>
    <span style={{letterSpacing:".2em",fontSize:11,fontWeight:800,color:"#a85d7c"}}>TE HICE ESTO ♥ · SIETE DÍAS DE AMOR</span>
    <h1 style={{font:"normal clamp(45px,7vw,70px)/1 Georgia,serif",margin:"18px 0"}}>Un poquito de mí,<br/><i style={{color:"#b93468"}}>cada día.</i></h1>
    <p style={{fontSize:17,lineHeight:1.65,color:"#967b88"}}>Siete capítulos únicos, un regalo diferente cada día. Personalizá nombres, mensajes, fotos y audios desde tu espacio privado.</p>
    <strong style={{display:"block",fontSize:26,marginTop:20}}>$25.000 ARS</strong>
    <small style={{color:"#927c88"}}>Pago único · acceso para personalizar y compartir los siete días</small>
   </div>
   <form onSubmit={submit} style={{maxWidth:560,margin:"auto",padding:"clamp(24px,5vw,38px)",border:"1px solid #efd4de",background:"#fffefd",borderRadius:28,boxShadow:"0 18px 60px #a4537020",display:"grid",gap:18}}>
    <h2 style={{font:"normal 29px Georgia,serif",margin:0}}>Prepará tu sorpresa</h2>
    <p style={{margin:0,lineHeight:1.6,color:"#947789"}}>Dejanos tus datos para activar la compra. Después, desde «Mis regalos», vas a poder personalizar cada frase antes de compartir.</p>
    <label style={{display:"grid",gap:7,fontSize:13,fontWeight:700}}>Tu nombre
      <input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Martín" style={{border:"1px solid #e8d2db",borderRadius:12,padding:13,fontSize:16}} />
    </label>
    <label style={{display:"grid",gap:7,fontSize:13,fontWeight:700}}>Correo electrónico
      <input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" style={{border:"1px solid #e8d2db",borderRadius:12,padding:13,fontSize:16}} />
    </label>
    <label style={{display:"grid",gap:7,fontSize:13,fontWeight:700}}>WhatsApp (con código de país)
      <input required type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="549221..." style={{border:"1px solid #e8d2db",borderRadius:12,padding:13,fontSize:16}} />
    </label>
    <label style={{display:"none"}}>Sitio web<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)} /></label>
    <label style={{display:"flex",gap:9,lineHeight:1.45,fontSize:13,color:"#765e6b",alignItems:"flex-start"}}>
      <input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)} /> Acepto que Te Hice Esto utilice estos datos para gestionar mi pedido y enviarme comunicaciones relacionadas con este regalo.
    </label>
    <button type="submit" disabled={loading} style={{background:"#b93468",color:"white",border:0,borderRadius:50,padding:17,fontWeight:800,fontSize:16,cursor:"pointer"}}>
      {loading?"Preparando tu compra…":"Comprar mis siete días ♡"}
    </button>
    {message&&<p role="status" style={{margin:0,color:"#a8396a",lineHeight:1.55}}>{message} {order?.code&&<strong>Pedido {order.code}</strong>}</p>}
    {order?.code&&!order.checkoutReady&&<a href={"https://wa.me/5492215653163?text="+encodeURIComponent("Hola! Quiero completar el pago del pedido Te Hice Esto "+order.code)} target="_blank" rel="noopener noreferrer" style={{color:"#a8396a",fontWeight:700}}>Hablar por WhatsApp para completar el pago ↗</a>}
    <p style={{textAlign:"center",fontSize:12,color:"#aa94a0",lineHeight:1.5,margin:0}}>No se publica ningún regalo ni se habilita la edición comercial antes de la acreditación del pago.</p>
   </form>
  </div>
 </main>;
}
