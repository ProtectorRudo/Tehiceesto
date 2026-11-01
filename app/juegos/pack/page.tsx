import type {Metadata} from "next";
import Link from "next/link";
export const metadata:Metadata={title:"Pack de 4 Juegos · $25.000 ARS | Te Hice Esto",description:"Trazo Cómplice, Entre Dos, Cómplices y Meme Match completos en un solo pack. Probá una demo de cada juego y desbloqueá 48 parejas de memes."};
const cards=[
 {emoji:"🎨",title:"Trazo Cómplice",desc:"Dibujá, adiviná y reíte con 1.274 palabras y categorías.",demo:"/juegos/trazo-complice",badge:"1.274 PALABRAS",shade:"#ffc5d9"},
 {emoji:"💌",title:"Entre Dos",desc:"90 preguntas para descubrir cuánto se conocen.",demo:"/juegos/entre-dos",badge:"90 PREGUNTAS",shade:"#dab8ff"},
 {emoji:"🔐",title:"Cómplices",desc:"Una aventura cooperativa con siete desafíos.",demo:"/juegos/complices",badge:"7 DESAFÍOS",shade:"#9fdfdf"},
 {emoji:"🧠",title:"Meme Match",desc:"Duelo de memoria para dos en un solo celular. Demo de 8 parejas; edición completa con 48 parejas de memes y tableros de hasta 96 cartas.",demo:"/juegos/meme-match",badge:"48 PAREJAS COMPLETAS",shade:"#ffe38f"},
];
export default function PackLanding(){return <main style={{minHeight:"100dvh",background:"radial-gradient(ellipse at 50% 0%,#322247,#151023 64%,#100c1d)",color:"#fbf4ff",fontFamily:"system-ui,sans-serif",padding:"24px 16px 60px"}}>
<div style={{maxWidth:1030,margin:"auto"}}>
<nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,marginBottom:45,gap:15}}><Link href="/" style={{color:"#f6dded",textDecoration:"none"}}>← Te Hice Esto</Link><Link href="/mis-regalos" style={{color:"#f5cce1"}}>Ya compré · Mis juegos</Link></nav>
<header style={{textAlign:"center",maxWidth:770,margin:"auto"}}>
<div style={{letterSpacing:3,fontSize:12,fontWeight:900,color:"#f6c77d"}}>✦ UN CELULAR · DOS PERSONAS · CUATRO JUEGOS</div>
<h1 style={{fontSize:"clamp(42px,8vw,76px)",fontWeight:950,lineHeight:1.03,letterSpacing:"-.055em",margin:"15px 0"}}>El pack para <span style={{color:"#ffce72"}}>jugar juntos.</span></h1>
<p style={{color:"#d1bfdb",fontSize:"clamp(15px,2vw,20px)",lineHeight:1.7,margin:"0 auto 25px"}}>Cuatro mundos, una sola compra. Para reírse, competir y descubrir quién tiene la peor memoria.</p>
<div style={{fontSize:32,fontWeight:900,color:"#ffce7d"}}>$25.000 <span style={{fontSize:14,color:"#cfb9d6"}}>ARS · pago único</span></div>
<div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",margin:"24px 0 50px"}}>
<Link href="/comprar/pack-juegos" style={{background:"linear-gradient(120deg,#ffe58b,#f4a34d)",padding:"17px 24px",borderRadius:15,color:"#24122d",fontWeight:900,textDecoration:"none"}}>Quiero los cuatro juegos →</Link>
<a href="#juegos" style={{border:"1px solid #ffffff50",padding:"17px 24px",borderRadius:15,color:"white",textDecoration:"none"}}>Probar demos gratis ↓</a>
</div></header>
<section id="juegos" aria-label="Cuatro juegos incluidos" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))",gap:17}}>
{cards.map(item=><article key={item.title} style={{border:"1px solid #ffffff22",borderRadius:23,background:"#ffffff0d",padding:21,display:"grid",gap:12,alignContent:"start"}}>
<div style={{background:"#ffffff0c",borderRadius:17,minHeight:128,display:"grid",placeItems:"center",fontSize:70,boxShadow:"inset 0 0 40px "+item.shade+"20"}} aria-hidden="true">{item.emoji}</div>
<span style={{letterSpacing:2,fontSize:10,fontWeight:900,color:item.shade}}>{item.badge}</span>
<h2 style={{margin:0,fontSize:26,letterSpacing:"-.04em"}}>{item.title}</h2>
<p style={{margin:"0 0 5px",color:"#d6c8dc",lineHeight:1.6,fontSize:14}}>{item.desc}</p>
<Link href={item.demo} style={{marginTop:"auto",textDecoration:"none",textAlign:"center",color:"#24122d",fontSize:13,fontWeight:900,background:item.shade,padding:"13px 12px",borderRadius:12}}>Probar demo gratis ↗</Link>
</article>)}
</section>
<aside style={{textAlign:"center",color:"#d8c4dc",lineHeight:1.7,border:"1px solid #ffffff25",borderRadius:22,margin:"33px 0 0",padding:"20px 23px",background:"#ffffff08"}}>
<strong style={{color:"#ffe091"}}>Meme Match: la demo tiene solamente 8 parejas.</strong> Al comprar el pack se desbloquean 48 parejas diferentes de memes y todas las dificultades, incluido el tablero gigante de 96 cartas. También se incluyen los otros tres juegos completos. No se incluyen las salas de escape.
</aside>
</div></main>}
