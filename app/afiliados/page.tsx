import { getAffiliateSession } from "@/lib/affiliate-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { loginAffiliate, logoutAffiliate } from "./actions";
import styles from "./afiliados.module.css";

export const dynamic = "force-dynamic";

function money(minor: number | null | undefined) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

export default async function AffiliadosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAffiliateSession();
  const { error } = await searchParams;

  if (!session) {
    return (
      <main className={styles.shell}>
        <section className={styles.login}>
          <span className={styles.kicker}>TE HICE ESTO · SOCIOS</span>
          <h1>Tu impacto,<br /><em>en números reales.</em></h1>
          <p>
            Accedé a tus links, ventas confirmadas y comisiones.
            Sólo contamos pagos realmente aprobados.
          </p>
          <form action={loginAffiliate} className={styles.form}>
            <label>
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              <span>Contraseña</span>
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            {error && <small className={styles.error}>Email o contraseña incorrectos.</small>}
            <button type="submit">Entrar al panel <b>↗</b></button>
          </form>
          <small className={styles.private}>Acceso privado · datos protegidos</small>
        </section>
      </main>
    );
  }

  const supabase = createAdminSupabase();
  const [{ data: stats }, { data: links }, { data: commissions }] = await Promise.all([
    supabase.from("affiliate_stats").select("*").eq("id", session.id).maybeSingle(),
    supabase
      .from("affiliate_links")
      .select("id,code,label,status,created_at")
      .eq("affiliate_id", session.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("affiliate_commissions")
      .select("id,gross_amount_minor,commission_amount_minor,status,approved_at,created_at")
      .eq("affiliate_id", session.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const visitors = Number(stats?.unique_visitors || 0);
  const sales = Number(stats?.approved_sales || 0);
  const conversion = visitors > 0 ? (sales / visitors) * 100 : 0;
  const primaryCode =
    links?.find((link) => link.status === "active")?.code ||
    stats?.primary_link_code;
  const baseUrl = primaryCode ? `https://tehiceesto.com/ref/${primaryCode}` : "";

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>TE HICE ESTO · SOCIOS</span>
          <h1>Hola, {session.name}.</h1>
          <p>Estos números salen de visitas y pagos reales atribuidos a tus links.</p>
        </div>
        <form action={logoutAffiliate}>
          <button className={styles.logout} type="submit">Cerrar sesión</button>
        </form>
      </header>

      <section className={styles.heroStats}>
        <article>
          <span>VENTAS CONFIRMADAS</span><strong>{sales}</strong><small>Pagos aprobados</small>
        </article>
        <article>
          <span>FACTURACIÓN GENERADA</span><strong>{money(stats?.revenue_minor)}</strong><small>Atribuida a tus ventas</small>
        </article>
        <article className={styles.highlight}>
          <span>COMISIÓN PENDIENTE</span><strong>{money(stats?.commission_pending_minor)}</strong><small>Lista para próxima liquidación</small>
        </article>
        <article>
          <span>COMISIÓN PAGADA</span><strong>{money(stats?.commission_paid_minor)}</strong><small>Histórico liquidado</small>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <span className={styles.sectionLabel}>TU LINK PRINCIPAL</span>
          <h2>Compartí. Nosotros medimos el resto.</h2>
          {baseUrl ? (
            <>
              <div className={styles.linkBox}><code>{baseUrl}</code></div>
              <div className={styles.sources}>
                <code>{baseUrl}?src=instagram</code>
                <code>{baseUrl}?src=tiktok</code>
                <code>{baseUrl}?src=youtube</code>
              </div>
            </>
          ) : (
            <p>Tu cuenta todavía no tiene un link activo. Contactanos para activarlo.</p>
          )}
          <small>La atribución usa último clic válido y dura 30 días.</small>
        </article>

        <article className={styles.card}>
          <span className={styles.sectionLabel}>EMBUDO</span>
          <div className={styles.funnel}>
            <div><span>Clics</span><strong>{Number(stats?.clicks || 0)}</strong></div>
            <div><span>Personas</span><strong>{visitors}</strong></div>
            <div><span>Pedidos atribuidos</span><strong>{Number(stats?.attributed_orders || 0)}</strong></div>
            <div><span>Ventas aprobadas</span><strong>{sales}</strong></div>
            <div><span>Conversión</span><strong>{conversion.toFixed(1)}%</strong></div>
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>ÚLTIMAS COMISIONES</span>
            <h2>Movimientos</h2>
          </div>
          <strong>{(session.commission_bps / 100).toFixed(0)}% por venta</strong>
        </div>

        {!commissions?.length ? (
          <div className={styles.empty}>
            Todavía no hay ventas confirmadas. Cuando llegue la primera, aparece acá.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr><th>Fecha</th><th>Venta</th><th>Comisión</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {commissions.map((item) => (
                  <tr key={item.id}>
                    <td>{new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(item.approved_at || item.created_at))}</td>
                    <td>{money(item.gross_amount_minor)}</td>
                    <td><strong>{money(item.commission_amount_minor)}</strong></td>
                    <td><span className={styles[`status_${item.status}`]}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <span>TE HICE ESTO</span>
        <p>
          Las comisiones se generan únicamente sobre pagos aprobados.
          Los reembolsos revierten la comisión asociada.
        </p>
      </footer>
    </main>
  );
}
