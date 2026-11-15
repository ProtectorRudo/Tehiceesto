
"use client";
import {useState,useEffect,useCallback} from "react";
import {createClient} from "@supabase/supabase-js";

const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const QUESTION_BANK={
 romance:["¿Qué pequeño gesto mío te hace sentir más querido/a?","¿Cuál de nuestros recuerdos guardarías en una botella?","¿Qué cita nuestra repetirías mil veces?","¿Qué es algo que admirás de mí y casi nunca decís?"],
 humor:["¿Qué haríamos si ganáramos un viaje sorpresa mañana?","¿Quién sobreviviría mejor un día sin celular?","¿Cuál es nuestra anécdota más divertida?"],
 profundo:["¿Qué aprendiste de nuestra relación este año?","¿Qué te gustaría que entienda mejor de vos?","¿Qué hábito nuestro te gustaría cuidar más?"],
 futuro:["¿Qué aventura te gustaría que hagamos este año?","¿Qué sueño pequeño podríamos cumplir juntos pronto?","¿Cómo imaginás un domingo perfecto dentro de cinco años?"],
 picante:["¿Qué momento a solas te gustaría repetir?","¿Qué plan romántico íntimo te gustaría que organicemos?","¿Qué detalle o ambiente te hace sentir más deseado/a?"]
};
const ABOUT_QUESTIONS=[
 ["q01","¿Qué gesto cotidiano te hace sentir especialmente querido/a?"],
 ["q02","¿Qué actividad te gustaría compartir más seguido?"],
 ["q03","¿Qué sorpresa pequeña te alegraría esta semana?"],
 ["q04","¿Qué te ayuda a sentirte acompañado/a en un día difícil?"],
 ["q05","¿Qué plan sencillo disfrutarías el próximo fin de semana?"],
 ["q06","¿Qué tradición de pareja te gustaría empezar?"],
 ["q07","¿Qué plan o regalo preferís evitar?"],
 ["q08","¿Qué lugar te gustaría conocer con tu pareja?"]
];
const DEFAULT_SURPRISE={title:"Una sorpresa inesperada",body:"Dejale una nota cariñosa donde menos la espere. Algo sencillo, pero hecho con intención."};
const GENERIC_DAILY=[
 {title:"Un agradecimiento inesperado",body:"Decile algo concreto que agradecés de la persona que tenés al lado.",icon:"💌"},
 {title:"Un rato sin pantallas",body:"Disfruten diez minutos juntos, sin celulares ni distracciones.",icon:"☕"},
 {title:"Un recuerdo compartido",body:"Contale un momento vivido que te siga sacando una sonrisa.",icon:"📸"},
 {title:"Una pregunta que acerca",body:"Preguntale cómo está de verdad y escuchá sin interrupciones.",icon:"💬"},
 {title:"Un abrazo consciente",body:"Si ambos tienen ganas, compartan un abrazo largo y tranquilo.",icon:"🫂"},
 {title:"Un plan mínimo",body:"Proponé una actividad que puedan compartir esta semana.",icon:"✨"}
];
const WEEKLY=[
 {title:"Siete días, siete detalles",body:"Hagan al menos un gesto de cariño cada día de la semana. Elijan uno para recordar.",icon:"💝"},
 {title:"Una cita a nuestra manera",body:"Planeen una cita sencilla: en casa, en un parque o en un lugar que disfruten.",icon:"🌙"},
 {title:"Nuestra cápsula del tiempo",body:"Escriban un recuerdo y un deseo para el próximo año. Guárdenlos.",icon:"🕰️"},
 {title:"Un desafío en equipo",body:"Preparen juntos algo que no hayan hecho antes: una receta, un paseo o un juego.",icon:"🎲"}
];
const SHARE_THEMES=[["","Elegí un tema para la pista"],["detalles","💝 Pequeños detalles"],["charla","💬 Conversaciones"],["paseo","🌿 Paseos"],["cocina","🍓 Cocinar juntos"],["pelicula","🎬 Películas y series"],["recuerdos","📸 Recuerdos"],["planes","✨ Citas y planes"],["humor","🎲 Humor y juegos"]];
const TREAT=[["ninguno","Me gustan las sorpresas simples"],["chocolate","Chocolates"],["cafe","Café"],["mate","Mate"],["dulce","Algo dulce"],["flores","Flores"]];
const PLAN=[["charlar","Conversar"],["caminar","Caminar"],["peli","Películas"],["cocinar","Cocinar juntos"],["salir","Salir"]];
const LANG=[["tiempo","Tiempo de calidad"],["palabras","Palabras lindas"],["detalles","Pequeños detalles"],["ayuda","Ayuda cotidiana"],["contacto","Cariño físico"]];
const TOPICS=[["romance","💕 Romance"],["humor","😄 Humor"],["profundo","🌙 Profundas"],["futuro","✨ Futuro"],["picante","🌶️ Picantes"]];
const NAV=[["hoy","⌂","Hoy"],["misiones","♡","Misiones"],["juegos","♧","Juegos"],["preguntas","?","Preguntas"],["mensajes","✉","Chat"],["complice","✦","IA"]];

function todayKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function weeklyKey(){const date=new Date(todayKey()+"T12:00:00");const monday=new Date(date);monday.setDate(date.getDate()-((date.getDay()+6)%7));return monday.toISOString().slice(0,10)}
function getError(err){return err?.message||"No se pudo completar la acción."}
function humanTime(iso){try{return new Date(iso).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return ""}}
function Pill({children,gold}){return <span className={"pill"+(gold?" gold":"")}>{children}</span>}
function Button({children,secondary=false,small=false,full=false,disabled=false,onClick,type="button"}){return <button type={type} disabled={disabled} onClick={onClick} className={"btn"+(secondary?" secondary":"")+(small?" small":"")+(full?" full":"")}>{children}</button>}
function SelectField({label,value,onChange,options}){return <div className="form-field"><label>{label}</label><select className="select" value={value} onChange={e=>onChange(e.target.value)}>{options.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>}
export default function Home(){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[authMode,setAuthMode]=useState("entrar");
 const [email,setEmail]=useState(""),[pass,setPass]=useState("");
 const [member,setMember]=useState(null),[members,setMembers]=useState([]),[space,setSpace]=useState(null),[pref,setPref]=useState(null),[surprise,setSurprise]=useState(DEFAULT_SURPRISE);
 const [activities,setActivities]=useState([]),[messages,setMessages]=useState([]),[notes,setNotes]=useState([]),[reflections,setReflections]=useState([]),[memories,setMemories]=useState([]),[aiRatings,setAiRatings]=useState([]),[notificationSettings,setNotificationSettings]=useState({enabled:false,quiet_start:"22:00",quiet_end:"08:00"});
 const [name,setName]=useState(""),[inviteInput,setInviteInput]=useState("");
 const [tab,setTab]=useState("hoy"),[messageText,setMessageText]=useState(""),[replyText,setReplyText]=useState(""),[replyTo,setReplyTo]=useState(null),[questionTopic,setQuestionTopic]=useState("romance");
 const [aiText,setAiText]=useState(""),[aiChat,setAiChat]=useState([]),[aiBusy,setAiBusy]=useState(false),[tipMode,setTipMode]=useState("guiado"),[noteText,setNoteText]=useState("");
 const [gameAnswers,setGameAnswers]=useState({}),[gameResults,setGameResults]=useState({});
 const [aboutQuestion,setAboutQuestion]=useState("q01"),[aboutAnswer,setAboutAnswer]=useState(""),[aboutAllowAI,setAboutAllowAI]=useState(false),[aboutShare,setAboutShare]=useState(false),[aboutShareTheme,setAboutShareTheme]=useState(""),[aiAvailable,setAiAvailable]=useState(false);
 const [memoryText,setMemoryText]=useState(""),[memoryCategory,setMemoryCategory]=useState("gustos"),[memoryShare,setMemoryShare]=useState(false),[memoryShareTheme,setMemoryShareTheme]=useState(""),[editingMemory,setEditingMemory]=useState(null);
 const [centralActivities,setCentralActivities]=useState([]),[centralMode,setCentralMode]=useState("guiado"),[centralLoading,setCentralLoading]=useState(false),[centralError,setCentralError]=useState("");
 useEffect(()=>{let active=true;db.auth.getUser().then(({data})=>{if(active){setUser(data.user||null);setLoading(false)}}).catch(()=>setLoading(false));const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(active)setUser(session?.user||null)});if(typeof window!=="undefined"){
 const input=new URLSearchParams(window.location.search).get("invite");
 const fromUrl=(input||"").match(/^[a-f0-9]{24}$/i)?.[0];
 if(fromUrl){setInviteInput(fromUrl);sessionStorage.setItem("cp_pending_invite",fromUrl)}
 else {const pending=sessionStorage.getItem("cp_pending_invite");if(pending&&/^[a-f0-9]{24}$/i.test(pending))setInviteInput(pending)}
}if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});return()=>{active=false;subscription.unsubscribe()}},[]);
 const load=useCallback(async(u)=>{
  if(!u)return;
  const {data:m,error:e}=await db.from("cp_members").select("*").eq("user_id",u.id).maybeSingle();
  if(e){setNotice(getError(e));return}
  if(!m){setMember(null);setMembers([]);setSpace(null);setPref(null);return}
  setMember(m);
  const [s,mm,p,c,ms,n,t,rfl,ns,mem,feedback]=await Promise.all([
   db.from("cp_spaces").select("*").eq("id",m.space_id).single(),
   db.from("cp_members").select("user_id,display_name,joined_at").eq("space_id",m.space_id),
   db.from("cp_preferences").select("*").eq("user_id",u.id).maybeSingle(),
   db.from("cp_completions").select("*").eq("space_id",m.space_id),
   db.from("cp_messages").select("*").eq("space_id",m.space_id).order("created_at",{ascending:true}).limit(100),
   db.from("cp_ai_notes").select("*").eq("user_id",u.id).order("created_at",{ascending:false}).limit(12),
   db.rpc("cp_partner_surprise",{p_space:m.space_id}),
   db.from("cp_reflections").select("id,question_id,question,answer,ai_use_allowed,share_for_surprises,share_theme,updated_at").eq("user_id",u.id).order("updated_at",{ascending:false}),
   db.from("cp_notification_settings").select("enabled,quiet_start,quiet_end").eq("user_id",u.id).maybeSingle(),
   db.from("cp_ai_memories").select("id,category,body,use_for_ai,share_for_surprises,share_theme,created_at").eq("user_id",u.id).order("created_at",{ascending:false}).limit(35),
   db.from("cp_ai_feedback").select("activity_id,rating").eq("user_id",u.id)
  ]);
  if(s.error)setNotice(getError(s.error));
  setSpace(s.data||null);setMembers(mm.data||[]);setPref(p.data||null);setActivities(c.data||[]);setMessages(ms.data||[]);setNotes(n.data||[]);setReflections(rfl.data||[]);setMemories(mem.data||[]);setAiRatings(feedback.data||[]);setNotificationSettings(ns.data||{enabled:false,quiet_start:"22:00",quiet_end:"08:00"});if(t.data)setSurprise(t.data);const {data:gameRows}=await db.from("cp_game_entries").select("game_key,answer").eq("space_id",m.space_id).eq("user_id",u.id);if(gameRows)setGameAnswers(Object.fromEntries(gameRows.map(g=>[g.game_key,g.answer])));
 },[]);
 useEffect(()=>{if(user){load(user)}else{setMember(null);setSpace(null)}},[user,load]);
 const refreshCentral=useCallback(async()=>{
  if(!user?.id)return;
  setCentralLoading(true);
  try{
   const {data:{session}}=await db.auth.getSession();
   if(!session?.access_token){setCentralLoading(false);return}
   const response=await fetch("/api/central",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});
   const data=await response.json();
   if(!response.ok){setCentralError(data.error||"No pude actualizar tus misiones");return}
   setCentralActivities(data.activities||[]);setCentralMode(data.mode||"guiado");setCentralError("");
  }catch{setCentralError("No pude conectar con tu cómplice central")}
  finally{setCentralLoading(false)}
 },[user?.id]);
 useEffect(()=>{if(user?.id&&member?.space_id)refreshCentral();else setCentralActivities([])},[user?.id,member?.space_id,refreshCentral]);
 useEffect(()=>{fetch("/api/complice").then(r=>r.json()).then(x=>setAiAvailable(x.mode==="ia")).catch(()=>setAiAvailable(false))},[]);
 useEffect(()=>{
  if(!user||!member)return;
  let stopped=false;
  const poll=async()=>{
   if(document.visibilityState==="hidden")return;
   const [{data:ms},{data:ac}]=await Promise.all([
    db.from("cp_messages").select("*").eq("space_id",member.space_id).order("created_at",{ascending:true}).limit(100),
    db.from("cp_completions").select("*").eq("space_id",member.space_id)]);
   if(stopped)return;
   if(ms)setMessages(ms);
   if(ac)setActivities(ac);
  };
  poll();const timer=setInterval(poll,25000);window.addEventListener("focus",poll);return()=>{stopped=true;clearInterval(timer);window.removeEventListener("focus",poll)}
 },[user,member]);
 async function login(e){e.preventDefault();setBusy(true);setNotice("");const result=authMode==="entrar"?await db.auth.signInWithPassword({email:email.trim(),password:pass}):await db.auth.signUp({email:email.trim(),password:pass,options:{emailRedirectTo:window.location.origin+(inviteInput&&/^[a-f0-9]{24}$/i.test(inviteInput)?"/?invite="+inviteInput:"")}});setBusy(false);if(result.error){setNotice(getError(result.error));return}if(authMode!=="entrar"&&!result.data.session){setNotice("Si se creó tu cuenta, recibirás un correo de confirmación. Luego volvé a Cómplices e iniciá sesión. Si el enlace te lleva a otra página, hay que configurar el dominio permitido de Supabase.")}else{setNotice("");setUser(result.data.user||null)}}
 async function logout(){
  try{
   const registration=await navigator.serviceWorker?.ready;
   const subscription=await registration?.pushManager?.getSubscription();
   if(subscription&&user){
    await db.from("cp_push_subscriptions").delete().eq("user_id",user.id).eq("endpoint",subscription.endpoint);
    await subscription.unsubscribe();
   }
  }catch{}
  await db.auth.signOut();setMember(null);setSpace(null);setUser(null);setTab("hoy");
 }
 async function createSpace(e){e.preventDefault();if(!name.trim())return;setBusy(true);setNotice("");const {error}=await db.rpc("cp_create_space",{p_name:name.trim()});if(error)setNotice(getError(error));else await load(user);setBusy(false)}
 async function joinSpace(e){e.preventDefault();if(!name.trim()||!inviteInput.trim())return;setBusy(true);setNotice("");const {error}=await db.rpc("cp_join_by_invite",{p_code:inviteInput.trim().replace(/^.*invite=/,"").split("&")[0].toLowerCase(),p_name:name.trim()});if(error)setNotice(getError(error));else {sessionStorage.removeItem("cp_pending_invite");await load(user)}setBusy(false)}
 function shareInvite(){const link=window.location.origin+"/?invite="+space.invite_code;if(navigator.share){navigator.share({title:"Nuestro espacio en Cómplices",text:"Te invito a nuestro rincón ❤️",url:link}).catch(()=>{})}else{navigator.clipboard?.writeText(link).then(()=>setNotice("Enlace copiado. Mandáselo a tu pareja por WhatsApp.")).catch(()=>setNotice("Copiá este enlace: "+link))}}
 const partner=members.find(m=>m.user_id!==user?.id), date=todayKey(), week=weeklyKey();
 const chosen=GENERIC_DAILY[(new Date(date+"T12:00:00").getDate()+3)%GENERIC_DAILY.length];
 const weekly=WEEKLY[(new Date(week+"T12:00:00").getDate()+3)%WEEKLY.length];
 const byCentralSlot=Object.fromEntries(centralActivities.map(item=>[item.slot,item]));
 const taskDefaults=[
  {key:"d:"+date+":sorpresa",title:surprise.title,body:surprise.body,icon:"💝",points:40},
  {key:"d:"+date+":conexion",title:chosen.title,body:chosen.body,icon:chosen.icon,points:30},
  {key:"w:"+week+":aventura",title:weekly.title,body:weekly.body,icon:weekly.icon,points:120}
 ];
 const tasks=taskDefaults.map((fallback,i)=>{
  const slot=["daily_1","daily_2","weekly_1"][i],a=byCentralSlot[slot];
  return a?{id:a.id,key:a.task_key,title:a.title,body:a.body,icon:a.icon,points:a.points,mode:a.mode,theme:a.theme}:fallback
 });
 const mineDone=(key)=>activities.some(a=>a.task_key===key&&a.user_id===user?.id);
 const partnerDone=(key)=>activities.some(a=>a.task_key===key&&a.user_id===partner?.user_id);
 const calcPoints=(key)=>key.startsWith("w:")?120:key.startsWith("q:")?20:key.endsWith(":sorpresa")||key.startsWith("d:")&&key.endsWith(":central-1")?40:key.startsWith("g:")?60:30;
 const totalHearts=activities.reduce((sum,a)=>sum+calcPoints(a.task_key),0);
 const ratingFor=(task)=>aiRatings.find(f=>f.activity_id===task.id)?.rating||0;
 const dailyAbout=ABOUT_QUESTIONS.find(q=>!reflections.some(r=>r.question_id===q[0]))||ABOUT_QUESTIONS[(new Date(date+"T12:00:00").getDate())%ABOUT_QUESTIONS.length];
 const games=[{slug:"escapada",title:"Si pudiéramos escaparnos…",intro:"¿A dónde irías con tu pareja sin pensarlo demasiado?",options:[["playa","🏖️ A la playa"],["montana","⛰️ A la montaña"],["ciudad","🏙️ A una ciudad"],["campo","🌿 Al campo"]]},{slug:"cita",title:"Nuestra cita perfecta",intro:"¿Cuál de estos planes elegirías para esta noche?",options:[["cena","🍝 Una cena"],["peli","🎬 Una película"],["paseo","🌙 Un paseo"],["cocinar","👩‍🍳 Cocinar juntos"]]}];
 async function revealGame(key){const {data,error}=await db.rpc("cp_game_reveal",{p_space:member.space_id,p_key:key});if(error)setNotice(getError(error));else setGameResults(old=>({...old,[key]:data}))}
 async function playGame(key,answer){if(!partner)return;setBusy(true);setNotice("");const {error}=await db.from("cp_game_entries").upsert({space_id:member.space_id,game_key:key,user_id:user.id,answer},{onConflict:"space_id,game_key,user_id"});if(error){setNotice(getError(error))}else{if(!mineDone(key))await db.from("cp_completions").insert({space_id:member.space_id,user_id:user.id,task_key:key});await load(user);await revealGame(key)}setBusy(false)}
 async function mark(key){if(!member)return;setBusy(true);setNotice("");const was=mineDone(key);const r=was?await db.from("cp_completions").delete().eq("user_id",user.id).eq("space_id",member.space_id).eq("task_key",key):await db.from("cp_completions").insert({space_id:member.space_id,user_id:user.id,task_key:key});if(r.error)setNotice(getError(r.error));else await load(user);setBusy(false)}
 async function savePref(){if(!user||!pref)return;setBusy(true);const {error}=await db.from("cp_preferences").update({favorite_treat:pref.favorite_treat,favorite_plan:pref.favorite_plan,love_language:pref.love_language,allow_surprises:pref.allow_surprises,adult_mode:pref.adult_mode,updated_at:new Date().toISOString()}).eq("user_id",user.id);setNotice(error?getError(error):"Preferencias guardadas. Actualizando propuestas para vos.");await load(user);if(!error)await refreshCentral();setBusy(false)}
 async function requestNotifications(){
  if(!("Notification" in window)||!("serviceWorker" in navigator)||!("PushManager" in window)){setNotice("Este navegador no admite todas las notificaciones. Podés seguir usando la página normalmente.");return}
  try{
   const permission=await Notification.requestPermission();
   if(permission!=="granted"){setNotice("No se habilitaron los avisos. Podés activarlos cuando quieras desde los ajustes del navegador.");return}
   const response=await fetch("/api/push",{cache:"no-store"});const config=await response.json();
   if(!config.available||!config.publicKey){setNotice("Las notificaciones todavía no están disponibles en el servidor.");return}
   const registration=await navigator.serviceWorker.ready;
   const key=config.publicKey.replace(/-/g,"+").replace(/_/g,"/");
   const binary=atob(key.padEnd(Math.ceil(key.length/4)*4,"="));
   const applicationServerKey=Uint8Array.from(binary,c=>c.charCodeAt(0));
   let subscription=await registration.pushManager.getSubscription();
   if(!subscription){subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey})}
   const json=subscription.toJSON();
   const {data:existing,error:existingError}=await db.from("cp_push_subscriptions").select("id").eq("user_id",user.id).eq("endpoint",subscription.endpoint).maybeSingle();
   if(existingError)throw existingError;
   if(!existing){const {error}=await db.from("cp_push_subscriptions").insert({user_id:user.id,endpoint:subscription.endpoint,p256dh:json.keys?.p256dh,auth_key:json.keys?.auth});if(error)throw error}
   const {error:settingsError}=await db.from("cp_notification_settings").upsert({user_id:user.id,enabled:true,quiet_start:notificationSettings.quiet_start,quiet_end:notificationSettings.quiet_end,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(settingsError)throw settingsError;
   await load(user);
   setNotice("Avisos activados en este celular, respetando tus horas de silencio. La entrega depende de los permisos del teléfono.");
  }catch(e){setNotice("No se pudieron activar las notificaciones: "+getError(e))}
 }
 async function saveNotificationSettings(enabled=notificationSettings.enabled){
  if(!user)return;
  setBusy(true);setNotice("");
  const {error}=await db.from("cp_notification_settings").upsert({user_id:user.id,enabled,quiet_start:notificationSettings.quiet_start,quiet_end:notificationSettings.quiet_end,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  setBusy(false);
  if(error){setNotice(getError(error));return}
  setNotificationSettings(old=>({...old,enabled}));
  setNotice(enabled?"Horario de silencio guardado.":"Avisos desactivados para tu cuenta.");
 }
 async function disableNotifications(){
  if(!user)return;
  setBusy(true);setNotice("");
  const {error}=await db.from("cp_notification_settings").upsert({user_id:user.id,enabled:false,quiet_start:notificationSettings.quiet_start,quiet_end:notificationSettings.quiet_end,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  if(error){setBusy(false);setNotice(getError(error));return}
  try{const registration=await navigator.serviceWorker?.ready;const sub=await registration?.pushManager?.getSubscription();if(sub){await db.from("cp_push_subscriptions").delete().eq("user_id",user.id).eq("endpoint",sub.endpoint);await sub.unsubscribe()}}catch{}
  setNotificationSettings(old=>({...old,enabled:false}));
  setNotice("Avisos desactivados. Podés activarlos nuevamente cuando quieras.");setBusy(false);
 }
 async function notifyPartner(messageId){
  if(!messageId)return;
  try{const {data:{session}}=await db.auth.getSession();if(session?.access_token)await fetch("/api/push",{method:"POST",keepalive:true,headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({messageId})});}catch{}
 }
 async function sendMessage(kind,body,topic="general",reply=null){const text=body.trim();if(!text||!member)return;setBusy(true);setNotice("");const {data:sent,error}=await db.from("cp_messages").insert({space_id:member.space_id,sender_id:user.id,kind,body:text,topic,reply_to:reply}).select("id").single();if(error){setNotice(getError(error))}else{setMessageText("");setReplyText("");setReplyTo(null);await load(user);notifyPartner(sent?.id)}setBusy(false)}
 function surpriseQuestion(){const bank=QUESTION_BANK[questionTopic]||QUESTION_BANK.romance;const i=(new Date().getTime()+messages.length)%bank.length;sendMessage("pregunta",bank[i],questionTopic)}
 async function respond(q){if(!replyText.trim())return;await sendMessage("respuesta",replyText,q.topic,q.id);if(!mineDone("q:"+q.id)){const r=await db.from("cp_completions").insert({space_id:member.space_id,user_id:user.id,task_key:"q:"+q.id});if(!r.error)await load(user)}}
 async function askAI(e){e.preventDefault();if(!aiText.trim()||aiBusy)return;const text=aiText.trim();setAiText("");setAiChat(old=>[...old,{who:"yo",text}]);setAiBusy(true);try{const {data:{session}}=await db.auth.getSession();const resp=await fetch("/api/complice",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session?.access_token},body:JSON.stringify({message:text})});const data=await resp.json();setTipMode(data.mode||"guiado");setAiChat(old=>[...old,{who:"coach",text:data.reply||data.error||"Intentá de nuevo."}])}catch{setAiChat(old=>[...old,{who:"coach",text:"No pude responder en este momento. Probá otra vez."}])}setAiBusy(false)}
 async function saveAbout(){
  if(!aboutAnswer.trim()||!user)return;
  if(aboutShare&&(!aboutAllowAI||!aboutShareTheme||aboutQuestion==="q07")){setNotice("Para compartir una pista elegí un tema positivo y autorizá que tu IA use la respuesta.");return}
  const q=ABOUT_QUESTIONS.find(x=>x[0]===aboutQuestion);
  if(!q)return;
  setBusy(true);setNotice("");
  const {error}=await db.from("cp_reflections").upsert({user_id:user.id,question_id:q[0],question:q[1],answer:aboutAnswer.trim().slice(0,1200),ai_use_allowed:aboutAllowAI,share_for_surprises:aboutShare,share_theme:aboutShare?aboutShareTheme:null,updated_at:new Date().toISOString()},{onConflict:"user_id,question_id"});
  setNotice(error?getError(error):"Tu respuesta privada quedó guardada.");
  if(!error){setAboutAnswer("");setAboutAllowAI(false);setAboutShare(false);setAboutShareTheme("");await load(user);await refreshCentral()}
  setBusy(false);
 }
 function pickAbout(id){
  const x=reflections.find(r=>r.question_id===id);
  setAboutQuestion(id);setAboutAnswer(x?.answer||"");setAboutAllowAI(x?.ai_use_allowed||false);setAboutShare(x?.share_for_surprises||false);setAboutShareTheme(x?.share_theme||"");
 }
 async function deleteAbout(id){
  setBusy(true);const {error}=await db.from("cp_reflections").delete().eq("user_id",user.id).eq("id",id);
  setNotice(error?getError(error):"Respuesta eliminada.");
  if(!error){setAboutAnswer("");setAboutShare(false);setAboutShareTheme("");await load(user);await refreshCentral()}setBusy(false);
 }
async function saveMemory(){
  if(!user||!memoryText.trim()||busy)return;
  if(memoryShare&&(!memoryShareTheme||memoryCategory==="evitar")){setNotice("Para dar una pista elegí un tema positivo. Lo que preferís evitar queda únicamente en tu perfil.");return}
  setBusy(true);setNotice("");
  const payload={
   category:memoryCategory,body:memoryText.trim().slice(0,350),use_for_ai:true,
   share_for_surprises:memoryShare,share_theme:memoryShare?memoryShareTheme:null,updated_at:new Date().toISOString()
  };
  const result=editingMemory
   ?await db.from("cp_ai_memories").update(payload).eq("id",editingMemory).eq("user_id",user.id)
   :await db.from("cp_ai_memories").insert({user_id:user.id,...payload});
  if(result.error)setNotice(getError(result.error));
  else {
   setMemoryText("");setMemoryCategory("gustos");setMemoryShare(false);setMemoryShareTheme("");setEditingMemory(null);
   setNotice("Recuerdo guardado. Si autorizaste una pista, tu pareja solo recibirá sugerencias por tema, no tu texto.");
   await load(user);await refreshCentral();
  }
  setBusy(false);
 }
 function editMemory(record){
  setEditingMemory(record.id);setMemoryText(record.body);setMemoryCategory(record.category);
  setMemoryShare(record.share_for_surprises||false);setMemoryShareTheme(record.share_theme||"");
  setNotice("Editá el recuerdo en el formulario de tu cómplice.");
 }
 async function toggleMemory(record){
  setBusy(true);
  const payload={use_for_ai:!record.use_for_ai,updated_at:new Date().toISOString()};
  if(record.use_for_ai)payload.share_for_surprises=false;
  const {error}=await db.from("cp_ai_memories").update(payload).eq("id",record.id).eq("user_id",user.id);
  if(error)setNotice(getError(error));else {await load(user);await refreshCentral()}
  setBusy(false);
 }
  async function deleteMemory(record){
  setBusy(true);const {error}=await db.from("cp_ai_memories").delete().eq("id",record.id).eq("user_id",user.id);
  if(error)setNotice(getError(error));else {await load(user);await refreshCentral();setNotice("Recuerdo eliminado de tu perfil.")}
  setBusy(false);
 }
 async function rateActivity(task,value){
  if(!task.id||!user)return;
  setBusy(true);
  const {error}=await db.from("cp_ai_feedback").upsert({activity_id:task.id,user_id:user.id,rating:value,updated_at:new Date().toISOString()},{onConflict:"activity_id,user_id"});
  if(error)setNotice(getError(error));else {await load(user);await refreshCentral()}
  setBusy(false);
 }
  async function saveNote(){if(!noteText.trim())return;setBusy(true);const {error}=await db.from("cp_ai_notes").insert({user_id:user.id,body:noteText.trim()});setNotice(error?getError(error):"La nota quedó guardada solo para vos.");setNoteText("");await load(user);setBusy(false)}
 if(loading)return <main className="app"><div className="brand"><span className="mark">♡</span> Cómplices</div><p className="muted" style={{marginTop:55}}>Preparando nuestro rincón…</p></main>;
 if(!user)return <main className="app"><div className="brand"><span className="mark">♡</span> CÓMPLICES <span className="muted">por TeHiceEsto</span></div><div className="hero-grid"><div><span className="tiny">UN MUNDO PRIVADO PARA DOS</span><h1>Volver a elegirnos.<br/><span style={{color:"#ff8eae"}}>Todos los días.</span></h1><p className="muted">Misiones sorpresa, preguntas que acercan, juegos y un cómplice que aprende qué hace especial a tu pareja.</p><Button onClick={()=>document.querySelector("#acceso")?.scrollIntoView({behavior:"smooth"})}>Empezar nuestra aventura →</Button></div><div className="hero-art"><span className="big-heart">💗</span><div className="float one">✦ Una sorpresa para hoy</div><div className="float two">♡ +40 corazones por tu gesto</div></div></div><div className="features"><article><h3>💌 Misiones con intención</h3><p>Un motivo nuevo para alegrarle el día a alguien.</p></article><article><h3>🎲 Siempre algo juntos</h3><p>Preguntas, juegos y pequeñas aventuras reales.</p></article><article><h3>🔒 Solo ustedes dos</h3><p>Cuentas personales y recuerdos compartidos.</p></article></div><section className="auth-card" id="acceso"><div className="glass box"><span className="tiny">ACCESO AL PILOTO</span><h2 style={{margin:"9px 0 19px"}}>Tu lugar empieza acá.</h2><div className="tabs" style={{marginBottom:20}}><button className={authMode==="entrar"?"active":""} onClick={()=>setAuthMode("entrar")}>Entrar</button><button className={authMode==="crear"?"active":""} onClick={()=>setAuthMode("crear")}>Crear cuenta</button></div><form onSubmit={login}><div className="form-field"><label>Correo electrónico</label><input className="input" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/></div><div className="form-field"><label>Contraseña (mínimo 6 caracteres)</label><input className="input" type="password" minLength={6} required autoComplete={authMode==="entrar"?"current-password":"new-password"} value={pass} onChange={e=>setPass(e.target.value)}/></div><Button full type="submit" disabled={busy}>{busy?"Un momento…":authMode==="entrar"?"Entrar a nuestro espacio":"Crear mi cuenta"}</Button></form>{notice&&<div className="alert">{notice}</div>}{authMode==="crear"&&<div style={{marginTop:12}}><button className="link-button" onClick={()=>{setAuthMode("entrar");setNotice("")}}>Ya confirmé mi correo · Iniciar sesión</button></div>}<p className="subtle" style={{marginTop:14}}>Piloto privado para adultos. Cada integrante usa su propia cuenta.</p></div></section><footer className="page-bottom">Cómplices · Una experiencia independiente de TeHiceEsto · Privacidad primero.</footer></main>;
 if(!member)return <main className="app"><header className="top"><div className="brand"><span className="mark">♡</span> Cómplices</div><button className="link-button" onClick={logout}>Salir</button></header><section className="auth-card" style={{marginTop:40}}><span className="tiny">YA TENÉS TU CUENTA</span><h1>Creemos nuestro <span style={{color:"#ff8ead"}}>rincón.</span></h1><p className="muted" style={{margin:"15px 0 24px"}}>Podés crear un espacio e invitar a tu pareja o ingresar con el código que te compartió.</p><div className="glass box"><form onSubmit={inviteInput?joinSpace:createSpace}><div className="form-field"><label>¿Cómo querés que te llamemos?</label><input className="input" maxLength={40} required value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre"/></div><div className="form-field"><label>Código de invitación (opcional)</label><input className="input" value={inviteInput} onChange={e=>setInviteInput(e.target.value)} placeholder="Si recibiste uno, pegalo acá"/></div><Button full disabled={busy} type="submit">{busy?"Guardando…":inviteInput?"Unirme a nuestra pareja":"Crear nuestro espacio"}</Button></form>{notice&&<div className="alert">{notice}</div>}</div></section></main>;
 return <main className="app"><header className="top"><div className="brand"><span className="mark">♡</span> CÓMPLICES</div><div className="row"><Pill gold>❤️ {totalHearts} corazones</Pill><button className="link-button" onClick={logout}>Salir</button></div></header><div className="welcome"><div><span className="tiny">SU HISTORIA SIGUE</span><h1>Hola, {member.display_name}. <span style={{color:"#ff9db9"}}>♡</span></h1><p className="muted">{partner?"Un espacio para "+member.display_name+" y "+partner.display_name:"Tu rincón ya está listo. Falta invitar a tu pareja."}</p></div></div><nav className="tabs desktop" aria-label="Secciones">{NAV.map(([key,emoji,title])=><button key={key} className={tab===key?"active":""} onClick={()=>{setNotice("");setTab(key)}}>{emoji} {title}</button>)}</nav>{notice&&<div className="alert">{notice}</div>}
 {tab==="hoy"&&<><div className="dashboard"><div className="accent-card"><span className="tiny">LA CONEXIÓN SE CONSTRUYE CADA DÍA</span><h2 style={{fontSize:42,margin:"12px 0"}}>Lo más lindo de hoy todavía puede pasar.</h2><p className="subtle">No hace falta una fecha especial para tener un gesto especial.</p><div className="row wrap" style={{marginTop:22}}><Button onClick={()=>setTab("misiones")}>Ver misiones →</Button><Button secondary onClick={()=>setTab("preguntas")}>Enviar pregunta</Button></div></div><div className="glass box stack"><div className="between row"><span className="tiny">PROGRESO COMPARTIDO</span><span>💕</span></div><h2>{totalHearts} corazones</h2><div className="progress-track"><div className="progress-bar" style={{width:(totalHearts%500)/5+"%"}}/></div><p className="subtle">Cada gesto cuenta. No hay competencia ni días perdidos.</p>{!partner?<><div className="note">Invitá a tu pareja para jugar y conversar juntos.</div><Button small onClick={shareInvite}>Compartir invitación</Button><p className="subtle">Código: {space?.invite_code}</p></>:<p className="subtle">Conectados: {member.display_name} + {partner.display_name} ♡</p>}</div></div><div className="section-title"><h2>Tus desafíos de hoy</h2><Pill>{centralLoading?"Preparando…":centralMode==="generativa"?"IA personalizada":"Selección personalizada"}</Pill></div>{centralError&&<div className="note">Mostrando desafíos de respaldo. {centralError}</div>}<div className="cards">{tasks.slice(0,2).map(task=><Task key={task.key} task={task} done={mineDone(task.key)} other={partnerDone(task.key)} partner={partner} busy={busy} rating={ratingFor(task)} onRate={value=>rateActivity(task,value)} onToggle={()=>mark(task.key)}/>)}</div><div className="section-title"><h2>Esta semana</h2><Pill gold>+120 ❤️</Pill></div><Task task={tasks[2]} done={mineDone(tasks[2].key)} other={partnerDone(tasks[2].key)} partner={partner} busy={busy} rating={ratingFor(tasks[2])} onRate={value=>rateActivity(tasks[2],value)} onToggle={()=>mark(tasks[2].key)}/><div className="section-title"><h2>Una pregunta que acerca</h2></div><div className="glass box"><p style={{fontSize:18,marginBottom:17}}>{QUESTION_BANK.romance[new Date().getDate()%QUESTION_BANK.romance.length]}</p><Button secondary onClick={()=>{setQuestionTopic("romance");setTab("preguntas")}}>Preguntársela a mi pareja</Button></div><div className="section-title"><h2>Hoy tu cómplice quiere conocerte</h2></div><div className="glass box stack"><span className="tiny">UNA PREGUNTA PERSONAL</span><h3>{dailyAbout[1]}</h3><p className="subtle">Solo vos podés ver tu respuesta. Podés decidir si tu IA la utiliza en las sugerencias.</p><Button secondary onClick={()=>{pickAbout(dailyAbout[0]);setTab("complice");window.scrollTo({top:0,behavior:"smooth"})}}>Responder en mi espacio privado →</Button></div></>}
 {tab==="misiones"&&<><div className="section-title"><div><span className="tiny">PEQUEÑOS GESTOS, GRANDES HISTORIAS</span><h2>Nuestras misiones</h2></div><Pill gold>{totalHearts} ❤️</Pill></div><div className="cards">{tasks.map(task=><Task key={task.key} task={task} done={mineDone(task.key)} other={partnerDone(task.key)} partner={partner} busy={busy} rating={ratingFor(task)} onRate={value=>rateActivity(task,value)} onToggle={()=>mark(task.key)}/>)}</div><div className="glass box" style={{marginTop:17}}><h3>Los corazones son de los dos ♡</h3><p className="muted" style={{marginTop:8}}>Marcá una misión cuando la hagas. Si la otra persona también la cumple, los dos suman. No hay castigos por no completar actividades.</p></div></>}

 {tab==="juegos"&&<><div className="section-title"><div><span className="tiny">DOS PERSONAS, MIL DESCUBRIMIENTOS</span><h2>Juegos para los dos 🎲</h2></div><Pill gold>+60 ❤️ por juego</Pill></div>{byCentralSlot.game_1&&<div className="glass box stack" style={{marginBottom:16}}><span className="tiny">EL JUEGO QUE TU CÓMPLICE ELIGIÓ PARA HOY</span><h2>💞 {byCentralSlot.game_1.title}</h2><p className="muted">{byCentralSlot.game_1.body}</p><p className="subtle">Esta pregunta fue elegida a partir de tus gustos; el texto no revela tus respuestas privadas.</p><Button disabled={busy||!partner} onClick={()=>sendMessage("pregunta",byCentralSlot.game_1.body,"romance")}>Enviar este juego a mi pareja</Button></div>}<div className="grid2">{games.map(game=>{const key="g:"+date+":"+game.slug,own=gameAnswers[key],result=gameResults[key];return <div className="glass box stack" key={game.slug}><span className="tiny">JUEGO COOPERATIVO</span><h2>{game.title}</h2><p className="muted">{game.intro}</p><div className="choice-grid">{game.options.map(([val,label])=><button className={"choice"+(own===val?" selected":"")} key={val} disabled={busy||!partner} onClick={()=>playGame(key,val)}>{label}</button>)}</div>{own&&<div className="note">Tu elección quedó guardada en privado. La otra persona no la verá hasta que ambos jueguen.</div>}{result?.ready?<div className="accent-card"><span className="tiny">¡LOS DOS JUGARON!</span><h3 style={{margin:"12px 0"}}>Descubran sus respuestas 💞</h3>{result.answers?.map((a,i)=><p key={i} style={{marginTop:5}}><strong>{a.user_id===user.id?member.display_name:partner?.display_name||"Tu pareja"}:</strong> {game.options.find(o=>o[0]===a.answer)?.[1]||"Respuesta"}</p>)}</div>:result?<p className="subtle">Aún falta la respuesta de tu pareja.</p>:null}<Button small secondary onClick={()=>revealGame(key)} disabled={!partner}>Ver si ya respondió mi pareja</Button></div>})}</div><div className="section-title"><h2>¿Cuánto nos conocemos?</h2></div><div className="glass box stack"><p className="muted">Respondan preguntas sobre gustos y recuerdos. Pueden descubrir las respuestas en la sección Preguntas, y charlar sobre lo que cada uno eligió.</p><Button secondary onClick={()=>{setTab("preguntas");setQuestionTopic("romance")}}>Empezar una ronda de preguntas →</Button></div></>}
 {tab==="preguntas"&&<><div className="section-title"><div><span className="tiny">CONVERSACIONES QUE NOS ACERCAN</span><h2>Preguntame algo</h2></div><Pill>+20 ❤️ al responder</Pill></div><div className="glass box stack"><h3>Elegí un tema</h3><div className="row wrap">{TOPICS.map(([v,title])=><button className={"choice"+(questionTopic===v?" selected":"")} style={{flex:"1 1 120px"}} key={v} onClick={()=>setQuestionTopic(v)}>{title}</button>)}</div>{questionTopic==="picante"&&<p className="note">Solo se habilita cuando los dos adultos activaron esta categoría en sus preferencias.</p>}<Button onClick={surpriseQuestion} disabled={busy||!partner}>🎲 Enviar una pregunta sorpresa</Button><div className="form-field" style={{margin:0}}><label>O escribí tu propia pregunta</label><textarea maxLength={1000} className="textarea" value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="¿Qué te gustaría preguntarle?"/></div><Button secondary disabled={busy||!partner||!messageText.trim()} onClick={()=>sendMessage("pregunta",messageText,questionTopic)}>Mandarle esta pregunta 💌</Button></div><div className="section-title"><h2>Preguntas entre ustedes</h2></div><div className="question-list">{messages.filter(m=>m.kind==="pregunta").slice().reverse().map(q=>{const mine=q.sender_id===user.id;const response=messages.find(m=>m.reply_to===q.id);return <div key={q.id} className="glass box"><div className="row between"><Pill>{TOPICS.find(t=>t[0]===q.topic)?.[1]||"Pregunta"}</Pill><span className="subtle">{humanTime(q.created_at)}</span></div><h3 style={{margin:"15px 0"}}>{q.body}</h3><p className="subtle">{mine?"La enviaste vos":"Te la envió "+(partner?.display_name||"tu pareja")}</p>{response?<p className="note" style={{marginTop:12}}>Respuesta: {response.body}</p>:mine?<p className="subtle" style={{marginTop:12}}>Esperando su respuesta ❤️</p>:replyTo===q.id?<div className="stack" style={{marginTop:13}}><textarea className="textarea" maxLength={1000} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Tu respuesta…"/><Button disabled={busy||!replyText.trim()} onClick={()=>respond(q)}>Enviar respuesta +20 ❤️</Button></div>:<div style={{marginTop:14}}><Button small onClick={()=>setReplyTo(q.id)}>Responder</Button></div>}</div>})}{!messages.some(m=>m.kind==="pregunta")&&<div className="empty">Todavía no se enviaron preguntas. ¡Empezá vos!</div>}</div></>}
 {tab==="mensajes"&&<><div className="section-title"><div><span className="tiny">UN CANAL SOLO PARA USTEDES</span><h2>Nuestro chat 💌</h2></div></div><div className="glass box"><div className="chat-stream">{messages.filter(m=>m.kind==="mensaje").map(m=><div key={m.id} className={"message"+(m.sender_id===user.id?" mine":"")}><div className="meta">{m.sender_id===user.id?"Vos":partner?.display_name||"Tu pareja"} · {humanTime(m.created_at)}</div><p>{m.body}</p></div>)}{!messages.some(m=>m.kind==="mensaje")&&<div className="empty">Un espacio solo para ustedes. Empezá con un mensaje lindo.</div>}</div><div className="row" style={{marginTop:16}}><input className="input" maxLength={1000} value={messageText} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();sendMessage("mensaje",messageText)}}} onChange={e=>setMessageText(e.target.value)} placeholder="Escribile algo…"/><Button disabled={busy||!partner||!messageText.trim()} onClick={()=>sendMessage("mensaje",messageText)}>Enviar</Button></div></div><p className="subtle" style={{marginTop:13}}>Los mensajes quedan guardados en la base privada de su espacio. Por ahora no existe cifrado de extremo a extremo.</p></>}
 {tab==="complice"&&<><div className="section-title"><div><span className="tiny">UN COMPAÑERO PARA CREAR BUENOS MOMENTOS</span><h2>Mi cómplice ✨</h2></div></div><div className="grid2"><div className="glass box stack"><h3>Una idea personalizada</h3><p className="subtle">Basada en preferencias que tu pareja decidió habilitar para sorpresas. Nunca muestra sus respuestas privadas.</p><div className="accent-card"><span className="tiny">PISTA PARA HOY</span><h2 style={{margin:"12px 0"}}>{surprise.title}</h2><p>{surprise.body}</p></div><Button small secondary onClick={()=>load(user)}>Actualizar sugerencia</Button></div><div className="glass box stack"><h3>Ayudanos a conocerte</h3><p className="subtle">Tus respuestas son privadas. Solo se usan como pistas si autorizás las sorpresas.</p>{pref&&<><SelectField label="¿Qué detalle disfrutás recibir?" value={pref.favorite_treat} onChange={v=>setPref({...pref,favorite_treat:v})} options={TREAT}/><SelectField label="¿Qué plan te gusta?" value={pref.favorite_plan} onChange={v=>setPref({...pref,favorite_plan:v})} options={PLAN}/><SelectField label="¿Cómo preferís recibir cariño?" value={pref.love_language} onChange={v=>setPref({...pref,love_language:v})} options={LANG}/><label className="toggle"><input type="checkbox" checked={pref.allow_surprises} onChange={e=>setPref({...pref,allow_surprises:e.target.checked})}/> Usar estas pistas para recomendarle gestos a mi pareja</label><label className="toggle"><input type="checkbox" checked={pref.adult_mode} onChange={e=>setPref({...pref,adult_mode:e.target.checked})}/> Soy mayor de edad y quiero habilitar preguntas picantes</label><Button full disabled={busy} onClick={savePref}>Guardar mis preferencias</Button></>}</div></div><div className="section-title"><h2>Conoceme mejor ✨</h2><Pill>{reflections.length}/8</Pill></div><div className="glass box stack"><p className="subtle">La IA te hace preguntas para conocer tus gustos y elegir mejores propuestas. Tus respuestas son privadas: <strong>nunca se muestran directamente a tu pareja</strong>. Vos decidís si permitís que tu cómplice las use al conversar con vos.</p><SelectField label="Elegí una pregunta personal" value={aboutQuestion} onChange={pickAbout} options={ABOUT_QUESTIONS}/><textarea className="textarea" maxLength={1200} value={aboutAnswer} onChange={e=>setAboutAnswer(e.target.value)} placeholder="Respondé con tus palabras…"/><label className="toggle"><input type="checkbox" checked={aboutAllowAI} onChange={e=>{setAboutAllowAI(e.target.checked);if(!e.target.checked)setAboutShare(false)}}/> Mi IA puede usar esta respuesta para darme ideas personales</label>
<label className="toggle"><input type="checkbox" disabled={!aboutAllowAI||aboutQuestion==="q07"} checked={aboutShare} onChange={e=>setAboutShare(e.target.checked)}/> También quiero que mi pareja reciba sugerencias basadas SOLO en un tema que yo elija</label>
{aboutShare&&<SelectField label="¿Qué tema le puede inspirar a tu pareja?" value={aboutShareTheme} onChange={setAboutShareTheme} options={SHARE_THEMES}/>}
<p className="subtle">Tu respuesta escrita nunca se comparte. Las pistas están desactivadas de forma predeterminada.</p>
<Button disabled={busy||!aboutAnswer.trim()||(aboutShare&&!aboutShareTheme)} onClick={saveAbout}>Guardar mi respuesta</Button>{reflections.length>0&&<div className="stack">{reflections.map(q=><div className="mini-card" key={q.id}><div className="row between wrap"><strong style={{fontSize:13}}>{q.question}</strong><button className="link-button" onClick={()=>pickAbout(q.question_id)}>Editar</button></div><p>{q.answer}</p><div className="row between wrap" style={{marginTop:10}}><span className="subtle">{q.share_for_surprises?"Pista compartible: "+(SHARE_THEMES.find(t=>t[0]===q.share_theme)?.[1]||"Tema"):q.ai_use_allowed?"Solo para mi IA":"No utilizada por la IA"}</span><button className="link-button" disabled={busy} onClick={()=>deleteAbout(q.id)}>Eliminar</button></div></div>)}</div>}</div><div className="section-title"><h2>Lo que mi cómplice recuerda 🧠</h2><Pill>{memories.filter(x=>x.use_for_ai).length} recuerdos activos</Pill></div><div className="glass box stack"><p className="subtle">Contale tus gustos, planes, actividades que disfrutás o cosas que preferís evitar. Solo se guarda lo que vos elijas guardar. El texto no se comparte nunca con tu pareja.</p><SelectField label="¿Qué querés recordar?" value={memoryCategory} onChange={v=>{setMemoryCategory(v);if(v==="evitar")setMemoryShare(false)}} options={[["gustos","Mis gustos"],["planes","Planes que disfruto"],["evitar","Cosas que prefiero evitar"],["prioridades","Mis prioridades"],["otro","Otro recuerdo"]]}/><textarea className="textarea" maxLength={350} value={memoryText} onChange={e=>setMemoryText(e.target.value)} placeholder="Ejemplo: Me encantan las caminatas cortas, pero prefiero planes económicos."/>
<label className="toggle"><input type="checkbox" disabled={memoryCategory==="evitar"} checked={memoryShare} onChange={e=>setMemoryShare(e.target.checked)}/> Permitir que mi cómplice transforme un tema de este recuerdo en ideas para mi pareja</label>
{memoryShare&&<SelectField label="Tema seguro que autorizo compartir" value={memoryShareTheme} onChange={setMemoryShareTheme} options={SHARE_THEMES}/>}
<p className="subtle">Solo se utiliza el tema seleccionado, nunca tus palabras. Podés cambiarlo o desactivarlo cuando quieras.</p>
<div className="row wrap"><Button disabled={busy||!memoryText.trim()||(memoryShare&&!memoryShareTheme)} onClick={saveMemory}>{editingMemory?"Guardar cambios":"Guardar para mi cómplice"}</Button>{editingMemory&&<Button secondary small onClick={()=>{setEditingMemory(null);setMemoryText("");setMemoryShare(false);setMemoryShareTheme("");setMemoryCategory("gustos")}}>Cancelar edición</Button>}</div>{memories.length>0&&<div className="stack">{memories.map(m=><div className="mini-card" key={m.id}><p style={{color:"#f6e9ef"}}>{m.body}</p><div className="row between wrap" style={{marginTop:10}}><span className="subtle">{m.category} · {m.share_for_surprises&&m.use_for_ai?"Pista temática habilitada":m.use_for_ai?"Solo para mi IA":"No disponible para mi IA"}</span><div className="row"><button className="link-button" disabled={busy} onClick={()=>editMemory(m)}>Editar</button><button className="link-button" disabled={busy} onClick={()=>toggleMemory(m)}>{m.use_for_ai?"No usar":"Usar"}</button><button className="link-button" disabled={busy} onClick={()=>deleteMemory(m)}>Eliminar</button></div></div></div>)}</div>}</div><div className="section-title"><h2>Conversá con tu cómplice</h2><Pill>{aiAvailable?"IA generativa disponible":"Modo guiado"}</Pill></div><div className="glass box"><p className="subtle">Pedile ideas para una cita, gestos sin gastar o una sorpresa. {aiAvailable?"Las respuestas son generadas por IA. Lo que escribas en este chat se procesa en el proveedor de IA; solo se incluyen tus respuestas personales si lo autorizaste.":"Por ahora tenés una guía de sugerencias. La IA generativa se activará cuando configuremos su clave de API."}</p><div className="chat-stream" style={{marginTop:18}}>{aiChat.length===0&&<div className="note">Probá: “Quiero sorprender a mi pareja sin gastar dinero”.</div>}{aiChat.map((m,i)=><div key={i} className={"message"+(m.who==="yo"?" mine":"")}><div className="meta">{m.who==="yo"?"Vos":"Tu cómplice"}</div><p>{m.text}</p>{m.who==="yo"&&<button className="link-button" style={{marginTop:8}} onClick={()=>{setMemoryText(m.text.slice(0,350));setMemoryCategory("gustos");setNotice("El texto quedó preparado en tu memoria privada. Guardalo si querés que la IA lo recuerde.")}}>Preparar para guardar en mi memoria</button>}</div>)}{aiBusy&&<p className="muted">Pensando en una idea…</p>}</div><form className="row" onSubmit={askAI}><input className="input" value={aiText} maxLength={350} onChange={e=>setAiText(e.target.value)} placeholder="Contame qué tenés en mente…"/><Button type="submit" disabled={aiBusy||!aiText.trim()}>Enviar</Button></form></div><div className="section-title"><h2>Mis notas privadas</h2></div><div className="glass box stack"><p className="subtle">Anotá algo que no querés olvidar. No se comparte automáticamente con tu pareja.</p><textarea className="textarea" maxLength={600} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Una idea, un recuerdo, una preferencia…"/><Button secondary disabled={busy||!noteText.trim()} onClick={saveNote}>Guardar nota privada</Button>{notes.map(n=><div key={n.id} className="mini-card"><p>{n.body}</p><span className="subtle">{humanTime(n.created_at)}</span></div>)}</div></>}
 <div className="section-title"><h2>Tu espacio</h2></div><div className="glass box stack"><div className="row between wrap"><div><h3>Notificaciones privadas</h3><p className="subtle">Avisos de mensajes y preguntas, sin mostrar el contenido en la pantalla bloqueada.</p></div><div className="row wrap"><Button secondary small onClick={requestNotifications}>Activar en este celular</Button>{notificationSettings.enabled&&<Button secondary small disabled={busy} onClick={disableNotifications}>Desactivar avisos</Button>}</div></div><div className="row wrap"><label className="grow">Desde qué hora no molestar<input className="input" type="time" value={notificationSettings.quiet_start?.slice(0,5)||"22:00"} onChange={e=>setNotificationSettings(p=>({...p,quiet_start:e.target.value}))}/></label><label className="grow">Hasta qué hora no molestar<input className="input" type="time" value={notificationSettings.quiet_end?.slice(0,5)||"08:00"} onChange={e=>setNotificationSettings(p=>({...p,quiet_end:e.target.value}))}/></label></div><Button secondary small disabled={busy} onClick={()=>saveNotificationSettings()}>Guardar horario de silencio</Button><p className="subtle">Horario de Argentina. Si los dos horarios son iguales, no se aplica un período de silencio. Cada integrante configura sus propios avisos.</p>{!partner&&<div className="stack"><p className="subtle">Invitación privada: {space?.invite_code}</p><Button secondary onClick={shareInvite}>Compartir invitación con mi pareja</Button></div>}<p className="subtle">Piloto sin cobros. Sin mensajes WhatsApp automáticos ni recordatorios diarios con la web cerrada todavía. No compartas información especialmente sensible.</p></div><footer className="page-bottom">Cómplices · Desarrollado sobre recursos de TeHiceEsto · Un espacio privado para dos ♡</footer><nav className="bottom-nav" aria-label="Navegación principal">{NAV.map(([key,emoji,title])=><button key={key} className={tab===key?"active":""} onClick={()=>{setTab(key);setNotice("");window.scrollTo({top:0,behavior:"smooth"})}}><b>{emoji}</b>{title}</button>)}</nav></main>
}
function Task({task,done,other,partner,busy,onToggle,rating,onRate}){return <article className={"task-card"+(done?" done":"")}><div className="row between"><span className="task-icon">{task.icon}</span><Pill gold>+{task.points} ❤️</Pill></div><h3>{task.title}</h3><p>{task.body}</p>{partner&&<span className="subtle">{other?"♡ Tu pareja ya marcó una misión":"Podés hacerla a tu ritmo"}</span>}<Button full secondary={done} disabled={busy} onClick={onToggle}>{done?"✓ Hecho · Desmarcar":"Marcar como hecho"}</Button>{task.id&&<div className="row between wrap" style={{marginTop:5}}><span className="subtle">¿Te sirvió esta idea?</span><div className="row"><button type="button" disabled={busy} onClick={()=>onRate?.(1)} className={"feedback-btn"+(rating===1?" active":"")} aria-label="Me gustó esta idea">👍</button><button type="button" disabled={busy} onClick={()=>onRate?.(-1)} className={"feedback-btn"+(rating===-1?" active":"")} aria-label="No me gustó esta idea">👎</button></div></div>}</article>}
