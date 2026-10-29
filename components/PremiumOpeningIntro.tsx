"use client";
import {useEffect,useId,useRef,useState} from "react";
import type {CSSProperties} from "react";
import type {Experience} from "@/data/experiences";
import "./PremiumOpeningIntro.css";

type Mode="flowers"|"celebration"|"starlight"|"heritage"|"promise";
type Phase="sealed"|"unfolding"|"revealed";
const config:Record<string,{mode:Mode;headline:string;kicker:string;action:string;accent:string}>={
 pareja:{mode:"flowers",headline:"Hay algo para vos.",kicker:"DE UN CORAZÓN A OTRO",action:"Abrí la tarjeta",accent:"#b86e88"},
 mama:{mode:"flowers",headline:"Gracias, de verdad.",kicker:"PARA QUIEN SIEMPRE ESTUVO",action:"Descubrí tu dedicatoria",accent:"#bd8290"},
 aniversario:{mode:"flowers",headline:"Una vez más, nosotros.",kicker:"POR TODO LO COMPARTIDO",action:"Abrí nuestro recuerdo",accent:"#94768c"},
 abuelos:{mode:"flowers",headline:"Una vida de historias.",kicker:"RECUERDOS QUE ABRAZAN",action:"Abrí esta historia",accent:"#a17964"},
 cumpleanos:{mode:"celebration",headline:"Pedí un deseo.",kicker:"HOY ES TODO PARA VOS",action:"Descubrí tu sorpresa",accent:"#c27682"},
 hijos:{mode:"starlight",headline:"Nuestro pequeño universo.",kicker:"UN AMOR QUE EMPEZÓ ANTES",action:"Descubrí tu cielo",accent:"#7f9d9e"},
 papa:{mode:"heritage",headline:"Lo que aprendí de vos.",kicker:"LA HUELLA QUE DEJASTE EN MÍ",action:"Abrí este recuerdo",accent:"#708c85"},
 propuesta:{mode:"promise",headline:"Hay algo que decirte.",kicker:"ANTES DE LA GRAN PREGUNTA",action:"Abrí este momento",accent:"#ab897d"},
};

