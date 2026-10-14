import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {createAdminSupabase} from "@/lib/supabase/admin";
import {escapeRooms} from "@/data/escape-rooms";
import {createEscapeGift} from "./actions";
export const dynamic="force-dynamic";
export default async function EscapeAdmin(){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const {data,error}=await createAdminSupabase().from("gifts").select("public_code,experience_slug,recipient_name,status,created_at").like("experience_slug","escape-%").order("created_at",{ascending:false}).limit(50);
 return <main className="admin-page">
  <header className="admin-header"><div><span className="eyebrow">Te Hice Esto · laboratorio de misterios</span><h1>Invitaciones escape</h1></div><a className="ghost-action" href="/admin">← Panel</a></header>
  <section className="admin-editor-card"><h2>Crear una invitación privada</h2><p>Primero elegí una sala, cargá el final y guardala como borrador. Después podés publicarla y compartir su enlace privado.</p>
   {escapeRooms.map(room=><details key={room.slug} style={{marginTop:20,border:"1px solid #7774",borderRadius:16,padding:20}}>
    <summary style={{cursor:"pointer",fontWeight:700,fontSize:18}}>{room.title} · Crear nuevo</summary>
    <form action={createEscapeGift} className="admin-form" style={{paddingTop:22}}>
     <input type="hidden" name="room" value={room.slug}/>
     <div className="admin-form-grid">{room.fields.map(field=><label key={field.key} className={field.multiline?"admin-form-wide":undefined}>
      <span>{field.label}</span>
      {field.multiline?<textarea name={field.key} maxLength={field.max||650} placeholder={field.hint||""} required={field.required} rows={4}/>:<input name={field.key} defaultValue={field.defaultValue||""} maxLength={field.max||160} placeholder={field.hint||""} required={field.required&&!field.defaultValue}/>}
     </label>)}</div>
     <div className="admin-form-footer"><p>La configuración queda guardada en la base de datos, no en la URL pública.</p><button className="primary-action" type="submit">Crear borrador →</button></div>
    </form>
   </details>)}
  </section>
  <section className="admin-list-section"><h2>Invitaciones creadas</h2>
   {error?<p>No se pudo consultar el historial de invitaciones.</p>:!data?.length?<p>Todavía no hay invitaciones de estas tres salas.</p>:<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Invitación</th><th>Destinatario</th><th>Estado</th><th>Editar</th></tr></thead><tbody>{data.map(item=><tr key={item.public_code}><td>{item.experience_slug}</td><td>{item.recipient_name}</td><td>{item.status}</td><td><a href={"/admin/escapes/"+item.public_code}>Abrir edición →</a></td></tr>)}</tbody></table></div>}
  </section>
 </main>;
}