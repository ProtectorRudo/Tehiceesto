import {notFound,redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {createAdminSupabase} from "@/lib/supabase/admin";
import {getEscapeRoom} from "@/data/escape-rooms";
import {saveEscapeGift} from "../actions";
export const dynamic="force-dynamic";
export default async function EditEscape({params,searchParams}:{params:Promise<{code:string}>;searchParams:Promise<{updated?:string}>}){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const {code}=await params;
 if(!/^[a-f0-9]{18}$/.test(code))notFound();
 const {data}=await createAdminSupabase().from("gifts").select("experience_slug,recipient_name,giver_name,status,story_data").eq("public_code",code).single();
 if(!data)notFound();
 const room=getEscapeRoom(data.experience_slug.replace(/^escape-/,""));
 if(!room||data.experience_slug!=="escape-"+room.slug)notFound();
 const raw=data.story_data&&typeof data.story_data==="object"&&!Array.isArray(data.story_data)?data.story_data.escapeConfig:null;
 const config=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as Record<string,string>:{};
 const {updated}=await searchParams;
 return <main className="admin-page">
  <header className="admin-header"><div><span className="eyebrow">Editor privado · {room.eyebrow}</span><h1>{room.title}</h1><p>Para {data.recipient_name} · Estado: {data.status}</p></div><a className="ghost-action" href="/admin/escapes">← Invitaciones</a></header>
  <section className="admin-editor-card">
   {updated&&<p role="status">Cambios guardados correctamente.</p>}
   {data.status==="published"&&<p><a href={"/escape-r/"+code} target="_blank" rel="noopener noreferrer">Abrir enlace privado publicado ↗</a></p>}
   <form action={saveEscapeGift} className="admin-form">
    <input type="hidden" name="code" value={code}/>
    <div className="admin-form-grid">{room.fields.map(field=><label key={field.key} className={field.multiline?"admin-form-wide":undefined}>
     <span>{field.label}</span>{field.hint&&<small>{field.hint}</small>}
     {field.multiline?<textarea name={field.key} key={field.key} defaultValue={config[field.key]||field.defaultValue||""} maxLength={field.max||650} required={field.required} rows={5}/>:<input name={field.key} defaultValue={config[field.key]||field.defaultValue||""} maxLength={field.max||160} required={field.required&&!field.defaultValue}/>}
    </label>)}</div>
    <div className="admin-form-footer"><p>Los cambios no alteran la escena ni los acertijos de los otros juegos. Publicar habilita /escape-r/ con un identificador aleatorio.</p>
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      <button className="ghost-action" name="intent" value="save" type="submit">Guardar cambios</button>
      <button className="primary-action" name="intent" value={data.status==="published"?"unpublish":"publish"} type="submit">{data.status==="published"?"Despublicar":"Publicar invitación"} →</button>
    </div></div>
   </form>
  </section>
 </main>;
}