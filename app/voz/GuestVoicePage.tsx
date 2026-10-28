"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./guest-voice.module.css";

const apiBase=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const apiKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
type View="loading"|"invalid"|"idle"|"recording"|"ready"|"sending"|"done";
type ApiResult={error?:string;ok?:boolean;path?:string;token?:string;uploadId?:string};

function chooseMime(){
  if(typeof MediaRecorder==="undefined")return"";
  for(const m of ["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg"])
    if(MediaRecorder.isTypeSupported(m))return m;
  return "";
}
function errorMessage(code:string){
  if(code==="invite_unavailable")return"El enlace venció o fue desactivado. Pedí otro a quien te invitó.";
  if(code==="gift_full")return"Este regalo alcanzó la capacidad máxima de audios.";
  if(code==="invalid_audio")return"No pudimos procesar ese audio. Grabalo de nuevo.";
  if(code==="too_many_attempts")return"Hubo demasiados intentos. Probá más tarde.";
  return"No pudimos enviar tu voz. Revisá tu conexión e intentá otra vez; la grabación sigue acá.";
}
export default function GuestVoicePage(){
  const [view,setView]=useState<View>("loading");
  const [time,setTime]=useState(0);
  const [audioUrl,setAudioUrl]=useState("");
  const [speaker,setSpeaker]=useState("");
  const [error,setError]=useState("");
  const token=useRef("");
  const stream=useRef<MediaStream|null>(null);
  const recorder=useRef<MediaRecorder|null>(null);
  const chunks=useRef<Blob[]>([]);
  const file=useRef<File|null>(null);
  const preview=useRef("");
  const startTime=useRef(0);
  const ticker=useRef<ReturnType<typeof setInterval>|null>(null);
  const canceled=useRef(false);
  const sending=useRef(false);
  const mounted=useRef(true);

  const release=()=>{
    if(ticker.current){clearInterval(ticker.current);ticker.current=null;}
    stream.current?.getTracks().forEach(track=>track.stop());
    stream.current=null;
  };
  const reset=()=>{
    canceled.current=true;
    if(recorder.current?.state==="recording")recorder.current.stop();
    release();
    if(preview.current){URL.revokeObjectURL(preview.current);preview.current="";}
    file.current=null;chunks.current=[];
    setAudioUrl("");setTime(0);setError("");setView("idle");
  };
  async function request(action:string,params:Record<string,unknown>={}):Promise<ApiResult>{
    const response=await fetch(apiBase+"/functions/v1/guest-voice",{
      method:"POST",cache:"no-store",referrerPolicy:"no-referrer",
      headers:{"apikey":apiKey,"content-type":"application/json"},
      body:JSON.stringify({action,inviteToken:token.current,...params})
    });
    const data=await response.json().catch(()=>({error:"request_failed"})) as ApiResult;
    if(!response.ok||data.error)throw new Error(data.error||"request_failed");
    return data;
  }
  useEffect(()=>{
    mounted.current=true;
    const fragment=new URLSearchParams(window.location.hash.replace(/^#/,""));
    const incoming=fragment.get("t")||"";
    if(/^[a-f0-9]{64}$/.test(incoming)){
      token.current=incoming;
      window.sessionStorage.setItem("thi-guest-voice-token",incoming);
    }else token.current=window.sessionStorage.getItem("thi-guest-voice-token")||"";
    // Keep the bearer secret out of the browser address bar and navigation history.
    window.history.replaceState(null,"",window.location.pathname);
    if(!/^[a-f0-9]{64}$/.test(token.current)){
      setView("invalid");
    }else{
      void request("status").then(()=>{
        if(mounted.current)setView("idle");
      }).catch(()=>{
        window.sessionStorage.removeItem("thi-guest-voice-token");
        if(mounted.current)setView("invalid");
      });
    }
    return()=>{
      mounted.current=false;
      if(ticker.current)clearInterval(ticker.current);
      stream.current?.getTracks().forEach(track=>track.stop());
      if(preview.current)URL.revokeObjectURL(preview.current);
    };
  // Only initialize on first mount, never re-read a cleared URL fragment.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function begin(){
    if(sending.current)return;
    reset();
    canceled.current=false;
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){
      setError("Este navegador no permite grabar. Abrí el enlace desde Safari o Chrome en tu teléfono.");
      return;
    }
    try{
      stream.current=await navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false
      });
      const mime=chooseMime();
      const rec=mime?new MediaRecorder(stream.current,{mimeType:mime}):new MediaRecorder(stream.current);
      recorder.current=rec;
      chunks.current=[];
      rec.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};
      rec.onerror=()=>{reset();setError("La grabación se interrumpió. Intentá de nuevo.")};
      rec.onstop=()=>{
        release();
        if(canceled.current||!mounted.current)return;
        const kind=rec.mimeType.split(";")[0]||"audio/webm";
        const blob=new Blob(chunks.current,{type:kind});
        chunks.current=[];
        if(!blob.size||blob.size>15*1024*1024){
          reset();setError("La grabación está vacía o supera los 15 MB.");return;
        }
        const ext=kind.includes("mp4")?"m4a":kind.includes("ogg")?"ogg":"webm";
        file.current=new File([blob],"mi-voz."+ext,{type:kind,lastModified:Date.now()});
        preview.current=URL.createObjectURL(file.current);
        setAudioUrl(preview.current);
        setView("ready");
      };
      rec.start(1000);
      startTime.current=Date.now();
      setTime(0);setView("recording");
      ticker.current=setInterval(()=>{
        const seconds=Math.min(180,Math.floor((Date.now()-startTime.current)/1000));
        setTime(seconds);
        if(seconds>=180&&rec.state==="recording")rec.stop();
      },250);
    }catch(e){
      reset();
      const name=e instanceof Error?e.name:"";
      setError(name==="NotAllowedError"?"Habilitá el permiso del micrófono en el navegador para grabar.":"No pudimos acceder al micrófono. Probá desde Safari o Chrome.");
    }
  }
  function stop(){if(recorder.current?.state==="recording")recorder.current.stop()}
  async function send(){
    if(!file.current||sending.current)return;
    sending.current=true;setView("sending");setError("");
    try{
      const recording=file.current;
      const signed=await request("prepare",{mimeType:recording.type,size:recording.size});
      if(!signed.path||!signed.token||!signed.uploadId)throw new Error("upload_prepare_failed");
      const client=createClient(apiBase,apiKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const {error:uploadError}=await client.storage.from("gift-media")
        .uploadToSignedUrl(signed.path,signed.token,recording,{contentType:recording.type,upsert:false});
      if(uploadError)throw uploadError;
      await request("finish",{uploadId:signed.uploadId,speaker:speaker.slice(0,60).trim()});
      if(preview.current){URL.revokeObjectURL(preview.current);preview.current="";}
      file.current=null;setAudioUrl("");setView("done");
      window.sessionStorage.removeItem("thi-guest-voice-token");
    }catch(e){
      const code=e instanceof Error?e.message:"request_failed";
      if(code==="invite_unavailable"){setView("invalid");window.sessionStorage.removeItem("thi-guest-voice-token")}
      else{setError(errorMessage(code));setView("ready")}
    }finally{sending.current=false}
  }
  const clock=String(Math.floor(time/60)).padStart(2,"0")+":"+String(time%60).padStart(2,"0");
  return <main id="guest-voice" className={styles.page}>
    <div className={styles.frame}>
      <div className={styles.brand}>TE HICE ESTO <span>♥</span></div>
      <section className={styles.card}>
        {view==="loading"&&<div className={styles.loading}>Preparando un lugar para tu voz…</div>}
        {view==="invalid"&&<>
          <div className={styles.seal} aria-hidden="true">♡</div>
          <h1 className={styles.title}>Esta invitación ya no está disponible.</h1>
          <p className={styles.lead}>Puede haber vencido, completado su cupo o haber sido desactivada. Pedile otro enlace a quien te invitó.</p>
        </>}
        {view==="done"&&<>
          <div className={styles.seal} aria-hidden="true">♥</div>
          <span className={styles.eyebrow}>MENSAJE ENVIADO</span>
          <h1 className={styles.successTitle}>Tu voz ya es parte de esta historia.</h1>
          <p className={styles.successText}>Gracias por regalar algo tan personal. Tu mensaje quedó guardado en la experiencia de quien te invitó.</p>
        </>}
        {["idle","recording","ready","sending"].includes(view)&&<>
          <div className={styles.seal} aria-hidden="true">♫</div>
          <span className={styles.eyebrow}>UNA INVITACIÓN MUY ESPECIAL</span>
          <h1 className={styles.title}>Hay palabras que merecen <em>escucharse.</em></h1>
          <p className={styles.lead}>Alguien quiere guardar tu voz en un regalo único. Grabá un mensaje desde tu teléfono; esa persona lo recibirá como un recuerdo al que siempre podrá volver.</p>
          <div className={styles.rule}/>
          {view==="idle"&&<button type="button" className={styles.record} onClick={()=>void begin()}><span className={styles.dot} aria-hidden="true">●</span> Empezar a grabar</button>}
          {view==="recording"&&<>
            <div className={styles.timer} role="status"><span className={styles.dot} aria-hidden="true">●</span> Grabando · {clock} / 03:00</div>
            <div className={styles.actions}><button type="button" className={styles.record} onClick={stop}>■ Detener grabación</button><button type="button" className={styles.outline} onClick={reset}>Cancelar</button></div>
          </>}
          {(view==="ready"||view==="sending")&&<>
            <span className={styles.eyebrow}>ESCUCHÁ TU MENSAJE</span>
            {audioUrl&&<audio className={styles.audio} controls preload="metadata" src={audioUrl} aria-label="Escuchar mi voz"/>}
            <div className={styles.form}><label htmlFor="guest-speaker">¿Cómo te llamás? (opcional)</label><input id="guest-speaker" type="text" maxLength={60} value={speaker} onChange={e=>setSpeaker(e.target.value)} placeholder="Ejemplo: Tía Ana" autoComplete="given-name"/></div>
            <div className={styles.actions}><button type="button" className={styles.record} disabled={view==="sending"} onClick={()=>void send()}>{view==="sending"?"Enviando tu voz…":"Enviar mi voz ♥"}</button><button type="button" className={styles.outline} disabled={view==="sending"} onClick={reset}>Grabar otra vez</button></div>
          </>}
          {error&&<p role="alert" className={styles.error}>{error}</p>}
          <p className={styles.hint}>Máximo 3 minutos. Solo se envía cuando tocás «Enviar mi voz». No necesitás crear una cuenta.</p>
          <p className={styles.only}>Este enlace sirve únicamente para grabar y enviar un mensaje de voz.</p>
        </>}
      </section>
      <div className={styles.footer}>Un recuerdo que se escucha se queda un poquito más cerca.<br/>© Te Hice Esto · Experiencias privadas</div>
    </div>
  </main>;
}