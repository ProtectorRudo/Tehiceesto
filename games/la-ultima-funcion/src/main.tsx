import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {TheaterWorld,type TheaterAction,type TheaterPhase} from "./TheaterWorld";
import {TheaterAudio} from "./audio";
import "./style.css";

type Invite={nombre:string;evento:string;fecha:string;hora:string;lugar:string;mensaje:string;rsvp:string};
function invitation():Invite{
  const q=new URLSearchParams(location.search);
  const get=(k:string,fallback:string)=>{const v=q.get(k)?.trim();return v?v.slice(0,160):fallback;};
  return {nombre:get("nombre","INVITADO ESPECIAL"),evento:get("evento","Una celebración inolvidable"),
    fecha:get("fecha","Próximamente"),hora:get("hora","Horario por confirmar"),
    lugar:get("lugar","El lugar de nuestra celebración"),
    mensaje:get("mensaje","Tu presencia hace que esta función sea única."),
    rsvp:get("rsvp","").replace(/\D/g,"")};
}
const steps=[
  {phase:"inicio",title:"La butaca reservada",objective:"Encontrá la fila 3, asiento 8. Revisá debajo del terciopelo."},
  {phase:"luces",title:"La consola de luces",objective:"Con la llave encontrada, restaurá la electricidad."},
  {phase:"proyector",title:"La película perdida",objective:"Descubrí la combinación de las tres ruedas del proyector."},
  {phase:"telon",title:"La última función",objective:"Subí al escenario y accioná la palanca del telón."}
];
const labels:Record<TheaterAction,string>={
  butaca:"Examinar butaca reservada",ambar:"Activar interruptor ámbar",azul:"Activar interruptor azul",
  rojo:"Activar interruptor rojo",rueda1:"Girar rueda izquierda",rueda2:"Girar rueda central",
  rueda3:"Girar rueda derecha",proyector:"Reproducir cinta",telon:"Accionar palanca del telón",programa:"Leer programa"
};
const hints:Record<TheaterPhase,string>={
  inicio:"Tu boleto dice «FILA 3 · ASIENTO 8». Buscá una butaca con una placa dorada, a la derecha del pasillo central.",
  luces:"La consola se encuentra al costado izquierdo del escenario. La vieja inscripción revela el orden: ÁMBAR, AZUL, ROJO.",
  proyector:"El proyector está a la derecha del escenario. Su combinación corresponde a la hora que marca el reloj detenido desde 1968: 03:17. Girá cada rueda física y después tocá la máquina.",
  telon:"El mecanismo final está sobre el escenario, justo frente al telón rojo. Hay una palanca con una esfera oscura.",
  final:"La función comenzó. Ahora descubrí para qué te estaban esperando."
};
function MissionLetter({name,returning,onProceed}:{name:string;returning:boolean;onProceed:()=>void}){
  return <section className={"briefing-screen"+(returning?" briefing-recall":"")} role="dialog" aria-modal="true" aria-labelledby="briefing-title" aria-describedby="briefing-summary">
    <div className="briefing-darkness" aria-hidden="true"/>
    <div className="briefing-frame">
      <div className="briefing-envelope-crest" aria-hidden="true">B</div>
      <article className="briefing-paper">
        <div className="briefing-paper-top"><span>TEATRO BELLADONNA</span><span>ARCHIVO · 1968</span></div>
        <p className="briefing-kicker">CARTA DEL ÚLTIMO TRAMOYISTA</p>
        <h2 id="briefing-title">La función que nunca terminó</h2>
        <div className="briefing-ink-rule" aria-hidden="true"/>
        <div className="briefing-body" id="briefing-summary">
          <p>En 1968, las luces del Belladonna se apagaron en plena función. <strong>Ochenta y tres espectadores desaparecieron.</strong> Nunca encontraron sus cuerpos. El teatro quedó clausurado.</p>
          <p>Esta noche llegó una entrada a nombre de <strong>{name}</strong>. Alguien abrió las puertas solo para vos. Pero el Acomodador sigue allí… y no permite que termine la función.</p>
          <p><strong>Tu misión:</strong> encontrar las pistas que dejaron los desaparecidos, devolverle la electricidad al teatro, recuperar la última película y descubrir qué oculta el telón antes de que se agote el tiempo.</p>
          <div className="briefing-ticket" aria-label="Primera pista">
            <span className="briefing-ticket-label">PRIMERA PISTA · ENTRADA RESERVADA</span>
            <strong>FILA 3 <span>·</span> ASIENTO 8</strong>
            <small>Buscá la butaca marcada con una placa dorada. Empezá por ahí.</small>
          </div>
          <p className="briefing-directions">En el celular: usá el círculo izquierdo para <strong>caminar</strong>, deslizá sobre la escena para <strong>mirar</strong> y tocá los objetos para <strong>interactuar</strong>. Si te perdés, consultá <strong>¿UNA PISTA?</strong></p>
        </div>
        <div className="briefing-paper-end">
          <span className="briefing-countdown">7 MINUTOS · 1 MINUTO EXTRA</span>
          <button className="briefing-start" onClick={onProceed}>{returning?"VOLVER AL TEATRO":"ENTENDÍ MI MISIÓN · ENTRAR"} <span aria-hidden="true">↗</span></button>
          {!returning&&<small>El tiempo empieza únicamente cuando entrás.</small>}
        </div>
        <div className="briefing-signature" aria-hidden="true">El último tramoyista</div>
      </article>
    </div>
  </section>;
}
function App(){
  const invite=useRef(invitation()).current;
  const mount=useRef<HTMLDivElement>(null);
  const world=useRef<TheaterWorld|null>(null);
  const sound=useRef(new TheaterAudio());
  const phaseRef=useRef<TheaterPhase>("inicio");
  const actionRef=useRef<(a:TheaterAction)=>void>(()=>{});
  const timerRef=useRef<number|null>(null);
  const toastTimer=useRef<number|null>(null);
  const warningCueCount=useRef(0);
  const startAt=useRef(0);const sequence=useRef(0);
  const [supported,setSupported]=useState(true);
  const [started,setStarted]=useState(false);
  const [briefingOpen,setBriefingOpen]=useState(false);
  const [briefingRecall,setBriefingRecall]=useState(false);
  const [phase,setPhaseState]=useState<TheaterPhase>("inicio");
  const [focus,setFocus]=useState<TheaterAction|null>(null);
  const [story,setStory]=useState("");
  const [toast,setToastState]=useState("");
  const [seconds,setSeconds]=useState(0);
  const [hintsOpen,setHintsOpen]=useState(false);
  const [blackout,setBlackout]=useState(false);
  const [hauntingCaption,setHauntingCaption]=useState("");
  const [reveal,setReveal]=useState(false);
  const [timedOut,setTimedOut]=useState(false);
  const [muted,setMuted]=useState(false);
  const [joystick,setJoystick]=useState({x:0,y:0});
  const [error,setError]=useState("");
  const diagnosticsEnabled=useRef(new URLSearchParams(location.search).has("diagnostico")).current;
  const [performance,setPerformance]=useState<{fps:number;pixelRatio:number;drawCalls:number;triangles:number;models:boolean}|null>(null);
  const finished=phase==="final";
  const setPhase=(p:TheaterPhase)=>{phaseRef.current=p;setPhaseState(p);world.current?.setPhase(p);sound.current.setScene(p);};
  const show=(message:string,duration=3900)=>{
    setToastState(message);
    if(toastTimer.current!==null)window.clearTimeout(toastTimer.current);
    toastTimer.current=window.setTimeout(()=>setToastState(""),duration);
  };
  const handleAction=(name:TheaterAction)=>{
    if(phaseRef.current==="final")return;
    sound.current.play("click");const current=phaseRef.current;
    if(name==="programa"){show("PROGRAMA · Fila 3, asiento 8. El orden de luces es ÁMBAR — AZUL — ROJO.",6000);return;}
    if(name==="butaca"){
      if(current==="inicio"){
        world.current?.collectKey();
        setPhase("luces");sound.current.play("found");
        setStory("Encontraste la llave del tramoyista. La consola izquierda se ha desbloqueado.");
        show("Una llave fría descansa bajo el terciopelo. Algo se movió en el balcón…",6000);
      }else show("La butaca está vacía. Ya tomaste lo que necesitabas.");
      return;
    }
    if(name==="ambar"||name==="azul"||name==="rojo"){
      if(current==="inicio"){show("Los interruptores están bloqueados. Primero encontrá tu asiento.");return;}
      if(current!=="luces"){show("El sistema de iluminación ya está sincronizado.");return;}
      const order:["ambar","azul","rojo"]=["ambar","azul","rojo"];
      if(name===order[sequence.current]){
        world.current?.markLight(sequence.current);sequence.current++;
        if(sequence.current===3){
          setPhase("proyector");sound.current.play("found");
          setStory("La electricidad volvió. Un reloj detenido guarda el código de las tres ruedas del proyector.");
          show("Las luces recorren el escenario. El acomodador ya no está donde lo viste.",6200);
        }else show("Circuito "+sequence.current+"/3 activado. Escuchás un relé detrás del muro.");
      }else{
        sequence.current=0;world.current?.resetLights();sound.current.play("wrong");
        show("Una alarma chirría. La secuencia volvió a cero. Recordá: ÁMBAR, AZUL, ROJO.");
      }
      return;
    }
    if(name==="rueda1"||name==="rueda2"||name==="rueda3"){
      if(current!=="proyector"){
        show(current==="inicio"||current==="luces"?"El mecanismo sigue apagado. Primero encendé las luces.":"Las bobinas ya están aseguradas.");
        return;
      }
      const index=Number(name.slice(-1))-1;
      world.current?.turnWheel(index);
      const values=world.current?.getWheelValues()??[0,0,0];
      show("CÓDIGO DEL PROYECTOR  ·  "+values.join("  •  "),1500);
      return;
    }
    if(name==="proyector"){
      if(current==="proyector"){
        const values=world.current?.getWheelValues();
        if(values&&values[0]===3&&values[1]===1&&values[2]===7){
          sound.current.play("found");world.current?.playRecoveredFilm();setPhase("telon");
          setStory("La cinta se proyecta. Los espectadores desaparecieron a las 03:17. El telón puede abrirse.");
          show("La película vuelve a girar. Escuchás tres golpes detrás del telón.",6200);
        }else{
          sound.current.play("wrong");
          show("La cinta se atasca. Observá el reloj del vestíbulo y corregí las ruedas.",5400);
        }
      }else if(current==="inicio"||current==="luces")show("El proyector está apagado. Primero restablecé las luces.");
      else show("La película ya se recuperó.");
      return;
    }
    if(name==="telon"){
      if(current==="telon"){
        setPhase("final");sound.current.play("curtain");
        setStory("La maquinaria del teatro vuelve a la vida.");
        show("Damas y caballeros… la función está por comenzar.",5000);
        world.current?.setRevealText(invite.nombre,invite.evento);
        world.current?.openCurtain();
        window.setTimeout(()=>{sound.current.play("success");setReveal(true);},5150);
      }else show("El telón está asegurado. Necesitás restaurar la película antes de levantarlo.");
    }
  };
  actionRef.current=handleAction;
  useEffect(()=>{
    if(!mount.current)return;
    try{
      const w=new TheaterWorld(mount.current,{
        onFocus:a=>setFocus(a),
        onAction:a=>actionRef.current(a),
        onListener:(x,y,z,fx,fy,fz,ux,uy,uz)=>sound.current.updateListener(x,y,z,fx,fy,fz,ux,uy,uz),
        onEvent:e=>{
          if(e==="apagón"){
            setBlackout(true);sound.current.play("scare");
            window.setTimeout(()=>{setBlackout(false);setStory("¿Viste al acomodador? Algo cambió cerca del escenario.");},1200);
          }else if(e==="advertencia"){
            warningCueCount.current++;
            sound.current.silenceFor(3.0);
            setHauntingCaption("...");
            window.setTimeout(()=>{
              if(phaseRef.current==="final")return;
              setHauntingCaption("«Disculpe… ese no es su asiento»");
              sound.current.speakWarning("Disculpe... ese no es su asiento.");
            },1150);
            window.setTimeout(()=>setHauntingCaption(""),10500);
          }else if(e==="presencia"){
            sound.current.play("whisper");
            if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate(20);
          }else if(e==="aparicion"){
            sound.current.play("scare");
            setHauntingCaption("NO ESTÁS SOLO");
            if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate([65,45,110]);
            window.setTimeout(()=>setHauntingCaption(""),1750);
          }else if(e==="retirada"){
            sound.current.play("steps");
            setStory("Una voz susurró detrás tuyo. El pasillo volvió a quedar vacío.");
          }else if(e==="portazo"){sound.current.play("door");show("Las puertas se cerraron detrás tuyo. La función ya comenzó.",3500);}
          else if(e==="pasos")sound.current.play("steps");
          else if(e==="susurro"){
            sound.current.play("whisper");
            if(phaseRef.current!=="final")show("«No mire hacia el palco. Todavía no…»",4300);
          }else if(e==="aplausos")sound.current.play("applause");
        }
      });
      world.current=w;
    }catch(e){
      setSupported(false);setError(e instanceof Error?e.message:"No se pudo inicializar el escenario 3D.");
    }
    return ()=>{world.current?.dispose();world.current=null;sound.current.dispose();if(timerRef.current!==null)clearInterval(timerRef.current);};
  },[]);
  useEffect(()=>{
    if(!diagnosticsEnabled)return;
    const refresh=window.setInterval(()=>{
      if(world.current)setPerformance(world.current.getPerformanceStatus());
    },1100);
    return ()=>window.clearInterval(refresh);
  },[diagnosticsEnabled]);
  const begin=()=>{
    if(started||!briefingOpen||!supported||!world.current)return;
    setBriefingOpen(false);
    sound.current.unlock();sound.current.play("found");
    setStarted(true);world.current.start();startAt.current=Date.now();
    setStory("El último espectador ha llegado. Encontrá tu butaca: fila 3, asiento 8.");
    show("«Por favor, encuentre su asiento. El director lo está esperando»",6500);
    timerRef.current=window.setInterval(()=>{
      const s=Math.floor((Date.now()-startAt.current)/1000);setSeconds(s);
      if(s>=480){
        if(timerRef.current!==null){window.clearInterval(timerRef.current);timerRef.current=null;}
        if(phaseRef.current!=="final"){setTimedOut(true);world.current?.stop();}
      }
    },250);
  };
  // Development-only QA hooks exercise the real puzzle reducer, not a fake solved screen.
  // Vite removes this block from the production build.
  if(import.meta.env.DEV)(window as Window & {
    __BELLADONNA_QA__?:{action:(a:TheaterAction)=>void; getPhase:()=>TheaterPhase; character:()=>{human:boolean;idle:boolean;walk:boolean}|undefined;usher:()=>{headBone:boolean;chestBone:boolean;periodCap:boolean;insignia:boolean;eyeContact:boolean;rigOffset:number}|undefined;viewUsher:()=>boolean; wheels:()=>[number,number,number]|undefined; aim:(a:TheaterAction)=>boolean; cinema:()=>{projectorModel:boolean;director:boolean;threatVisible:boolean;act:TheaterPhase}|undefined; warning:()=>{stage:string;seen:boolean}|undefined; forceWarning:()=>boolean; advanceWarning:()=>boolean; turnBehind:()=>boolean; finishWarning:()=>boolean; warningCues:()=>number;}
  }).__BELLADONNA_QA__={
    action:a=>actionRef.current(a),getPhase:()=>phaseRef.current,character:()=>world.current?.getCharacterStatus(),usher:()=>world.current?.getUsherDetails(),viewUsher:()=>world.current?.viewUsherForTest()??false,wheels:()=>world.current?.getWheelValues(),aim:a=>world.current?.aimAtForTest(a)??false,cinema:()=>world.current?.getCinematicStatus(),warning:()=>world.current?.getWarningStatus(),forceWarning:()=>world.current?.forceWarningForTest()??false,advanceWarning:()=>world.current?.advanceWarningForTest()??false,turnBehind:()=>world.current?.turnToApparitionForTest()??false,finishWarning:()=>world.current?.finishWarningForTest()??false,warningCues:()=>warningCueCount.current
  };
  const joyMove=(e:React.PointerEvent<HTMLDivElement>)=>{
    const r=e.currentTarget.getBoundingClientRect();const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    const max=r.width*.37;const n=Math.max(1,Math.hypot(dx,dy)/max);
    const x=dx/max/n,y=dy/max/n;setJoystick({x,y});world.current?.setMove(x,-y);
  };
  const minutes=(s:number)=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
  const remaining=Math.max(0,420-seconds);
  const progress=phase==="inicio"?0:phase==="luces"?1:phase==="proyector"?2:phase==="telon"?3:4;
  return <main className="app">
    <div className="scene-host" ref={mount}/>
    <div className="film-grain" aria-hidden="true"/>
    {!started&&!reveal&&!briefingOpen&&<section className="intro-screen">
      <div className="intro-corners" aria-hidden="true"/>
      <div className="topline"><span>TEATRO BELLADONNA</span><span>EST. 1968</span></div>
      <div className="intro-central">
        <p className="overline">UNA EXPERIENCIA INTERACTIVA</p>
        <div className="ornament">✦</div>
        <h1>LA ÚLTIMA<br/><em>FUNCIÓN</em></h1>
        <p className="premise">83 espectadores desaparecieron aquella noche.<br/>La función nunca terminó.</p>
        <p className="intro-person">Pero hoy… <strong>{invite.nombre}</strong> tiene una entrada reservada.</p>
        {!supported&&<p className="error">{error||"Se necesita un dispositivo compatible con WebGL2."}</p>}
        <button className="main-cta" disabled={!supported} onClick={()=>{sound.current.unlock();sound.current.play("found");setBriefingOpen(true);}}>ABRIR LAS PUERTAS <span>↗</span></button>
        {!supported&&<button className="text-button accessible-reveal" onClick={()=>{setReveal(true);setStarted(true);}}>VER MI INVITACIÓN SIN 3D</button>}
        <p className="micro">Usá auriculares para una mejor experiencia · 7 minutos</p>
      </div>
      <div className="intro-bottom"><span>ÚLTIMO ACTO</span><span>SOLO HAY UNA SALIDA</span><span>DECORADOS CC0: POLY HAVEN</span></div>
    </section>}
    {!started&&!reveal&&briefingOpen&&<MissionLetter name={invite.nombre} returning={false} onProceed={begin}/>}
    {started&&!reveal&&<div className="hud">
      {diagnosticsEnabled&&performance&&<aside className="perf-panel" aria-label="Diagnóstico gráfico">
        <strong>DIAGNÓSTICO 3D</strong>
        <span>{performance.fps} FPS · {performance.drawCalls} draw calls</span>
        <span>{performance.triangles.toLocaleString("es-AR")} triángulos · escala {performance.pixelRatio}×</span>
        <span>{performance.models?"Texturas y proyector PBR activos":"Cargando recursos PBR…"}</span>
      </aside>}
      <header className="hud-header">
        <div className="hud-brand"><span className="hud-spark">✦</span><div>LA ÚLTIMA FUNCIÓN<small>TEATRO BELLADONNA</small></div></div>
        <div className="hud-right">
          <button className="icon-button" onClick={()=>{const v=!muted;setMuted(v);sound.current.setMuted(v);}} aria-label={muted?"Activar audio":"Silenciar audio"}>{muted?"♩̸":"♫"}</button>
          <span className={"timer "+(seconds>=420?"timer-alert":"")}>{seconds<420?minutes(remaining):"+"+minutes(Math.max(0,480-seconds))}<small>{seconds>=420?"TIEMPO EXTRA":"RESTANTE"}</small></span>
        </div>
      </header>
      {!finished&&<div className="mission">
        <span className="mission-index">ACTO {progress+1} / 4</span>
        <div className="mission-title">{steps[Math.min(progress,3)].title}</div>
        <p className="mission-objective">{steps[Math.min(progress,3)].objective}</p>
        <div className="mission-bar"><span style={{width:(progress/4)*100+"%"}}/></div>
      </div>}
      {story&&<div className="story-caption">{story}</div>}
      <div className="crosshair" aria-hidden="true"><i/><i/></div>
      {hauntingCaption&&<div className="haunting-caption" role="status">{hauntingCaption}</div>}
      {focus&& !hintsOpen&& !timedOut&& !finished&&<div className="interaction">
        <span className="interaction-label">{labels[focus]}</span>
        <button onClick={()=>world.current?.activate()}>INTERACTUAR <span>✦</span></button>
      </div>}
      <div className="game-bottom">
        <div className="joystick-area" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);joyMove(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))joyMove(e);}} onPointerUp={()=>{setJoystick({x:0,y:0});world.current?.setMove(0,0);}} onPointerCancel={()=>{setJoystick({x:0,y:0});world.current?.setMove(0,0);}}>
          <div className="joystick-ring"><div className="joystick-knob" style={{transform:"translate("+(joystick.x*30)+"px,"+(joystick.y*30)+"px)"}}/></div>
          <small>MOVER</small>
        </div>
        <div className="right-controls">
          <span className="drag-tip">DESLIZÁ PARA MIRAR ↔</span>
          <button className="story-button" onClick={()=>{setHintsOpen(false);setBriefingRecall(true);}}>VER MI MISIÓN <span>✦</span></button>
          <button className="hint-button" onClick={()=>setHintsOpen(v=>!v)}>¿UNA PISTA? <span>?</span></button>
        </div>
      </div>
      <div className="desktop-tip">W A S D PARA CAMINAR · MOUSE PARA MIRAR · E PARA INTERACTUAR</div>
      {toast&&<div role="status" className="toast">{toast}</div>}
      {briefingRecall&&<MissionLetter name={invite.nombre} returning={true} onProceed={()=>setBriefingRecall(false)}/>}
      {hintsOpen&& <div className="modal-scrim" onClick={()=>setHintsOpen(false)}>
        <div className="clue-card" onClick={e=>e.stopPropagation()}>
          <p className="overline">DEL DIARIO DEL TRAMOYISTA</p><h2>Una pista del teatro</h2><p>{hints[phase]}</p>
          <button onClick={()=>setHintsOpen(false)}>VOLVER A LA FUNCIÓN</button>
        </div>
      </div>}
      {timedOut&&!finished&&<div className="modal-scrim">
        <div className="clue-card">
          <p className="overline">LA FUNCIÓN SE INTERRUMPIÓ</p><h2>El teatro vuelve a quedar en silencio.</h2>
          <p>El minuto adicional terminó. Todavía podés volver a intentarlo.</p>
          <button onClick={()=>location.reload()}>REINICIAR PARTIDA</button>
          <button className="text-button" onClick={()=>setReveal(true)}>CONSULTAR LA INVITACIÓN</button>
        </div>
      </div>}
      <div className={"blackout "+(blackout?"visible":"")} aria-hidden="true"/>
    </div>}
    {reveal&&<section className="finale-screen">
      <div className="finale-glow"/>
      <div className="finale-confetti" aria-hidden="true">{Array.from({length:25},(_,i)=><i key={i} style={{left:(i*41%100)+"%",animationDelay:(i*.13)+"s",animationDuration:(3.5+i%5)+"s"}}/>)}</div>
      <p className="overline">EL TEATRO BELLADONNA PRESENTA</p>
      <div className="ornament">✦</div>
      <p className="finale-announce">Nunca fuiste un espectador más.</p>
      <h1>VOS ERAS<br/><em>EL INVITADO</em></h1>
      <article className="invitation-ticket">
        <div className="ticket-top">UNA FUNCIÓN IRREPETIBLE <span>ADMIT ONE · ★</span></div>
        <div className="ticket-body">
          <p>LA CELEBRACIÓN MÁS ESPERADA</p><h2>{invite.evento}</h2>
          <div className="ticket-rule"/>
          <div className="invite-data"><div><small>FECHA</small><strong>{invite.fecha}</strong></div><div><small>HORA</small><strong>{invite.hora}</strong></div></div>
          <div className="invite-place"><small>LUGAR</small><strong>{invite.lugar}</strong></div>
          <p className="message">{invite.mensaje}</p>
          <small className="exclusive">ENTRADA PERSONAL E INTRANSFERIBLE · {invite.nombre}</small>
        </div>
      </article>
      {invite.rsvp&&<a className="main-cta rsvp" target="_blank" rel="noopener noreferrer" href={"https://wa.me/"+invite.rsvp+"?text="+encodeURIComponent("¡Confirmo mi asistencia a "+invite.evento+"!")}>CONFIRMAR ASISTENCIA ↗</a>}
      <p className="finale-end">Ahora sí… podemos comenzar.</p>
    </section>}
  </main>;
}
createRoot(document.getElementById("root")!).render(<App/>);
