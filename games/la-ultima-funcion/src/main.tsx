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
  {phase:"inicio",title:"La butaca reservada",objective:"Seguí los carteles de las filas y la numeración de los respaldos hasta encontrar fila 3, asiento 8."},
  {phase:"luces",title:"La consola de luces",objective:"Recuperá el fusible, insertalo en la consola y activá los tres circuitos en orden."},
  {phase:"proyector",title:"La película perdida",objective:"Investigá el Palco 1, buscá una bobina entre las butacas y recuperá la proyección perdida."},
  {phase:"telon",title:"La última función",objective:"Subí al escenario y accioná la palanca del telón."}
];
const labels:Record<TheaterAction,string>={
  butaca:"Examinar butaca reservada",fusible:"Recoger fusible de porcelana",portafusible:"Insertar el fusible en la consola",bobina:"Recoger bobina perdida",montar:"Montar la bobina en el proyector",enfoque:"Girar aro de enfoque",palco:"Examinar el palco 1",ambar:"Activar interruptor ámbar",azul:"Activar interruptor azul",
  rojo:"Activar interruptor rojo",rueda1:"Girar rueda izquierda",rueda2:"Girar rueda central",
  rueda3:"Girar rueda derecha",proyector:"Reproducir cinta",telon:"Accionar palanca del telón",programa:"Leer programa"
};
const hints:Record<TheaterPhase,string>={
  inicio:"Alguien dejó una entrada reservada. Las pequeñas placas de bronce en los respaldos podrían ayudarte a encontrar lo que buscan de vos.",
  luces:"El panel no está averiado del todo: le falta una pieza. Leé el viejo programa del tramoyista; el orden de una función importa tanto como el principio y el final.",
  proyector:"Los espectadores nunca se llevaron sus recuerdos al escenario. Revisá las primeras filas. Después observá la lente y buscá una fecha que se repita en el teatro: a veces el tiempo es la clave.",
  telon:"No todo lo importante está en la pantalla. Escuchá la maquinaria y acercate al lugar donde comienza cada función.",
  final:"Las respuestas no siempre están detrás del telón."
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
            <small>Las filas están señalizadas junto al pasillo central. Cada respaldo tiene un número. Encontrá el 8 en la tercera fila.</small>
          </div>
          <p className="briefing-directions">En el celular: usá el círculo izquierdo para <strong>caminar</strong>, deslizá sobre la escena para <strong>mirar</strong> y tocá los objetos para <strong>interactuar</strong>. Si te perdés, consultá <strong>¿UNA PISTA?</strong></p>
        </div>
        <div className="briefing-paper-end">
          <span className="briefing-countdown">9 MINUTOS · 1 MINUTO EXTRA</span>
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
  const ghostHuntStarted=useRef(false);
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
  const fuseHeld=useRef(false),fuseReady=useRef(false),reelHeld=useRef(false),reelReady=useRef(false),focusReady=useRef(0);
  const [boxEncountered,setBoxEncountered]=useState(false);
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
    if(name==="programa"){show("PROGRAMA DEL TRAMOYISTA · Atardecer, noche, alarma: ÁMBAR — AZUL — ROJO.",6600);return;}
    if(name==="palco"){
      show("PALCO 1 · El cortinaje parece moverse. Mirá hacia arriba, a la izquierda del escenario.",5000);return;
    }
    if(name==="fusible"){
      if(fuseHeld.current){show("Ya tenés el fusible. Buscá el portafusible de la consola.");return;}
      fuseHeld.current=true;world.current?.collectFuse();sound.current.play("found");
      setStory("Encontraste un fusible antiguo. Tenés que conectarlo al panel eléctrico.");
      show("FUSIBLE RECUPERADO · Encastralo en la consola izquierda.",5200);return;
    }
    if(name==="portafusible"){
      if(!fuseHeld.current){show("La consola no tiene fusible. Buscá el repuesto de porcelana en un estante cercano.");return;}
      if(!fuseReady.current){
        fuseReady.current=true;world.current?.installFuse();sound.current.play("found");
        show("FUSIBLE COLOCADO · Activá los circuitos en el orden que indica el programa.",6000);
      }else show("El fusible ya está colocado.");
      return;
    }
    if(name==="bobina"){
      if(reelHeld.current){show("Ya recuperaste la bobina.");return;}
      reelHeld.current=true;world.current?.collectReel();sound.current.play("found");
      show("BOBINA RECUPERADA · Montala en el eje del proyector.",5200);return;
    }
    if(name==="montar"){
      if(current!=="proyector"){show("Sin electricidad no podés montar la cinta.");return;}
      if(!reelHeld.current){show("Necesitás encontrar la bobina. Revisá los asientos cercanos a la entrada.");return;}
      if(!reelReady.current){world.current?.mountReel();reelReady.current=world.current?.getMechanicalStatus().reelMounted??false;if(reelReady.current){sound.current.play("found");show("BOBINA MONTADA · La pantalla la reconoce. Ajustá la lente.",5400);}else show("No se pudo fijar la bobina. Intentá otra vez.");}
      else show("Ya montaste la bobina.");
      return;
    }
    if(name==="enfoque"){
      if(current!=="proyector"){show("El enfoque no funciona sin electricidad.");return;}
      focusReady.current=world.current?.rotateFocus()??0;
      show("ENFOQUE · "+focusReady.current+"/3"+(focusReady.current===2?" · IMAGEN NÍTIDA":" · IMAGEN BORROSA"),3300);
      return;
    }
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
      if(!fuseReady.current){show("Primero tenés que instalar el fusible de porcelana.",5000);return;}
      const order:["ambar","azul","rojo"]=["ambar","azul","rojo"];
      if(name===order[sequence.current]){
        world.current?.markLight(sequence.current);sequence.current++;
        if(sequence.current===3){
          setPhase("proyector");sound.current.play("found");
          setStory("Volvió la electricidad… pero hay alguien detrás de la cortina del Palco 1, arriba a la izquierda. Mirá.");
          show("Las luces vuelven. En el Palco 1 hay alguien mirándote.",6200);
        }else show("Circuito "+sequence.current+"/3 activado. Escuchás un relé detrás del muro.");
      }else{
        sequence.current=0;world.current?.resetLights();world.current?.triggerFailedCircuit();sound.current.play("wrong");
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
        if(!reelReady.current&&!world.current?.getMechanicalStatus().reelMounted){show(reelHeld.current?"Tenés la bobina, pero falta encastrarla en el eje del proyector.":"El proyector necesita su bobina. Buscá entre las butacas de la entrada.",5200);return;}
        if(focusReady.current!==2){show("La imagen está borrosa. Ajustá el enfoque físico a la marca 2.",5200);return;}
        if(values&&values[0]===3&&values[1]===1&&values[2]===7){
          sound.current.play("found");world.current?.playRecoveredFilm();setPhase("telon");
          setStory("Una filmación prohibida recorre las butacas vacías. Algo se mueve arriba, en el Palco 1.");
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
        show("El telón se detiene a mitad de camino. Una voz murmura: todavía no terminó.",6100);
        world.current?.setRevealText(invite.nombre,invite.evento);
        window.setTimeout(()=>{world.current?.openCurtain();sound.current.play("curtain");setHauntingCaption("LA ÚLTIMA FUNCIÓN… SOS VOS");},2250);
        window.setTimeout(()=>{sound.current.play("success");setReveal(true);setHauntingCaption("");},7300);
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
          if(e==="electricidad"){
            setBlackout(true);sound.current.play("scare");
            setStory("Hay alguien en el PALCO 1. Está inmóvil… pero su cabeza sigue cada movimiento tuyo.");
            window.setTimeout(()=>{setBlackout(false);setHauntingCaption("TE ESTÁN MIRANDO DESDE EL PALCO 1");},760);
            window.setTimeout(()=>setHauntingCaption(""),5100);
          }else if(e==="fallo_luces"){
            sound.current.play("wrong");setBlackout(true);
            window.setTimeout(()=>setBlackout(false),400);
            show("DESCARGA ELÉCTRICA · Alguien está detrás tuyo.",4500);
          }else if(e==="palco_aparicion"){
            setBoxEncountered(false);
            setStory("Se abrió una cortina en el PALCO 1, arriba a la izquierda. Algo te está observando.");
          }else if(e==="palco_visto"){
            setBoxEncountered(true);sound.current.play("scare");
            setHauntingCaption("TE ESTÁ MIRANDO");
            if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate([100,60,140]);
            window.setTimeout(()=>setHauntingCaption(""),2600);
          }else if(e==="palco_desvanecido"){
            sound.current.play("door");
            setStory("El Palco 1 quedó vacío. Ahora alguien camina entre los asientos y te está buscando.");
          }else if(e==="film_terror"){
            sound.current.play("whisper");
            show("ARCHIVO BELLADONNA · LA CINTA MUESTRA UNA FILA DE ESPECTADORES DESAPARECIDOS.",6000);
          }else if(e==="final_falso"){
            setBlackout(true);sound.current.play("scare");
            setHauntingCaption("LA FUNCIÓN NO TERMINÓ");
            window.setTimeout(()=>{setBlackout(false);setHauntingCaption("");},2100);
          }else if(e==="apagón"){
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
            if(phaseRef.current!=="final")show("«No levantes la vista al PALCO 1… Hay alguien ahí.»",5300);
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
      sound.current.setTension(Math.min(1,s/540));
      if(s>=420&&!ghostHuntStarted.current&&phaseRef.current!=="final"){
        if(world.current?.releaseSpecterIntoAudience()){
          ghostHuntStarted.current=true;sound.current.enterHunt();sound.current.play("scare");
          setStory("DESAPARECIÓ DEL PALCO 1. AHORA ESTÁ ENTRE LOS ASIENTOS… Y TE BUSCA.");
          setHauntingCaption("DESAPARECIÓ DEL PALCO. ESTÁ ENTRE LOS ASIENTOS.");
          if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate([180,90,220]);
          window.setTimeout(()=>setHauntingCaption(""),6500);
        }
      }
      if(s>=600){
        if(timerRef.current!==null){window.clearInterval(timerRef.current);timerRef.current=null;}
        if(phaseRef.current!=="final"){setTimedOut(true);world.current?.stop();}
      }
    },250);
  };
  // Development-only QA hooks exercise the real puzzle reducer, not a fake solved screen.
  // Vite removes this block from the production build.
  if(import.meta.env.DEV)(window as Window & {
    __BELLADONNA_QA__?:{action:(a:TheaterAction)=>void; getPhase:()=>TheaterPhase; seatNumbers:()=>{rows:number;perRow:number;numbered:number;digits:number;target:string;targetPosition?:number[]}|undefined;viewNumberedSeat:()=>boolean;viewRowSignage:()=>boolean; boxes:()=>{count:number;names:string[];labels:boolean[]};viewBox:()=>boolean;usherGround:()=>{position:number[];stageBoundary:number;safe:boolean;footAnchors?:{footBones:number;footError:number}}; character:()=>{human:boolean;idle:boolean;walk:boolean}|undefined;usher:()=>{headBone:boolean;chestBone:boolean;periodCap:boolean;insignia:boolean;eyeContact:boolean;rigOffset:number}|undefined;viewUsher:()=>boolean; wheels:()=>[number,number,number]|undefined; aim:(a:TheaterAction)=>boolean; cinema:()=>{projectorModel:boolean;director:boolean;threatVisible:boolean;act:TheaterPhase}|undefined; warning:()=>{stage:string;seen:boolean}|undefined; forceWarning:()=>boolean; advanceWarning:()=>boolean; turnBehind:()=>boolean; finishWarning:()=>boolean; warningCues:()=>number;mechanics:()=>{fuseInstalled:boolean;reelMounted:boolean;focus:number;boxFigure:boolean;boxVisible:boolean;boxSeen:boolean;actorGround?:{footBones:number;footError:number;anchorY:number}}|undefined;viewMechanical:()=>boolean;viewFigure:()=>boolean;}
  }).__BELLADONNA_QA__={
    action:a=>actionRef.current(a),getPhase:()=>phaseRef.current,seatNumbers:()=>world.current?.getSeatNumberingStatus(),viewNumberedSeat:()=>world.current?.viewNumberedSeatForTest()??false,viewRowSignage:()=>world.current?.viewRowSignageForTest()??false,boxes:()=>world.current?.getPrivateBoxesStatus()??{count:0,names:[],labels:[]},viewBox:()=>world.current?.viewPrivateBoxForTest()??false,usherGround:()=>world.current?.getUsherGroundingStatus()??{position:[0,0,0],stageBoundary:-11.12,safe:false},character:()=>world.current?.getCharacterStatus(),usher:()=>world.current?.getUsherDetails(),viewUsher:()=>world.current?.viewUsherForTest()??false,wheels:()=>world.current?.getWheelValues(),aim:a=>world.current?.aimAtForTest(a)??false,cinema:()=>world.current?.getCinematicStatus(),warning:()=>world.current?.getWarningStatus(),forceWarning:()=>world.current?.forceWarningForTest()??false,advanceWarning:()=>world.current?.advanceWarningForTest()??false,turnBehind:()=>world.current?.turnToApparitionForTest()??false,finishWarning:()=>world.current?.finishWarningForTest()??false,warningCues:()=>warningCueCount.current,mechanics:()=>world.current?.getMechanicalStatus(),viewMechanical:()=>world.current?.viewMechanicalPartsForTest()??false,viewFigure:()=>world.current?.viewBoxFigureForTest()??false
  };
  const joyMove=(e:React.PointerEvent<HTMLDivElement>)=>{
    const r=e.currentTarget.getBoundingClientRect();const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    const max=r.width*.37;const n=Math.max(1,Math.hypot(dx,dy)/max);
    const x=dx/max/n,y=dy/max/n;setJoystick({x,y});world.current?.setMove(x,-y);
  };
  const minutes=(s:number)=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
  const remaining=Math.max(0,540-seconds);
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
        <p className="micro">Usá auriculares para una mejor experiencia · 9 minutos + 1 extra</p>
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
          <span className={"timer "+(seconds>=540?"timer-alert":"")}>{seconds<540?minutes(remaining):"+"+minutes(Math.max(0,600-seconds))}<small>{seconds>=540?"TIEMPO EXTRA":"RESTANTE"}</small></span>
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
      {phase==="proyector"&&!boxEncountered&&!finished&&<div className="balcony-callout" role="status">
        <span aria-hidden="true">↑</span>
        <span>PALCO 1 · ARRIBA A LA IZQUIERDA</span>
        <button className="balcony-look-button" onClick={()=>{
          if(!world.current?.lookToBalcony())show("La figura está llegando al palco. Mirá arriba a la izquierda.",4200);
        }}>MIRAR PALCO 1 <span aria-hidden="true">↗</span></button>
      </div>}
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
