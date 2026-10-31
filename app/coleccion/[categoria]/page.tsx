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
export default async function RecipientCollection({params}:Props){
 const {categoria}=await params;
 const option=recipientCategory(categoria);
 if(!option)notFound();
 const selected=categoria==="todos"?publicExperiences:publicExperiences.filter(item=>option.slugs.includes(item.slug));
 const withGames=categoria==="juegos"||categoria==="todos";
 const itemCount=selected.length+(withGames?3:0);
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
       {withGames&&<article className="recipient-catalog-card recipient-catalog-card--game">
         <div className="recipient-catalog-card-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/demo-previews/casi-telepatia.svg" alt="Dos cartas originales de Casi Telepatía" loading="eager"/>
          <span className="recipient-catalog-card-label">JUEGO · DOS PERSONAS · UN CELULAR</span>
         </div>
         <div className="recipient-catalog-card-copy">
          <span className="recipient-catalog-card-category">600 PREGUNTAS · 20 TEMAS</span>
          <h3>Casi Telepatía</h3>
          <p>Una persona responde en secreto. La otra intenta adivinar. Rondas alternadas, revelaciones y una competencia para descubrir cuánto se conocen.</p>
          <div className="recipient-catalog-card-buttons">
           <Link href="/juegos/casi-telepatia" className="recipient-catalog-card-view">Jugar ahora <span aria-hidden="true">↗</span></Link>
          </div>
         </div>
       </article>}
       {withGames&&<article className="recipient-catalog-card recipient-catalog-card--game">
         <div className="recipient-catalog-card-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/demo-previews/trazo-complice.svg" alt="Cartas de Trazo Cómplice" loading="eager"/>
          <span className="recipient-catalog-card-label">JUEGO · UN SOLO CELULAR</span>
         </div>
         <div className="recipient-catalog-card-copy">
          <span className="recipient-catalog-card-category">DOS PERSONAS · MUCHAS RISAS</span>
          <h3>Trazo Cómplice</h3><p>Dibujá, adiviná y pasale el celular a la otra persona. Dos palabras gratis y 1.274 en el juego completo.</p>
          <div className="recipient-catalog-card-buttons">
           <Link href="/juegos/trazo-complice" className="recipient-catalog-card-view">Jugar demo <span aria-hidden="true">↗</span></Link>
           <Link href="/comprar/trazo-complice" className="recipient-catalog-card-buy">Juego completo <span aria-hidden="true">→</span></Link>
          </div>
         </div>
       </article>}
       {withGames&&<article className="recipient-catalog-card recipient-catalog-card--escape">
         <div className="recipient-catalog-card-photo recipient-catalog-escape-visual"><div className="recipient-catalog-escape-mark" aria-hidden="true">⌖</div><strong>Mundos<br/>secretos</strong><span className="recipient-catalog-card-label">SALAS DE ESCAPE</span></div>
         <div className="recipient-catalog-card-copy">
          <span className="recipient-catalog-card-category">AVENTURAS INMERSIVAS</span>
          <h3>Salas de escape</h3><p>Misterios interactivos y desafíos para compartir, donde cada detalle puede ser una pista.</p>
          <div className="recipient-catalog-card-buttons"><Link href="/escapes" className="recipient-catalog-card-view">Explorar juegos <span aria-hidden="true">↗</span></Link></div>
         </div>
       </article>}
      </div>
    </section>
    <footer className="recipient-catalog-footer"><span>✳ TE HICE ESTO</span><p>Los regalos más lindos empiezan pensando en alguien.</p><Link href="/coleccion/todos">Todas las experiencias →</Link></footer>
   </div>
  </main>;
}
