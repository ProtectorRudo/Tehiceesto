import CopyReferralLink from "@/components/CopyReferralLink";
import { getAffiliateDashboard } from "@/lib/affiliates/dashboard";
import {AFFILIATE_SESSION_COOKIE} from "@/lib/affiliates/backend";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import { loginAffiliate, logoutAffiliate,changeAffiliatePassword } from "./actions";
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
  searchParams: Promise<{ error?: string; change?: string }>;
}) {
  const dashboard = await getAffiliateDashboard();
  const session = dashboard?.affiliate||null;
  const { error,change } = await searchParams;

  if(change==="1"){
    // The backend intentionally blocks dashboard reads until the temporary
    // password is replaced. Show this form to a browser holding a session;
    // the server endpoint still validates that session before changing a password.
    const jar=await cookies();
    const hasSession=Boolean(jar.get(AFFILIATE_SESSION_COOKIE)?.value);
    if(!hasSession)redirect("/afiliados?error=credenciales");

    return <main className={styles.shell+" studio-page studio-affiliates-page"}>
      <section className={styles.login}>
        <span className={styles.kicker}>TE HICE ESTO · ACCESO SEGURO</span>
        <h1>Protegé <em>tu cuenta.</em></h1>
        <p>Para continuar, elegí una contraseña nueva de al menos 12 caracteres.</p>
        <form action={changeAffiliatePassword} className={styles.form}>
          <label><span>Contraseña nueva</span><input name="password" type="password" autoComplete="new-password" minLength={12} required/></label>
          <label><span>Repetir contraseña</span><input name="confirm" type="password" autoComplete="new-password" minLength={12} required/></label>
          {error&&<small className={styles.error}>Revisá que ambas contraseñas coincidan y tengan al menos 12 caracteres.</small>}
          <button type="submit">Guardar y entrar al panel ↗</button>
        </form>
      </section>
    </main>;
  }
  if (!session) {
    return (
      <main className={styles.shell + " studio-page studio-affiliates-page"}>
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

  const stats=dashboard!.stats;
  const last30=dashboard!.series||[];
  const sources=Object.entries(dashboard!.sources||{}).sort((a,b)=>b[1].clicks-a[1].clicks).slice(0,6);
  const maxDailyClicks=Math.max(1,...last30.map(day=>day.clicks));
  const clicks30=last30.reduce((sum,day)=>sum+day.clicks,0);
  const sales30=last30.reduce((sum,day)=>sum+day.sales,0);
  const links=dashboard!.links;
  const commissions=dashboard!.recentSales.map(item=>({
    id:item.id,gross_amount_minor:item.saleAmountMinor,
    commission_amount_minor:item.commissionAmountMinor,status:item.status,
    approved_at:item.date,created_at:item.date,
  }));

  const visitors = Number(stats?.unique_visitors || 0);
  const sales = Number(stats?.approved_sales || 0);
  const conversion = visitors > 0 ? (sales / visitors) * 100 : 0;
  const primaryCode =
    links?.find((link) => link.status === "active")?.code ||
    stats?.primary_link_code;
  const baseUrl = primaryCode ? `https://tehiceesto.com/ref/${primaryCode}` : "";

  return (
    <main className={styles.dashboard + " studio-page studio-affiliates-page"}>
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
              <CopyReferralLink url={baseUrl}/>
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

      <section className={styles.insights}>
        <article className={styles.card}>
          <span className={styles.sectionLabel}>ÚLTIMOS 30 DÍAS</span>
          <h2>Tu alcance, día a día.</h2>
          <p className={styles.insightSummary}>{clicks30} clics registrados · {sales30} ventas confirmadas</p>
          <div className={styles.trend} role="img" aria-label={"Clics diarios de los últimos 30 días, total "+clicks30}>
            {last30.map(day=><div key={day.date} className={styles.trendColumn}
              title={day.date+": "+day.clicks+" clics, "+day.sales+" ventas"}
              style={{height:Math.max(4,(day.clicks/maxDailyClicks)*100)+"%"}}/>)}
          </div>
          <p className={styles.insightFoot}>Cada barra representa un día. Las ventas cuentan únicamente pagos aprobados.</p>
        </article>
        <article className={styles.card}>
          <span className={styles.sectionLabel}>DÓNDE TE ENCUENTRAN</span>
          <h2>Canales de origen.</h2>
          <div className={styles.funnel}>
            {sources.length?sources.map(([name,detail])=><div key={name}>
              <span>{name==="directo"?"Directo / sin etiqueta":name}</span>
              <strong>{detail.clicks} <small>clics</small> · {detail.sales} <small>ventas</small></strong>
            </div>):<p className={styles.insightFoot}>Todavía no hay visitas registradas en los últimos 30 días.</p>}
          </div>
        </article>
      </section>
      <section className={styles.card}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>ÚLTIMAS COMISIONES</span>
            <h2>Movimientos</h2>
          </div>
          <strong>{(session.commissionBps / 100).toFixed(0)}% por venta</strong>
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
