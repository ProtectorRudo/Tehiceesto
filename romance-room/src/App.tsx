import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import {World} from './scene/World';
import {AudioEngine} from './game/AudioEngine';
import {RushClock} from './game/RushClock';
import {applyAction,formatRemaining,initialProgress,safeReplyLink,type Progress,type PuzzleAction} from './game/logic';
import './ui/style.css';

type Invitation = {recipient:string;sender:string;question:string;message:string;date:string;place:string;replyPhone:string;voiceUrl:string};
type Modal='intro'|'clock'|'gramophone'|'code'|'letter'|'final'|'timeout'|'accepted'|null;
const copy=[
  {title:'El reloj detenido',hint:'Revisá el escritorio: hay una llave y la hora escrita en la nota. Después, ajustá el reloj.',task:'Encontrá la llave y poné el reloj en marcha.'},
  {title:'La melodía escondida',hint:'El cuaderno habla del color de una noche bajo la lluvia. Probá el disco azul.',task:'Descubrí cuál de los tres discos guarda la melodía correcta.'},
  {title:'El cajón cerrado',hint:'Detrás tuyo hay tres cuadros con símbolos. Leé los números de LUNA, ESTRELLAS y FLOR, en ese orden.',task:'Encontrá la combinación de tres cifras.'},
  {title:'El orden secreto',hint:'La carta muestra la secuencia exacta: LUNA, LLUVIA, FLOR. Tocá esos tres libros especiales en orden.',task:'Activá los libros que pueden mover la biblioteca.'},
  {title:'La última campanada',hint:'Atravesá la puerta de cristal. En el jardín, encendé las tres farolas de izquierda a derecha antes de que termine el tiempo.',task:'¡Encendé las tres luces antes de que cierre el jardín!'},
  {title:'Un instante detenido',hint:'Acercate a la mesa del jardín y tocá la pequeña caja de regalo.',task:'Acercate a la mesa. Alguien dejó algo para vos.'}
];
const fallback:Invitation={recipient:'Alguien muy especial',sender:'Alguien que quiere sorprenderte',question:'¿Me regalás una noche juntos?',message:'No necesitaba una fecha especial. Solo quería vivir una noche inolvidable con vos.',date:'Una fecha por descubrir',place:'Un lugar que todavía es secreto',replyPhone:'',voiceUrl:''};
const loadProgress=():Progress=>{try{const s=JSON.parse(localStorage.getItem('ultima-campanada-v1')||'null');if(s&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=5)return {...initialProgress,...s,stage:s.stage as Progress['stage']}}catch{/* ignore corrupted progress */}return initialProgress};
export default function App(){
  const canvas=useRef<HTMLCanvasElement>(null);
  const world=useRef<World|null>(null);
  const audio=useRef<AudioEngine|null>(null);
  const progressRef=useRef<Progress>(loadProgress());
  const rushClock=useRef(new RushClock());
  const startedRush=useRef(false);
  const lastTick=useRef(-1);
  const lastHint=useRef(false);
  const [progress,setProgress]=useState<Progress>(progressRef.current);
  const [invitation,setInvitation]=useState<Invitation>(fallback);
  const [modal,setModal]=useState<Modal>('intro');
  const [notification,setNotification]=useState('');
  const [showHelp,setShowHelp]=useState(false);
  const [muted,setMuted]=useState(false);
  const [remaining,setRemaining]=useState(120000);
  const [hour,setHour]=useState(12);
  const [minute,setMinute]=useState(0);
  const [code,setCode]=useState('');
  const [started,setStarted]=useState(false);
  const [webglError,setWebglError]=useState(false);
  const [focusedAction,setFocusedAction]=useState<string|null>(null);
  const [backgroundPaused,setBackgroundPaused]=useState(false);
  const [position,setPosition]=useState({x:0,z:5.5});
  const toastTimer=useRef<number|null>(null);

  const toast=useCallback((message:string)=>{setNotification(message);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setNotification(''),4700)},[]);
  const update=useCallback((action:PuzzleAction)=>{
    const {next,success,feedback}=applyAction(progressRef.current,action);
    progressRef.current=next;setProgress(next);toast(feedback);
    if(success){audio.current?.success();if('vibrate' in navigator)navigator.vibrate?.([20,35,20]);}
    world.current?.setStage(next.stage);world.current?.setLanterns(next.lanterns);
    if(next.stage===4&&progressRef.current.rushing&&!startedRush.current){
      startedRush.current=true;rushClock.current.start(performance.now());setRemaining(120000);audio.current?.playRush();toast('¡El jardín está por cerrar! Encontrá las tres luces.');
    }
    if(next.stage===5){rushClock.current.stop();audio.current?.finale();toast('El tiempo se detuvo. Acercate a la mesa del jardín.');}
    if(action.type==='CODE'&&success)setModal('letter');
    return {next,success};
  },[toast]);
  const onInteract=useCallback((what:string,sub?:string)=>{
    const stage=progressRef.current.stage;
    if(what==='desk'){
      if(stage===0&&!progressRef.current.keyFound){
        const next={...progressRef.current,keyFound:true};progressRef.current=next;setProgress(next);world.current?.setKeyFound(true);
        audio.current?.success();toast('Encontraste una pequeña llave de bronce. La nota dice: «9:15».');
      } else if(stage===0)toast('La nota del escritorio dice: «Todo comenzó a las 9:15».');
      else toast('Un cuaderno dice: «El azul trae de vuelta aquella canción».');
      return;
    }
    if(what==='clock') {if(stage===0)setModal('clock');else toast('El reloj vuelve a caminar, como si nada hubiera ocurrido.');return;}
    if(what==='gramophone') {if(stage===1){if(sub&&['azul','rojo','oro'].includes(sub)){const result=update({type:'RECORD',record:sub});if(result.success)setModal(null);}else setModal('gramophone')}else toast('Todavía no es momento de escuchar esa música.');return;}
    if(what==='painting'){toast(`El cuadro dice: ${sub==='LUNA'?'2':sub==='ESTRELLAS'?'7':'4'}. Un símbolo más para recordar.`);return;}
    if(what==='cabinet') {if(stage===2)setModal('code');else if(stage<2)toast('El cajón está trabado. Se oye un mecanismo musical en su interior.');else toast('El sobre ya está abierto. Recordá las tres palabras de la carta.');return;}
    if(what==='books'){if(stage===3&&sub)update({type:'BOOK',book:sub});else toast('La biblioteca guarda un mecanismo. Tal vez necesites una carta para entenderlo.');return;}
    if(what==='gardenGate'){toast(stage<4?'Esa puerta no tiene cerradura visible. Algo tendrá que moverla.':'La puerta está abierta. ¡Buscá las tres farolas en el jardín!');return;}
    if(what.startsWith('lantern')) {if(stage===4)update({type:'LANTERN',index:Number(what.slice(-1))});else toast('Una farola de cristal espera su momento.');return;}
    if(what==='present'){if(stage===5){setModal('final');audio.current?.bell(1.4);void audio.current?.playVoice(invitation.voiceUrl)}else toast('El jardín todavía no está listo para recibirte.');return;}
  },[toast,update,invitation.voiceUrl]);
  const onInteractRef=useRef(onInteract);onInteractRef.current=onInteract;

  useEffect(()=>{
    fetch('/config/invitation.json',{cache:'no-store'}).then(r=>r.ok?r.json():fallback).then(v=>{
      if(v&&typeof v.recipient==='string')setInvitation({...fallback,...v});
    }).catch(()=>{});
    const probe=document.createElement('canvas');
    if(!probe.getContext('webgl2')){setWebglError(true);return;}
    if(!canvas.current)return;
    const sound=new AudioEngine();audio.current=sound;
    const w=new World(canvas.current,{onInteract:(what,sub)=>onInteractRef.current(what,sub),onFocus:label=>setFocusedAction(label),onMove:(x,z)=>setPosition(old=>Math.round(old.x*4)===Math.round(x*4)&&Math.round(old.z*4)===Math.round(z*4)?old:{x,z})});
    world.current=w;
    w.setStage(progressRef.current.stage);w.setKeyFound(progressRef.current.keyFound);w.setLanterns(progressRef.current.lanterns);w.enableMovement(false);
    return()=>{w.dispose();sound.dispose();world.current=null;audio.current=null;if(toastTimer.current)clearTimeout(toastTimer.current)};
  },[]);
  useEffect(()=>{try{localStorage.setItem('ultima-campanada-v1',JSON.stringify(progress))}catch{/* private browsing */}},[progress]);
  useEffect(()=>{world.current?.enableMovement(started && !modal);},[started,modal]);
  useEffect(()=>{
    const timer=window.setInterval(()=>{
      if(!rushClock.current.active || rushClock.current.paused)return;
      const ms=rushClock.current.remaining(performance.now());setRemaining(ms);
      world.current?.setRushIntensity(1-ms/120000);
      const secs=Math.ceil(ms/1000);
      if(secs<=35&&!lastHint.current){lastHint.current=true;toast('¡Última pista! Encendé las farolas de izquierda a derecha: izquierda, centro y derecha.');}
      if(secs<=10 && secs>0 && secs!==lastTick.current){lastTick.current=secs;audio.current?.tick()}
      if(ms<=0){rushClock.current.stop();audio.current?.stopRush();setModal('timeout');world.current?.enableMovement(false)}
    },100);
    return()=>clearInterval(timer);
  },[toast]);
  useEffect(()=>{
    const visibility=()=>{
      if(document.hidden){
        rushClock.current.pause(performance.now());
        audio.current?.suspend();
      }else{
        const wasPaused=rushClock.current.paused;
        rushClock.current.resume(performance.now());
        if(wasPaused)setBackgroundPaused(true);
        void audio.current?.resume();
      }
    };
    document.addEventListener('visibilitychange',visibility);
    return()=>document.removeEventListener('visibilitychange',visibility);
  },[]);
  const begin=()=>{
    setStarted(true);setModal(null);void audio.current?.start();
    if(progressRef.current.stage===4){startedRush.current=true;rushClock.current.start(performance.now());setRemaining(120000);audio.current?.playRush();}
    toast(progressRef.current.stage===0?'Buscá una pequeña llave. Tal vez el escritorio esconda algo.':'Bienvenido de nuevo a la habitación.');
  };
  const resetAll=()=>{localStorage.removeItem('ultima-campanada-v1');window.location.reload()};
  const retry=()=>{const result=update({type:'RESET_RUSH'});if(result.success){rushClock.current.start(performance.now());startedRush.current=true;lastTick.current=-1;lastHint.current=false;setRemaining(120000);setModal(null);audio.current?.playRush();}};
  const confirmClock=()=>{const result=update({type:'CLOCK',hour,minute});if(result.success)setModal(null)};
  const confirmCode=()=>{const result=update({type:'CODE',code});if(result.success)setCode('')};
  const remainingMins=formatRemaining(remaining);
  const link=safeReplyLink(invitation.replyPhone,invitation.sender,invitation.recipient);
  const inGarden=position.z<-7;
  return <main className="experience">
    <canvas ref={canvas} className="world" aria-label="Escenario tridimensional interactivo" />
    <div className="grain" aria-hidden="true" />
    {webglError?<section className="unsupported card"><div className="monogram">✦</div><h1>Esta experiencia necesita WebGL2</h1><p>Probá con un navegador actualizado y aceleración gráfica activada. En este dispositivo no se puede mostrar la sala 3D.</p></section>:<>
      <header className="topbar">
        <div className="identity"><span className="diamond">✧</span><span><strong>LA ÚLTIMA CAMPANADA</strong><small>una historia que todavía no sucedió</small></span></div>
        <div className="top-controls">
          {progress.stage===4&&<div className={'clock-count '+(remaining<35000?'urgent':'')} role="timer">⌛ {remainingMins}</div>}
          <button className="icon-button" aria-label={muted?'Activar sonido':'Silenciar sonido'} onClick={()=>{audio.current?.setEnabled(muted);setMuted(!muted)}}>{muted?'♪̸':'♫'}</button>
          <button className="icon-button" aria-label="Pistas" onClick={()=>setShowHelp(v=>!v)}>?</button>
        </div>
      </header>
      {started&&<div className="mission" aria-live="polite"><span className="overline">CAPÍTULO {Math.min(progress.stage+1,6)} / 6</span><strong>{copy[progress.stage].title}</strong><span>{copy[progress.stage].task}</span></div>}
      {started&&!modal&&<div className="crosshair" aria-hidden="true"><span>✦</span></div>}
      {started&&!modal&&<div className="touch-pad" aria-hidden="true"><span className="touch-pad-knob">✦</span><small>MOVER</small></div>}
      {started&&!modal&&focusedAction&&<button className="focus-action" onClick={()=>world.current?.interactFocused()} aria-label={focusedAction}><span className="focus-sigil">✧</span>{focusedAction}</button>}
      {started&&!modal&&<div className="navigation-tip">{inGarden?'JARDÍN DE CRISTAL':'BIBLIOTECA'} · <span>deslizá para mirar · tocá para investigar · pellizcá para zoom</span></div>}
      {notification&&!modal&&<div className="toast" role="status">✧ {notification}</div>}
      {backgroundPaused&&started&&!modal&&<div className="resume-note" role="status">El reloj esperó mientras no estabas. <button onClick={()=>setBackgroundPaused(false)}>Continuar ✧</button></div>}
      {showHelp&&<div className="help-panel"><button className="mini-close" onClick={()=>setShowHelp(false)}>×</button><span className="overline">UNA AYUDA DEL DESTINO</span><h3>{copy[progress.stage].title}</h3><p>{copy[progress.stage].hint}</p><p className="help-controls">Computadora: W A S D + arrastrar. Celular: deslizar a la izquierda para caminar, a la derecha para mirar. Pellizcá para zoom.</p><button className="quiet-link" onClick={()=>setShowHelp(false)}>Entendido</button></div>}
      {modal&&<div className="modal-scrim" role="presentation"><section className={'card story '+(modal==='final'||modal==='accepted'?'romantic':'')} role="dialog" aria-modal="true">
        {modal==='intro'&&<><div className="monogram">✦</div><span className="overline">UN MENSAJE SIN REMITENTE</span><h1>Hay una noche que todavía no existe.</h1><p>Alguien dejó algo preparado para vos detrás de la última puerta. Nadie puede contarte qué es. Solo esta habitación guarda la respuesta.</p><blockquote>«No todas las historias comienzan cuando abrimos una puerta. Algunas empiezan cuando decidimos buscarla».</blockquote><p className="footnote">Explorá la habitación y resolvé sus secretos. Usá auriculares para vivir mejor la experiencia.</p><button className="primary" onClick={begin}>Aceptar el misterio <span>→</span></button></>}
        {modal==='clock'&&<><button className="close" aria-label="Cerrar" onClick={()=>setModal(null)}>×</button><span className="overline">MECANISMO I</span><h2>El reloj detenido</h2><p>La llave encaja, pero las agujas necesitan la hora correcta. ¿Qué decía la nota?</p><div className="dial"><div className="dial-rim"><div className="dial-hands" style={{'--hand-hour':`${hour*30+minute*.5}deg`,'--hand-minute':`${minute*6}deg`} as CSSProperties}><div className="hour-hand"/><div className="minute-hand"/><i/></div><span className="twelve">XII</span><span className="three">III</span><span className="six">VI</span><span className="nine">IX</span></div></div><div className="time-controls"><label>HORA<div className="stepper"><button onClick={()=>setHour(v=>(v+10)%12+1)}>−</button><strong>{String(hour).padStart(2,'0')}</strong><button onClick={()=>setHour(v=>v%12+1)}>+</button></div></label><label>MINUTOS<div className="stepper"><button onClick={()=>setMinute(v=>(v+55)%60)}>−</button><strong>{String(minute).padStart(2,'0')}</strong><button onClick={()=>setMinute(v=>(v+5)%60)}>+</button></div></label></div><button className="primary" onClick={confirmClock}>Dar cuerda al reloj →</button></>}
        {modal==='gramophone'&&<><button className="close" aria-label="Cerrar" onClick={()=>setModal(null)}>×</button><span className="overline">MECANISMO II</span><h2>La canción que faltaba</h2><p>Hay tres discos antiguos. Solo uno conserva la melodía que puede mover el siguiente mecanismo.</p><div className="record-row">{(['rojo','azul','oro'] as const).map(col=><button key={col} className={'record '+col} onClick={()=>{const r=update({type:'RECORD',record:col});if(r.success)setModal(null)}}><span className="vinyl"/><small>{col==='oro'?'DORADO':col.toUpperCase()}</small></button>)}</div><p className="footnote">Una frase del cuaderno habla del color de la lluvia.</p></>}
        {modal==='code'&&<><button className="close" aria-label="Cerrar" onClick={()=>setModal(null)}>×</button><span className="overline">MECANISMO III</span><h2>El cajón sellado</h2><p>Debajo de la cerradura están grabados tres símbolos: <b>☾ ✶ ✿</b></p><div className="code-display" aria-label="Combinación introducida">{[0,1,2].map(i=><span key={i}>{code[i]||'·'}</span>)}</div><div className="keypad">{['1','2','3','4','5','6','7','8','9','←','0','✓'].map(key=><button key={key} onClick={()=>key==='←'?setCode(s=>s.slice(0,-1)):key==='✓'?confirmCode():setCode(s=>s.length<3?s+key:s)}>{key}</button>)}</div><p className="footnote">Los cuadros de la pared guardan las cifras. Tocá ✓ para abrir.</p></>}
        {modal==='letter'&&<><div className="monogram">✉</div><span className="overline">UNA CARTA ENCONTRADA</span><h2>Para quien llegó hasta aquí...</h2><p className="letter">Hay momentos que todavía no vivimos, pero que ya tengo ganas de recordar con vos.</p><p className="letter">Si algo en esta habitación cambia, seguí estas palabras en orden:</p><div className="sequence">☾ LUNA <span>→</span> ☂ LLUVIA <span>→</span> ✿ FLOR</div><p>Algo se oculta entre los libros de la biblioteca.</p><button className="primary" onClick={()=>setModal(null)}>Continuar la búsqueda →</button></>}
        {modal==='timeout'&&<><div className="monogram">⌛</div><span className="overline">ÚLTIMA CAMPANADA</span><h2>El jardín cerró sus puertas.</h2><p>Algunas oportunidades merecen un segundo intento. Conservás todo lo que resolviste: solo vas a repetir el desafío final.</p><button className="primary" onClick={retry}>Volver a intentar · 2 minutos →</button></>}
        {modal==='final'&&<><div className="monogram heart">♥</div><span className="overline">TODO ESTE MISTERIO ERA PARA VOS</span><h1>{invitation.recipient},<br/>{invitation.question}</h1><p className="love-line">{invitation.message}</p><div className="invitation-details"><div><span>CUÁNDO</span><strong>{invitation.date}</strong></div><div><span>DÓNDE</span><strong>{invitation.place}</strong></div></div><p className="signature">Con cariño, <b>{invitation.sender}</b></p><button className="primary" onClick={()=>{audio.current?.finale();setModal('accepted')}}>Sí, acepto esta invitación ♥</button></>}
        {modal==='accepted'&&<><div className="celebrate" aria-hidden="true">✦ ✧ ♡ ✦ ✧ ♡ ✦</div><div className="monogram heart">♥</div><span className="overline">EL TIEMPO SE DETUVO PARA ESTE MOMENTO</span><h1>Nuestra próxima noche acaba de empezar.</h1><p>Lo más hermoso de esta historia es que todavía falta vivirla.</p>{link?<a className="primary" href={link} target="_blank" rel="noopener noreferrer">Confirmar por WhatsApp ♥</a>:<p className="footnote">Ahora podés responder personalmente a quien preparó esta sorpresa.</p>}<button className="quiet-link" onClick={()=>setModal(null)}>Volver al jardín</button></>}
      </section></div>}
      {started&&<button className="restart" onClick={resetAll} title="Reiniciar toda la experiencia">↻ Reiniciar</button>}
    </>}
  </main>;
}
