import type {Metadata} from "next";
import {adminRequest,isAdminAuthenticated} from "@/lib/admin-auth";
import {operationsLogin,operationsLogout,markContacted} from "./actions";
import {accessNeedsReview,historicalApprovalNeedsReview,operationalSaleCounts,saleAttentionPriority} from "@/lib/operations/sale-delivery-audit.mjs";
import "./operations.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Operaciones | Te Hice Esto",robots:{index:false,follow:false,nocache:true}};
type Sale={
 orderId:string;code:string;status:string;priceMinor:number|null;currency:string;
 experienceSlug:string;giftStatus:string;giverName:string;recipientName:string;
 buyerEmail:string;whatsapp:string;createdAt:string;paidAt:string|null;
 contactedAt:string|null;accessEmailAccepted:boolean;opsNoticeAccepted:boolean;opsNoticeAttempted:boolean;opsNoticeError:string|null;assisted:boolean;
};
function date(raw:string|null){return raw?new Intl.DateTimeFormat("es-AR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Argentina/Buenos_Aires"}).format(new Date(raw)):"—";}
type DeliveryMonitor={
 status:"ready"|"unavailable";windowDays:number;totalEvents:number;
 sent:number;delivered:number;delayed:number;bounced:number;failed:number;
 suppressed:number;complained:number;truncated:boolean;latestAt:string|null;
};
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
 const totals=operationalSaleCounts(sales);
 const accessReview=sales.filter(accessNeedsReview);
 const historicalReview=sales.filter(historicalApprovalNeedsReview);
 const delivery=result?.emailDelivery&&typeof result.emailDelivery==="object"?
   result.emailDelivery as DeliveryMonitor:null;
 const deliveryProblems=delivery?.status==="ready"?
   delivery.bounced+delivery.failed+delivery.suppressed+delivery.complained:0;
 const sortedSales=[...sales].sort((a,b)=>
   saleAttentionPriority(b)-saleAttentionPriority(a)||Date.parse(b.createdAt)-Date.parse(a.createdAt));
 return <main className="ops-page"><div className="ops-wrapper">
   <header className="ops-header"><div><div className="ops-eyebrow">TE HICE ESTO · OPERACIONES</div><h1>Ventas en <em>tiempo real.</em></h1><p>El equipo acompaña cada compra, reúne los materiales y prepara el regalo sin cambiar el modelo elegido.</p></div>
   <form action={operationsLogout}><button type="submit" className="ops-out">Cerrar sesión</button></form></header>
   <div className="ops-metrics">
    <article><span>Ventas aprobadas (Mercado Pago)</span><strong>{totals.approved}</strong></article>
    <article className={totals.accessReview?"ops-metric-attention":""}><span>Correos de acceso pendientes</span><strong>{totals.accessReview}</strong></article>
    <article><span>Pendientes de pago</span><strong>{totals.pending}</strong></article>
    <article><span>Pedidos registrados</span><strong>{totals.total}</strong></article>
   </div>
   <section className="ops-section ops-workflow" aria-label="Producción asistida del equipo">
     <div className="ops-workflow-title"><div className="ops-eyebrow">DESPUÉS DE CADA PAGO VERIFICADO</div><h2>Del pedido a la emoción.</h2><p>Este recorrido es interno. Nunca publiques una experiencia sin cotejar los datos, los archivos personales y la versión comprada.</p></div>
     <ol className="ops-workflow-steps">
       <li><strong>01 · Contactar</strong><span>Escribir al comprador y registrar el contacto, sin pedirle que diseñe una página.</span></li>
       <li><strong>02 · Reunir recuerdos</strong><span>Solicitar nombres, textos, fechas, fotos y audios necesarios para el modelo que eligió.</span></li>
       <li><strong>03 · Personalizar</strong><span>Abrir el editor privado del equipo. Conservar las escenas, animaciones y efectos del modelo.</span></li>
       <li><strong>04 · Revisar y entregar</strong><span>Probar la vista previa en celular; publicar solo cuando esté correcta y compartir el enlace privado.</span></li>
     </ol>
     <p className="ops-workflow-warning" role="status"><strong>Transición pendiente:</strong> hoy el sistema también envía acceso automático a «Mis regalos» y ofrece edición al comprador. Hasta que ese flujo se adapte y se pruebe, no comunicar que la producción es exclusivamente asistida.</p>
   </section>
   {accessReview.length>0&&<p className="ops-followup-notice" role="alert"><strong>{accessReview.length} pago{accessReview.length===1?"":"s"} acreditado{accessReview.length===1?"":"s"} sin confirmación de aceptación del correo de acceso.</strong> Revisá el pedido y el transporte antes de reenviar manualmente; este panel no envía correos ni modifica pagos.</p>}
   {historicalReview.length>0&&<p className="ops-followup-notice" role="status"><strong>{historicalReview.length} registro{historicalReview.length===1?"":"s"} histórico{historicalReview.length===1?"":"s"} incompleto{historicalReview.length===1?"":"s"}.</strong> Figura{historicalReview.length===1?"":"n"} como aprobado{historicalReview.length===1?"":"s"}, pero sin fecha de pago o importe válido. No se cuenta{historicalReview.length===1?"":"n"} como correo pendiente ni se reenvía{historicalReview.length===1?"":"n"} automáticamente.</p>}
   {!result?.sales&&<p className="ops-error" role="alert">No pudimos consultar las ventas. Revisá la conexión antes de operar.</p>}
   <section className="ops-section" aria-label="Entrega de correos">
     <h2>Entrega de correos · Resend</h2>
     <p>Eventos firmados recibidos en los últimos siete días, desde que se activó el monitoreo. No incluye mensajes anteriores ni garantiza que la persona haya leído el correo. Estas cifras no se asocian individualmente a los pedidos.</p>
     {delivery?.status==="ready"?<>
       <div className="ops-metrics">
         <article><span>Correos enviados · eventos</span><strong>{delivery.sent}</strong></article>
         <article><span>Entregas confirmadas</span><strong>{delivery.delivered}</strong></article>
         <article className={deliveryProblems?"ops-metric-attention":""}><span>Rebotes, fallos o bloqueos</span><strong>{deliveryProblems}</strong></article>
         <article><span>Entregas demoradas</span><strong>{delivery.delayed}</strong></article>
       </div>
       {deliveryProblems>0&&<p className="ops-followup-notice" role="alert">Resend informó {deliveryProblems} evento{deliveryProblems===1?"":"s"} de rebote, fallo, supresión o queja en la última semana. Revisá los mensajes en Resend antes de tomar medidas. No se reenvía automáticamente.</p>}
       {delivery.truncated&&<p role="status">La consulta alcanzó el límite de 2000 eventos. Los valores podrían ser inferiores a los reales.</p>}
       <p>Último evento recibido: {date(delivery.latestAt)}. Que un correo figure entregado significa aceptación por el servidor de destino, no lectura por el comprador.</p>
     </>:<p role="status">Todavía no hay monitoreo de entrega disponible. Podés consultar el estado de los correos directamente en Resend.</p>}
   </section>
   <section className="ops-section"><h2>Historial de compras</h2><p>Los pagos se acreditan únicamente mediante Mercado Pago. En compras acreditadas, usá las acciones privadas para contactar al comprador y preparar el regalo; el acceso automático del comprador sigue activo hasta completar el cambio de modelo comercial.</p>
     {!sales.length?<p className="ops-empty">Todavía no hay operaciones para mostrar.</p>:
       <div className="ops-cards">{sortedSales.map(s=>{
        const paid=s.status==="approved";
        const accessPending=accessNeedsReview(s);
        const historicalIncomplete=historicalApprovalNeedsReview(s);
        return <article key={s.orderId} className={"ops-sale"+(accessPending||historicalIncomplete?" ops-attention":"")}>
          <div className="ops-sale-head"><span>#{s.code||"Pedido sin código"}</span><b>{accessPending?"PAGO · REVISAR CORREO":historicalIncomplete?"REGISTRO HISTÓRICO · REVISAR":paid?"PAGO ACREDITADO":s.status.toUpperCase()}</b></div>
          <h3>{s.experienceSlug||"Experiencia personalizada"}</h3>
          <p className="ops-price">{peso(s.priceMinor)}</p>
          <dl><div><dt>Contacto</dt><dd>{s.buyerEmail||"Sin email"}</dd></div>
          <div><dt>WhatsApp</dt><dd>{s.whatsapp||"Sin teléfono"}</dd></div>
          <div><dt>Creado</dt><dd>{date(s.createdAt)}</dd></div>
          <div><dt>Pago acreditado</dt><dd>{date(s.paidAt)}</dd></div>
          <div><dt>Confirmación por correo</dt><dd>{s.accessEmailAccepted?"Aceptada por proveedor (no garantiza recepción)":historicalIncomplete?"Registro incompleto · verificar antes de reenviar":!paid?"Pendiente de acreditación":"Sin confirmación de aceptación"}</dd></div>
          <div><dt>Aviso al equipo</dt><dd>{s.opsNoticeAccepted?"Enviado al equipo":!paid?"—":s.opsNoticeError==="ops_recipient_not_configured"?"Falta configurar correo del equipo":s.opsNoticeAttempted?"En espera de reintento":"Aún no se intentó"}</dd></div>
          <div><dt>Producción asistida</dt><dd>{paid?(s.contactedAt?"Contacto registrado · preparar en editor interno":"Pendiente de contacto y materiales"):"Comienza con el pago acreditado"}</dd></div>
          <div><dt>Seguimiento de contacto</dt><dd>{s.contactedAt?date(s.contactedAt):paid?"Sin registrar · no bloquea la entrega":"—"}</dd></div></dl>
          {paid&&<div className="ops-actions">
            {s.whatsapp&&/^\+?[0-9\s().-]{8,25}$/.test(s.whatsapp)&&<a href={"https://wa.me/"+s.whatsapp.replace(/\D/g,"")} target="_blank" rel="noopener noreferrer">WhatsApp del comprador ↗</a>}
            {s.buyerEmail&&<a href={"mailto:"+encodeURIComponent(s.buyerEmail)}>Escribir por email ↗</a>}
            {s.code&&/^[a-z0-9-]{6,64}$/i.test(s.code)&&<a href={"/admin/gifts/"+encodeURIComponent(s.code)}>Preparar en editor privado ↗</a>}
            {s.code&&/^[a-z0-9-]{6,64}$/i.test(s.code)&&<a href={"/admin/gifts/"+encodeURIComponent(s.code)+"/preview"}>Revisar vista previa ↗</a>}
            {!s.contactedAt&&<form action={markContacted}>
              <input type="hidden" name="orderId" value={s.orderId}/>
              <button type="submit">✓ Marcar como contactado</button>
            </form>}
          </div>}
        </article>;
       })}</div>}
   </section>
 </div></main>;
}
