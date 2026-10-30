/* eslint-disable @next/next/no-img-element */
"use client";

import {useEffect,useRef,useState,type CSSProperties} from "react";
import type {Experience,SceneType} from "@/data/experiences";
import type {SceneTextOverrides} from "@/data/scene-text";
import "./ClubAmigosExperience.css";
import DoorAtmosphere from "./DoorAtmosphere";

type Photo={url:string;caption?:string;fit?:"cover"|"contain";position?:"center"|"top"|"bottom"|"left"|"right"};
type Audio={url:string;caption?:string};
type Props={experience:Experience;letterText?:string;photoMedia?:Photo[];audioMedia?:Audio[];soundtrackMedia?:Audio;sceneTextOverrides?:SceneTextOverrides;customerGift?:boolean};

const CATS=[
 {name:"Milo",role:"EL DRAMÁTICO",pic:"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=380&q=85",accessory:"🕶️",tone:"gold"},
 {name:"Luna",role:"LA QUE SABE TODO",pic:"https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=380&q=85",accessory:"🎀",tone:"pink"},
 {name:"Bruno",role:"EL DE LOS PLANES",pic:"https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=380&q=85",accessory:"⭐",tone:"blue"},
 {name:"Mora",role:"LA CONSEJERA",pic:"https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=380&q=85",accessory:"💌",tone:"peach"},
 {name:"Pipo",role:"EL QUE SIEMPRE ESTÁ",pic:"https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=380&q=85",accessory:"🧢",tone:"mint"},
];
const CHAPTERS=[
 ["La puerta","El lugar secreto"],
 ["La banda","La bienvenida"],
 ["El archivo","Nuestros códigos"],
 ["El primer día","Así empezó todo"],
 ["Los papelitos","Cosas que solo sabemos"],
 ["El mapa","Nuestras aventuras"],
 ["La conversación","Mensajes sin filtro"],
 ["El pronóstico","Clima de amistad"],
 ["Un momento","Siempre presente"],
 ["Nuestra canción","La banda sonora"],
 ["La ruleta","Más planes imposibles"],
 ["La cápsula","Lo que todavía falta"],
 ["El tesoro","Momentos guardados"],
 ["Una carta","Lo que te quiero decir"],
 ["La sorpresa","Un último regalo"],
 ["Para siempre","El final... por ahora"],
] as const;
const stockPhotos=[
 "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85",
 "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1000&q=85",
 "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=85",
 "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85",
];
const notes=["Las ideas que empezaron con un «¿y si…?»","Las risas en el peor momento","Los planes improvisados","Las conversaciones eternas","Las fotos que no podemos publicar","Ese «avisame cuando llegues»"];
const locations=["La primera salida","Los planes de último momento","Ese viaje inolvidable","Nuestro próximo destino"];
const chats=[
 ["Milo","¿Quién dijo «esta vez nos portamos bien»?"],
 ["Luna","Hay pruebas de que eso nunca pasó."],
 ["Bruno","Igual repetiría todo mañana."],
 ["Mora","Lo mejor de los planes es con quién los hacés."],
 ["Pipo","¿Podemos hacer otro? Llevo snacks."],
];
const weather=[
 ["☀️","Probabilidad de risas","100%"],
 ["🌦️","Pequeños dramas","Solucionados con un mensaje"],
 ["🌪️","Planes improvisados","Alerta permanente"],
 ["🌈","Días difíciles","Acompañamiento asegurado"],
];
const wishes=["Seguir sumando anécdotas","No perder nunca nuestras charlas","Conocer lugares nuevos","Reírnos de esto dentro de muchos años"];

