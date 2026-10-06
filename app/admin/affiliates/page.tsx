import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  createAffiliateAction,
  payAffiliateAction,
  setAffiliateStatusAction,
} from "./actions";
import styles from "./affiliates.module.css";

export const dynamic = "force-dynamic";

function money(minor: number | null | undefined) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

const notices: Record<string, string> = {
  creado: "Influencer creado y link principal activado.",
  liquidado: "Comisiones pendientes marcadas como pagadas.",
  "datos-invalidos": "Revisá los datos: contraseña mínima 10 caracteres y comisión entre 0% y 50%.",
  "email-existente": "Ya existe un influencer con ese email.",
  "no-se-pudo-crear": "No se pudo crear el influencer.",
  "link-duplicado": "Ese código de referido ya existe.",
  "sin-comisiones-pendientes": "No hay comisiones pendientes para liquidar.",
};

export default async function AdminAffiliatesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin");

  const { notice } = await searchParams;
  const supabase = createAdminSupabase();
  const { data: affiliates, error } = await supabase
    .from("affiliate_stats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("affiliate_stats_load_failed", error);

  const rows = affiliates || [];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Te Hice Esto · crecimiento</span>
          <h1>Referidos</h1>
        </div>
        <div className="admin-header-actions">
          <a className="ghost-action" href="/admin">← Regalos</a>
        </div>
      </header>

      {notice && notices[notice] && <div className={styles.notice}>{notices[notice]}</div>}

      <section className={styles.summary}>
        <article><span>Influencers</span><strong>{rows.length}</strong></article>
        <article>
          <span>Ventas aprobadas</span>
          <strong>{rows.reduce((sum, item) => sum + Number(item.approved_sales || 0), 0)}</strong>
        </article>
        <article>
          <span>Facturación referida</span>
          <strong>{money(rows.reduce((sum, item) => sum + Number(item.revenue_minor || 0), 0))}</strong>
        </article>
        <article>
          <span>Comisión pendiente</span>
          <strong>{money(rows.reduce((sum, item) => sum + Number(item.commission_pending_minor || 0), 0))}</strong>
        </article>
      </section>

      <section className={styles.create}>
        <div>
          <span className="eyebrow">Alta rápida</span>
          <h2>Nuevo influencer</h2>
          <p>Se crea su cuenta privada y su link principal en el mismo paso.</p>
        </div>
        <form action={createAffiliateAction}>
          <label><span>Nombre</span><input name="name" required placeholder="Ej. Sofía Méndez" /></label>
          <label><span>Email</span><input name="email" type="email" required placeholder="sofia@email.com" /></label>
          <label><span>WhatsApp</span><input name="whatsapp" placeholder="549..." /></label>
          <label><span>Código del link</span><input name="slug" placeholder="sofia" pattern="[A-Za-z0-9 -]{3,40}" /></label>
          <label><span>Comisión %</span><input name="commissionPercent" type="number" min="0" max="50" step="0.5" defaultValue="20" required /></label>
          <label><span>Contraseña inicial</span><input name="password" type="password" minLength={10} required /></label>
          <button className="primary-action" type="submit">Crear influencer</button>
        </form>
      </section>

      <section className={styles.list}>
        <div className={styles.title}>
          <div><span className="eyebrow">Rendimiento</span><h2>Todos los influencers</h2></div>
          <small>Último clic · ventana de atribución 30 días</small>
        </div>

        {!rows.length ? (
          <div className="admin-empty">
            <strong>Todavía no hay influencers.</strong>
            <p>Creá el primero arriba y su link queda listo al instante.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Influencer</th><th>Link</th><th>Clics</th><th>Ventas</th>
                  <th>Facturación</th><th>Pendiente</th><th>Comisión</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((affiliate) => (
                  <tr key={affiliate.id}>
                    <td><strong>{affiliate.name}</strong><br /><small>{affiliate.email}</small></td>
                    <td>{affiliate.primary_link_code ? <code>tehiceesto.com/ref/{affiliate.primary_link_code}</code> : "—"}</td>
                    <td>{Number(affiliate.clicks || 0)}<br /><small>{Number(affiliate.unique_visitors || 0)} personas</small></td>
                    <td>{Number(affiliate.approved_sales || 0)}<br /><small>{Number(affiliate.attributed_orders || 0)} pedidos</small></td>
                    <td>{money(affiliate.revenue_minor)}</td>
                    <td><strong>{money(affiliate.commission_pending_minor)}</strong></td>
                    <td>{(Number(affiliate.commission_bps || 0) / 100).toFixed(1)}%</td>
                    <td>
                      <div className={styles.actions}>
                        <form action={setAffiliateStatusAction}>
                          <input type="hidden" name="affiliateId" value={affiliate.id || ""} />
                          <input type="hidden" name="status" value={affiliate.status === "active" ? "paused" : "active"} />
                          <button className="ghost-action" type="submit">
                            {affiliate.status === "active" ? "Pausar" : "Activar"}
                          </button>
                        </form>
                        {Number(affiliate.commission_pending_minor || 0) > 0 && (
                          <form action={payAffiliateAction} className={styles.pay}>
                            <input type="hidden" name="affiliateId" value={affiliate.id || ""} />
                            <input name="reference" placeholder="Ref. transferencia" />
                            <button className="primary-action" type="submit">Liquidar</button>
                          </form>
                        )}
                      </div>
                    </td>
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
