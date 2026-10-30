"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Experience } from "@/data/experiences";
import { JAR365_CATEGORIES, JAR365_SEED, type Jar365Note } from "@/data/jar365-notes";
import "./jar365.css";

type OpenedNote = Jar365Note & { openedAt?:string|null };
type JarState = {
  recipient:string; giver:string; opened:OpenedNote[];
  total:number; openedCount:number; available:number; startedAt:string|null;
  nextAt:string|null; serverNow:string;
};
type Props={experience:Experience;giftCode?:string;previewNotes?:Jar365Note[];};

function formatCountdown(millis:number) {
  const seconds=Math.max(0,Math.ceil(millis/1000));
  const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;
  return [h,m,s].map(n=>String(n).padStart(2,"0")).join(":");
}
function colorFor(category:string){
  return JAR365_CATEGORIES.find(c=>c.key===category)?.color || "#F1C6CF";
}
function labelFor(category:string){
  return JAR365_CATEGORIES.find(c=>c.key===category)?.label || "Un papelito para vos";
}
function JarIllustration({progress,drawing}:{progress:number;drawing:boolean}){
  const slips=useMemo(()=>Array.from({length:76},(_,i)=>{
    const seed=(i*271+19)%1009;
    return {x:74+(seed*37)%244,y:131+(seed*17)%205,angle:-35+(seed*7)%71,
      color:JAR365_CATEGORIES[(i*7+(i%3))%JAR365_CATEGORIES.length].color,
      width:38+seed%34};
  }),[]);
  return <svg className={"jar365-illustration"+(drawing?" is-drawing":"")} viewBox="0 0 430 490" role="img"
    aria-label={"Frasco de vidrio con 365 papelitos de colores. "+progress+" abiertos."}>
    <defs>
      <linearGradient id="jarGlass" x1="0" x2="1" y1="0" y2=".3"><stop offset="0" stopColor="#fff" stopOpacity=".74"/><stop offset=".26" stopColor="#eef7f5" stopOpacity=".19"/><stop offset=".7" stopColor="#fefdfb" stopOpacity=".07"/><stop offset="1" stopColor="#d2e7e4" stopOpacity=".47"/></linearGradient>
      <linearGradient id="jarCap" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f3d4b7"/><stop offset=".5" stopColor="#d6ab84"/><stop offset="1" stopColor="#b98f70"/></linearGradient>
      <linearGradient id="jarLabel" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffdf7"/><stop offset="1" stopColor="#f4eadf"/></linearGradient>
      <linearGradient id="jarReflection" x1="0" x2="1"><stop stopColor="#fff" stopOpacity=".8"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
      <filter id="jarShadow" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur stdDeviation="11"/></filter>
      <clipPath id="jarInside"><path d="M96 125 Q83 133 81 153 L78 344 Q78 400 115 419 Q158 444 215 442 Q276 444 318 419 Q354 399 351 344 L348 153 Q347 133 334 125Z"/></clipPath>
    </defs>
    <ellipse cx="216" cy="456" rx="139" ry="17" fill="#806d61" opacity=".17" filter="url(#jarShadow)"/>
    <g className="jar365-lid">
      <rect x="118" y="77" width="195" height="47" rx="12" fill="url(#jarCap)" stroke="#a98065" strokeWidth="2"/>
      <rect x="122" y="74" width="187" height="14" rx="7" fill="#f3decc" opacity=".95"/>
      {Array.from({length:22},(_,i)=><path key={i} d={`M${127+i*8} 90v30`} stroke="#9d775c" strokeWidth="1.3" opacity=".42"/>)}
      <path d="M130 111H304" stroke="#fff4e7" opacity=".46" strokeWidth="3"/>
    </g>
    <path d="M95 126Q82 130 79 153L76 348Q76 404 115 425Q151 449 215 449Q285 449 317 425Q356 403 353 348L350 153Q348 132 334 126Z" fill="#e5eff0" opacity=".61" stroke="#b9c7c6" strokeWidth="3"/>
    <g clipPath="url(#jarInside)">
      <rect x="76" y="128" width="279" height="313" fill="#f7f1e9" opacity=".24"/>
      {slips.map((s,i)=><g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.angle})`}>
        <rect x={-s.width/2} y="-13" width={s.width} height="28" rx="2" fill={s.color} stroke="#a7837e" strokeOpacity=".22" strokeWidth="1"/>
        <path d={`M${-s.width/2+4} 0 H${s.width/2-4}`} stroke="#fff" strokeOpacity=".65" strokeWidth="1"/>
        {i%3===0&&<path d={`M${-s.width/2+9} 7 h${s.width-18}`} stroke="#765d6e" strokeOpacity=".23" strokeWidth=".8"/>}
      </g>)}
      <path d="M77 280Q155 315 222 303Q300 285 357 311V452H76Z" fill="#ecd0cf" opacity=".11"/>
    </g>
    <path d="M95 126Q82 130 79 153L76 348Q76 404 115 425Q151 449 215 449Q285 449 317 425Q356 403 353 348L350 153Q348 132 334 126Z"
      fill="url(#jarGlass)" stroke="#fefefa" strokeOpacity=".9" strokeWidth="3.5"/>
    <path d="M106 147Q97 171 97 234V347Q99 385 113 402" fill="none" stroke="url(#jarReflection)" strokeWidth="15" strokeLinecap="round" opacity=".76"/>
    <path d="M327 151Q338 185 336 276V361" fill="none" stroke="#fff" strokeWidth="7" strokeOpacity=".31" strokeLinecap="round"/>
    <path d="M131 428Q204 451 299 425" fill="none" stroke="#fff" strokeOpacity=".67" strokeWidth="5" strokeLinecap="round"/>
    <rect x="122" y="222" width="185" height="131" rx="7" fill="#8a6c62" opacity=".15" transform="rotate(-2 215 284)"/>
    <rect x="117" y="214" width="188" height="134" rx="6" fill="url(#jarLabel)" stroke="#dbc9b6" strokeWidth="1.5" transform="rotate(-2 211 281)"/>
    <g transform="rotate(-2 211 281)" textAnchor="middle">
      <path d="M196 237 q-6 -12 -16 -4 q-10 9 17 25 q27 -16 17 -25 q-10 -8 -18 4" fill="none" stroke="#a87588" strokeWidth="1.5"/>
      <text x="211" y="290" fontFamily="Georgia,serif" fontSize="25" fill="#704a56">Para vos</text>
      <text x="211" y="314" fontSize="12" fontFamily="Arial,sans-serif" letterSpacing="3" fill="#a07984">365 PAPELITOS</text>
      <path d="M171 329H251" stroke="#ceb3ac" strokeWidth="1"/>
    </g>
    <path d="M94 132Q205 147 335 132" fill="none" stroke="#fefdfa" opacity=".85" strokeWidth="6"/>
    <path d="M126 86 Q215 80 300 86" fill="none" stroke="#fff7eb" strokeWidth="2" opacity=".6"/>
    <g fill="#fff7ee" opacity=".9"><path d="M68 182l3 12 12 3-12 3-3 12-3-12-12-3 12-3z"/><circle cx="362" cy="257" r="3"/></g>
  </svg>;
}

export default function Jar365Experience({experience,giftCode,previewNotes}:Props){
  const demo=!giftCode;
  const [state,setState]=useState<JarState|null>(demo?{
    giver:experience.demoGiver,recipient:experience.demoRecipient,total:365,
    opened:[],available:1,openedCount:0,startedAt:null,nextAt:null,serverNow:new Date().toISOString(),
  }:null);
  const [busy,setBusy]=useState(false);
  const [drawing,setDrawing]=useState(false);
  const [active,setActive]=useState<OpenedNote|null>(null);
  const [history,setHistory]=useState(false);
  const [error,setError]=useState("");
  const [clock,setClock]=useState(Date.now());
  const [demoDay,setDemoDay]=useState(0);
  const [ready,setReady]=useState(demo);
  const [favorites,setFavorites]=useState<number[]>([]);
  const giftStorage=demo?"jar365-demo-favorites":"jar365-favorites-"+giftCode;

  const load=useCallback(async()=>{
    if(demo||!giftCode)return;
    try{
      const response=await fetch("/api/jar365?code="+encodeURIComponent(giftCode),{cache:"no-store"});
      if(!response.ok)throw new Error("load");
      const payload=await response.json() as JarState;
      setState(payload);setError("");
    }catch{setError("No pudimos conectar con tu frasco. Revisá tu conexión e intentá de nuevo.");}
    finally{setReady(true);}
  },[demo,giftCode]);

  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    const timer=setInterval(()=>setClock(Date.now()),1000);
    const onFocus=()=>{setClock(Date.now());void load();};
    document.addEventListener("visibilitychange",onFocus);
    return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",onFocus);};
  },[load]);
  useEffect(()=>{try{const value=JSON.parse(localStorage.getItem(giftStorage)||"[]");if(Array.isArray(value))setFavorites(value.filter(Number.isInteger));}catch{}},[giftStorage]);
  // A paper becomes available even if the recipient keeps the page open overnight.
  useEffect(()=>{
    if(demo||!state?.nextAt||state.available>0)return;
    const millis=Date.parse(state.nextAt)-Date.now();
    const timer=window.setTimeout(()=>void load(),Math.max(120,Math.min(millis+150,2147483600)));
    return()=>window.clearTimeout(timer);
  },[demo,load,state?.nextAt,state?.available]);

  const available=state?.available||0;
  const opened=state?.opened||[];
  const current=state?.openedCount||0;
  const nextMs=state?.nextAt?Date.parse(state.nextAt)-clock:0;
  const progress=Math.round(current/365*100);
  const toggleFavorite=(position:number)=>{
    setFavorites(prev=>{
      const next=prev.includes(position)?prev.filter(x=>x!==position):[...prev,position];
      try{localStorage.setItem(giftStorage,JSON.stringify(next));}catch{}
      return next;
    });
  };

  async function draw(){
    if(busy||drawing||available<1||!ready)return;
    setBusy(true);setError("");
    try{
      let note:OpenedNote, next:JarState;
      if(demo){
        const record=(previewNotes?.length===365?previewNotes:JAR365_SEED)[demoDay%365];
        note={...record,openedAt:new Date().toISOString()};
        next={...(state as JarState),available:1,openedCount:current+1,opened:[...opened,note]};
        setDemoDay(n=>n+1);
      }else{
        const response=await fetch("/api/jar365",{method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({action:"open",code:giftCode})});
        const payload=await response.json();
        if(!response.ok){if(payload.state)setState(payload.state);throw new Error("open");}
        note=payload.note as OpenedNote;next=payload.state as JarState;
      }
      setDrawing(true);setState(next);
      try{navigator.vibrate?.(25);}catch{}
      window.setTimeout(()=>{setDrawing(false);setActive(note);setBusy(false);},850);
    }catch{
      setBusy(false);setDrawing(false);
      setError("No se pudo sacar el papelito. No se perdió ningún cupo: probá otra vez.");
    }
  }

  return <main className="jar365-shell">
    <header className="jar365-topbar">
      <a href="/" className="jar365-brand">TE HICE ESTO<span>♥</span><small>UN REGALO QUE DURA UN AÑO</small></a>
      <span className="jar365-top-count"><i/> {String(current).padStart(3,"0")} <b>/ 365</b></span>
      {demo&&<a className="jar365-top-link" href="/comprar/frasco365">Quiero regalarlo <span>↗</span></a>}
    </header>
    <div className="jar365-ambient"><i/><i/><i/><i/></div>
    <div className="jar365-body">
      <div className="jar365-intro">
        <span className="jar365-kicker"><span>✺</span> {demo?"UN REGALO QUE PODÉS PROBAR":"UN REGALO HECHO PARA VOS"} <span>✺</span></span>
        <h1>Un año de <em>cosas lindas</em><br/>para decirte.</h1>
        <p className="jar365-lead">{demo?"365 papelitos. Uno para abrir cada día. Nada de frases hechas: cosas que una persona de verdad le diría a otra.":`${state?.giver||experience.demoGiver} te dejó 365 papelitos. Hay cosas para agradecerte, otras para recordarte y algunas sorpresas. Hoy podés descubrir una.`}</p>
      </div>
      <section className="jar365-stage" aria-label="Frasco de papelitos">
        <span className="jar365-stage-spark s1">✦</span><span className="jar365-stage-spark s2">✧</span>
        <span className="jar365-orbit-caption">UNO POR DÍA · SIN APURO</span>
        <button type="button" className="jar365-jar-button" onClick={()=>void draw()}
          disabled={!available||busy||!ready} aria-label={available?"Tocar el frasco para sacar un papelito":"Frasco cerrado hasta el próximo cupo"}>
          <JarIllustration progress={current} drawing={drawing}/>
          {drawing&&<span className="jar365-flying-paper">Para vos ♡</span>}
        </button>
        <div className="jar365-ground-glow"/>
      </section>
      <section className="jar365-ritual">
        {demo&&<span className="jar365-demo-notice">DEMO INTERACTIVA · PODÉS ABRIR MÁS DE UNO PARA PROBAR</span>}
        {!ready?<p className="jar365-loading">Buscando tu papelito de hoy…</p>:<>
          {current>=365?<div className="jar365-ritual-copy"><strong>Ya abriste los 365.</strong><span>Ahora tenés un año entero de mensajes para volver a leer.</span></div>:
          available>0?<div className="jar365-ritual-copy"><strong>{demo&&current===0?"Tu primer papelito está listo.":available===1?"Hay un papelito esperándote.":`Tenés ${available} papelitos por abrir.`}</strong><span>Elegí uno de los que están en el frasco. La sorpresa aparece al desplegarlo.</span></div>:
          <div className="jar365-ritual-copy"><strong>Por hoy, ya está. ♡</strong><span>El siguiente se libera en <b className="jar365-countdown">{formatCountdown(nextMs)}</b></span></div>}
          <button className="jar365-main-cta" type="button" onClick={()=>void draw()}
            disabled={!available||busy||drawing||current>=365}>
            <span className="jar365-cta-icon">✉</span>{busy?"Sacando tu papelito…":available?"Sacar mi papelito":"Tu próximo papelito, mañana"} <span>♡</span>
          </button>
        </>}
        {error&&<p className="jar365-error" role="alert">{error}</p>}
        <button type="button" className="jar365-library-link" onClick={()=>setHistory(true)}>
          <span>◌</span> Mis papelitos abiertos <b>{current}/365</b>
        </button>
        <div className="jar365-progress-track" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={365}>
          <i style={{width:progress+"%"}}/>
        </div>
        <p className="jar365-progress-caption">Los que no abrís hoy se guardan. Nunca perdés tu turno.</p>
      </section>
      <footer className="jar365-bottom">
        <span>365 DÍAS · 365 PEQUEÑAS RAZONES</span><span>HECHO CON CARIÑO, PARA UNA SOLA PERSONA ♡</span>
      </footer>
    </div>
    {active&&<div className="jar365-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)setActive(null);}}>
      <section className="jar365-note-modal" role="dialog" aria-modal="true" aria-label={"Papelito "+active.position}
        style={{"--note-color":colorFor(active.category)} as React.CSSProperties}>
        <span className="jar365-fold-triangle"/>
        <span className="jar365-note-eyebrow">PAPELITO {String(active.position).padStart(3,"0")} DE 365</span>
        <span className="jar365-note-category">{labelFor(active.category)}</span>
        <div className="jar365-note-smallheart">♡</div>
        <p className="jar365-note-message">{active.message}</p>
        <span className="jar365-note-from">— {state?.giver||experience.demoGiver}</span>
        <div className="jar365-note-actions">
          <button type="button" onClick={()=>toggleFavorite(active.position)}>{favorites.includes(active.position)?"♥ Guardado":"♡ Guardar favorito"}</button>
          <button type="button" className="is-primary" onClick={()=>setActive(null)}>Guardar y cerrar</button>
        </div>
      </section>
    </div>}
    {history&&<div className="jar365-modal-backdrop jar365-history-backdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)setHistory(false);}}>
      <section className="jar365-history-panel" role="dialog" aria-modal="true" aria-label="Papelitos que ya abriste">
        <button type="button" className="jar365-close" aria-label="Cerrar" onClick={()=>setHistory(false)}>×</button>
        <span className="jar365-kicker">TUS PEQUEÑOS RECUERDOS</span>
        <h2>Lo que ya<br/><em>te dije.</em></h2>
        <p>Podés volver a leerlos todas las veces que quieras. Los demás siguen esperando en el frasco.</p>
        <div className="jar365-note-list">
          {opened.length?opened.slice().reverse().map(note=><button type="button" key={note.position}
            className="jar365-history-note" style={{"--note-color":colorFor(note.category)} as React.CSSProperties}
            onClick={()=>{setHistory(false);setActive(note);}}>
            <span className="jar365-history-palette"/><span><b>#{String(note.position).padStart(3,"0")} · {labelFor(note.category)}</b><small>{note.message}</small></span><span>{favorites.includes(note.position)?"♥":"›"}</span>
          </button>):<div className="jar365-empty">Todavía no abriste ningún papelito. El primero te espera afuera.</div>}
        </div>
        <span className="jar365-history-count">{current} DE 365 · CADA UNO A SU TIEMPO</span>
      </section>
    </div>}
  </main>;
}
