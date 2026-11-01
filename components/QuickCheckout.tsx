"use client";

import {useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import type {Experience} from "@/data/experiences";
import "./quick-checkout.css";

const projectUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
type CheckoutResult={code?:string;priceMinor?:number;currency?:string;checkoutUrl?:string|null;checkoutReady?:boolean;error?:string};
type Props={experience:Pick<Experience,"slug"|"title"|"short"|"eyebrow">};
const experienceAddOnChoices=[
 {slug:"pareja",name:"Nuestra historia · Pareja"},
 {slug:"cumpleanos",name:"Tu día · Cumpleaños"},
 {slug:"mama",name:"Para mamá"},
 {slug:"papa",name:"Para papá"},
 {slug:"amistad",name:"Expediente de amistad"},

 {slug:"sticker-bomb-amistad",name:"Sticker Bomb Amistad"},
 {slug:"frasco365",name:"Un año de cosas lindas"},
 {slug:"dragon-ball-pareja",name:"Dragon Ball · Nuestra Saga"},
 {slug:"siete-dias",name:"Un poquito de mí, cada día"},
] as const;

/** Keeps international numbers intact; accepts the simple 10-digit Argentine local format too. */
function cleanPhone(raw:string){
  let value=raw.trim().replace(/[\s().-]/g,"");
  if(value.startsWith("00"))value="+"+value.slice(2);
  if(value.startsWith("+"))value=value.slice(1);
  if(value.startsWith("0")&&value.length===11)value=value.slice(1);
  // National Argentine mobile: enter just the ten-digit area code + number.
  if(/^\d{10}$/.test(value))return "549"+value;
  // Some people paste 54 + ten-digit mobile without the 9.
  if(/^54\d{10}$/.test(value))return "549"+value.slice(2);
  // 54 9 + area code + number already works.
  return value;
}
function photo(slug:string){if(slug==="pack-juegos")return "/demo-previews/trazo-complice.svg";return "/demo-previews/"+slug+(slug==="frasco365"||slug==="siete-dias"||slug==="sticker-bomb-amistad"||slug==="trazo-complice"||slug==="dragon-ball-pareja"?".svg":".jpg");}

export default function QuickCheckout({experience}:Props){
  const isPack=experience.slug==="pack-juegos";
  const isGame=isPack||experience.slug==="trazo-complice";
  const canOfferPack=["pareja","cumpleanos","hijos","mama","papa","amistad",
    "sticker-bomb-amistad","frasco365","siete-dias","dragon-ball-pareja"].includes(experience.slug);
  const [addGamesPack,setAddGamesPack]=useState(false);
  const [addExperience,setAddExperience]=useState(false);
  const [experienceChoice,setExperienceChoice]=useState("pareja");
  // Temporarily reduced checkout prices for end-to-end purchase and affiliate attribution tests.
  const basePriceMinor=100000;
  const addonPriceMinor=100000;
  const totalMinor=basePriceMinor+((canOfferPack&&addGamesPack)||(isGame&&addExperience)?addonPriceMinor:0);
  const totalFormatted=new Intl.NumberFormat("es-AR").format(totalMinor/100);
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [busy,setBusy]=useState(false);
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>setHydrated(true),[]);
  const [message,setMessage]=useState("");
  const [order,setOrder]=useState<CheckoutResult|null>(null);
  const [website,setWebsite]=useState("");
  const requestRef=useRef<{id:string;key:string}|null>(null);
  const validPhone=/^\d{8,15}$/.test(cleanPhone(phone));
  const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid=validEmail&&validPhone;
  const showEmailHint=email.trim().length>0&&!validEmail;
  const showPhoneHint=phone.trim().length>0&&!validPhone;

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy||website||!valid)return;
    setBusy(true);setMessage("");setOrder(null);
    try{
      if(!projectUrl||!publicKey)throw Error("unavailable");
      const normalizedEmail=email.trim().toLowerCase();
      const normalizedPhone=cleanPhone(phone);
      const key=experience.slug+":"+normalizedEmail+":"+normalizedPhone+":"+
        (canOfferPack&&addGamesPack?"with-pack":isGame&&addExperience?"gift-"+experienceChoice:"base");
      if(requestRef.current?.key!==key)requestRef.current={id:crypto.randomUUID(),key};
      const response=await fetch("/api/checkout",{
        method:"POST",cache:"no-store",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          experienceSlug:experience.slug,
          email:normalizedEmail,whatsapp:normalizedPhone,
          consent:true,clientRequestId:requestRef.current.id,website,
          addGamesPack:canOfferPack&&addGamesPack,
          addonExperienceSlug:isGame&&addExperience?experienceChoice:"",
        }),
      });
      const result=await response.json() as CheckoutResult;
      if(!response.ok||result.error)throw Error(result.error||"request_failed");
      if(Number(result.priceMinor)!==totalMinor||result.currency!=="ARS"){
        throw Error("price_mismatch");
      }
      setOrder(result);
      if(result.checkoutReady&&typeof result.checkoutUrl==="string"&&result.checkoutUrl.startsWith("https://")){
        window.location.assign(result.checkoutUrl);
        return;
      }
      setMessage("Tu pedido está preparado, pero el enlace de Mercado Pago no está disponible ahora. Podés reintentar sin crear otro pedido o escribirnos con tu número de pedido.");
    }catch(err){
      const code=err instanceof Error?err.message:"";
      if(code==="experience_coming_soon")setMessage("Esta experiencia todavía no está disponible para comprar.");
      else if(code==="too_many_orders")setMessage("Alcanzaste el límite de intentos. Probá más tarde o escribinos.");
      else if(code==="price_mismatch")setMessage("Por seguridad no iniciamos el cobro: el servidor devolvió un importe distinto al elegido. Intentá nuevamente o escribinos.");
      else if(code==="request_selection_conflict")setMessage("Cambiaste la selección de tu pedido. Actualizá los datos y volvé a continuar.");
      else if(code==="addon_unavailable"||code==="addon_not_available")setMessage(isGame?"La experiencia adicional no está disponible por el momento. Podés quitarla y continuar con los juegos.":"El pack de 4 juegos no está disponible por el momento. Podés quitarlo y continuar con tu regalo.");
      else if(code==="request_already_completed")setMessage(isPack?"Esa compra ya se completó. Entrá a «Mis juegos» con tu correo para abrir los cuatro juegos.":isGame?"Esa compra ya se completó. Entrá a «Mis regalos» con tu correo y elegí «Jugar versión completa».":"Esa compra ya se completó. Entrá a «Mis regalos» con tu correo para editar tu experiencia.");
      else setMessage("No pudimos abrir Mercado Pago. Revisá tu conexión y volvé a intentar; no se realizó ningún cobro.");
    }finally{setBusy(false);}
  }

  return <main className="quick-checkout">
    <div className="quick-checkout-container">
      <header className="quick-checkout-header">
        <Link className="quick-checkout-back" href={isPack?"/juegos/pack":isGame?"/juegos/trazo-complice":"/crear"}>← {isPack?"Volver al pack":isGame?"Volver al juego":"Volver a experiencias"}</Link>
        <Link className="quick-checkout-brand" href="/">TE HICE ESTO <span>♥</span></Link>
      </header>
      <div className="quick-checkout-layout">
        <section className="quick-checkout-summary" aria-label="Tu experiencia elegida">
          <span className="quick-checkout-kicker">{isPack?"4 JUEGOS · UNA SOLA COMPRA":isGame?"UN JUEGO SIN LÍMITES":"TU REGALO ESTÁ A UN PASO"}</span>
          <div className="quick-checkout-product">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={photo(experience.slug)} loading="eager"/>
            <div><span>{experience.eyebrow}</span><h1>{experience.title}</h1><p>{isPack?"Trazo Cómplice + Entre Dos + Cómplices + Meme Match":isGame?"1.274 palabras · 11 categorías · Acceso completo":"Personalizable después de comprar"}</p></div>
          </div>
          <div className="quick-checkout-price"><strong>${totalFormatted} <small>ARS</small></strong><span>Pago único · Sin suscripción</span></div>
          <p className="quick-checkout-help">{isPack?"El pack incluye Trazo Cómplice (1.274 palabras), Entre Dos (90 preguntas), Cómplices (7 desafíos) y Meme Match (48 parejas de memes). Una sola compra de $1.000 ARS (precio de prueba). Después de pagar vas a recibir un email para entrar a tus cuatro juegos. Las salas de escape no están incluidas.":isGame?"Desbloqueá Trazo Cómplice para jugar todas las rondas con 1.274 palabras. Después de pagar, recibirás un email para entrar a «Mis regalos» y abrir tu juego completo. No necesitás instalar nada.":"Elegí tu experiencia y pagá de forma segura. Cuando se confirme el pago, vas a recibir un email con acceso a «Mis regalos», donde podés personalizar nombres, mensajes, fotos y audios. El diseño, las escenas y los efectos ya están preparados."}</p>
        </section>
        <form className="quick-checkout-form" onSubmit={submit}>
          <span className="quick-checkout-form-kicker">COMPRA RÁPIDA · 2 DATOS</span>
          <h2>Ya casi <em>es tuyo.</em></h2>
          <p>{isPack?"¿A qué correo enviamos el acceso a tus cuatro juegos?":isGame?"¿A qué correo enviamos tu acceso al juego completo?":"¿A qué correo enviamos el acceso para editar tu regalo?"}</p>
          <label htmlFor="checkout-email">Tu email
            <input id="checkout-email" required type="email" autoComplete="email" inputMode="email"
              placeholder="tu@email.com" maxLength={180} value={email} onChange={event=>setEmail(event.target.value)}
              disabled={busy} aria-invalid={showEmailHint} aria-describedby={showEmailHint?"checkout-email-hint":undefined}/>
            {showEmailHint&&<span id="checkout-email-hint" className="quick-checkout-field-hint" role="status">Completá tu correo con @ y dominio. Ej.: nombre@gmail.com</span>}
          </label>
          <label htmlFor="checkout-phone">Tu WhatsApp
            <input id="checkout-phone" required type="tel" autoComplete="tel" inputMode="tel"
              placeholder="221 555 1234" value={phone} onChange={event=>setPhone(event.target.value)}
              maxLength={40} disabled={busy} aria-invalid={showPhoneHint} aria-describedby={showPhoneHint?"checkout-phone-hint":undefined}/>
            {showPhoneHint&&<span id="checkout-phone-hint" className="quick-checkout-field-hint" role="status">Revisá el número. Incluí característica y teléfono, sin 0 ni 15.</span>}
          </label>
          <p className="quick-checkout-phonehint">Argentina: escribí tu número con característica, sin 0 ni 15. Si estás en otro país, incluí el código internacional (+).</p>
          {canOfferPack&&<section className="quick-checkout-addon" aria-label="Complemento opcional">
            <div className="quick-checkout-addon-symbol" aria-hidden="true">✦</div>
            <div className="quick-checkout-addon-copy">
              <span>COMPLEMENTO · PRECIO DE PRUEBA</span>
              <strong>Pack de 4 juegos <span className="quick-checkout-discount">PRUEBA</span></strong>
              <div className="quick-checkout-addon-price"><b>$1.000 ARS</b><span>Precio de prueba</span></div>
              <p>Trazo Cómplice, Entre Dos, Cómplices y Meme Match completos (48 parejas). Salas de escape no incluidas.</p>
              <button className="quick-checkout-addon-choice" type="button"
                aria-pressed={addGamesPack} disabled={busy||!hydrated}
                onClick={()=>setAddGamesPack(value=>!value)}>
                {addGamesPack?"✓ Pack agregado · Quitar":"＋ Agregar pack por $1.000"}
              </button>
            </div>
          </section>}
          {isGame&&<section className="quick-checkout-addon quick-checkout-addon--experience" aria-label="Oportunidad de agregar una experiencia">
            <div className="quick-checkout-addon-symbol" aria-hidden="true">♡</div>
            <div className="quick-checkout-addon-copy">
              <span>COMPLEMENTO · PRECIO DE PRUEBA</span>
              <strong>Agregá una experiencia personalizada <span className="quick-checkout-discount">PRUEBA</span></strong>
              <div className="quick-checkout-addon-price"><b>$1.000 ARS</b><span>Precio de prueba</span></div>
              <p>Elegí la experiencia que querés regalar. Después de pagar, personalizás los nombres, recuerdos, fotos y audios desde «Mis regalos».</p>
              <label className="quick-checkout-addon-select-label" htmlFor="checkout-experience-choice">Elegí tu experiencia
                <select id="checkout-experience-choice" value={experienceChoice} disabled={busy||!hydrated}
                  onChange={event=>setExperienceChoice(event.target.value)}>
                  {experienceAddOnChoices.map(choice=><option key={choice.slug} value={choice.slug}>{choice.name}</option>)}
                </select>
              </label>
              <button className="quick-checkout-addon-choice" type="button"
                aria-pressed={addExperience} disabled={busy||!hydrated}
                onClick={()=>setAddExperience(value=>!value)}>
                {addExperience?"✓ Experiencia agregada · Quitar":"＋ Agregar experiencia por $1.000"}
              </button>
            </div>
          </section>}
          {(canOfferPack||isGame)&&<div className="quick-checkout-total" aria-live="polite">
             <span>Total a pagar</span><strong>$ {totalFormatted} ARS</strong>
          </div>}
          <div className="quick-checkout-honey" aria-hidden="true"><label>Sitio web<input tabIndex={-1} autoComplete="off" value={website} onChange={event=>setWebsite(event.target.value)}/></label></div>
          {!busy&&!valid&&(email.trim()||phone.trim())&&<p className="quick-checkout-form-guidance" role="status">Para continuar, completá correctamente {showEmailHint||!email.trim()?"tu email": "tu WhatsApp"}.</p>}
          <button className="quick-checkout-submit" type="submit" disabled={busy||!valid||Boolean(website)}>
            {busy?"Preparando tu pago…":"Continuar a Mercado Pago"} <span aria-hidden="true">↗</span>
          </button>
          <p className="quick-checkout-legal">Al continuar aceptás que usemos tu email y WhatsApp para gestionar el pedido y contactarte sobre tu {isPack?"pack de juegos":isGame?"juego":"regalo"}. No se realiza ningún cobro hasta que lo confirmes en Mercado Pago.</p>
          {message&&<div className="quick-checkout-status" role="status">
            <p>{message}</p>
            {order?.code&&<small>N.º de pedido: {order.code}</small>}
            {order?.code&&!order.checkoutReady&&<a href={"https://wa.me/5492215653163?text="+encodeURIComponent("Hola, necesito ayuda para pagar mi pedido "+order.code+" de Te Hice Esto.")} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp ↗</a>}
          </div>}
          <div className="quick-checkout-trust"><span>✳ Compra protegida</span><span>{isGame?"♢ Dos personas · un celular":"♡ Hecho para una sola persona"}</span></div>
        </form>
      </div>
    </div>
  </main>;
}
