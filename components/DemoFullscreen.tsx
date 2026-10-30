"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./demo-fullscreen.css";

/**
 * Same demo route as the small previews, rendered at the actual screen width
 * instead of scaled to a 170px phone. Kept in a portal to escape carousel
 * overflow/transform and the creator wizard stacking context.
 */
export default function DemoFullscreen({slug,title,onClose}:{
  slug:string;
  title:string;
  onClose:()=>void;
}){
  const closeButton=useRef<HTMLButtonElement>(null);
  const onCloseRef=useRef(onClose);
  onCloseRef.current=onClose;
  useEffect(()=>{
    const previousOverflow=document.body.style.overflow;
    const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    document.body.style.overflow="hidden";
    closeButton.current?.focus({preventScroll:true});
    const onEscape=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){
        event.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown",onEscape);
    return ()=>{
      document.body.style.overflow=previousOverflow;
      window.removeEventListener("keydown",onEscape);
      previousFocus?.focus({preventScroll:true});
    };
  },[]);

  return createPortal(
    <div className="demo-fullscreen" role="dialog" aria-modal="true" aria-label={"Demo de "+title+" en pantalla completa"}>
      <div className="demo-fullscreen-toolbar">
        <div className="demo-fullscreen-identity">
          <span className="demo-fullscreen-overline">TE HICE ESTO <b aria-hidden="true">♥</b> · DEMO EN VIVO</span>
          <span className="demo-fullscreen-title">{title}</span>
        </div>
        <button ref={closeButton} className="demo-fullscreen-exit" type="button" onClick={onClose} aria-label="Cerrar pantalla completa y volver a las experiencias">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          <span>Volver</span>
        </button>
      </div>
      <div className="demo-fullscreen-stage">
        <iframe
          key={slug}
          title={"Experiencia completa: "+title}
          src={"/experiencias/"+encodeURIComponent(slug)+"?embed=1"}
          className="demo-fullscreen-iframe"
          allow="autoplay; microphone; fullscreen"
          allowFullScreen
          loading="eager"
        />
      </div>
    </div>,
    document.body
  );
}
