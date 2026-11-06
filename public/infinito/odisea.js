/* TE HICE ESTO · EL PROBLEMA MÁS LINDO DEL UNIVERSO
 * MODEL v3 / isolated immersive demo. Personalization ONLY in CONTENT.
 * This experience is deliberately staged: every chapter has its own physical interaction.
 */
(function(){
"use strict";
const mount=document.getElementById("infinito-app");
if(!mount || mount.dataset.immersive==="yes")return;
mount.dataset.immersive="yes";

const CONTENT=Object.freeze({
  recipient:"vos",
  sender:"Alguien que tuvo muchísima suerte de encontrarte",
  memories:[
    "Tu risa arregla hasta los martes más largos.",
    "Me gusta hasta cuando preguntás qué comemos por quinta vez.",
    "Mi lugar favorito sigue siendo estar cerquita tuyo."
  ],
  photo:"https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85",
  note:"No hay planeta, estrella ni universo que alcance para explicar lo importante que sos para mí. Si pudiera elegir un lugar entre todos los que existen, volvería a elegir uno muy sencillo: al lado tuyo.",
  signature:"Te quiero hasta donde no llegan los mapas. ♡",
  recording:""
});
const PROVIDED=window.THI_INFINITO_CONFIG||{};
const copy=Object.assign({},CONTENT,PROVIDED);
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const ART={
 earth:"https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/1/1-bluemarble_west.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
 sun:"https://d2pn8kiwq2w21t.cloudfront.net/original_images/contentdamsciencepsdphotojournalpiapia26pia26681PIA26681.jpg",
 galaxy:"https://science.nasa.gov/wp-content/uploads/2023/04/hubble_m51-jpg-e1688472875538.webp"
};
const LABELS=["PORTADA","LA TIERRA","EL SOL","LAS ESTRELLAS","EL UNIVERSO","LA OFICINA","UN RECUERDO","PARA VOS"];
let scene=0,completed=false,changing=false,starsFound=new Set(),earthTurn=0,hold=0,holdFrom=0,holdFrame=0,previousClientX=0,voice=null,ctx=null,starCanvas=null,stars=[],raf=0,paintGeneration=0,particles=[];
const safe=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const imageOk=s=>typeof s==="string" && (/^https:\/\//i.test(s)||/^data:image\//i.test(s));
const imageSrc=imageOk(copy.photo)?copy.photo:CONTENT.photo;
const waiting=()=>!completed;

function nebula(){
 return '<div class="mx-nebula mx-nebula-a"></div><div class="mx-nebula mx-nebula-b"></div><div class="mx-grain"></div>';
}
function header(){
 return '<header class="mx-top"><a href="https://tehiceesto.com/" class="mx-logo" aria-label="Volver a Te Hice Esto">te hice esto <span>✳</span></a><span class="mx-chapter-number">'+(scene===0?'EDICIÓN INFINITA':"CAPÍTULO "+String(scene).padStart(2,"0")+" / 07")+'</span><button class="mx-sound" data-act="sound" aria-label="Alternar sonido" aria-pressed="'+(window.mxSoundEnabled?"true":"false")+'">'+(window.mxSoundEnabled?'♪':'♫')+'</button></header>';
}
function footer(){
 return '<footer class="mx-footer"><span>UN REGALO QUE SE VIVE</span><div class="mx-progress">'+Array.from({length:7},(_,i)=>'<i class="'+(i<scene?'is-lit':'')+'"></i>').join("")+'</div><span>'+(scene===0?"COMENZÁ CUANDO QUIERAS":scene===7?"PARA SIEMPRE":"DESLIZÁ EL DESTINO")+'</span></footer>';
}
function action(text,next="Siguiente descubrimiento"){
 return '<button class="mx-next" data-act="next"><span>'+safe(text||next)+'</span><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 20h25m-12-12 12 12-12 12" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></button>';
}
function navBack(){return scene>1?'<button class="mx-back" data-act="back" aria-label="Volver a la escena anterior">↶ Volver</button>':'';}
function phrase(text){return '<div class="mx-phrase"><span>✦ HALLAZGO EXTRAORDINARIO</span><p>'+safe(text)+'</p></div>';}
function intro(){
 return '<div class="mx-intro"><div class="mx-intro-heading"><span class="mx-eyebrow">UN EXPEDIENTE TAN ABSURDO COMO VERDADERO</span><h1>El problema<br><em>más lindo</em><br>del universo<span class="mx-point">.</span></h1><p>Quise encontrar algo tan grande como lo que siento por vos.<br>La ciencia no estaba preparada.</p></div>'+
 '<div class="mx-orrery" aria-hidden="true"><div class="mx-orrery-sky"></div><div class="mx-orrery-ring mx-ring-a"></div><div class="mx-orrery-ring mx-ring-b"></div><div class="mx-orrery-ring mx-ring-c"></div><div class="mx-orrery-center"><span>∞</span></div><div class="mx-orrery-satellite mx-sat-a"></div><div class="mx-orrery-satellite mx-sat-b"></div><div class="mx-orrery-satellite mx-sat-c"></div><div class="mx-orrery-caption">OBSERVATORIO DE LAS COSAS IMPOSIBLES<br><b>CASO N.º 000∞</b></div></div>'+
 '<div class="mx-intro-bottom"><span class="mx-invitation">INVITACIÓN PERSONAL <i>✦</i> UN SOLO DESTINATARIO</span><button class="mx-begin" data-act="next">INICIAR EXPEDICIÓN <span>↗</span></button><small>Duración aproximada: un ratito. Consecuencias: posibles sonrisas.</small></div></div>';
}
function earth(){
 return '<section class="mx-stage mx-earth-stage"><div class="mx-story"><span class="mx-eyebrow">01 / DONDE EMPIEZA TODO</span><h1>Primero fui hasta <em>la Tierra.</em></h1><p>Un planeta entero. Parecía suficiente.</p></div>'+
 '<div class="mx-theatre mx-earth-theatre"><div class="mx-guide mx-guide-left">DIÁMETRO<br><b>12.742 KM</b></div><div class="mx-planet-shadow"></div><div class="mx-earth-rings mx-earth-rings-one"></div><div class="mx-earth-rings mx-earth-rings-two"></div><div class="mx-earth-planet" role="button" tabindex="0" aria-label="Girar la Tierra" data-gesture="earth"><img draggable="false" alt="La Tierra vista desde el espacio" src="'+ART.earth+'"><div class="mx-earth-gloss"></div></div><span class="mx-planet-cross mx-cross-a">+</span><span class="mx-planet-cross mx-cross-b">+</span><div class="mx-guide mx-guide-right">LA ÚNICA TIERRA<br>EN LA QUE ESTÁS VOS</div></div>'+
 '<div class="mx-lower">'+(completed?phrase("La recorrí completa. Igual me queda chica... como la sábana cuando te la robás."):'<div class="mx-gesture"><span class="mx-gesture-arrow">↔</span><strong>HACÉ GIRAR EL PLANETA</strong><small>Deslizá el dedo sobre la Tierra.</small></div>')+
 (completed?action("Entonces probé con algo ardiente"):'<button class="mx-text-action" data-act="complete">O tocá acá para continuar ↗</button>')+navBack()+'</div></section>';
}
function sun(){
 return '<section class="mx-stage mx-sun-stage"><div class="mx-story"><span class="mx-eyebrow">02 / HACÍA FALTA MÁS CALOR</span><h1>Le pedí ayuda <em>al Sol.</em></h1><p>Uno solo puede contener más de un millón de Tierras.</p></div>'+
 '<div class="mx-theatre mx-sun-theatre"><span class="mx-sun-ring mx-sun-ring1"></span><span class="mx-sun-ring mx-sun-ring2"></span><div class="mx-sun-halo"></div><div class="mx-sun-body" role="button" tabindex="0" aria-label="Mantener presionado para encender el Sol" data-gesture="sun"><img src="'+ART.sun+'" alt="Superficie solar, fotografía astronómica" draggable="false"><span class="mx-sun-light"></span></div><svg class="mx-charge-svg" viewBox="0 0 340 340" aria-hidden="true"><circle cx="170" cy="170" r="159" fill="none" stroke="rgba(255,228,183,.16)" stroke-width="2"/><circle class="mx-charge-circle" cx="170" cy="170" r="159" fill="none" stroke="#ffdab4" stroke-linecap="round" stroke-width="4" stroke-dasharray="1000" stroke-dashoffset="1000" transform="rotate(-90 170 170)"/></svg><div class="mx-sun-numbers"><span>FUSIÓN ENERGÉTICA</span><strong>1.392.700 KM</strong></div></div>'+
 '<div class="mx-lower">'+(completed?phrase("Me pidió que dejara de compararlo con tu sonrisa. Se puso colorado. Bastante colorado."):'<div class="mx-gesture"><span class="mx-gesture-arrow">◎</span><strong>ENCENDÉ NUESTRA ESTRELLA</strong><small>Mantené presionado el Sol hasta que brille.</small></div>')+
 (completed?action("A ver qué dicen las estrellas"):'<button class="mx-text-action" data-act="complete">Encender con un toque ↗</button>')+navBack()+'</div></section>';
}
function galaxy(){
 const positions=[{x:"21%",y:"25%"},{x:"73%",y:"32%"},{x:"57%",y:"69%"}];
 const buttons=positions.map((p,i)=>'<button class="mx-star-pick '+(starsFound.has(i)?'mx-star-picked':'')+'" style="left:'+p.x+';top:'+p.y+'" data-star="'+i+'" aria-label="Descubrir estrella '+(i+1)+'"><span>✦</span><i>'+String(i+1).padStart(2,"0")+'</i></button>').join("");
 const found=Array.from(starsFound);
 const clue=found.length?'<div class="mx-galaxy-reveal"><span>RECUERDO '+found.length+'/3</span><p>'+safe(copy.memories[found[found.length-1]]||CONTENT.memories[0])+'</p></div>':'<div class="mx-galaxy-reveal mx-galaxy-muted">Hay tres estrellas que tienen algo tuyo.</div>';
 return '<section class="mx-stage mx-galaxy-stage"><div class="mx-story"><span class="mx-eyebrow">03 / CONSULTA AL CIELO</span><h1>Interrogué a <em>las estrellas.</em></h1><p>Encontré tres pruebas que apuntaban a vos.</p></div>'+
 '<div class="mx-theatre mx-galaxy-theatre"><div class="mx-galaxy-haze"></div><div class="mx-galaxy-photo"><img src="'+ART.galaxy+'" draggable="false" alt="Galaxia espiral fotografiada por Hubble"></div><div class="mx-galaxy-constellation">'+buttons+'</div><div class="mx-galaxy-coordinates">03 ESTRELLAS · '+found.length+' ENCONTRADAS</div></div>'+
 '<div class="mx-lower">'+(completed?phrase("Casualidad cósmica: las tres tenían tu nombre. Bastante sospechoso.") : clue)+(completed?action("¿Y si probamos con TODO el universo?"):'<div class="mx-gesture"><strong>TOCÁ LAS TRES ESTRELLAS QUE BRILLAN</strong><small>Cada una guarda un secreto.</small></div>')+navBack()+'</div></section>';
}
function universe(){
 return '<section class="mx-stage mx-universe-stage"><div class="mx-story"><span class="mx-eyebrow">04 / ÚLTIMO INTENTO CIENTÍFICO</span><h1>Entonces traje <em>todo.</em></h1><p>Sí, TODO el universo. Hasta los lugares que nadie conoce.</p></div>'+
 '<div class="mx-theatre mx-universe-theatre"><div class="mx-universe-cloud"></div><div class="mx-universe-vortex"><div class="mx-vortex-layer mx-vortex-a"></div><div class="mx-vortex-layer mx-vortex-b"></div><div class="mx-vortex-layer mx-vortex-c"></div><div class="mx-vortex-layer mx-vortex-d"></div></div><div class="mx-universe-aim"><span>+</span></div><div class="mx-universe-hud"><span>UNIVERSO OBSERVABLE</span><strong>≈ 92.000 MILLONES DE AÑOS LUZ</strong></div><div class="mx-universe-error" aria-live="polite"><span>ATENCIÓN • UNIDADES AGOTADAS</span><strong>ERROR<br>∞</strong><small>Ni el universo alcanza.<br>Consultá en otra ventanilla.</small></div></div>'+
 '<div class="mx-lower">'+(completed?phrase("La calculadora renunció. Saturno pidió un día libre. Y yo seguía sin poder medirlo."):'<div class="mx-gesture"><strong>AMPLIÁ LA ESCALA HASTA EL INFINITO</strong><small>Arrastrá el medidor de izquierda a derecha.</small><input type="range" aria-label="Ampliar escala del universo" class="mx-scale" id="mx-universe-scale" min="0" max="100" value="0"><div class="mx-scale-labels"><span>TIERRA</span><span>∞</span></div></div>')+
 (completed?action("Abrir un reclamo cósmico"):'<button class="mx-text-action" data-act="complete">Saltar a escala infinita ↗</button>')+navBack()+'</div></section>';
}
function clerkSvg(){
 return '<svg class="mx-clerk-svg" viewBox="0 0 260 210" aria-label="Un pequeño funcionario intergaláctico desbordado" role="img"><defs><linearGradient id="mxcg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#89b2ad"/><stop offset="1" stop-color="#3a6868"/></linearGradient></defs><path d="M101 169c-21-22-34-40-32-74 4-46 39-75 75-70 44 4 69 40 67 83-1 26-12 51-28 64" fill="url(#mxcg)" stroke="#345755" stroke-width="4"/><path d="M87 55 67 33l-11 17m113-15 16-23 14 15" fill="none" stroke="#668d86" stroke-width="13" stroke-linecap="round"/><ellipse cx="111" cy="106" rx="30" ry="38" fill="#eaf0d9"/><ellipse cx="175" cy="106" rx="28" ry="38" fill="#eaf0d9"/><circle class="mx-clerk-eye" cx="116" cy="111" r="8" fill="#273f3d"/><circle class="mx-clerk-eye" cx="174" cy="111" r="8" fill="#273f3d"/><path d="M102 81Q129 76 141 93Q151 78 183 81" fill="none" stroke="#4d6862" stroke-width="5" stroke-linecap="round"/><path d="M134 148q10 13 21-2" fill="none" stroke="#305856" stroke-width="4" stroke-linecap="round"/><path d="M88 170q-21 4-25 18m135-18q22 4 25 20" fill="none" stroke="#345755" stroke-width="10" stroke-linecap="round"/><path d="M111 172c0 0 8 21 32 21 30 0 42-22 42-22" fill="#f1d9c7" stroke="#be997f" stroke-width="2"/><path d="m140 174 3 17 8-18" fill="#a46458"/><path d="M97 71q18-13 36-3m30 0q17-13 32 0" stroke="#345755" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="94" y="89" width="45" height="31" rx="15" stroke="#9b704c" stroke-width="4" fill="none"/><rect x="150" y="89" width="43" height="31" rx="15" stroke="#9b704c" stroke-width="4" fill="none"/><path d="M139 101h11" stroke="#9b704c" stroke-width="4"/></svg>';
}
function bureau(){
 return '<section class="mx-stage mx-bureau-stage"><div class="mx-story mx-story-bureau"><span class="mx-eyebrow">05 / UN PEQUEÑO CONTRATIEMPO</span><h1>Me derivaron a <em>otra oficina.</em></h1><p>Departamento Intergaláctico de Cosas Imposibles.</p></div>'+
 '<div class="mx-theatre mx-bureau-theatre"><div class="mx-clerk">'+clerkSvg()+'<div class="mx-clerk-bubble">¿Otra persona enamorada?<br>Ay, hoy no llego a casa...</div></div><div class="mx-dossier"><div class="mx-clip"></div><div class="mx-dossier-title">DEPARTAMENTO DE LAS COSAS IMPOSIBLES<br><b>FORMULARIO 001 · CASO URGENTE</b></div><div class="mx-dossier-lines"><span>Objeto a medir: <b>AMOR</b></span><span>Unidad solicitada: <b>INFINITO</b></span><span>Resultado: <b>NO APLICA</b></span></div><button class="mx-stamp" data-act="complete" aria-label="Sellar el expediente">SELLAR<br>INFORME <span>↓</span></button><div class="mx-stamp-mark">INMEDIBLE<br><b>♡</b></div></div><div class="mx-desk-shadow"></div></div>'+
 '<div class="mx-lower">'+(completed?phrase("El funcionario dijo que lo nuestro supera todas las unidades conocidas. Me dio un sello y se fue a merendar."):'<div class="mx-gesture"><strong>NECESITAN TU FIRMA</strong><small>Presioná el sello del expediente.</small></div>')+(completed?action("Volver a la Tierra, por un motivo especial"):'')+navBack()+'</div></section>';
}
function memory(){
 return '<section class="mx-stage mx-memory-stage"><div class="mx-story"><span class="mx-eyebrow">06 / EL DESCUBRIMIENTO DE VERDAD</span><h1>Entonces entendí <em>algo.</em></h1><p>No estaba buscando en el lugar correcto.</p></div>'+
 '<div class="mx-theatre mx-memory-theatre"><div class="mx-memory-halo"></div><div class="mx-memory-photo"><img src="'+safe(imageSrc)+'" alt="Un momento especial para recordar" loading="eager"><div class="mx-memory-reflection"></div><span>DE TODOS LOS LUGARES, ESTE ES EL MÍO</span></div><div class="mx-memory-cloud" data-gesture="memory"><span class="mx-memory-cloud-top">EL CIELO ESTABA MIRANDO<br>EN OTRA DIRECCIÓN...</span><div class="mx-memory-finger">Deslizá para revelar <b>↗</b></div></div><span class="mx-memory-spark mx-ms-a">✦</span><span class="mx-memory-spark mx-ms-b">✧</span></div>'+
 '<div class="mx-lower">'+(completed?phrase("No era el tamaño del universo. Eran esos momentos chiquitos en los que todo se vuelve enorme cuando estás vos."):'<div class="mx-gesture"><strong>CORRÉ EL CIELO CON TU DEDO</strong><small>Deslizá sobre el recuerdo.</small></div>')+(completed?action("Todavía falta lo más importante"):'<button class="mx-text-action" data-act="complete">Descubrir el recuerdo ↗</button>')+navBack()+'</div></section>';
}
function letter(){
 return '<section class="mx-stage mx-letter-stage"><div class="mx-story"><span class="mx-eyebrow">07 / PARA GUARDAR EN EL CORAZÓN</span><h1>No encontré medida.<br><em>Encontré la respuesta.</em></h1><p>Esto era lo que quería decirte desde el principio.</p></div>'+
 '<div class="mx-theatre mx-letter-theatre"><span class="mx-letter-spark mx-ls-a">✧</span><span class="mx-letter-spark mx-ls-b">✦</span><span class="mx-letter-spark mx-ls-c">✧</span><div class="mx-letter-envelope"><div class="mx-letter-page"><span class="mx-letter-head">PARA '+safe(copy.recipient).toUpperCase()+'</span><p>'+safe(copy.note)+'</p><small>'+safe(copy.signature)+'</small><span class="mx-letter-from">— '+safe(copy.sender)+'</span></div><div class="mx-envelope-back"></div><div class="mx-envelope-flap"></div><div class="mx-envelope-front"></div><button class="mx-envelope-seal" data-act="complete" aria-label="Romper el sello y abrir la carta"><span>♡</span></button></div></div>'+
 '<div class="mx-lower">'+(completed?phrase("Si alguna vez te olvidás de cuánto te quiero, volvé a abrir este pequeño universo."):'<div class="mx-gesture"><strong>SOLO FALTA UNA COSA</strong><small>Tocá el sello para abrir tu carta.</small></div>')+
 (completed?'<div class="mx-last-controls">'+(copy.recording?'<button class="mx-voice" data-act="voice">♫ Escuchar un mensaje para vos</button>':'')+'<button class="mx-next" data-act="restart">Volver a sentirlo <span>↺</span></button><button class="mx-text-action" data-act="share">Compartir este regalo ↗</button></div>':'')+navBack()+'</div></section>';
}
function render(){
 mount.innerHTML='<main class="mx-experience mx-scene-'+scene+(completed?' mx-completed':'')+'" data-stage="'+scene+'">'+nebula()+'<canvas id="mx-stars" aria-hidden="true"></canvas><div class="mx-app">'+header()+[intro,earth,sun,galaxy,universe,bureau,memory,letter][scene]()+footer()+'</div><div class="mx-transition" aria-hidden="true"><span>✦</span></div><div class="mx-flashes" aria-hidden="true"></div></main>';
 mount.querySelectorAll("[data-act]").forEach(el=>el.addEventListener("click",()=>handle(el.dataset.act)));
 mount.querySelectorAll("[data-star]").forEach(el=>el.addEventListener("click",()=>pickStar(Number(el.dataset.star),el)));
 const earthEl=mount.querySelector('[data-gesture="earth"]');
 if(earthEl)setupEarth(earthEl);
 const sunEl=mount.querySelector('[data-gesture="sun"]');
 if(sunEl)setupSun(sunEl);
 const memoryEl=mount.querySelector('[data-gesture="memory"]');
 if(memoryEl)setupMemory(memoryEl);
 const scale=mount.querySelector("#mx-universe-scale");
 if(scale)scale.addEventListener("input",e=>{const value=Number(e.target.value);const sceneEl=mount.querySelector(".mx-universe-stage");if(sceneEl)sceneEl.style.setProperty("--progress",String(value/100));if(value>=93)finish();});
 const keyboard=mount.querySelectorAll('[role="button"][data-gesture]');keyboard.forEach(el=>el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();finish();}}));
 paintStars();
}
function handle(action){
 if(action==="next")go(scene+1);
 if(action==="restart")go(0);
 if(action==="back")go(scene-1);
 if(action==="complete")finish();
 if(action==="voice"){if(!copy.recording||!/^https:\/\//.test(copy.recording))return;if(!voice)voice=new Audio(copy.recording);if(voice.paused)voice.play().catch(()=>{});else voice.pause();}
 if(action==="share"){if(navigator.share)navigator.share({title:"El problema más lindo del universo",url:location.href}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(location.href).catch(()=>{});}
 if(action==="sound"){window.mxSoundEnabled=!window.mxSoundEnabled; sound("tick");const b=mount.querySelector('.mx-sound');if(b){b.textContent=window.mxSoundEnabled?"♪":"♫";b.setAttribute("aria-pressed",String(!!window.mxSoundEnabled));}}
}
function sound(which){
 if(!window.mxSoundEnabled)return;
 try{const ac=window.mxCtx||(window.mxCtx=new (window.AudioContext||window.webkitAudioContext)());const t=ac.currentTime;
  const frequencies=which==="win"?[523,659,784]:[460];
  frequencies.forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.setValueAtTime(f,t+i*.075);g.gain.setValueAtTime(.0001,t+i*.075);g.gain.exponentialRampToValueAtTime(.042,t+i*.075+.025);g.gain.exponentialRampToValueAtTime(.0001,t+i*.075+.32);o.connect(g);g.connect(ac.destination);o.start(t+i*.075);o.stop(t+i*.075+.35);});}catch{}
}
function go(next){
 if(changing || next<0 || next>7)return;
 changing=true;const el=mount.querySelector(".mx-experience");if(el)el.classList.add("mx-leaving");
 setTimeout(()=>{scene=next;completed=false;starsFound.clear();earthTurn=0;changing=false;cancelAnimationFrame(holdFrame);clearTimeout(hold);render();scrollTo({top:0,behavior:"instant"});},reduced?30:600);
}
function finish(){
 if(completed||changing||scene===0)return;
 completed=true;cancelAnimationFrame(holdFrame);clearTimeout(hold);sound("win");
 const el=mount.querySelector(".mx-experience");if(el)el.classList.add("mx-completed");
 if(scene===4){const scale=mount.querySelector("#mx-universe-scale");if(scale)scale.value="100";}
 if(scene===7){const seal=mount.querySelector(".mx-envelope-seal");if(seal)seal.disabled=true;}
 burst(); // Preserve active 3D scene and give the reveal its own timing.
 const lower=mount.querySelector(".mx-lower");
 if(lower){
  const old=lower.querySelector(".mx-gesture");if(old)old.remove();
  const pending=lower.querySelector(".mx-text-action");if(pending)pending.remove();
  const copyHTML= [null,null,null,null,null,null,null,null];
  let content="";
  if(scene===1)content=phrase("La recorrí completa. Igual me queda chica... como la sábana cuando te la robás.")+action("Entonces probé con algo ardiente");
  if(scene===2)content=phrase("Me pidió que dejara de compararlo con tu sonrisa. Se puso colorado. Bastante colorado.")+action("A ver qué dicen las estrellas");
  if(scene===3)content=phrase("Casualidad cósmica: las tres tenían tu nombre. Bastante sospechoso.")+action("¿Y si probamos con TODO el universo?");
  if(scene===4)content=phrase("La calculadora renunció. Saturno pidió un día libre. Y yo seguía sin poder medirlo.")+action("Abrir un reclamo cósmico");
  if(scene===5)content=phrase("El funcionario dijo que lo nuestro supera todas las unidades conocidas. Me dio un sello y se fue a merendar.")+action("Volver a la Tierra, por un motivo especial");
  if(scene===6)content=phrase("No era el tamaño del universo. Eran esos momentos chiquitos en los que todo se vuelve enorme cuando estás vos.")+action("Todavía falta lo más importante");
  if(scene===7)content=phrase("Si alguna vez te olvidás de cuánto te quiero, volvé a abrir este pequeño universo.")+'<div class="mx-last-controls">'+(copy.recording?'<button class="mx-voice" data-act="voice">♫ Escuchar un mensaje para vos</button>':'')+'<button class="mx-next" data-act="restart">Volver a sentirlo <span>↺</span></button><button class="mx-text-action" data-act="share">Compartir este regalo ↗</button></div>';
  const previous=lower.querySelector(".mx-phrase");if(previous)previous.remove();
  const g=lower.querySelector(".mx-galaxy-reveal");if(g)g.remove();
  const b=lower.querySelector(".mx-next");if(b)b.remove();
  const nextNav=lower.querySelector(".mx-back");
  lower.insertAdjacentHTML("afterbegin",content);
  lower.querySelectorAll('[data-act]').forEach(btn=>{if(!btn.dataset.bound){btn.dataset.bound="1";btn.addEventListener("click",()=>handle(btn.dataset.act));}});
 }
 const step=mount.querySelector('.mx-chapter-number');if(step)step.textContent=scene===7?"PARA SIEMPRE":step.textContent;
}
function setupEarth(el){
 let x=0,drag=0,active=false;
 el.addEventListener("pointerdown",e=>{active=true;x=e.clientX;drag=0;el.setPointerCapture?.(e.pointerId);});
 el.addEventListener("pointermove",e=>{if(!active||completed)return;const d=e.clientX-x;drag=d;earthTurn=Math.max(-170,Math.min(170,d*1.2));el.style.setProperty("--spin",earthTurn+"deg");if(Math.abs(d)>95){active=false;finish();}});
 ["pointerup","pointercancel"].forEach(ev=>el.addEventListener(ev,()=>{if(active&&Math.abs(drag)>55)finish();active=false;}));
 el.addEventListener("click",()=>{if(!completed&&Math.abs(drag)<8){el.classList.add('mx-wobble');setTimeout(()=>el.classList.remove('mx-wobble'),800);}});
}
function setupSun(el){
 let pressing=false;
 function release(){pressing=false;cancelAnimationFrame(holdFrame);if(!completed)el.style.setProperty("--charge","0");}
 function update(ts){if(!pressing)return;const progress=Math.min(1,(ts-holdFrom)/850);el.style.setProperty("--charge",String(progress));const ring=mount.querySelector(".mx-charge-circle");if(ring)ring.style.strokeDashoffset=String(1000-1000*progress);if(progress>=1){pressing=false;finish();return;}holdFrame=requestAnimationFrame(update);}
 el.addEventListener("pointerdown",e=>{if(completed)return;pressing=true;holdFrom=performance.now();el.setPointerCapture?.(e.pointerId);holdFrame=requestAnimationFrame(update);});
 ["pointerup","pointercancel","lostpointercapture"].forEach(ev=>el.addEventListener(ev,release));
}
function pickStar(i,el){
 if(completed||starsFound.has(i))return;
 starsFound.add(i);el.classList.add("mx-star-picked");sound("tick");burst(el.getBoundingClientRect());
 const count=starsFound.size;const co=mount.querySelector(".mx-galaxy-coordinates");if(co)co.textContent="03 ESTRELLAS · "+count+" ENCONTRADAS";
 const g=mount.querySelector(".mx-galaxy-reveal");if(g){g.classList.remove("mx-galaxy-muted");g.innerHTML='<span>RECUERDO '+count+'/3</span><p>'+safe(copy.memories[i]||CONTENT.memories[i])+'</p>';}
 if(count===3)setTimeout(finish,700);
}
function setupMemory(el){
 let x=null;
 el.addEventListener("pointerdown",e=>{x=e.clientX;el.setPointerCapture?.(e.pointerId);});
 el.addEventListener("pointermove",e=>{if(x===null||completed)return;const d=x-e.clientX;const amount=Math.min(100,Math.max(0,(d/160)*100));el.style.setProperty("--peel",amount+"%");if(d>125){x=null;finish();}});
 ["pointerup","pointercancel"].forEach(k=>el.addEventListener(k,e=>{if(x!==null&&x-e.clientX>65)finish();x=null;}));
}
function burst(rect){
 const target=mount.querySelector(".mx-flashes");if(!target||reduced)return;
 const box=rect||mount.querySelector('.mx-theatre')?.getBoundingClientRect();if(!box)return;
 const cx=(box.left+box.width*.5),cy=(box.top+box.height*.5);
 for(let i=0;i<24;i++){const theta=(Math.PI*2*i)/24,dist=55+Math.random()*145;const s=document.createElement("i");s.style.setProperty("--x",cx+"px");s.style.setProperty("--y",cy+"px");s.style.setProperty("--dx",(Math.cos(theta)*dist)+"px");s.style.setProperty("--dy",(Math.sin(theta)*dist)+"px");s.style.setProperty("--delay",(i%6)*20+"ms");target.appendChild(s);setTimeout(()=>s.remove(),1400);}
}
function paintStars(){
 const canvas=mount.querySelector("#mx-stars");if(!canvas)return;paintGeneration++;const gen=paintGeneration;
 cancelAnimationFrame(raf);const dpr=Math.min(2,devicePixelRatio||1);const w=innerWidth,h=Math.max(innerHeight,mount.clientHeight);
 canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+"px";canvas.style.height=h+"px";
 ctx=canvas.getContext("2d",{alpha:true});ctx.setTransform(dpr,0,0,dpr,0,0);
 let seed=1091;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 stars=Array.from({length:w<600?155:280},()=>({x:rand()*w,y:rand()*h,r:.3+rand()*1.5,a:.2+rand()*.65,s:.2+rand()*.65,phase:rand()*6.28}));
 const draw=t=>{if(gen!==paintGeneration)return;ctx.clearRect(0,0,w,h);for(const p of stars){const a=p.a*(reduced?1:(.7+.3*Math.sin(t*.0007+p.phase)));ctx.fillStyle="rgba(245,236,222,"+a.toFixed(2)+")";ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}if(!reduced)raf=requestAnimationFrame(draw);};draw(performance.now());
}
addEventListener("resize",()=>paintStars(),{passive:true});
render();
})();