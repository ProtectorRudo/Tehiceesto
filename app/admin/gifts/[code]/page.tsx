import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminGiftByCode } from "@/lib/gifts/repository";
import { getExperience } from "@/data/experiences";
import SceneRecipeEditor from "@/components/admin/SceneRecipeEditor";
import AdminMediaManager from "@/components/admin/AdminMediaManager";
import AdminPublishControls from "@/components/admin/AdminPublishControls";
import { saveGiftContentAction } from "../actions";

export default async function AdminGiftEditorPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin");

  const { code } = await params;
  const result = await getAdminGiftByCode(code);
  if (!result) notFound();

  const { gift, media } = result;
  const base = getExperience(gift.experience_slug);
  if (!base) notFound();

  return (
    <main className="admin-page admin-editor-page">
      <header className="admin-header admin-editor-header">
        <div>
          <a className="admin-back-link" href="/admin">← Regalos</a>
          <span className="eyebrow">{base.eyebrow}</span>
          <h1>{gift.recipient_name}</h1>
          <p className="admin-editor-subtitle">
            De {gift.giver_name} · <code>{gift.public_code}</code>
          </p>
        </div>

        <AdminPublishControls code={gift.public_code} status={gift.status} />
      </header>

      <section className="admin-editor-card">
        <div className="admin-block-heading">
          <div>
            <span className="eyebrow">Historia</span>
            <h2>Contenido del regalo</h2>
            <p>
              Acá definimos la narrativa. Guardar no publica nada.
            </p>
          </div>
          <span className={`status-pill status-${gift.status}`}>{gift.status}</span>
        </div>

        <form action={saveGiftContentAction} className="admin-form">
          <input type="hidden" name="code" value={gift.public_code} />

          <div className="admin-form-grid">
            <label>
              <span>Quién regala</span>
              <input name="giverName" defaultValue={gift.giver_name} required />
            </label>

            <label>
              <span>Quién recibe</span>
              <input name="recipientName" defaultValue={gift.recipient_name} required />
            </label>

            <label>
              <span>Ocasión</span>
              <input
                name="occasion"
                defaultValue={gift.occasion || ""}
                placeholder="Ej. aniversario 8 años"
              />
            </label>

            <label>
              <span>Emoción</span>
              <select name="feeling" defaultValue={gift.feeling || "Emoción"}>
                <option>Emoción</option>
                <option>Amor</option>
                <option>Sorpresa</option>
                <option>Diversión</option>
                <option>Nostalgia</option>
              </select>
            </label>

            <label className="admin-form-wide">
              <span>Relación / contexto</span>
              <textarea
                name="relationship"
                rows={3}
                defaultValue={gift.story_data?.relationship || ""}
                placeholder="Quiénes son, hace cuánto, qué los define…"
              />
            </label>

            <label>
              <span>Fecha importante</span>
              <input
                name="keyDate"
                type="date"
                defaultValue={gift.story_data?.keyDate || ""}
              />
            </label>

            <label>
              <span>Canción de referencia</span>
              <input
                name="musicUrl"
                defaultValue={gift.music_url || ""}
                placeholder="Nombre, Spotify o YouTube · después subimos el audio final"
              />
            </label>

            <label className="admin-form-wide">
              <span>Anécdota clave</span>
              <textarea
                name="anecdote"
                rows={4}
                defaultValue={gift.story_data?.anecdote || ""}
                placeholder="Ese momento que sólo ellos entienden…"
              />
            </label>

            <label className="admin-form-wide">
              <span>Entrada</span>
              <textarea
                name="openingText"
                rows={3}
                defaultValue={gift.opening_text || base.opening}
              />
            </label>

            <label className="admin-form-wide">
              <span>Carta</span>
              <textarea
                className="admin-letter-input"
                name="letterText"
                rows={8}
                defaultValue={gift.letter_text || ""}
                placeholder="El mensaje más importante del regalo…"
              />
            </label>

            <label className="admin-form-wide">
              <span>Cierre</span>
              <textarea
                name="closingText"
                rows={3}
                defaultValue={gift.closing_text || base.closing}
              />
            </label>
          </div>

          <div className="admin-scenes-section">
            <div className="admin-block-heading compact">
              <div>
                <span className="eyebrow">Recorrido</span>
                <h2>Orden de escenas</h2>
                <p>
                  Se puede repetir, quitar o mover cualquier escena.
                </p>
              </div>
            </div>

            <SceneRecipeEditor initialRecipe={gift.scene_recipe || base.recipe} />
          </div>

          <div className="admin-form-footer">
            <p>
              Sugerencia: guardá primero la historia y después revisá el preview
              con los archivos reales.
            </p>
            <button className="primary-action" type="submit">
              Guardar cambios
            </button>
          </div>
        </form>
      </section>

      <AdminMediaManager code={gift.public_code} media={media} />
    </main>
  );
}