function Pet({index=0,speech,small=false,onClick}: {index?:number;speech?:string;small?:boolean;onClick?:()=>void}){
 const c=CATS[index%CATS.length];
 return <button className={"club-pet club-pet--"+c.tone+(small?" club-pet--small":"")+(onClick?" is-interactive":"")} type="button" onClick={onClick} disabled={!onClick} aria-label={onClick?"Escuchar a "+c.name:c.name} title={c.name}>
   <span className="club-pet-portrait"><span className="club-pet-fallback" aria-hidden="true">{index===2||index===4?"🐶":"🐱"}</span><img src={c.pic} alt="" draggable={false} onError={event=>{event.currentTarget.style.display="none";}}/><b className="club-pet-accessory" aria-hidden="true">{c.accessory}</b></span>
   <span className="club-pet-label">{c.name}</span>
   {speech&&<span className="club-pet-speech">{speech}</span>}
 </button>;
}
function Photograph({url,caption,tilt=0,onClick}:{url:string;caption:string;tilt?:number;onClick?:()=>void}){
 return <button type="button" className={"club-polaroid"+(onClick?" club-tappable":"")} style={{"--tilt":tilt+"deg"} as CSSProperties} disabled={!onClick} onClick={onClick}>
  <span className="club-polaroid-visual"><span aria-hidden="true">✳</span><img src={url} alt={caption} loading="eager" decoding="async" onError={event=>{event.currentTarget.style.display="none";}}/></span><span>{caption}</span>
 </button>;
}
export default function ClubAmigosExperience({experience,letterText,photoMedia=[],audioMedia=[],soundtrackMedia,sceneTextOverrides,customerGift=false}:Props){
 const [step,setStep]=useState(0),[opened,setOpened]=useState<number[]>([]),[activePet,setActivePet]=useState(0);
 const [chatIndex,setChatIndex]=useState(0),[wheel,setWheel]=useState(-1),[giftOpen,setGiftOpen]=useState(false);
 const [playing,setPlaying]=useState(false),[confetti,setConfetti]=useState(false);
 const [doorEntering,setDoorEntering]=useState(false);
 const doorTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const soundtrackRef=useRef<HTMLAudioElement>(null);
 const name=experience.demoRecipient||"Sofi",giver=experience.demoGiver||"Tu amistad";
 const text=(value:string)=>sceneTextOverrides?.club?.[value]??value;
 const photos=stockPhotos.map((fallback,i)=>photoMedia[i]?.url||fallback);
 const letter=letterText||text("Gracias por cada plan improvisado, por escucharme hasta cuando no sé qué decir y por lograr que hasta los días normales terminen siendo recuerdos. No sé cómo habría sido todo sin vos, pero sé que me gusta mucho más así. Que nos queden mil historias por inventar.");
 const current=CHAPTERS[step];
 const next=()=>{setStep(s=>Math.min(CHAPTERS.length-1,s+1));setOpened([]);setGiftOpen(false);setWheel(-1);setChatIndex(0);setActivePet(0);};
 const enterClub=()=>{
   if(step!==0||doorEntering)return;
   setDoorEntering(true);
   try { if("vibrate" in navigator)navigator.vibrate?.([9,35,11]); } catch { /* optional */ }
   const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??false;
   doorTimer.current=setTimeout(()=>{doorTimer.current=null;next();setDoorEntering(false);},reduced?35:1110);
 };
 const prev=()=>{setStep(s=>Math.max(0,s-1));setOpened([]);setGiftOpen(false);};
 const toggle=(i:number)=>setOpened(a=>a.includes(i)?a.filter(n=>n!==i):[...a,i]);
 const replay=()=>{setStep(0);setDoorEntering(false);setOpened([]);setChatIndex(0);setGiftOpen(false);setConfetti(false);};
 useEffect(()=>{if(step===15){setConfetti(true);}else setConfetti(false);},[step]);
 useEffect(()=>()=>{soundtrackRef.current?.pause();if(doorTimer.current)clearTimeout(doorTimer.current);},[]);
 const progress=Math.round(step/(CHAPTERS.length-1)*100);
 return <main className={"club-experience experience-shell"+(step===0?" is-door":"")} data-current-scene="club" aria-label="Club de Amigos de Toda la Vida">
  {soundtrackMedia&&<audio ref={soundtrackRef} src={soundtrackMedia.url} preload="none" loop playsInline onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>}
  <div className="club-ambient" aria-hidden="true"><i/><i/><i/><i/></div>
  <header className="club-top" data-copy-ignore="true">
   <button type="button" onClick={prev} disabled={step===0} aria-label="Escena anterior">‹</button>
   <div className="club-top-progress"><span>CLUB DE AMIGOS DE TODA LA VIDA</span><div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:progress+"%"}}/></div></div>
   <span className="club-step-number">{String(step+1).padStart(2,"0")} / {CHAPTERS.length}</span>
   {soundtrackMedia&&<button type="button" className="club-sound" aria-label={playing?"Pausar música":"Escuchar música"} onClick={()=>{const a=soundtrackRef.current;if(!a)return;if(a.paused)void a.play().catch(()=>setPlaying(false));else a.pause();}}>{playing?"♫":"♪"}</button>}
  </header>
  <div className="club-stage" key={step}>
   <div className="club-chapter"><span>CAPÍTULO {String(step+1).padStart(2,"0")}</span><h2>{current[0]}</h2><p>{current[1]}</p></div>
   {step===0&&<section className={"club-door-scene"+(doorEntering?" is-entering":"")}>
     <div className="club-fairy" aria-hidden="true">✦ ✧ ✦</div>
     <button type="button" className="club-door" aria-label="Abrir la puerta del club" onClick={enterClub} disabled={doorEntering}>
      <DoorAtmosphere/>
      <span className="club-door-sign"><span>UN LUGAR AL QUE SIEMPRE VOLVER</span><strong>CLUB DE<br/>AMIGOS<br/>DE TODA LA VIDA</strong><em>♥ DESDE QUE NOS CONOCIMOS ♥</em></span>
      <span className="club-door-knob" aria-hidden="true"/>
     </button>
     <p className="club-intro-line">{text("Hay amistades tan especiales que merecen tener un lugar secreto solo para ellas.")}</p>
     <button className="club-primary club-door-action" onClick={enterClub} disabled={doorEntering}>{doorEntering?"ENTRANDO AL CLUB…":"TOCÁ PARA ENTRAR"} <span>↗</span></button>
     <span className="club-door-veil" aria-hidden="true"/>
   </section>}
   {step===1&&<section className="club-meet-scene">
     <div className="club-lightbulbs" aria-hidden="true">✦ · ✦ · ✦</div>
     <h3>{text("Reunimos a toda la banda para hablar de nuestra historia.")}</h3>
     <div className="club-pet-gallery">{CATS.map((c,i)=><div key={c.name} className="club-pet-card"><Pet index={i} onClick={()=>setActivePet(i)}/><span>{c.role}</span></div>)}</div>
     <div className="club-speech-card" aria-live="polite"><b>{CATS[activePet].name} dice:</b><p>{text(["¡Llegó nuestra persona favorita!","Traje recuerdos. Y algunos secretos.","Yo traje los planes para la próxima aventura.","Atención, esto va a ponerse emotivo.","¿Alguien trajo comida?"][activePet])}</p></div>
     <p className="club-hint">Tocá cada sticker para escucharlo.</p>
   </section>}
   {step===2&&<section className="club-file-scene">
     <div className="club-file-folder"><div className="club-file-tab">CONFIDENCIAL · SOLO NOSOTROS</div>
       <span className="club-file-symbol">✳</span><h3>ARCHIVO DE<br/>LA AMISTAD</h3>
       <p>PERTENECE A</p><strong>{name}</strong>
       <span className="club-file-stamp">PERSONA IRREMPLAZABLE</span>
       <p className="club-file-small">{text("Contiene historias, planes imposibles y secretos que solamente nosotros entendemos.")}</p>
     </div><div className="club-file-pet"><Pet index={1} small speech="¡Este archivo es top secret!"/></div>
   </section>}
   {step===3&&<section className="club-memory-scene">
     <h3>{text("¿Te acordás de cómo empezó todo?")}</h3>
     <div className="club-memory-photos">
      <Photograph url={photos[0]} caption={text("El comienzo de algo increíble")} tilt={-8} onClick={()=>toggle(0)}/>
      <Photograph url={photos[1]} caption={text("Y la primera de mil aventuras")} tilt={7} onClick={()=>toggle(1)}/>
     </div>
     <p className="club-memory-caption">{opened.length?text("Sin darnos cuenta, un día cualquiera se convirtió en el principio de nuestra historia."):text("Tocá nuestras fotos para descubrir lo que esconden.")}</p>
     <Pet index={0} small speech={opened.length?"¡Y mirá todo lo que vino después!":"Esto merece un álbum entero."}/>
   </section>}
   {step===4&&<section className="club-notes-scene">
     <h3>{text("Cosas que solo nosotros entendemos")}</h3><p>Seis papelitos. Demasiada historia.</p>
     <div className="club-note-grid">{notes.map((n,i)=><button key={i} className={"club-note club-note--"+i%4+(opened.includes(i)?" is-open":"")} onClick={()=>toggle(i)} type="button"><span>{opened.includes(i)?text(n):["UN SECRETO","UNA VERDAD","NO CONTAR","ARCHIVO 04","JAJAJA","ENTRE NOS"][i]}</span><small>{opened.includes(i)?"♥":"TOCAR PARA GIRAR ↻"}</small></button>)}</div>
     <div className="club-note-bottom"><Pet index={3} small speech={opened.length>3?"Lo sabíamos. ¡Son un caso perdido!":"Que nadie encuentre estos papelitos."}/></div>
   </section>}
   {step===5&&<section className="club-map-scene"><h3>{text("Un mapa lleno de historias")}</h3><p>{text("No importa dónde. Importa con quién.")}</p><div className="club-map-board"><span className="club-map-line" aria-hidden="true"/>{locations.map((l,i)=><button key={l} type="button" className={"club-map-pin pin"+i+(opened.includes(i)?" active":"")} onClick={()=>toggle(i)}><b>✦</b><span>{text(l)}</span></button>)}</div><Pet index={2} small speech={text("Nos faltan un montón de lugares por conocer.")}/></section>}
   {step===6&&<section className="club-chat-scene"><h3>{text("Un chat que debería ser patrimonio cultural")}</h3><div className="club-phone-chat"><div className="club-chat-title"><span className="club-chat-avatar">✿</span><div><strong>La banda ♥</strong><small>5 miembros · siempre conectados</small></div></div>
    {chats.slice(0,chatIndex+1).map(([who,msg],i)=><div key={i} className={"club-chat-msg"+(i%2?" from-right":"")}><span>{who}</span><p>{text(msg)}</p></div>)}
    <button type="button" className="club-chat-more" onClick={()=>setChatIndex(n=>(n+1)%chats.length)}>{chatIndex===chats.length-1?"VOLVER A LEER ↻":"RECIBIR MENSAJE 💬"}</button></div>
    <div className="club-chat-pet"><Pet index={chatIndex} small/></div>
   </section>}
   {step===7&&<section className="club-weather-scene"><div className="club-weather-title"><span>PRONÓSTICO ESPECIAL</span><h3>CLIMA DE NUESTRA<br/>AMISTAD</h3></div><div className="club-weather-list">{weather.map(([icon,label,value],i)=><button key={i} type="button" onClick={()=>setActivePet(i)} className={"club-weather-row"+(activePet===i?" active":"")}><span>{icon}</span><span>{text(label)}<small>{text(value)}</small></span></button>)}</div><Pet index={activePet} small speech={text("Pronóstico para hoy y para siempre: nos tenemos.")}/></section>}
   {step===8&&<section className="club-night-scene"><div className="club-night-stars" aria-hidden="true">✦　✧　✧　✦　✦</div><div className="club-night-glow">♡</div><h3>{text("En los buenos días y en los no tan buenos…")}</h3><p>{text("Qué lindo saber que del otro lado siempre hay alguien que escucha, acompaña y se queda.")}</p><div className="club-night-friends"><Pet index={2} small/><Pet index={3} small/></div><span className="club-night-sign">{text("Gracias por ser ese lugar seguro.")}</span></section>}
   {step===9&&<section className="club-song-scene"><span className="club-song-kicker">LA BANDA SONORA OFICIAL</span><div className="club-record" aria-hidden="true"><div className="club-record-center">♥</div></div><h3>{text("Hay canciones que suenan a nosotros.")}</h3><p>{text("Y aunque cambien los años, siempre nos van a llevar a los mismos recuerdos.")}</p>
    {audioMedia.length>0?<div className="club-player"><audio controls playsInline preload="none" src={audioMedia[0].url}/><small>{audioMedia[0].caption||"Nuestro audio especial"}</small></div>:
    <div className="club-no-audio"><span>♫</span><small>Acá podrá sonar el audio que quieras dedicarle.</small></div>}
    <Pet index={0} small speech="Dale play a nuestra historia."/></section>}
   {step===10&&<section className="club-wheel-scene"><h3>{text("La ruleta de los planes imposibles")}</h3><div className={"club-wheel"+(wheel>=0?" has-spun":"")}><div className="club-wheel-center">✳</div></div>
    <button type="button" className="club-primary" onClick={()=>setWheel(n=>(n+1)%4)}>{wheel<0?"GIRAR LA RULETA ↻":"OTRO PLAN ↻"}</button>
    <div className="club-wheel-result" aria-live="polite">{wheel<0?"El próximo recuerdo está esperando…":text(["Escapada sin planear nada","Noche de películas y charla eterna","Un viaje lleno de anécdotas","Hacer realidad esa idea pendiente"][wheel])}</div>
    <Pet index={4} small speech="Prometo llevar los snacks."/></section>}
   {step===11&&<section className="club-future-scene"><h3>{text("Todo lo que todavía nos falta")}</h3><p>Cuatro deseos por descubrir.</p><div className="club-wish-list">{wishes.map((w,i)=><button key={i} onClick={()=>toggle(i)} type="button" className={"club-wish"+(opened.includes(i)?" is-open":"")}><span>{opened.includes(i)?"♥":"✉"}</span><strong>{opened.includes(i)?text(w):"Abrir deseo "+(i+1)}</strong></button>)}</div><Pet index={1} small speech="Yo firmo todos estos planes."/></section>}
   {step===12&&<section className="club-treasure-scene"><h3>{text("Un tesoro de momentos")}</h3><div className={"club-treasure"+(opened.includes(0)?" unlocked":"")}><button type="button" className="club-treasure-lid" onClick={()=>toggle(0)} aria-label="Abrir el cofre de recuerdos">{opened.includes(0)?"✧":"🔐"}<span>{opened.includes(0)?"NUESTROS RECUERDOS":"TOCAR PARA ABRIR"}</span></button>{opened.includes(0)&&<div className="club-treasure-photos">{photos.map((url,i)=><Photograph key={i} url={url} caption={text(["Esa risa","Ese día","Otra aventura","Siempre juntos"][i])} tilt={i%2?6:-6}/>)}</div>}</div><p>{text("Porque las mejores cosas no se guardan en una caja. Se quedan con nosotros.")}</p></section>}
   {step===13&&<section className="club-letter-scene"><span className="club-letter-kicker">UNA CARTA, SIN FILTRO</span><div className="club-letter-sheet"><div className="club-letter-clip">♡</div><h3>Para {name}:</h3><p>{letter}</p><div className="club-letter-sign">Con todo mi cariño,<br/><strong>{giver}</strong></div></div><Pet index={3} small speech="Ahora sí... un poquito de emoción."/></section>}
   {step===14&&<section className="club-gift-scene"><h3>{text("Un último regalito para vos")}</h3><div className="club-gift-wrap"><button type="button" className={"club-gift-box"+(giftOpen?" unwrapped":"")} onClick={()=>setGiftOpen(!giftOpen)} aria-label="Revelar sorpresa">{giftOpen?"💌":"🎁"}</button><span>{giftOpen?"DESDE EL CORAZÓN":"TOCÁ PARA REVELAR"}</span></div>{giftOpen?<div className="club-gift-message">{text("Te regalo una promesa: seguir juntando anécdotas, abrazos y días inolvidables. La vida es mejor cuando estás en ella.")}</div>:<p>{text("Las mejores sorpresas no vienen envueltas en papel.")}</p>}</section>}
   {step===15&&<section className="club-finale-scene">{confetti&&<div className="club-confetti" aria-hidden="true">{Array.from({length:28},(_,i)=><i key={i} style={{"--i":i} as CSSProperties}/>)}</div>}
      <div className="club-finale-heart">♥</div><h3>{text("Qué suerte la nuestra de habernos encontrado.")}</h3><p>{text("Ojalá la vida nos encuentre siempre así: inventando planes, riéndonos de cualquier cosa y sabiendo que no estamos solos.")}</p>
      <div className="club-finale-pets">{CATS.map((_,i)=><Pet key={i} index={i} small/>)}</div><strong className="club-finale-brand">AMIGOS POR SIEMPRE</strong><span className="club-finale-sign">Hecho por {giver} para {name} ♡</span><button className="club-replay" type="button" onClick={replay}>↻ Volver a vivirlo</button>
      {customerGift&&<button className="club-share" type="button" onClick={()=>{if(navigator.share)void navigator.share({title:experience.title,url:location.href}).catch(()=>{});else void navigator.clipboard?.writeText(location.href);}}>Compartir experiencia ↗</button>}
    </section>}
  </div>
  {step>0&&step<15&&<footer className="club-footer" data-copy-ignore="true"><span className="club-footer-text">✦ UN RECUERDO MÁS PARA NUESTRA HISTORIA ✦</span><button type="button" className="club-primary" onClick={next}>SEGUIR DESCUBRIENDO <span>→</span></button></footer>}
  <span className="club-credit" aria-hidden="true">Te Hice Esto ♡</span>
 </main>;
}
