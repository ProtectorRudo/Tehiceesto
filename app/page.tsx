import Link from "next/link";
import { experiences } from "@/data/experiences";
import BoutiqueGallery from "@/components/BoutiqueGallery";
import "./home-boutique.css";

export default function Home() {
  return (
    <main className="boutique-home" id="inicio">
      <section className="boutique-hero" aria-labelledby="boutique-hero-title">
        <div className="boutique-hero-inner">
          <div className="boutique-hero-copy">
            <span className="boutique-kicker"><span className="boutique-kicker-dot" /> UN ESTUDIO DE REGALOS QUE SE VIVEN</span>
            <h1 id="boutique-hero-title">Hay regalos<br/>que se abren.<br/><em>Y otros que<br/>se sienten.</em></h1>
            <p>Una carta puede decir mucho. Una experiencia puede hacer que lo sienta todo. Convertimos tus fotos, audios y recuerdos en un lugar que existe solamente para esa persona.</p>
            <div className="boutique-hero-buttons">
              <a className="boutique-button boutique-button-dark" href="#coleccion">Descubrí las experiencias <span aria-hidden="true">↗</span></a>
              <Link className="boutique-link-arrow" href="/crear">Quiero hacer un regalo <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="boutique-hero-footer"><span>PERSONALIZADO CON TUS RECUERDOS</span><span aria-hidden="true">✳</span><span>HECHO CON AMOR, NO EN SERIE</span></div>
          </div>
          <div className="boutique-hero-art" aria-label="Composición de recuerdos y sobres de nuestras experiencias">
            <div className="boutique-art-sun" aria-hidden="true" />
            <div className="boutique-art-note boutique-art-note--left"><span>UN MOMENTO</span><strong>que queda<br/>para siempre.</strong><i>✿</i></div>
            <div className="boutique-art-portrait">
              <div className="boutique-art-portrait-photo" />
              <div className="boutique-art-portrait-caption"><span>PARA EMMA, CON AMOR</span><strong>Lo nuestro.</strong><small>Una historia en siete momentos</small></div>
            </div>
            <div className="boutique-art-envelope" aria-hidden="true"><span>Una sola persona.<br/>Un universo entero.</span><i>♥</i></div>
            <div className="boutique-art-seal" aria-hidden="true">hecho<br/>para vos <span>♡</span></div>
            <div className="boutique-art-spark one" aria-hidden="true">✳</div><div className="boutique-art-spark two" aria-hidden="true">✦</div>
          </div>
        </div>
        <div className="boutique-hero-bottom"><span>DISEÑADO EN ARGENTINA · PARA EMOCIONAR EN CUALQUIER LUGAR</span><a href="#coleccion">DESLIZÁ PARA DESCUBRIR <span aria-hidden="true">↓</span></a></div>
      </section>

      <div className="boutique-marquee" aria-hidden="true"><div>PARA MAMÁ <span>✳</span> PARA ESA PERSONA <span>✳</span> PARA TU MEJOR AMISTAD <span>✳</span> PARA QUIEN TE CAMBIÓ LA VIDA <span>✳</span></div></div>

      <BoutiqueGallery experiences={experiences} />

      <section className="boutique-belief" aria-labelledby="boutique-belief-title">
        <div className="boutique-belief-overline">NO ES UNA TARJETA DIGITAL. ES UN RECUERDO EN MOVIMIENTO.</div>
        <div className="boutique-belief-grid">
          <h2 id="boutique-belief-title">No es sólo<br/>lo que le das.<br/><em>Es lo que vive.</em></h2>
          <div className="boutique-belief-detail"><div className="boutique-belief-symbol">✳</div><p>Una puerta que se abre. Una voz que vuelve a escucharse. Una foto que aparece cuando la buscás. Pequeños momentos que hacen grande una historia.</p><Link href="/crear">Empezá con tus recuerdos <span aria-hidden="true">↗</span></Link></div>
        </div>
      </section>

      <section className="boutique-how" id="como-funciona" aria-labelledby="boutique-how-title">
        <div className="boutique-section-head"><div><span className="boutique-kicker">ASÍ DE SIMPLE, ASÍ DE PERSONAL</span><h2 id="boutique-how-title">Vos ponés la historia.<br/><em>Nosotros hacemos la magia.</em></h2></div><p>Sin tener que diseñar, editar ni aprender ninguna herramienta. Elegís la experiencia y nuestro equipo la prepara para vos.</p></div>
        <div className="boutique-how-grid">
          <article><span className="boutique-how-index">01 /</span><div className="boutique-how-icon">◇</div><h3>Elegí su mundo.</h3><p>Explorá y probá nuestras experiencias. Quedate con la que más se parezca a esa persona.</p></article>
          <article><span className="boutique-how-index">02 /</span><div className="boutique-how-icon">✍</div><h3>Contanos su historia.</h3><p>Nos compartís nombres, palabras, fotos y audios. Esos detalles que solamente ustedes conocen.</p></article>
          <article><span className="boutique-how-index">03 /</span><div className="boutique-how-icon">✦</div><h3>Nosotros lo hacemos.</h3><p>Personalizamos el recorrido elegido respetando cada escena, efecto e interacción original.</p></article>
          <article><span className="boutique-how-index">04 /</span><div className="boutique-how-icon">♡</div><h3>Le mandás el enlace.</h3><p>Lo abre desde su celular. Y descubre algo que no se parecía a ningún otro regalo.</p></article>
        </div>
      </section>

      <section className="boutique-escapes" id="escapes"><div><span className="boutique-kicker">PARA REGALOS INESPERADOS</span><h2>¿Y si su sorpresa<br/><em>fuera una aventura?</em></h2><p>Tres misterios para jugar. Al final del recorrido, una invitación personal que sólo ustedes entienden.</p><Link className="boutique-button boutique-button-light" href="/escapes">Explorar salas de escape <span aria-hidden="true">↗</span></Link></div><div className="boutique-escapes-card"><span>COLECCIÓN · MUNDOS SECRETOS</span><div className="boutique-escapes-orbit">✳</div><strong>TRES MISTERIOS.<br/>UNA HISTORIA<br/>PARA RECORDAR.</strong></div></section>

      <section className="boutique-ending"><span className="boutique-kicker">SEGURO QUE YA SABÉS PARA QUIÉN</span><h2>Hay alguien que merece<br/><em>algo que sólo sea suyo.</em></h2><Link className="boutique-button boutique-button-dark" href="/crear">Hacer un regalo inolvidable <span aria-hidden="true">↗</span></Link><small>PERSONALIZADO POR NUESTRO EQUIPO · ENLACE PRIVADO · PENSADO PARA CELULAR</small></section>
      <footer className="boutique-footer"><Link href="/" className="boutique-footer-brand">TE HICE ESTO <span>♥</span></Link><p>Regalos digitales que se sienten de verdad.</p><div><Link href="/mis-regalos">Mis regalos</Link><Link href="/crear">Crear un regalo</Link></div><span>ARGENTINA · 2026</span></footer>
    </main>
  );
}

