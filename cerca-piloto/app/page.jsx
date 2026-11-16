"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@supabase/supabase-js";

const URL=process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const categories={conectar:{icon:"♡",title:"Conectar",sub:"Un momento juntos",tone:"peach"},comprender:{icon:"◉",title:"Comprender",sub:"Escuchar su mundo",tone:"sage"},sembrar:{icon:"✧",title:"Sembrar",sub:"Acompañar su autonomía",tone:"sun"}};
const inspirations=[
 {tag:"Evidencia · Primera infancia",title:"Primero responder, después enseñar",desc:"Las interacciones de ida y vuelta, siguiendo las señales del niño, ayudan a construir vínculos y habilidades tempranas.",source:"Harvard · Center on the Developing Child",url:"https://developingchild.harvard.edu/resource-guides/guide-serve-and-return/"},
 {tag:"Guía por edades",title:"Acompañar también significa dejar crecer",desc:"La crianza positiva se adapta a cada etapa e incluye protección, conexión y oportunidades para la independencia.",source:"CDC · Positive Parenting Tips",url:"https://www.cdc.gov/child-development/positive-parenting-tips/index.html"},
 {tag:"Evidencia · Cuidadores",title:"El bienestar del adulto también importa",desc:"El estrés y las condiciones del cuidador afectan su disponibilidad; vale la pena elegir pequeñas acciones posibles.",source:"Harvard · Serve and Return",url:"https://developingchild.harvard.edu/resource-guides/guide-serve-and-return/"}
];
const emptyChild={id:null,name:"",age_years:"",interests:"",goals:"",notes:""};
const moodOptions=[["bien","😊","Con energía"],["normal","🙂","Un día normal"],["cansado","😮‍💨","Con poco resto"],["dificil","🫶","Día difícil"]];
function csv(s){return String(s||"").split(",").map(v=>v.trim()).filter(Boolean).slice(0,12)}
function localDay(timeZone="America/Argentina/Buenos_Aires"){
 try{return new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}catch{return new Date().toISOString().slice(0,10)}
}
function mark(status){return status==="hecha"?"Realizada":status==="omitida"?"Dejada para otro día":""}
function Icon({children}){return <span aria-hidden="true">{children}</span>}
export default function Home(){
 const db=useMemo(()=>URL&&KEY?createClient(URL,KEY):null,[]);
 const [session,setSession]=useState(null),[authLoading,setAuthLoading]=useState(true),[register,setRegister]=useState(false);
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[authBusy,setAuthBusy]=useState(false);
 const [message,setMessage]=useState(""),[view,setView]=useState("hoy"),[family,setFamily]=useState(null),[kids,setKids]=useState([]);
 const [missions,setMissions]=useState([]),[weekly,setWeekly]=useState(null),[entries,setEntries]=useState([]),[past,setPast]=useState([]);
 const [mood,setMood]=useState(null),[moodDetail,setMoodDetail]=useState(""),[moodBusy,setMoodBusy]=useState(false);
 const [newChild,setNewChild]=useState(emptyChild),[childEditor,setChildEditor]=useState(false),[saving,setSaving]=useState(false);
 const [loadingMissions,setLoadingMissions]=useState(false),[source,setSource]=useState(""),[openMission,setOpenMission]=useState(null);
 const [reflections,setReflections]=useState({}),[guideInput,setGuideInput]=useState(""),[guideAnswer,setGuideAnswer]=useState(""),[guideBusy,setGuideBusy]=useState(false);
 const [mutating,setMutating]=useState(false);
 const today=localDay(family?.timezone);

 useEffect(()=>{
  if(!db){setAuthLoading(false);return}
  db.auth.getSession().then(({data})=>{setSession(data.session||null);setAuthLoading(false)});
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,s)=>setSession(s));
  if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
  return ()=>subscription.unsubscribe();
 },[db]);
 useEffect(()=>{if(session&&db)refresh(session);else{setFamily(null);setKids([]);setMissions([]);setEntries([]);setWeekly(null)}},[session?.user?.id,db]);

 async function refresh(active=session){
  if(!active||!db)return;
  const f=await db.from("cerca_families").select("*").eq("owner_id",active.user.id).maybeSingle();
  if(f.error){setMessage("No se pudieron leer los datos. Revisá la conexión y el esquema CERCA.");return}
  let fam=f.data;
  if(!fam){
   const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"America/Argentina/Buenos_Aires";
   const created=await db.from("cerca_families").insert({owner_id:active.user.id,timezone:tz}).select("*").single();
   if(created.error){setMessage("No se pudo crear la familia. Revisá la configuración.");return}
   fam=created.data;
  }
  setFamily(fam);
  const [k,e,mo,p]=await Promise.all([
   db.from("cerca_children").select("*").eq("family_id",fam.id).order("created_at"),
   db.from("cerca_entries").select("*").eq("user_id",active.user.id).order("updated_at",{ascending:false}).limit(300),
   db.from("cerca_moods").select("*").eq("family_id",fam.id).eq("day",localDay(fam.timezone)).maybeSingle(),
   db.from("cerca_missions").select("*").eq("family_id",fam.id).order("day",{ascending:false}).limit(120)
  ]);
  if(k.error||e.error||p.error){setMessage("No pudimos cargar todo el historial. Podés reintentar.");return}
  const children=k.data||[];
  setKids(children);setEntries(e.data||[]);setPast(p.data||[]);
  setMood(mo.data?.mood||null);setMoodDetail(mo.data?.detail||"");
  if(children.length)await fetchMissions(active);else{setMissions([]);setWeekly(null)}
 }
 async function fetchMissions(active=session){
  if(!active?.access_token)return;
  setLoadingMissions(true);
  try{
   const res=await fetch("/api/missions",{method:"POST",headers:{"Authorization":"Bearer "+active.access_token}});
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||"No se pudieron preparar las misiones.");
   setMissions(data.missions||[]);setWeekly(data.weekly||null);setSource(data.source||"");
  }catch(err){setMessage(err.message)}
  finally{setLoadingMissions(false)}
 }
 async function signIn(event){
  event.preventDefault();if(!db)return;setAuthBusy(true);setMessage("");
  try{
   if(password.length<8)throw new Error("La contraseña debe tener al menos 8 caracteres.");
   const result=register?await db.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin}}):await db.auth.signInWithPassword({email:email.trim(),password});
   if(result.error)throw result.error;
   if(register&&!result.data.session)setMessage("Te enviamos un correo para verificar tu cuenta. Confirmalo y después iniciá sesión.");
   else setMessage("");
  }catch(e){setMessage(e.message||"No pudimos ingresar.")}
  finally{setAuthBusy(false)}
 }
 async function saveChild(event){
  event.preventDefault();if(!family||!db)return;setSaving(true);setMessage("");
  try{
   const age=Number(newChild.age_years);
   if(!newChild.name.trim()||!Number.isInteger(age)||age<0||age>18)throw new Error("Escribí un nombre o apodo y una edad entre 0 y 18.");
   const payload={family_id:family.id,name:newChild.name.trim().slice(0,55),age_years:age,interests:csv(newChild.interests),goals:csv(newChild.goals),notes:newChild.notes.slice(0,700)};
   const response=newChild.id?await db.from("cerca_children").update(payload).eq("id",newChild.id):await db.from("cerca_children").insert(payload);
   if(response.error)throw response.error;
   setChildEditor(false);setNewChild(emptyChild);setView("hoy");
   await refresh();
  }catch(e){setMessage(e.message||"No se pudo guardar el perfil.")}
  finally{setSaving(false)}
 }
 async function saveMood(value){
  if(!session||!family)return;setMoodBusy(true);setMood(value);
  const result=await db.from("cerca_moods").upsert({family_id:family.id,user_id:session.user.id,day:today,mood:value,detail:moodDetail.slice(0,400)},{onConflict:"user_id,day"});
  setMoodBusy(false);
  if(result.error)setMessage("No se pudo guardar tu estado de ánimo.");
 }
 async function saveEntry(m,status){
  if(!session||!m)return;setMutating(true);
  const reflection=(reflections[m.id]??entries.find(e=>e.mission_id===m.id)?.reflection??"").slice(0,800);
  const result=await db.from("cerca_entries").upsert({user_id:session.user.id,mission_id:m.id,status,reflection,updated_at:new Date().toISOString()},{onConflict:"user_id,mission_id"}).select().single();
  if(result.error)setMessage("No se pudo guardar esta experiencia.");
  else{setEntries(old=>[result.data,...old.filter(e=>e.mission_id!==m.id)]);setOpenMission(null)}
  setMutating(false);
 }
 async function askGuide(event){
  event.preventDefault();if(!guideInput.trim()||!session)return;setGuideBusy(true);setGuideAnswer("");
  try{
   const res=await fetch("/api/guide",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},body:JSON.stringify({situation:guideInput})});
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||"No se pudo responder.");
   setGuideAnswer(data.guidance);
  }catch(e){setGuideAnswer(e.message)}
  finally{setGuideBusy(false)}
 }
 async function exportData(){
  if(!family)return;
  const [moodRows,missionRows,entryRows]=await Promise.all([
   db.from("cerca_moods").select("*").eq("family_id",family.id),
   db.from("cerca_missions").select("*").eq("family_id",family.id),
   db.from("cerca_entries").select("*").eq("user_id",session.user.id)
  ]);
  if(moodRows.error||missionRows.error||entryRows.error){setMessage("No se pudo exportar todo el historial.");return}
  const blob=new Blob([JSON.stringify({exported_at:new Date().toISOString(),family,children:kids,moods:moodRows.data,missions:missionRows.data,entries:entryRows.data},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),anchor=document.createElement("a");anchor.href=url;anchor.download="cerca-mis-datos.json";anchor.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 }
 async function deleteFamilyData(){
  if(!family||!confirm("¿Eliminar definitivamente perfiles, misiones y recuerdos de CERCA? La cuenta de acceso seguirá existiendo."))return;
  if(!confirm("Esta eliminación no se puede deshacer. ¿Confirmás?"))return;
  const result=await db.from("cerca_families").delete().eq("id",family.id);
  if(result.error)setMessage("No se pudo eliminar la información familiar.");
  else{setMessage("Datos familiares eliminados. Tu cuenta sigue activa.");await refresh()}
 }
 function editChild(child){setNewChild({id:child.id,name:child.name,age_years:String(child.age_years),interests:(child.interests||[]).join(", "),goals:(child.goals||[]).join(", "),notes:child.notes||""});setChildEditor(true);setView("ajustes")}
 async function removeChild(child){
  if(!confirm("¿Eliminar el perfil de "+child.name+" y sus misiones? Esta acción es irreversible."))return;
  const result=await db.from("cerca_children").delete().eq("id",child.id);
  if(result.error)setMessage("No se pudo eliminar el perfil.");else await refresh();
 }
 function missionCard(m,index){
  const config=categories[m.kind]||categories.conectar;
  const entry=entries.find(e=>e.mission_id===m.id);
  const expanded=openMission===m.id;
  return <article className={"mission "+config.tone} key={m.id}>
   <div className="mission-head"><span className="mission-icon">{config.icon}</span><span className="mission-label">{config.title} <small>· {m.minutes} min</small></span>{entry&&<span className="done-pill">{entry.status==="hecha"?"✓ Hecha":"Sin presión"}</span>}</div>
   <h3>{m.title}</h3><p className="mission-how">{m.how}</p>
   <div className="mission-why"><strong>Para qué</strong><span>{m.why}</span></div>
   <div className="mission-actions">
    {!entry&&<button className="action-primary" disabled={mutating} onClick={()=>saveEntry(m,"hecha")}>✓ Lo hicimos</button>}
    {!entry&&<button className="action-text" disabled={mutating} onClick={()=>saveEntry(m,"omitida")}>Hoy no</button>}
    <button className="action-text" onClick={()=>setOpenMission(expanded?null:m.id)}>{expanded?"Cerrar":"Guardar recuerdo"}</button>
   </div>
   {expanded&&<div className="reflection"><label htmlFor={"reflection-"+m.id}>¿Qué te gustaría recordar? Solo vos podés verlo.</label><textarea id={"reflection-"+m.id} rows="3" maxLength="800" value={reflections[m.id]??entry?.reflection??""} onChange={e=>setReflections(p=>({...p,[m.id]:e.target.value}))} placeholder="Una frase, una reacción, un aprendizaje..."/><button disabled={mutating} onClick={()=>saveEntry(m,entry?.status||"hecha")}>Guardar en mis recuerdos</button></div>}
   {entry?.reflection&&<p className="saved-reflection">“{entry.reflection}”</p>}
  </article>
 }
 if(authLoading)return <div className="center-screen"><div className="logo-mark">c<span>·</span></div><p>Preparando tu espacio…</p></div>;
 if(!db)return <div className="center-screen"><div className="logo-mark">c<span>·</span></div><h1>Estamos preparando CERCA</h1><p>La aplicación ya está desplegada, pero la base independiente todavía no fue configurada. No vamos a usar datos de otras aplicaciones.</p><a href="/api/status">Consultar estado técnico</a></div>;
 if(!session)return <main className="auth-shell"><div className="auth-hero"><div className="logo-word">cerca<span>·</span></div><div className="art-circles"><span/><span/><span/></div><p className="eyebrow light">Un momento puede cambiar un día</p><h1>Más presentes.<br/><em>Más cerca.</em></h1><p>Pequeñas acciones para conectar con tus hijos, sin exigencias ni familias perfectas.</p></div><div className="auth-card"><h2>{register?"Empecemos por vos":"Qué bueno verte"}</h2><p>Un espacio privado para quienes cuidan.</p><form onSubmit={signIn}><label>Tu correo</label><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/><label>Contraseña</label><input type="password" autoComplete={register?"new-password":"current-password"} required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"/><button className="wide-button" disabled={authBusy}>{authBusy?"Un momento…":register?"Crear mi cuenta":"Entrar a CERCA"}</button></form><button className="link-button" onClick={()=>{setRegister(!register);setMessage("")}}>{register?"¿Ya tenés cuenta? Ingresá":"¿Es tu primera vez? Creá tu cuenta"}</button>{message&&<p className="feedback" role="status">{message}</p>}<p className="micro">Tus hijos no necesitan una cuenta. Sus datos nunca se comparten con Cómplices.</p></div></main>;
 return <div className="app-shell">
  <header className="topbar"><div className="logo-word">cerca<span>·</span></div><div className="topbar-right"><span className="private-pill"><Icon>✦</Icon> Tu espacio privado</span><button className="avatar" onClick={()=>setView("ajustes")} aria-label="Ajustes">☺</button></div></header>
  <main className="app-main">
   {message&&<div className="alert" role="status">{message}<button onClick={()=>setMessage("")} aria-label="Cerrar aviso">×</button></div>}
   {view==="hoy"&&<section className="home-view">
    <div className="hero"><p className="eyebrow">TU ESPACIO DE CADA DÍA</p><h1>Lo importante<br/><em>pasa cerquita.</em></h1><p>No hace falta un día perfecto. A veces, cinco minutos alcanzan para empezar.</p><div className="hero-decoration"><i/><i/><i/></div></div>
    {kids.length===0?<section className="empty-card"><span className="empty-symbol">♡</span><h2>¿A quién querés acompañar?</h2><p>Sumá el primer perfil. Solo necesitamos lo necesario para crear misiones apropiadas a su edad.</p><button className="wide-button" onClick={()=>{setChildEditor(true);setNewChild(emptyChild)}}>+ Agregar mi primer hijo</button></section>:<>
     <section className="mood-card"><div><span className="eyebrow">ANTES DE EMPEZAR</span><h2>¿Cómo estás hoy?</h2><p>Tu energía también importa.</p></div><div className="moods">{moodOptions.map(([id,emoji,text])=><button key={id} disabled={moodBusy} onClick={()=>saveMood(id)} className={mood===id?"selected":""} title={text}><span>{emoji}</span><small>{text}</small></button>)}</div></section>
     <div className="section-heading"><div><p className="eyebrow">PEQUEÑOS PASOS, GRAN VALOR</p><h2>Las misiones de hoy</h2></div><button className="icon-button" disabled={loadingMissions} title="Recargar" onClick={()=>fetchMissions()}>↻</button></div>
     {loadingMissions&&<p className="soft-loading">Preparando experiencias para tu familia…</p>}
     {kids.map(child=><section className="child-section" key={child.id}><div className="child-heading"><div className="child-avatar">{child.name[0]?.toUpperCase()}</div><div><h3>{child.name}</h3><p>{child.age_years} {child.age_years===1?"año":"años"} · 3 oportunidades hoy</p></div><button onClick={()=>editChild(child)} aria-label={"Editar "+child.name}>Editar</button></div>
      <div className="mission-stack">{missions.filter(m=>m.child_id===child.id).sort((a,b)=>["conectar","comprender","sembrar"].indexOf(a.kind)-["conectar","comprender","sembrar"].indexOf(b.kind)).map(missionCard)}</div>
      {!loadingMissions&&!missions.some(m=>m.child_id===child.id)&&<p className="small-note">Todavía no pudimos recuperar estas misiones. Tocá ↻ para reintentar.</p>}
     </section>)}
     {weekly&&<section className="weekly-card"><div className="weekly-ribbon">✧ UNA VEZ POR SEMANA · EN FAMILIA</div><h2>{weekly.title}</h2><p>{weekly.how}</p><div className="weekly-why"><strong>Para qué:</strong> {weekly.why}</div><div className="weekly-footer"><span>◷ {weekly.minutes} minutos</span>{missionCard(weekly,0)}</div></section>}
     <div className="bottom-affirmation">No se trata de hacer todo.<br/><strong>Se trata de estar.</strong></div>
    </>}
   </section>}
   {view==="inspiracion"&&<section className="internal-view"><p className="eyebrow">IDEAS CON FUNDAMENTO</p><h1>Inspiración que suma</h1><p className="lead">Evidencia confiable para convertir ideas en pequeños gestos. Diferenciamos la investigación de los relatos personales.</p><div className="resource-list">{inspirations.map((x,i)=><a key={i} className="resource-card" href={x.url} target="_blank" rel="noopener noreferrer"><span className="resource-tag">{x.tag}</span><h2>{x.title}</h2><p>{x.desc}</p><small>{x.source} ↗</small></a>)}</div><p className="small-note">Las historias familiares reales, con fuente comprobable y contexto, se incorporarán después de una revisión editorial. No fabricamos testimonios.</p></section>}
   {view==="guia"&&<section className="internal-view"><p className="eyebrow">PARA LOS MOMENTOS REALES</p><h1>¿Qué está pasando?</h1><p className="lead">A veces una mirada distinta ayuda. Contame una situación cotidiana y busquemos un primer paso.</p><form className="guide-box" onSubmit={askGuide}><label htmlFor="guide">Contame qué te preocupa</label><textarea id="guide" rows="6" maxLength="1200" minLength="12" required value={guideInput} onChange={e=>setGuideInput(e.target.value)} placeholder="Por ejemplo: últimamente discutimos para hacer la tarea y no sé cómo acompañarlo sin que terminemos enojados..."/><button className="wide-button" disabled={guideBusy}>{guideBusy?"Pensando una respuesta cuidadosa…":"Buscar una manera de acompañar"}</button></form>{guideAnswer&&<div className="guide-result"><span>✧ Una idea para empezar</span><p>{guideAnswer}</p></div>}<p className="small-note">Orientación informativa, no diagnóstico ni sustituto de profesionales. Evitá escribir datos que identifiquen innecesariamente a menores.</p></section>}
   {view==="recuerdos"&&<section className="internal-view"><p className="eyebrow">LO QUE VA QUEDANDO</p><h1>Nuestros momentos</h1><p className="lead">No contamos rachas ni días perdidos. Guardamos lo que te gustaría recordar.</p>{entries.length===0?<div className="empty-card"><span className="empty-symbol">✧</span><h2>Tus recuerdos empiezan hoy</h2><p>Cuando realices una misión, podés guardar una frase o algo que hayas aprendido.</p></div>:<div className="memory-list">{entries.filter(e=>e.reflection||e.status==="hecha").map(e=>{const mission=past.find(m=>m.id===e.mission_id)||missions.find(m=>m.id===e.mission_id)||(weekly?.id===e.mission_id?weekly:null);return mission?<div key={e.id} className="memory-card"><small>{mission.day} · {mark(e.status)}</small><h3>{mission.title}</h3>{e.reflection?<p>“{e.reflection}”</p>:<p>Un pequeño momento compartido.</p>}</div>:null})}</div>}</section>}
   {view==="ajustes"&&<section className="internal-view"><p className="eyebrow">TU FAMILIA, TUS DECISIONES</p><h1>Mi espacio</h1><p className="lead">Perfiles privados para personalizar las experiencias.</p><div className="settings-card"><h2>Mis hijos</h2>{kids.map(c=><div className="child-settings" key={c.id}><div><strong>{c.name}</strong><small>{c.age_years} años · {(c.interests||[]).length} intereses</small></div><button onClick={()=>editChild(c)}>Editar</button><button className="danger-text" onClick={()=>removeChild(c)}>Quitar</button></div>)}<button className="outlined-button" disabled={kids.length>=6} onClick={()=>{setNewChild(emptyChild);setChildEditor(true)}}>+ Agregar hijo</button></div><div className="settings-card"><h2>Privacidad y datos</h2><p>Solo tu cuenta puede acceder a estos perfiles. Podés llevarte tus datos o borrar los contenidos familiares.</p><button className="outlined-button" onClick={exportData}>Exportar mis datos</button><button className="danger-text delete-button" onClick={deleteFamilyData}>Eliminar datos familiares</button><p className="micro">La eliminación de datos familiares no elimina la cuenta de acceso. La baja total de cuenta estará disponible antes de abrir CERCA al público.</p></div><div className="settings-card"><h2>Notificaciones</h2><p>Estamos preparando recordatorios configurables con permiso del dispositivo y horarios de silencio. No enviaremos avisos hasta que esté listo.</p></div><button className="signout" onClick={()=>db.auth.signOut()}>Cerrar sesión</button></section>}
  </main>
  {childEditor&&<div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="child-title"><form className="child-modal" onSubmit={saveChild}><div className="modal-top"><h2 id="child-title">{newChild.id?"Editar perfil":"Un nuevo perfil"}</h2><button type="button" onClick={()=>setChildEditor(false)} aria-label="Cerrar">×</button></div><p>Solo lo que te resulte cómodo compartir. Un apodo alcanza.</p><label>Nombre o apodo</label><input required maxLength="55" value={newChild.name} onChange={e=>setNewChild(p=>({...p,name:e.target.value}))} placeholder="¿Cómo lo llamás?"/><label>Edad en años (0 para menores de un año)</label><input required type="number" min="0" max="18" value={newChild.age_years} onChange={e=>setNewChild(p=>({...p,age_years:e.target.value}))} placeholder="0 a 18"/><label>Intereses (separados por coma)</label><input value={newChild.interests} onChange={e=>setNewChild(p=>({...p,interests:e.target.value}))} placeholder="Ej.: dibujar, animales, fútbol"/><label>Objetivos que querés acompañar</label><textarea rows="2" value={newChild.goals} onChange={e=>setNewChild(p=>({...p,goals:e.target.value}))} placeholder="Ej.: escuchar más, autonomía, confianza"/><label>Algo más que te gustaría tener en cuenta (opcional)</label><textarea rows="2" maxLength="700" value={newChild.notes} onChange={e=>setNewChild(p=>({...p,notes:e.target.value}))} placeholder="Preferencias, límites o disponibilidad"/><button className="wide-button" disabled={saving}>{saving?"Guardando…":"Guardar perfil"}</button></form></div>}
  <nav className="bottom-nav" aria-label="Secciones">{[["hoy","⌂","Hoy"],["inspiracion","✧","Inspirar"],["guia","✳","Guía"],["recuerdos","♡","Recuerdos"],["ajustes","☰","Mi familia"]].map(([id,emoji,label])=><button className={view===id?"active":""} key={id} onClick={()=>{setView(id);window.scrollTo({top:0,behavior:"smooth"})}}><span>{emoji}</span><small>{label}</small></button>)}</nav>
 </div>;
}
