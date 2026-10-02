import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  isGiftDatabaseConfigured,
  listRecentGifts,
} from "@/lib/gifts/repository";
import { loginAdmin, logoutAdmin } from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const authenticated = await isAdminAuthenticated();
  const { error } = await searchParams;

  if (!authenticated) {
    return (
      <main className="admin-page admin-login-page">
        <section className="admin-login-card">
          <span className="eyebrow">Te Hice Esto · interno</span>
          <h1>Panel de regalos</h1>
          <p>
            Este acceso es sólo para operación interna. La sesión se guarda en
            una cookie segura durante ocho horas.
          </p>

          <form action={loginAdmin}>
            <label>
              <span>Clave de acceso</span>
              <input
                name="accessKey"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {error && <small className="admin-error">La clave no es correcta.</small>}
            <button className="primary-action" type="submit">
              Entrar al panel
            </button>
          </form>
        </section>
      </main>
    );
  }

  const databaseReady = isGiftDatabaseConfigured();
  const gifts = databaseReady ? await listRecentGifts(40) : [];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Te Hice Esto · operación</span>
          <h1>Regalos</h1>
        </div>
        <form action={logoutAdmin}>
          <button className="ghost-action" type="submit">Cerrar sesión</button>
        </form>
      </header>

      <section className="admin-status-grid">
        <article>
          <span>Base de datos</span>
          <strong>{databaseReady ? "Conectada" : "Pendiente"}</strong>
          <small>
            {databaseReady
              ? "Leyendo regalos reales."
              : "Falta conectar el proyecto dedicado de Supabase."}
          </small>
        </article>
        <article>
          <span>Regalos visibles</span>
          <strong>{gifts.length}</strong>
          <small>Últimos registros cargados en el sistema.</small>
        </article>
        <article>
          <span>Modo de operación</span>
          <strong>Híbrido</strong>
          <small>Automatizamos lo repetible y revisamos lo premium.</small>
        </article>
      </section>

      <section className="admin-list-section">
        <div className="admin-section-title">
          <div>
            <span className="eyebrow">Actividad</span>
            <h2>Últimos regalos</h2>
          </div>
        </div>

        {!databaseReady && (
          <div className="admin-empty">
            <strong>La app está lista para conectarse.</strong>
            <p>
              Cuando creemos el Supabase exclusivo de Te Hice Esto y carguemos
              las variables de entorno, este panel empezará a mostrar regalos
              sin cambiar su código.
            </p>
          </div>
        )}

        {databaseReady && gifts.length === 0 && (
          <div className="admin-empty">
            <strong>Todavía no hay regalos.</strong>
            <p>El primer regalo real va a aparecer acá.</p>
          </div>
        )}

        {gifts.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Destinatario</th>
                  <th>De</th>
                  <th>Experiencia</th>
                  <th>Estado</th>
                  <th>Código</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((gift) => (
                  <tr key={gift.public_code}>
                    <td><strong>{gift.recipient_name}</strong></td>
                    <td>{gift.giver_name}</td>
                    <td>{gift.experience_slug}</td>
                    <td><span className={`status-pill status-${gift.status}`}>{gift.status}</span></td>
                    <td><code>{gift.public_code}</code></td>
                    <td>{new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(gift.created_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
