import type {Metadata} from "next";
import {adminRequest,isAdminAuthenticated} from "@/lib/admin-auth";
import {operationsLogin,operationsLogout} from "./actions";
import "./operations.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Operaciones | Te Hice Esto",robots:{index:false,follow:false,nocache:true}};
type Sale={
 orderId:string;code:string;status:string;priceMinor:number|null;currency:string;
 experienceSlug:string;giftStatus:string;giverName:string;recipientName:string;
 buyerEmail:string;whatsapp:string;createdAt:string;paidAt:string|null;
 contactedAt:string|null;accessEmailAccepted:boolean;assisted:boolean;
};
function date(raw:string|null){return raw?new Intl.DateTimeFormat("es-AR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Argentina/Buenos_Aires"}).format(new Date(raw)):"—";}
const peso=(n:number|null)=>n===null?"—":new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n/100);
export default async function Operations({searchParams}:{searchParams:Promise<{error?:string}>}){
 const authenticated=await isAdminAuthenticated();
 const {error}=await searchParams;
 if(!authenticated)return <main className="ops-page"><section className="ops-login">
   <div className="ops-eyebrow">TE HICE ESTO · PRIVADO</div>
   <h1>Centro de <em>operaciones.</em></h1>
   <p>Acceso exclusivo para revisar ventas y el estado de los pagos.</p>
   <form action={operationsLogin}>
     <label htmlFor="accessKey">Clave administrativa</label>
     <input name="accessKey" id="accessKey" type="password" required autoComplete="current-password"/>
     {error&&<p role="alert">Acceso no autorizado. Verificá la clave.</p>}
     <button type="submit">Entrar al panel</button>
   </form>
 </section></main>;
 const result=await adminRequest("listSales");
 const sales=Array.isArray(result?.sales)?result.sales as Sale[]:[];
 const approved=sales.filter(s=>s.status==="approved");
 const pending=sales.filter(s=>s.status==="pending");
 return <main className="ops-page"><div className="ops-wrapper">
   <header className="ops-header"><div><div className="ops-eyebrow">TE HICE ESTO · OPERACIONES</div><h1>Ventas en <em>tiempo real.</em></h1><p>El comprador personaliza su regalo desde su cuenta.</p></div>
   <form action={operationsLogout}><button type="submit" className="ops-out">Cerrar sesión</button></form></header>
   <div className="ops-metrics"><article><span>Ventas aprobadas</span><strong>{approved.length}</strong></article><article><span>Pendientes de pago</span><strong>{pending.length}</strong></article><article><span>Pedidos recientes</span><strong>{sales.length}</strong></article></div>
   {!result?.sales&&<p className="ops-error" role="alert">No pudimos consultar las ventas. Revisá la conexión antes de operar.</p>}
   <section className="ops-section"><h2>Historial de compras</h2><p>Los pagos solo se acreditan mediante el proveedor. Después, el comprador recibe el acceso a «Mis regalos» para editar, publicar y compartir.</p>
     {!sales.length?<p className="ops-empty">Todavía no hay operaciones para mostrar.</p>:
       <div className="ops-cards">{sales.map(s=>{
        const paid=s.status==="approved";
        return <article key={s.orderId} className={"ops-sale"+(paid&&!s.contactedAt?" ops-attention":"")}>
          <div className="ops-sale-head"><span>#{s.code||"Pedido sin código"}</span><b>{paid?"PAGO APROBADO":s.status.toUpperCase()}</b></div>
          <h3>{s.experienceSlug||"Experiencia personalizada"}</h3>
          <p className="ops-price">{peso(s.priceMinor)}</p>
          <dl><div><dt>Contacto</dt><dd>{s.buyerEmail||"Sin email"}</dd></div>
          <div><dt>WhatsApp</dt><dd>{s.whatsapp||"Sin teléfono"}</dd></div>
          <div><dt>Creado</dt><dd>{date(s.createdAt)}</dd></div>
          <div><dt>Pago acreditado</dt><dd>{date(s.paidAt)}</dd></div>
          <div><dt>Confirmación por correo</dt><dd>{s.accessEmailAccepted?"Aceptada por proveedor":"Sin confirmación de envío"}</dd></div>
          <div><dt>Personalización</dt><dd>{paid?"Desde Mis regalos":"Disponible después del pago"}</dd></div></dl>

        </article>;
       })}</div>}
   </section>
 </div></main>;
}
