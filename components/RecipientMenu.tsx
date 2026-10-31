"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useCallback,useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {recipientCategories,type RecipientCategoryId} from "@/data/recipient-categories";
import "./RecipientMenu.css";

function CategoryIcon({name}:{name:RecipientCategoryId}){
  const shared={width:23,height:23,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.65,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const};
  switch(name){
    case "pareja":return <svg {...shared}><path d="M20.7 4.8a5.3 5.3 0 0 0-7.5 0L12 6l-1.2-1.2a5.3 5.3 0 0 0-7.5 7.5L12 21l8.7-8.7a5.3 5.3 0 0 0 0-7.5Z"/><path d="M12 10.1v5M9.5 12.6h5"/></svg>;
    case "mama":return <svg {...shared}><path d="M12 7.5c-1.9-4.5-6.7-4.8-7-1.2-2.2 2-1.8 5.1 2.2 5.6-3.7 2.9-2 7.7 1.2 6.8 2 2.9 5.1 2.5 6.2-1.5 3.1 3.4 7.7.1 6.8-2.8 1-2.8.6-5.6-2.6-5.9 2.2-1.4 2.2-5.3-.1-6.4-1.7-3.7-5.6-2.6-6.3.4Z"/><circle cx="12" cy="12" r="2.3"/></svg>;
    case "papa":return <svg {...shared}><path d="m12 2 2.7 5.7L21 9l-4.5 4.6L17.5 20 12 17l-5.5 3 1-6.4L3 9l6.3-1.3L12 2Z"/><path d="M12 7.9v5.3"/></svg>;
    case "amigos":return <svg {...shared}><circle cx="8" cy="8.2" r="3"/><circle cx="17.1" cy="8.2" r="2.6"/><path d="M2.5 20v-1.9A5.3 5.3 0 0 1 7.8 12.8h.5a5.3 5.3 0 0 1 5.3 5.3V20M15.1 13h1.8A4.6 4.6 0 0 1 21.5 17.6V20"/></svg>;
    case "juegos":return <svg {...shared}><path d="M7 8.3h10.3c2.1 0 3.3 1.3 3.8 3.5l1 5.4c.4 2.4-1.4 4-3.2 3.2-1.4 0-2.6-1.2-4-2.4h-5.5c-1.4 1.2-2.6 2.4-4 2.4-1.8 0-3.6-.8-3.2-3.2l1-5.4C3.7 9.6 4.9 8.3 7 8.3Z"/><path d="M8.5 12v5m-2.5-2.5h5M16 13.2h.02M18.4 15.4h.02"/></svg>;
    case "todos":return <svg {...shared}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>;
  }
}

export default function RecipientMenu(){
  const [open,setOpen]=useState(false);
  const [mounted,setMounted]=useState(false);
  const pathname=usePathname();
  const triggerRef=useRef<HTMLButtonElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const panelRef=useRef<HTMLElement>(null);
  const close=useCallback(()=>setOpen(false),[]);
  useEffect(()=>setMounted(true),[]);
  useEffect(()=>{close()},[pathname,close]);
  useEffect(()=>{
    if(!open)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const current=window.setTimeout(()=>closeRef.current?.focus(),10);
    function handleKey(event:KeyboardEvent){
      if(event.key==="Escape"){event.preventDefault();close();return;}
      if(event.key!=="Tab")return;
      const focusables=panelRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),[tabindex]:not([tabindex='-1'])");
      if(!focusables?.length)return;
      const first=focusables[0],last=focusables[focusables.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    document.addEventListener("keydown",handleKey);
    return ()=>{window.clearTimeout(current);document.body.style.overflow=previousOverflow;document.removeEventListener("keydown",handleKey);triggerRef.current?.focus();};
  },[open,close]);
  return <>
    <button ref={triggerRef} type="button" className={"recipient-menu-trigger"+(open?" is-open":"")} aria-label={open?"Cerrar menú de categorías":"Abrir menú de categorías"} aria-haspopup="dialog" aria-expanded={open} aria-controls="recipient-menu-panel" onClick={()=>setOpen(value=>!value)}>
      <span className="recipient-menu-trigger-label">Menú</span>
      <span className="recipient-menu-burger" aria-hidden="true"><i/><i/><i/></span>
    </button>
    {mounted&&open&&createPortal(
      <div className="recipient-menu-overlay" data-testid="recipient-overlay">
        <button type="button" className="recipient-menu-scrim" aria-label="Cerrar menú" onClick={close} tabIndex={-1}/>
        <aside id="recipient-menu-panel" ref={panelRef} className="recipient-menu-panel" role="dialog" aria-modal="true" aria-labelledby="recipient-menu-title">
          <div className="recipient-menu-top">
            <Link href="/" className="recipient-menu-brand" onClick={close} aria-label="Te Hice Esto — inicio">
              <span className="recipient-menu-brand-icon" aria-hidden="true">✳</span>
              <span>Te Hice Esto<span className="recipient-menu-brand-period">.</span></span>
            </Link>
            <button type="button" ref={closeRef} className="recipient-menu-close" onClick={close} aria-label="Cerrar menú">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg>
            </button>
          </div>
          <div className="recipient-menu-scroll">
            <div className="recipient-menu-intro">
              <span className="recipient-menu-eyebrow">EXPERIENCIAS HECHAS PARA ALGUIEN</span>
              <h2 id="recipient-menu-title">¿Para quién es <em>tu sorpresa?</em></h2>
              <p>Elegí a quién querés emocionar. Nosotros te mostramos el camino.</p>
            </div>
            <nav className="recipient-menu-categories" aria-label="Elegir destinatario">
              {recipientCategories.map(({id,title,description},index)=>
                <Link key={id} href={"/coleccion/"+id} className={"recipient-menu-category recipient-menu-category--"+id+(id==="todos"?" recipient-menu-category--all":"")} onClick={close}>
                  <span className="recipient-menu-icon" aria-hidden="true"><CategoryIcon name={id}/></span>
                  <span className="recipient-menu-category-copy">
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  <span className="recipient-menu-category-arrow" aria-hidden="true">↗</span>
                  <span className="recipient-menu-category-number" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
                </Link>)}
            </nav>
            <div className="recipient-menu-note">✦ Cada experiencia tiene una historia. Encontrá la que querés contar.</div>
          </div>
          <div className="recipient-menu-bottom">
            <Link href="/mis-regalos" className="recipient-menu-secondary" onClick={close}>Mis regalos <span aria-hidden="true">↗</span></Link>
            <Link href="/crear" className="recipient-menu-primary" onClick={close}>Crear un regalo <span aria-hidden="true">↗</span></Link>
          </div>
        </aside>
      </div>,document.body)}
  </>;
}
