"use client";
import {useEffect,useState,useCallback} from "react";

// Entre Dos en dos teléfonos: cada cuenta guarda su elección bajo RLS.
// La API SQL no revela respuestas ajenas hasta que ambos hayan participado.
export default function EntreDosOnline({db,user,member,partner,cards,onExit}){
 const [room,setRoom]=useState(null),[own,setOwn]=useState(null),[reveal,setReveal]=useState(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [missingPartner,setMissingPartner]=useState(false);
 const space=member?.space_id;
 const refresh=useCallback(async()=>{
  if(!space||!user?.id)return;
  try{
   const {data:state,error:e1}=await db.rpc("cp_entre_dos_state",{p_space:space});
   if(e1)throw e1;
   if(!state?.ready){setMissingPartner(true);setLoading(false);return}
   const {data:answer,error:e2}=await db.from("cp_entre_dos_answers").select("answer")
    .eq("space_id",space).eq("cycle",state.cycle).eq("round_index",state.round).eq("user_id",user.id).maybeSingle();
   if(e2)throw e2;
   const {data:both,error:e3}=await db.rpc("cp_entre_dos_reveal",{p_space:space,p_cycle:state.cycle,p_round:state.round});
   if(e3)throw e3;
   setRoom(old=>old?.cycle===state.cycle&&old?.round===state.round?old:state);
   setOwn(answer?.answer||null);
   setReveal(both||null);
   setMissingPartner(false);
   setError("");
  }catch(e){setError(e?.message||"No pudimos sincronizar la partida")}
  finally{setLoading(false)}
 },[db,user?.id,space]);
 useEffect(()=>{
  let enabled=true;
  // Polling para el piloto: funciona incluso si no está habilitado Realtime.
  const read=()=>{if(enabled)void refresh()};
  read();
  const interval=setInterval(()=>{if(document.visibilityState==="visible")read()},2500);
  const onVisible=()=>{if(document.visibilityState==="visible")read()};
  document.addEventListener("visibilitychange",onVisible);
  return()=>{enabled=false;clearInterval(interval);document.removeEventListener("visibilitychange",onVisible)}
 },[refresh]);
 async function answer(value){
  if(!room||own||busy||!["a","b"].includes(value))return;
  setBusy(true);setError("");
  const {error:e}=await db.from("cp_entre_dos_answers").upsert({
   space_id:space,cycle:room.cycle,round_index:room.round,user_id:user.id,answer:value,
   updated_at:new Date().toISOString()
  },{onConflict:"space_id,cycle,round_index,user_id"});
  if(e)setError(e.message||"No se guardó tu respuesta");
  else{setOwn(value);await refresh()}
  setBusy(false);
 }
 async function next(){
  if(!room||!reveal?.ready||busy)return;
  setBusy(true);setError("");
  const {data,error:e}=await db.rpc("cp_entre_dos_next",{p_space:space,p_cycle:room.cycle,p_round:room.round});
  if(e||!data?.ready)setError(e?.message||"Todavía falta una respuesta");
  else{setRoom(data);setOwn(null);setReveal(null);await refresh()}
  setBusy(false);
 }
 const card=room&&Array.isArray(cards)?cards[room.round]:null;
 const answers=Array.isArray(reveal?.answers)?reveal.answers:[];
 const self=answers.find(x=>x.user_id===user?.id);
 const other=answers.find(x=>x.user_id!==user?.id);
 const answerLabel=x=>x==="a"?card?.a:card?.b;
 return <div className="two-phone-stage" role="dialog" aria-modal="true" aria-label="Entre Dos · Dos teléfonos">
  <div className="two-phone-top"><button className="two-phone-back" onClick={onExit}>← Juegos</button><strong>Entre Dos <span>♡</span></strong><span>2 celulares</span></div>
  <div className="two-phone-content">
   <div className="two-phone-heading"><span>💌 DOS PERSONAS · DOS CELULARES</span><h2>Una pregunta, dos miradas.</h2><p>Responden por separado. Las respuestas se muestran solo cuando los dos eligieron.</p></div>
   {loading?<div className="two-phone-card">Preparando la partida compartida…</div>:
    missingPartner?<div className="two-phone-card"><h3>Falta que se una tu pareja</h3><p>Cuando ambos tengan su cuenta dentro del mismo espacio, podrán responder desde teléfonos diferentes. Mientras tanto pueden jugar la versión de un celular.</p><button className="two-phone-cta" onClick={onExit}>Volver a Juegos</button></div>:
    !card?<div className="two-phone-card"><p>No pude cargar la pregunta de esta ronda.</p><button className="two-phone-cta" onClick={refresh}>Reintentar</button></div>:
    <div className="two-phone-card">
     <span className="two-phone-count">RONDA {room.round+1} DE 90 · SERIE {room.cycle}</span>
     <h3>{card.q}</h3>
     <div className="two-phone-choices">
      <button disabled={busy||Boolean(own)} className={"two-phone-choice"+(own==="a"?" selected":"")} onClick={()=>answer("a")}><span>A</span>{card.a}</button>
      <button disabled={busy||Boolean(own)} className={"two-phone-choice"+(own==="b"?" selected":"")} onClick={()=>answer("b")}><span>B</span>{card.b}</button>
     </div>
     {own&&!reveal?.ready&&<div className="two-phone-wait">✓ Tu respuesta quedó guardada. Esperando a {partner?.display_name||"tu pareja"}…</div>}
     {reveal?.ready&&<div className="two-phone-reveal" aria-live="polite">
      <span className="two-phone-count">♡ YA RESPONDIERON LOS DOS</span>
      <div className="two-phone-answer"><strong>{member?.display_name||"Vos"}</strong><span>{answerLabel(self?.answer)}</span></div>
      <div className="two-phone-answer"><strong>{partner?.display_name||"Tu pareja"}</strong><span>{answerLabel(other?.answer)}</span></div>
      <p>{card.talk}</p>
      <button className="two-phone-cta" onClick={next} disabled={busy}>Siguiente pregunta →</button>
     </div>}
    </div>}
   {error&&<p className="two-phone-error" role="alert">{error}</p>}
   <p className="two-phone-foot">Sin competencia ni penalizaciones. Lo valioso es lo que descubran conversando.</p>
  </div>
 </div>;
}
