import {adminAffiliateCall,adminAffiliateSession} from "@/lib/affiliates/admin-backend";
import {createAffiliateAction,loginAffiliateAdmin,logoutAffiliateAdmin,payAffiliateAction,setAffiliateStatusAction} from "./actions";
import styles from "./affiliates.module.css";
export const dynamic="force-dynamic";
export const revalidate=0;

type Row={id:string;name:string;email:string;status:string;primary_link_code:string|null;
 clicks:number|string|null;unique_visitors:number|string|null;attributed_orders:number|string|null;
 approved_sales:number|string|null;revenue_minor:number|string|null;commission_pending_minor:number|string|null;
 commission_paid_minor:number|string|null;commission_available_minor:number|string|null;commission_bps:number|string|null};
const money=(amount:unknown)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(Number(amount||0)/100);
const notices:Record<string,string>={
 creado:"Influencer creado. Ya tiene un enlace de referido y puede entrar a su panel.",
 actualizado:"El estado de la cuenta fue actualizado.",
 liquidado:"Liquidación registrada. Debe existir una transferencia externa previamente comprobada.",
 "datos-invalidos":"Revisá los campos. La contraseña inicial debe tener al menos 12 caracteres.",
 "email-existente":"El email o el código de referido ya está registrado.",
 "no-se-pudo-crear":"No pudimos crear la cuenta. Revisá los datos y probá otra vez.",
 "actualizacion-fallida":"No se pudo actualizar el estado.",
 "referencia-requerida":"Confirmá la transferencia externa e ingresá su referencia antes de registrarla.",
 "sin-comisiones-pendientes":"No se pudo registrar la liquidación. Revisá el saldo pendiente.",
 credenciales:"Clave de acceso incorrecta.",
 sesion:"La sesión venció. Volvé a ingresar."
};
export default async function AdminAffiliatesPage({searchParams}:{searchParams:Promise<{notice?:string}>}){
 const {notice}=await searchParams;
 const token=await adminAffiliateSession();
 let rows:Row[]=[];let authenticated=false;let problem=false;
 if(token){
  try{
   const response=await adminAffiliateCall({action:"list"},token);
   if(response.ok&&Array.isArray(response.data.affiliates)){
    authenticated=true;rows=response.data.affiliates as Row[];
   }else if(response.status!==401){problem=true;}
  }catch{problem=true;}
 }
 if(!authenticated){
  return <main className="admin-page admin-login-page">
   <section className="admin-login-card" style={{maxWidth:480}}>
    <span className="eyebrow">TE HICE ESTO · OPERACIÓN INTERNA</span>
    <h1>Administrar influencers.</h1>
    <p>Acceso privado para gestionar enlaces, resultados y liquidaciones. Las cuentas de influencers tienen su propio acceso en <a href="/afiliados">/afiliados</a>.</p>
    <form action={loginAffiliateAdmin}>
     <label><span>Clave administrativa</span><input type="password" name="accessKey" autoComplete="current-password" required minLength={8}/></label>
     {notice&&notices[notice]&&<p role="alert" className="admin-error">{notices[notice]}</p>}
     {problem&&<p role="alert" className="admin-error">El servicio está temporalmente no disponible. No se realizó ningún cambio.</p>}
     <button type="submit" className="primary-action">Entrar al panel →</button>
    </form>
   </section>
  </main>;
 }
 const count=(key:keyof Row)=>rows.reduce((sum,item)=>sum+Number(item[key]||0),0);
 return <main className="admin-page">
  <header className="admin-header">
   <div><span className="eyebrow">TE HICE ESTO · REFERIDOS</span><h1>Influencers</h1><p style={{color:"#8e7884"}}>Visitas, compras atribuidas y liquidaciones verificables.</p></div>
   <div className="admin-header-actions">
    <a className="ghost-action" href="/afiliados">Panel del influencer ↗</a>
    <form action={logoutAffiliateAdmin}><button className="ghost-action" type="submit">Cerrar sesión</button></form>
   </div>
  </header>
  {notice&&notices[notice]&&<p className={styles.notice} role="status">{notices[notice]}</p>}
  <section className={styles.summary}>
   <article><span>Influencers</span><strong>{rows.length}</strong></article>
   <article><span>Visitas registradas</span><strong>{count("clicks")}</strong></article>
   <article><span>Ventas aprobadas</span><strong>{count("approved_sales")}</strong></article>
   <article><span>Ingresos referidos</span><strong>{money(count("revenue_minor"))}</strong></article>
   <article><span>Comisiones pendientes</span><strong>{money(count("commission_pending_minor"))}</strong></article>
  </section>
  <section className={styles.create}>
   <div><span className="eyebrow">ALTA SEGURA</span><h2>Nuevo influencer</h2>
    <p>Creamos su acceso y un enlace con seguimiento de 30 días, sin cambiar el proceso de compra del cliente.</p>
   </div>
   <form action={createAffiliateAction}>
    <label><span>Nombre</span><input name="name" required minLength={2} placeholder="Nombre del influencer"/></label>
    <label><span>Email</span><input name="email" type="email" required placeholder="correo@ejemplo.com"/></label>
    <label><span>WhatsApp (opcional)</span><input name="whatsapp" inputMode="tel" placeholder="549..."/></label>
    <label><span>Código de enlace</span><input name="slug" pattern="[A-Za-z0-9 -]{3,40}" placeholder="nombre-creador"/></label>
    <label><span>Comisión por venta (%)</span><input name="commissionPercent" type="number" min="0" max="50" step="0.5" defaultValue="20" required/></label>
    <label><span>Contraseña temporal (12 caracteres mínimo)</span><input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label>
    <button className="primary-action" type="submit">Crear y habilitar enlace →</button>
   </form>
  </section>
  <section className={styles.list}>
   <div className={styles.title}><div><span className="eyebrow">RENDIMIENTO</span><h2>Enlaces y comisiones</h2></div><small>Solo pagos aprobados generan comisiones.</small></div>
   {!rows.length?<div className="admin-empty"><strong>Todavía no hay influencers.</strong><p>Podés crear el primero arriba.</p></div>:
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr>
     <th>Influencer</th><th>Enlace</th><th>Visitas</th><th>Pedidos</th><th>Ventas</th><th>Facturación</th><th>Comisión</th><th>Estado y acciones</th>
    </tr></thead><tbody>
    {rows.map(item=><tr key={item.id}>
     <td><strong>{item.name}</strong><small style={{display:"block",marginTop:4}}>{item.email}</small></td>
     <td>{item.primary_link_code?<a href={`/ref/${item.primary_link_code}`} style={{fontWeight:700}} target="_blank" rel="noopener noreferrer">/ref/{item.primary_link_code} ↗</a>:"—"}</td>
     <td>{Number(item.clicks||0)}<small style={{display:"block"}}>{Number(item.unique_visitors||0)} personas</small></td>
     <td>{Number(item.attributed_orders||0)}</td><td><strong>{Number(item.approved_sales||0)}</strong></td>
     <td>{money(item.revenue_minor)}</td><td>{money(item.commission_pending_minor)}</td>
     <td><span style={{fontWeight:700}}>{item.status==="active"?"Activo":"Pausado"}</span>
      <small style={{display:"block"}}>{Number(item.commission_bps||0)/100}% por venta</small>
      <form action={setAffiliateStatusAction} className={styles.actions}>
       <input type="hidden" name="affiliateId" value={item.id}/><input type="hidden" name="status" value={item.status==="active"?"paused":"active"}/>
       <button className="ghost-action" type="submit">{item.status==="active"?"Pausar":"Activar"}</button>
      </form>
      {Number(item.commission_available_minor||item.commission_pending_minor||0)>0&&
       <form action={payAffiliateAction} className={styles.pay} style={{marginTop:12,display:"grid",gap:8}}>
        <input type="hidden" name="affiliateId" value={item.id}/>
        <label><span>Referencia de transferencia ya realizada</span><input name="reference" minLength={5} required placeholder="Comprobante externo"/></label>
        <label style={{fontSize:11,display:"flex",gap:6,alignItems:"center"}}><input name="transferConfirmed" type="checkbox" value="yes" required/> Ya comprobé el pago fuera de TeHiceEsto</label>
        <button className="primary-action" type="submit">Registrar liquidación</button>
       </form>}
     </td>
    </tr>)}</tbody></table></div>}
  </section>
 </main>;
}