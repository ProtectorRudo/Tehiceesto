import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { experiences } from "@/data/experiences";
import { createGiftAction } from "../gifts/actions";

export default async function NewGiftPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Te Hice Esto · nuevo</span>
          <h1>Nuevo regalo</h1>
        </div>
        <a className="ghost-action" href="/admin">← Volver</a>
      </header>

      <section className="admin-editor-card">
        <form action={createGiftAction} className="admin-form">
          <div className="admin-form-grid">
            <label>
              <span>Experiencia</span>
              <select name="experienceSlug" defaultValue="pareja" required>
                {experiences.map((experience) => (
                  <option key={experience.slug} value={experience.slug}>
                    {experience.icon} {experience.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Ocasión</span>
              <input name="occasion" placeholder="Ej. aniversario 8 años" />
            </label>

            <label>
              <span>Quién regala</span>
              <input name="giverName" placeholder="Ej. Mauro" required />
            </label>

            <label>
              <span>Quién recibe</span>
              <input name="recipientName" placeholder="Ej. Ailín" required />
            </label>

            <label className="admin-form-wide">
              <span>Emoción principal</span>
              <select name="feeling" defaultValue="Emoción">
                <option>Emoción</option>
                <option>Amor</option>
                <option>Sorpresa</option>
                <option>Diversión</option>
                <option>Nostalgia</option>
              </select>
            </label>
          </div>

          <div className="admin-form-footer">
            <p>
              Se crea como borrador privado. Después cargamos historia, archivos,
              escenas y recién al final lo publicamos.
            </p>
            <button className="primary-action" type="submit">
              Crear regalo →
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