const blooms:[number,number,number,number,number][]=[
 [158,267,1.05,-18,0],[254,233,1.14,7,1],[359,252,1.05,14,2],
 [443,291,.89,20,0],[118,359,1,-12,3],[229,339,1.14,-8,2],
 [335,343,1.19,9,1],[448,371,1.01,15,3],[182,425,1.06,2,2],
 [291,420,1.03,-5,0],[387,437,.89,8,1],
];
const flowerColors=[["#f8c5b3","#dca390"],["#f7bed0","#c67f9c"],["#f6d0db","#d19cab"],["#fff8ed","#cebfae"]];
function Flower({x,y,size,rotation,color}:{x:number;y:number;size:number;rotation:number;color:number}){
 const [base,outline]=flowerColors[color];
 return <g transform={"translate("+x+" "+y+") rotate("+rotation+") scale("+size+")"}>
   {Array.from({length:9},(_,i)=><path key={i} transform={"rotate("+(i*40)+")"} d="M0 0 C-20 -26 -36 -67 -15 -75 C11 -86 35 -52 20 -32 C10 -12 7 -7 0 0Z" fill={base} stroke={outline} strokeWidth="1.7" strokeLinejoin="round"/>)}
   {Array.from({length:7},(_,i)=><path key={i} transform={"rotate("+(i*51.43)+") scale(.64)"} d="M0 0 C-13 -22 -32 -53 -6 -56 C22 -60 34 -28 12 -8Z" fill={base} stroke={outline} strokeWidth="2"/>)}
   <path d="M-21 2 C-22 -23 17 -34 24 -6 C30 17 3 29 -12 13 C-22 1 -3 -17 10 -5 C17 1 12 12 3 11" fill="none" stroke={outline} strokeWidth="3.4" strokeLinecap="round"/>
   <path d="M-37 -30 Q-15 -46 5 -33" fill="none" stroke="#fff6ef" opacity=".8" strokeWidth="3" strokeLinecap="round"/>
 </g>;
}
function Bouquet({id}:{id:string}){
 return <>
   <defs><linearGradient id={id+"paper"} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f2d7b6"/><stop offset=".55" stopColor="#d4b18f"/><stop offset="1" stopColor="#bb916d"/></linearGradient>
     <linearGradient id={id+"fold"}><stop stopColor="#fff0d6"/><stop offset="1" stopColor="#c9a17e"/></linearGradient></defs>
   <g className="opening-leaves">
    {Array.from({length:12},(_,i)=>{const x=106+i*35,y=286+(i%3)*21;return <g key={i}>
      <path d={"M297 588 Q"+x+" 457 "+x+" "+y} stroke="#719485" strokeWidth="2.5" fill="none"/>
      <ellipse cx={x-14} cy={y+23} rx="22" ry="10" transform={"rotate(-39 "+(x-14)+" "+(y+23)+")"} fill="#9cb5a5" stroke="#749887" strokeWidth="1.5"/>
      <ellipse cx={x+18} cy={y+42} rx="19" ry="9" transform={"rotate(29 "+(x+18)+" "+(y+42)+")"} fill="#b5c8b4" stroke="#749887" strokeWidth="1.5"/>
    </g>})}
   </g>
   <g className="opening-flowers">{blooms.map(([x,y,size,rotation,color],i)=><g className="opening-flower" key={i} style={{animationDelay:i*.06+"s"}}><Flower x={x} y={y} size={size} rotation={rotation} color={color}/></g>)}</g>
   <g className="opening-wrapper">
     <path d="M67 397 L174 354 L305 566 L281 633Z" fill={"url(#"+id+"fold)"} stroke="#c39a7d" strokeWidth="2"/>
     <path d="M510 395 L420 351 L275 550 L308 632Z" fill={"url(#"+id+"fold)"} stroke="#c39a7d" strokeWidth="2"/>
     <path d="M66 405 Q300 528 509 397 L347 660 Q298 684 235 658Z" fill={"url(#"+id+"paper)"} stroke="#c29e79" strokeWidth="2"/>
     <path d="M70 410 L286 558 L505 400" fill="none" stroke="#f4dfc2" strokeWidth="2" opacity=".55"/>
     <path d="M84 443 L279 567 M499 437 L316 566" fill="none" stroke="#b88e6c" strokeWidth="2" opacity=".55"/>
     <path d="M282 592 L245 703 Q271 690 287 697 L300 603Z" fill="#f7e6ce" stroke="#d4b99e" strokeWidth="2"/>
     <path d="M304 593 L351 697 Q328 685 309 696 L287 608Z" fill="#faf0df" stroke="#d4b99e" strokeWidth="2"/>
     <path d="M294 605 C239 568 217 583 216 604 C220 644 263 623 294 606 C326 579 366 582 360 606 C355 641 318 624 294 605Z" fill="#f9eddd" stroke="#d7bea7" strokeWidth="2"/>
     <circle cx="294" cy="605" r="15" fill="#f7ecdb"/><circle cx="294" cy="605" r="5" fill="#d6bba1"/>
     <g transform="translate(295 519)"><circle r="26" fill="#aa5663" stroke="#8e4452" strokeWidth="3"/><path d="M0 14 C-34 -11 -14 -27 0 -10 C14 -28 37 -9 0 14Z" fill="#e69da2"/></g>
   </g>
 </>;
}
function Alternative({mode}:{mode:Mode}){
 if(mode==="celebration")return <g className="opening-art-alt">
   {Array.from({length:9},(_,i)=>{const x=105+i*51,y=222+(i%3)*20;return <g key={i}>
     <path d={"M"+x+" "+(y+71)+" Q"+(x+12)+" 481 294 560"} stroke="#c7abb5" strokeWidth="1.5" fill="none"/>
     <ellipse cx={x} cy={y} rx={34+(i%2)*5} ry={50+(i%3)*5} fill={["#eeb8cd","#f8d4a6","#bdd5d0","#eda5c0"][i%4]} stroke="#fff9f5" strokeWidth="2"/>
     <ellipse cx={x-12} cy={y-18} rx="9" ry="21" fill="#fff" opacity=".3" transform={"rotate(-27 "+(x-12)+" "+(y-18)+")"}/>
   </g>})}
   <path d="M135 440 L461 438 L358 663 Q298 693 232 666Z" fill="#ead0c1" stroke="#caa99f" strokeWidth="3"/><path d="M136 442 Q299 499 460 439 L371 514 Q300 550 221 514Z" fill="#fcebdd"/>
   <path d="M284 580 L245 701 L292 683 L321 700 L305 581" fill="#fff5ee"/><path d="M296 602 Q241 554 225 594 Q251 640 296 606 Q336 561 363 593 Q348 631 296 606Z" fill="#fff3e7" stroke="#d2b8aa" strokeWidth="2"/>
  </g>;
 if(mode==="starlight")return <g className="opening-art-alt">
   <circle cx="293" cy="373" r="191" fill="#e8f0e9"/><path d="M386 207 A173 173 0 1 0 386 531 A153 153 0 1 1 386 207Z" fill="#f9dfa8" stroke="#d0ba90" strokeWidth="4"/>
   {Array.from({length:23},(_,i)=>{const x=297+Math.cos(i*2.5)*245,y=357+Math.sin(i*1.7)*225;return <path key={i} d={"M"+x+" "+(y-9)+" q2 7 9 9 q-7 2 -9 9 q-2 -7 -9 -9 q7 -2 9 -9"} fill="#edd098" opacity=".9"/>})}
   <path d="M160 571 Q299 600 428 570 L389 675 Q296 703 208 676Z" fill="#c5d8d2" stroke="#9fb4b0" strokeWidth="3"/>
   <path d="M277 629 L247 700 L287 681 L324 700 L309 628" fill="#fff4e2"/>
 </g>;
 if(mode==="heritage")return <g className="opening-art-alt">
   <rect x="124" y="211" width="349" height="368" rx="13" transform="rotate(5 295 394)" fill="#dbc3a8" stroke="#ab957d" strokeWidth="4"/>
   <rect x="149" y="233" width="305" height="325" rx="5" transform="rotate(5 295 394)" fill="#fff3e4"/>
   <rect x="175" y="263" width="250" height="247" transform="rotate(5 295 394)" fill="#a2b0a9" stroke="#fff8eb" strokeWidth="11"/>
   <g transform="translate(290 375)"><circle r="84" fill="#dce6dc" stroke="#faf3e5" strokeWidth="6"/><circle r="63" fill="#b8c8c0" stroke="#91a69a" strokeWidth="2"/><path d="M0 -55 V-72 M55 0 H72 M0 55 V72 M-55 0 H-72" stroke="#fff9ea" strokeWidth="4"/><path d="M0 0 L-14 -40 M0 0 L35 14" stroke="#576e66" strokeWidth="5" strokeLinecap="round"/><circle r="6" fill="#557067"/></g>
   <path d="M173 555 L429 576 L381 678 L207 661Z" fill="#78948d" stroke="#57756d" strokeWidth="3"/><path d="M176 559 L304 605 L429 577" fill="none" stroke="#c3d5c8" strokeWidth="2"/>
   <circle cx="304" cy="606" r="19" fill="#dfcb9f" stroke="#bda67d" strokeWidth="2"/>
 </g>;
 return <g className="opening-art-alt">
   <path d="M144 275 L453 275 L464 613 Q296 684 131 612Z" fill="#f5e4d0" stroke="#cbb198" strokeWidth="3"/>
   <path d="M145 280 L299 412 L450 278" fill="#ead3be" stroke="#bfa78d" strokeWidth="2"/>
   <path d="M134 608 L295 468 L463 611 Q299 702 134 608Z" fill="#fff6e8" stroke="#d2baa4" strokeWidth="3"/>
   <g transform="translate(297 435)"><circle r="53" fill="#cba98a" stroke="#a38c72" strokeWidth="3"/><circle r="39" fill="#f3e0c2"/><path d="M0 19 C-43 -3 -20 -30 0 -11 C21 -32 44 -1 0 19Z" fill="#cba0a0"/></g>
   <path d="M252 220 Q300 166 348 220" stroke="#dabb9f" strokeWidth="3" fill="none"/><circle cx="298" cy="197" r="18" fill="#fbe8cc" stroke="#bca487" strokeWidth="3"/>
 </g>;
}
function chime(){
 try{const C=window.AudioContext;if(!C)return;const ctx=new C();if(ctx.state==="suspended")void ctx.resume();const now=ctx.currentTime;[523,659,784].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(.0001,now+i*.12);g.gain.exponentialRampToValueAtTime(.017,now+i*.12+.03);g.gain.exponentialRampToValueAtTime(.0001,now+i*.12+.44);o.connect(g).connect(ctx.destination);o.start(now+i*.12);o.stop(now+i*.12+.46)});setTimeout(()=>void ctx.close(),1400)}catch{}
}
export default function PremiumOpeningIntro({experience,onContinue}:{experience:Experience;onContinue:()=>void}){
 const meta=config[experience.slug]??config.pareja;const[phase,setPhase]=useState<Phase>("sealed");
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),locked=useRef(false);
 const uid=useId().replace(/:/g,"");
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 const open=()=>{
  if(locked.current)return;locked.current=true;
  const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if(!reduced)chime();navigator.vibrate?.(12);
  if(reduced){setPhase("revealed");return}
  setPhase("unfolding");timer.current=setTimeout(()=>setPhase("revealed"),1100);
 };
 const revealed=phase==="revealed";
 return <section className={"scene premium-intro premium-intro--"+meta.mode+" premium-intro--"+phase} aria-label={"Un regalo especial para "+experience.demoRecipient} style={{"--gift-accent":meta.accent} as CSSProperties}>
  <div className="premium-grain"/><div className="premium-sparks" aria-hidden="true">{Array.from({length:15},(_,i)=><span key={i} style={{"--n":i} as CSSProperties}>✦</span>)}</div>
  <div className="premium-heading"><small>TE HICE ESTO ♡</small><p>{experience.demoGiver} <span>→</span> {experience.demoRecipient}</p><h1>{meta.headline}</h1></div>
  <div className="premium-object" aria-hidden="true"><svg viewBox="0 0 600 720" xmlns="http://www.w3.org/2000/svg" className="premium-illustration"><ellipse cx="295" cy="687" rx="163" ry="17" fill="#7b5746" opacity=".12"/>{meta.mode==="flowers"?<Bouquet id={uid}/>:<Alternative mode={meta.mode}/>}</svg>
    <div className="premium-tag"><small>UNA HISTORIA PARA</small><strong>{experience.demoRecipient}</strong><em>hecha con amor ♡</em></div>
  </div>
  <div className={"premium-note"+(revealed?" premium-note--visible":"")} aria-hidden={!revealed}><span>UNA DEDICATORIA, SÓLO PARA VOS</span><b aria-hidden="true">♡</b><h2>{experience.demoRecipient}</h2><p>{experience.opening}</p><div className="premium-rule">✦</div><button type="button" className="premium-continue" disabled={!revealed} tabIndex={revealed?0:-1} onClick={onContinue}>Entrá en tu historia <i>↗</i></button></div>
  <div className="premium-controls"><p>{meta.kicker}</p><button type="button" className="premium-start" onClick={open} disabled={phase!=="sealed"}><span>✦</span> {meta.action} <span>↗</span></button><small>Tocá para descubrir lo que prepararon para vos</small></div>
 </section>;
}

