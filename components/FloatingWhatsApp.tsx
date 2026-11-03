"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {hideSalesWhatsappOnRoute,salesContextForRoute,buyerAlreadyOwnsSalesContext,type BoughtProduct} from "@/lib/marketing/sales-whatsapp-visibility";
import { getExperience } from "@/data/experiences";

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const context=salesContextForRoute(pathname);
  const [verified,setVerified]=useState<{pathname:string;hide:boolean}|null>(null);

  useEffect(()=>{
    if(!context)return;
    let active=true;
    const check=async()=>{
      const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
      const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
      // No session: this is a public demo and the sales CTA is relevant.
      if(!url||!key){if(active)setVerified({pathname,hide:false});return;}
      let authenticated=false;
      try{
        const client=createClient(url,key,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}});
        const {data,error}=await client.auth.getSession();
        if(error)throw error;
        const session=data.session;
        if(!session){if(active)setVerified({pathname,hide:false});return;}
        authenticated=true;
        const response=await fetch(url+"/functions/v1/gift-account",{
          method:"POST",cache:"no-store",signal:AbortSignal.timeout(12000),
          headers:{apikey:key,authorization:"Bearer "+session.access_token,"content-type":"application/json"},
          body:JSON.stringify({action:"list"}),
        });
        if(!response.ok)throw Error("owned_products_unavailable");
        const result=await response.json();
        const gifts: BoughtProduct[]=Array.isArray(result.gifts)?
          result.gifts.filter((gift:unknown):gift is BoughtProduct=>
            !!gift&&typeof gift==="object"&&typeof (gift as BoughtProduct).experienceSlug==="string"
          ):[];
        if(active)setVerified({pathname,hide:buyerAlreadyOwnsSalesContext(gifts,context)});
      }catch{
        // In an authenticated account, an intermittent entitlement lookup
        // must not reintroduce a misleading 'buy again' overlay.
        if(active)setVerified({pathname,hide:authenticated});
      }
    };
    void check();
    return()=>{active=false;};
  },[pathname]);

  // All purchased experiences and protected games are private by URL. Their
  // sales CTA is hidden even if the visitor's session is being refreshed.
  if(hideSalesWhatsappOnRoute(pathname))return null;
  // For public demos, check ownership before rendering: no flashes of a
  // purchase CTA over a product the logged-in customer already owns.
  if(context&&(!verified||verified.pathname!==pathname||verified.hide))return null;

  const compact = pathname.startsWith("/experiencias/");
  const creatorCompact = pathname.startsWith("/crear");
  const experienceSlug = compact ? pathname.split("/")[2] || "" : "";
  const experience = experienceSlug ? getExperience(experienceSlug) : undefined;

  const message = experience
    ? `Hola! Vi el demo “${experience.title}” de Te Hice Esto y quiero crear uno para regalar. ¿Me contás cómo seguimos?`
    : pathname.startsWith("/crear")
      ? "Hola! Estoy armando un borrador en Te Hice Esto y quiero crear una experiencia para regalar. ¿Me contás cómo seguimos?"
      : "Hola! Vi Te Hice Esto y quiero crear una experiencia para regalar. ¿Me contás cómo funciona?";

  const whatsappHref =
    "https://wa.me/5492215653163?text=" + encodeURIComponent(message);

  return (
    <a
      className={`floating-whatsapp ${compact ? "floating-whatsapp--experience" : ""} ${creatorCompact ? "floating-whatsapp--creator" : ""}`}
      href={whatsappHref}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Quiero crear el mío por WhatsApp"
    >
      <span className="floating-whatsapp-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <path d="M16.05 3.2c-6.94 0-12.58 5.52-12.58 12.31 0 2.16.58 4.27 1.68 6.11L3 29l7.58-2.05a12.8 12.8 0 0 0 5.46 1.22h.01c6.94 0 12.58-5.52 12.58-12.31C28.63 9.06 22.99 3.2 16.05 3.2Zm0 22.9h-.01a10.7 10.7 0 0 1-5.16-1.32l-.37-.2-4.5 1.22 1.2-4.29-.24-.39a10.13 10.13 0 0 1-1.58-5.61c0-5.65 4.77-10.25 10.66-10.25 5.88 0 10.66 4.6 10.66 10.25 0 5.99-4.78 10.59-10.66 10.59Zm5.85-7.67c-.32-.16-1.89-.91-2.18-1.02-.29-.1-.5-.16-.72.16-.21.31-.82 1.02-1 1.23-.19.21-.37.24-.69.08-.32-.15-1.35-.48-2.57-1.55-.95-.83-1.59-1.85-1.78-2.16-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.56.16-.18.21-.31.32-.52.1-.21.05-.39-.03-.55-.08-.16-.72-1.67-.98-2.29-.26-.61-.53-.53-.72-.54h-.61c-.21 0-.56.08-.85.39-.29.31-1.11 1.06-1.11 2.59 0 1.53 1.14 3 1.3 3.21.16.21 2.25 3.35 5.45 4.7.76.32 1.35.51 1.81.66.76.24 1.46.2 2.01.12.61-.09 1.89-.76 2.16-1.49.27-.74.27-1.37.19-1.5-.08-.13-.29-.21-.61-.36Z" />
        </svg>
      </span>
      <span className="floating-whatsapp-copy">
        <small>¿Querés hacer uno?</small>
        <strong>{compact || creatorCompact ? "Quiero el mío" : "Quiero crear el mío"}</strong>
      </span>
      <span className="floating-whatsapp-arrow" aria-hidden="true">↗</span>
    </a>
  );
}
