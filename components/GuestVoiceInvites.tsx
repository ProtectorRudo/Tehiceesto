"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "@/app/mis-regalos/account.module.css";

const base=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const apikey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
type Invite={id:string;created_at:string;expires_at:string;revoked_at:string|null;submissions_count:number;max_submissions:number};
type Props={code:string;bearer:string;onError:(message:string)=>void};

export default function GuestVoiceInvites({code,bearer,onError}:Props){
  const [invites,setInvites]=useState<Invite[]>([]);
  const [link,setLink]=useState("");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const call=useCallback(async(action:string,values:Record<string,unknown>={})=>{
    const res=await fetch(base+"/functions/v1/guest-voice",{
      method:"POST",cache:"no-store",
      headers:{apikey,authorization:"Bearer "+bearer,"content-type":"application/json"},
      body:JSON.stringify({action,code,...values}),
    });
    const result=await res.json().catch(()=>({}));
    if(!res.ok||result.error)throw new Error(result.error||"invite_failed");
    return result;
  },[bearer,code]);
  const reload=useCallback(async()=>{
    const result=await call("list");
    setInvites(Array.isArray(result.invites)?result.invites:[]);
  },[call]);
  useEffect(()=>{void reload().catch(()=>{});},[reload]);
  const active=invites.find(item=>!item.revoked_at&&new Date(item.expires_at).getTime()>Date.now()&&item.submissions_count<item.max_submissions);
  async function create(){
    setBusy(true);setNotice("");
    try{
      const result=await call("create");
      setLink(result.url);
      await reload();
      setNotice("Invitación lista para compartir.");
    }catch{onError("No se pudo generar la invitación. Volvé a intentarlo.");}
    finally{setBusy(false);}
  }
  async function revoke(){
    if(!active||!window.confirm("¿Desactivar este enlace? Las personas invitadas ya no podrán enviar mensajes nuevos."))return;
    setBusy(true);
    try{await call("revoke",{inviteId:active.id});setLink("");await reload();setNotice("El enlace dejó de funcionar.");}
    catch{onError("No pudimos desactivar la invitación.");}
    finally{setBusy(false);}
  }
  async function copy(){
    try{await navigator.clipboard.writeText(link);setNotice("Enlace copiado.");}
    catch{onError("No pudimos copiar automáticamente. Seleccioná el enlace y copialo.");}
  }
  const whatsapp="https://wa.me/?text="+encodeURIComponent("¡Te invito a dejar un mensaje de voz para un regalo muy especial! ♥ Grabalo acá, sin registrarte: "+link);
  return <div className={styles.guestInvite}>
    <span className={styles.eyebrow}>RECUERDOS QUE SE ESCUCHAN</span>
    <h3>Invitá a otros a grabar su voz</h3>
    <p>Compartí un enlace por WhatsApp. La persona verá <strong>únicamente una grabadora</strong>: no puede entrar a tu cuenta, ver otros recuerdos ni cambiar nada del regalo.</p>
    <button className={styles.primary} type="button" disabled={busy} onClick={()=>void create()}>
      {busy?"Preparando…":active?"Crear otro enlace privado →":"Crear enlace para invitar →"}
    </button>
    {link&&<div className={styles.guestInviteLink}>
      <label htmlFor="guest-share-url">Tu enlace privado para compartir</label>
      <input id="guest-share-url" readOnly value={link} onFocus={event=>event.target.select()} />
      <div className={styles.guestInviteActions}>
        <button className={styles.ghost} type="button" onClick={()=>void copy()}>Copiar enlace</button>
        <a href={whatsapp} rel="noopener noreferrer" target="_blank">Compartir por WhatsApp</a>
      </div>
    </div>}
    {active&&<div className={styles.guestInviteStatus}>
      <span>Enlace activo · {active.submissions_count} de {active.max_submissions} mensajes recibidos · Vence el {new Date(active.expires_at).toLocaleDateString("es-AR")}</span>
      <button type="button" disabled={busy} onClick={()=>void revoke()}>Desactivar enlace</button>
    </div>}
    {notice&&<p className={styles.guestInviteNotice} role="status">{notice}</p>}
    <p className={styles.guestInviteFine}>El acceso vence en 14 días o al recibir 12 voces. Crear otro enlace desactiva el anterior. Los mensajes quedan guardados en este regalo.</p>
  </div>;
}
