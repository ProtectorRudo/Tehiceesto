import Link from "next/link";
import { experiences } from "@/data/experiences";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />
        <div className="hero-copy">
          <span className="eyebrow">Experiencias digitales personalizadas</span>
          <h1>
            Un regalo que no se abre.
            <em> Se vive.</em>
          </h1>
          <p>
            Convertí fotos, cartas, audios y recuerdos en un lugar de Internet
            que existe solamente para una persona.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/crear">
              Hacerle algo ♥
            </Link>
            <Link className="text-action" href="/experiencias/pareja">
              Vivir un demo <span>→</span>
            </Link>
          </div>
        </div>
        <div className="hero-phone">
          <div className="phone-frame">
            <div className="phone-island" />
            <div className="phone-scene">
              <small>Julián hizo algo para vos</small>
              <strong>Emma</strong>
              <p>Este lugar existe solamente para vos.</p>
              <span>Entrar</span>
            </div>
          </div>
          <div className="floating-note note-one">✦ 7 recuerdos</div>
          <div className="floating-note note-two">♥ una carta escondida</div>
        </div>
      </section>

      <section className="trust-strip">
        <span>100% digital</span>
        <i />
        <span>Link privado</span>
        <i />
        <span>Hecho para celular</span>
        <i />
        <span>Pago único</span>
      </section>

      <section className="catalog-section" id="experiencias">
        <div className="section-heading">
          <span className="eyebrow">Elegí una historia</span>
          <h2>¿Para quién querés hacer algo inolvidable?</h2>
          <p>No elegís una plantilla. Elegís el tipo de emoción que querés crear.</p>
        </div>

        <div className="experience-grid">
          {experiences.map((experience, index) => (
            <Link
              className="experience-card"
              href={`/experiencias/${experience.slug}`}
              key={experience.slug}
              style={{ "--card-accent": experience.accent } as React.CSSProperties}
            >
              <div className="card-number">0{index + 1}</div>
              <div className="card-icon">{experience.icon}</div>
              <span>{experience.eyebrow}</span>
              <h3>{experience.title}</h3>
              <p>{experience.short}</p>
              <div className="tag-row">
                {experience.tags.map((tag) => <small key={tag}>{tag}</small>)}
              </div>
              <strong>Vivir demo <b>→</b></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="how-section">
        <div className="section-heading">
          <span className="eyebrow">Muy fácil para vos. Inolvidable para quien lo recibe.</span>
          <h2>Vos traés la historia. Nosotros construimos el lugar.</h2>
        </div>
        <div className="steps-grid">
          <article><span>01</span><h3>Elegís</h3><p>La persona, la ocasión y qué querés hacerle sentir.</p></article>
          <article><span>02</span><h3>Nos contás</h3><p>Subís recuerdos, fotos, audios y esas pequeñas cosas que sólo ustedes entienden.</p></article>
          <article><span>03</span><h3>Lo creamos</h3><p>La historia se convierte en escenas, juegos, cartas y sorpresas interactivas.</p></article>
          <article><span>04</span><h3>Lo vive</h3><p>Le mandás un link privado. Después podés recibir su reacción.</p></article>
        </div>
      </section>

      <section className="cta-section">
        <div>
          <span className="eyebrow">Hay alguien que se merece esto</span>
          <h2>No le mandes otra cosa. Hacésela vivir.</h2>
          <Link className="primary-action" href="/crear">Empezar mi regalo</Link>
        </div>
      </section>

      <footer className="footer">
        <Link className="brand" href="/">TE HICE ESTO<span>♥</span></Link>
        <p>Un lugar en Internet que existe para una sola persona.</p>
      </footer>
    </main>
  );
}
