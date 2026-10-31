import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {publicExperiences} from "@/data/experiences";
import {recipientCategories,recipientCategory} from "@/data/recipient-categories";
import "./recipient-collection.css";

type Props={params:Promise<{categoria:string}>};
export function generateStaticParams(){return recipientCategories.map(({id})=>({categoria:id}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {categoria}=await params;
  const option=recipientCategory(categoria);
  return {title:option?option.titleLong+" · Te Hice Esto":"Colección · Te Hice Esto",description:option?.subheading||"Explorá las experiencias de Te Hice Esto."};
}
function previewPath(slug:string){
 return "/demo-previews/"+slug+(["club-amigos","frasco365","siete-dias"].includes(slug)?".svg":".jpg");
}
const games = [
 {slug:"trazo-complice",title:"Trazo Cómplice",eyebrow:"DIBUJAR Y ADIVINAR",label:"DIVERSIÓN · UN SOLO CELULAR",description:"Dibujen sin hablar, adivinen lo imposible y terminen riéndose de sus propias obras de arte. Dos palabras fijas en la demo; 1.274 en el juego completo.",preview:"/demo-previews/trazo-complice.svg",alt:"Cartas ilustradas de Trazo Cómplice",demo:"/juegos/trazo-complice",accent:"#9a426d"},
 {slug:"entre-dos",title:"Entre Dos",eyebrow:"PREGUNTAS PARA DESCUBRIRSE",label:"CONEXIÓN · UN SOLO CELULAR",description:"Dos personas eligen en secreto entre dos opciones y descubren si coinciden. Nueve preguntas fijas en la demo; 90 en la edición completa.",preview:"/demo-previews/entre-dos.svg",alt:"Dos cartas románticas del juego Entre Dos",demo:"/juegos/entre-dos",accent:"#a43b66"},
 {slug:"complices",title:"Cómplices",eyebrow:"AVENTURA COOPERATIVA",label:"ADRENALINA · DOS PERSONAS",description:"Resuelvan pistas, coordinen decisiones y rescaten a Lía contrarreloj. Una misión fija en la demo; siete desafíos en el juego completo.",preview:"/demo-previews/complices.svg",alt:"Escena de rescate del juego cooperativo Cómplices",demo:"/juegos/complices",accent:"#48637b"}
] as const;

export default async function RecipientCollection({params}:Props){
 const {categoria}=await params;
 const option=recipientCategory(categoria);
 if(!option)notFound();
 const selected=categoria==="todos"?publicExperiences:publicExperiences.filter(item=>option.slugs.includes(item.slug));
 const withGames=categoria==="juegos"||categoria==="todos";
 const itemCount=selected.length+(withGames?games.length:0);
 return <main className="studio-page recipient-catalog" id="coleccion">
   <div className="recipient-catalog-ambient" aria-hidden="true"/>
   <div className="recipient-catalog-inner">
    <nav className="recipient-catalog-breadcrumb" aria-label="Ubicación">
      <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
      <Link href="/coleccion/todos">Colección</Link><span aria-hidden="true">/</span>
      <span aria-current="page">{option.title}</span>
    </nav>
    <div className="recipient-catalog-hero">
      <div className="recipient-catalog-hero-copy">
       <span className="recipient-catalog-eyebrow">✳ &nbsp; TE HICE ESTO / PARA {option.title.toUpperCase()}</span>
       <h1>{option.heading}</h1>
       <p>{option.subheading}</p>
       <div className="recipient-catalog-hero-actions">
        <a href="#recorridos" className="recipient-catalog-cta">Descubrir experiencias <span aria-hidden="true">↗</span></a>
        <Link href="/coleccion/todos" className="recipient-catalog-other">Ver toda la colección <span aria-hidden="true">→</span></Link>
       </div>
      </div>
      <div className="recipient-catalog-hero-art" aria-hidden="true">
        <span className="recipient-catalog-spark a">✳</span><span className="recipient-catalog-spark b">✦</span>
        <div className="recipient-catalog-art-frame"><span>Hay regalos</span><strong>que se<br/><em>sienten.</em></strong><small>HECHOS PARA ALGUIEN ESPECIAL</small></div>
        <div className="recipient-catalog-art-seal">hecho<br/>con ♥</div>
      </div>
    </div>

    <section id="recorridos" className="recipient-catalog-selection" aria-labelledby="recipient-catalog-list-title">
      <div className="recipient-catalog-selection-head">
       <div><span className="recipient-catalog-eyebrow">ELEGÍ SU EXPERIENCIA</span><h2 id="recipient-catalog-list-title">{categoria==="juegos"?"Para jugar juntos.":"Pequeños mundos, grandes emociones."}</h2></div>
       <span className="recipient-catalog-count">{String(itemCount).padStart(2,"0")} <small>PARA DESCUBRIR</small></span>
      </div>
      <div className="recipient-catalog-grid">
       {selected.map((item,index)=><article key={item.slug} className="recipient-catalog-card" style={{"--recipient-card-accent":item.accent} as React.CSSProperties}>
         <div className="recipient-catalog-card-photo">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={previewPath(item.slug)} alt={"Vista previa de "+item.title} loading={index<3?"eager":"lazy"}/>
           <span className="recipient-catalog-card-label">EXPERIENCIA INTERACTIVA</span>
         </div>
         <div className="recipient-catalog-card-copy">
          <span className="recipient-catalog-card-category">{item.eyebrow}</span>
          <h3>{item.title}</h3>
          <p>{item.short}</p>
          <div className="recipient-catalog-card-buttons">
           <Link href={"/experiencias/"+item.slug} className="recipient-catalog-card-view">Ver demo <span aria-hidden="true">↗</span></Link>
           <Link href={item.slug==="frasco365"?"/crear":"/comprar/"+item.slug} className="recipient-catalog-card-buy">Quiero este <span aria-hidden="true">→</span></Link>
          </div>
         </div>
       </article>)}
       {withGames&&games.map((game,index)=><article key={game.slug} className="recipient-catalog-card recipient-catalog-card--game" style={{"--recipient-card-accent":game.accent} as React.CSSProperties}>
         <div className="recipient-catalog-card-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.preview} alt={game.alt} loading={index===0?"eager":"lazy"}/>
          <span className="recipient-catalog-card-label">{game.label}</span>
         </div>
         <div className="recipient-catalog-card-copy">
          <span className="recipient-catalog-card-category">{game.eyebrow}</span>
          <h3>{game.title}</h3><p>{game.description}</p>
          <div className="recipient-catalog-card-buttons">
           <Link href={game.demo} className="recipient-catalog-card-view">Probar demo gratis <span aria-hidden="true">↗</span></Link>
           <Link href="/juegos/pack" className="recipient-catalog-card-buy">Ver pack de 3 juegos <span aria-hidden="true">→</span></Link>
          </div>
         </div>
       </article>)}
      </div>
      {withGames&&<div className="recipient-games-pack">
        <div><span className="recipient-catalog-eyebrow">PACK COMPLETO · PAGO ÚNICO</span><h3>Tres juegos. <em>Una sola compra.</em></h3><p>Trazo Cómplice + Entre Dos + Cómplices. Todos completos por <strong>$25.000 ARS</strong>. Probá sus demos gratis antes de elegir.</p></div>
        <Link href="/juegos/pack" className="recipient-catalog-cta">Conocer el pack de $25.000 <span aria-hidden="true">↗</span></Link>
      </div>}
    </section>
    {withGames&&<aside className="recipient-escapes-apart" aria-labelledby="recipient-escapes-title">
      <div><span className="recipient-catalog-eyebrow">UNA COLECCIÓN DISTINTA · NO INCLUIDA EN EL PACK</span><h2 id="recipient-escapes-title">¿Preferís un misterio?</h2><p>Las salas de escape son aventuras independientes que se venden por separado. Explorá sus historias y demos sin confundirlas con el pack de juegos.</p></div>
      <Link href="/escapes" className="recipient-catalog-other">Explorar salas de escape <span aria-hidden="true">→</span></Link>
    </aside>}
    <footer className="recipient-catalog-footer"><span>✳ TE HICE ESTO</span><p>Los regalos más lindos empiezan pensando en alguien.</p><Link href="/coleccion/todos">Todas las experiencias →</Link></footer>
   </div>
  </main>;
}
