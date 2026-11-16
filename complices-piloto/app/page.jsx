
"use client";
import {useState,useEffect,useCallback} from "react";
import {createClient} from "@supabase/supabase-js";
import {PROFILE_QUESTIONS,profileProgress} from "../lib/ai-profile.mjs";
import {taskDayFromKey} from "../lib/mission-schedule.mjs";
import {DEEP_QUESTIONS,DATE_TYPES,weeklyPersonalQuestion,profileKnowledge,upcomingOccasions} from "../lib/relationship-intelligence.mjs";

const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const QUESTION_BANK={
 romance:["¿Qué pequeño gesto mío te hace sentir más querido/a?","¿Cuál de nuestros recuerdos guardarías en una botella?","¿Qué cita nuestra repetirías mil veces?","¿Qué es algo que admirás de mí y casi nunca decís?"],
 humor:["¿Qué haríamos si ganáramos un viaje sorpresa mañana?","¿Quién sobreviviría mejor un día sin celular?","¿Cuál es nuestra anécdota más divertida?"],
 profundo:["¿Qué aprendiste de nuestra relación este año?","¿Qué te gustaría que entienda mejor de vos?","¿Qué hábito nuestro te gustaría cuidar más?"],
 futuro:["¿Qué aventura te gustaría que hagamos este año?","¿Qué sueño pequeño podríamos cumplir juntos pronto?","¿Cómo imaginás un domingo perfecto dentro de cinco años?"],
 picante:["¿Qué momento a solas te gustaría repetir?","¿Qué plan romántico íntimo te gustaría que organicemos?","¿Qué detalle o ambiente te hace sentir más deseado/a?"]
};
const ABOUT_QUESTIONS=[...DEEP_QUESTIONS,
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
const NAV=[["hoy","⌂","Hoy"],["misiones","♡","Misiones"],["juegos","♧","Juegos"],["mensajes","✉","Chat"],["complice","✦","Cómplice"]];

function todayKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function weeklyKey(){const date=new Date(todayKey()+"T12:00:00");const monday=new Date(date);monday.setDate(date.getDate()-((date.getDay()+6)%7));return monday.toISOString().slice(0,10)}
function getError(err){return err?.message||"No se pudo completar la acción."}
function humanTime(iso){try{return new Date(iso).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return ""}}
function NavIcon({name}){
 const props={width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true"};
 return <svg {...props}>
 {name==="hoy"&&<><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/></>}
 {name==="misiones"&&<><rect x="4.5" y="5.5" width="15" height="16" rx="3"/><path d="M9 5.5V3m6 2.5V3M8 13l2.5 2.5 5-5"/></>}
 {name==="juegos"&&<><path d="M6.5 9h11a4 4 0 0 1 3.8 3l1 4.3a2.5 2.5 0 0 1-4 2.5l-3-2.5H8.7l-3 2.5a2.5 2.5 0 0 1-4-2.5l1-4.3a4 4 0 0 1 3.8-3Z"/><path d="M7.8 11.7v5M5.3 14.2h5M16.8 12.2h.01M19.2 14.2h.01"/></>}
 {name==="mensajes"&&<><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.1-1.1L3 21l1.6-5A8.5 8.5 0 1 1 21 11.5Z"/></>}
 {name==="complice"&&<><path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2ZM19.5 17l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></>}
 {name==="perfil"&&<><circle cx="12" cy="8" r="3.5"/><path d="M4.4 21a8 8 0 0 1 15.2 0M4 4l1.5 1.5M20 4l-1.5 1.5"/></>}
 </svg>
}
function Pill({children,gold}){return <span className={"pill"+(gold?" gold":"")}>{children}</span>}
function Button({children,secondary=false,small=false,full=false,disabled=false,onClick,type="button"}){return <button type={type} disabled={disabled} onClick={onClick} className={"btn"+(secondary?" secondary":"")+(small?" small":"")+(full?" full":"")}>{children}</button>}
function SelectField({label,value,onChange,options}){return <div className="form-field"><label>{label}</label><select className="select" value={value} onChange={e=>onChange(e.target.value)}>{options.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>}
export default function Home(){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[authMode,setAuthMode]=useState("entrar");
 const [email,setEmail]=useState(""),[pass,setPass]=useState("");
 const [member,setMember]=useState(null),[members,setMembers]=useState([]),[space,setSpace]=useState(null),[pref,setPref]=useState(null),[surprise,setSurprise]=useState(DEFAULT_SURPRISE);
 const [activities,setActivities]=useState([]),[messages,setMessages]=useState([]),[notes,setNotes]=useState([]),[reflections,setReflections]=useState([]),[memories,setMemories]=useState([]),[aiRatings,setAiRatings]=useState([]),[notificationSettings,setNotificationSettings]=useState({enabled:false,reflection_prompts_enabled:false,quiet_start:"22:00",quiet_end:"08:00"});
 const [name,setName]=useState(""),[inviteInput,setInviteInput]=useState("");
 const [tab,setTab]=useState("hoy"),[missionFilter,setMissionFilter]=useState("diarias"),[messageText,setMessageText]=useState(""),[replyText,setReplyText]=useState(""),[replyTo,setReplyTo]=useState(null),[questionTopic,setQuestionTopic]=useState("romance");
 const [noteText,setNoteText]=useState("");
 const [aiCheck,setAiCheck]=useState(null),[checkingAI,setCheckingAI]=useState(false);
 const [gameAnswers,setGameAnswers]=useState({}),[gameResults,setGameResults]=useState({});
 const [aboutQuestion,setAboutQuestion]=useState("q09"),[aboutAnswer,setAboutAnswer]=useState(""),[aboutAllowAI,setAboutAllowAI]=useState(false),[aboutShare,setAboutShare]=useState(false),[aboutShareTheme,setAboutShareTheme]=useState("");
 const [memoryText,setMemoryText]=useState(""),[memoryCategory,setMemoryCategory]=useState("gustos"),[memoryShare,setMemoryShare]=useState(false),[memoryShareTheme,setMemoryShareTheme]=useState(""),[editingMemory,setEditingMemory]=useState(null);
 const [centralActivities,setCentralActivities]=useState([]),[centralMode,setCentralMode]=useState("guiado"),[centralLoading,setCentralLoading]=useState(false),[centralError,setCentralError]=useState(""),[partnerInsightCount,setPartnerInsightCount]=useState(0),[centralSchedule,setCentralSchedule]=useState(null);
 const [weeklyAnswer,setWeeklyAnswer]=useState(""),[weeklyAllowAI,setWeeklyAllowAI]=useState(false),[dismissedPulse,setDismissedPulse]=useState("");
 const [importantDates,setImportantDates]=useState([]),[importantDateLabel,setImportantDateLabel]=useState(""),[importantDateKind,setImportantDateKind]=useState("aniversario"),[importantDateOn,setImportantDateOn]=useState(""),[importantDateRepeats,setImportantDateRepeats]=useState(true),[importantDateShare,setImportantDateShare]=useState(false);
 const [profileCards,setProfileCards]=useState([]),[profileQuestion,setProfileQuestion]=useState("afecto"),[profileAnswer,setProfileAnswer]=useState(""),[profileShare,setProfileShare]=useState(false);
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
  const [s,mm,p,c,ms,n,t,rfl,ns,mem,feedback,structured,dateRows]=await Promise.all([
   db.from("cp_spaces").select("*").eq("id",m.space_id).single(),
   db.from("cp_members").select("user_id,display_name,joined_at").eq("space_id",m.space_id),
   db.from("cp_preferences").select("*").eq("user_id",u.id).maybeSingle(),
   db.from("cp_completions").select("*").eq("space_id",m.space_id),
   db.from("cp_messages").select("*").eq("space_id",m.space_id).order("created_at",{ascending:true}).limit(100),
   db.from("cp_ai_notes").select("*").eq("user_id",u.id).order("created_at",{ascending:false}).limit(12),
   db.rpc("cp_partner_surprise",{p_space:m.space_id}),
   db.from("cp_reflections").select("id,question_id,question,answer,ai_use_allowed,share_for_surprises,share_theme,updated_at").eq("user_id",u.id).order("updated_at",{ascending:false}),
   db.from("cp_notification_settings").select("enabled,quiet_start,quiet_end,reflection_prompts_enabled").eq("user_id",u.id).maybeSingle(),
   db.from("cp_ai_memories").select("id,category,body,use_for_ai,share_for_surprises,share_theme,created_at").eq("user_id",u.id).order("created_at",{ascending:false}).limit(35),
   db.from("cp_ai_feedback").select("activity_id,rating").eq("user_id",u.id),
   db.from("cp_ai_profile_cards").select("question_key,answer_code,share_with_partner_ai,updated_at").eq("user_id",u.id),
   db.from("cp_important_dates").select("id,space_id,user_id,kind,label,event_on,repeat_yearly,share_with_partner").eq("space_id",m.space_id).order("event_on",{ascending:true})
  ]);
  if(s.error)setNotice(getError(s.error));
  setSpace(s.data||null);setMembers(mm.data||[]);setPref(p.data||null);setActivities(c.data||[]);setMessages(ms.data||[]);setNotes(n.data||[]);setReflections(rfl.data||[]);setMemories(mem.data||[]);setAiRatings(feedback.data||[]);setProfileCards(structured.data||[]);setImportantDates(dateRows.data||[]);if(dateRows.error)setNotice("No pude cargar las fechas guardadas: "+getError(dateRows.error));setNotificationSettings(ns.data||{enabled:false,reflection_prompts_enabled:false,quiet_start:"22:00",quiet_end:"08:00"});if(t.data)setSurprise(t.data);const {data:gameRows}=await db.from("cp_game_entries").select("game_key,answer").eq("space_id",m.space_id).eq("user_id",u.id);if(gameRows)setGameAnswers(Object.fromEntries(gameRows.map(g=>[g.game_key,g.answer])));
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
   setCentralActivities(data.activities||[]);setCentralMode(data.mode||"guiado");setCentralSchedule(data.schedule||null);setPartnerInsightCount(data.personalization?.partnerSharedPreferences||0);setCentralError("");
  }catch{setCentralError("No pude conectar con tu cómplice central")}
  finally{setCentralLoading(false)}
 },[user?.id]);
 useEffect(()=>{if(user?.id&&member?.space_id)refreshCentral();else setCentralActivities([])},[user?.id,member?.space_id,refreshCentral]);
 useEffect(()=>{
  if(!user?.id||!member?.space_id)return;
  let lastCheck=Date.now();
  const refreshWhenBack=()=>{
   if(document.visibilityState!=="visible"||Date.now()-lastCheck<300000)return;
   lastCheck=Date.now();refreshCentral();
  };
  window.addEventListener("focus",refreshWhenBack);
  document.addEventListener("visibilitychange",refreshWhenBack);
  return()=>{window.removeEventListener("focus",refreshWhenBack);document.removeEventListener("visibilitychange",refreshWhenBack)};
 },[user?.id,member?.space_id,refreshCentral]);
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
 const byCentralSlot=Object.fromEntries(centralActivities.map(item=>[item.slot,item]));
 const tasks=centralActivities.filter(a=>/^mission_[123]$/.test(a.slot)||a.slot==="weekly_1").map(a=>({
  id:a.id,slot:a.slot,key:a.task_key,title:a.title,body:a.body,icon:a.icon,points:a.points,
  mode:a.mode,theme:a.theme,due:taskDayFromKey(a.task_key)
 }));
 const dailyTasks=tasks.filter(x=>x.slot.startsWith("mission_")&&x.due&&x.due<=date);
 const futureTasks=tasks.filter(x=>x.slot.startsWith("mission_")&&x.due&&x.due>date);
 const todayTasks=dailyTasks.filter(x=>x.due===date);
 const pendingTasks=dailyTasks.filter(x=>x.due<date);
 const weeklyTasks=tasks.filter(x=>x.slot==="weekly_1");
 const focusMission=todayTasks[0]||pendingTasks.find(x=>!activities.some(a=>a.task_key===x.key&&a.user_id===user?.id))||weeklyTasks[0]||null;
 const dayLabels=centralSchedule?.days?.map(x=>x.label)||[];
 const missionCount=tasks.filter(x=>x.slot.startsWith("mission_")).length;
 const mineDone=(key)=>activities.some(a=>a.task_key===key&&a.user_id===user?.id);
 const partnerDone=(key)=>activities.some(a=>a.task_key===key&&a.user_id===partner?.user_id);
 const calcPoints=(key)=>key.startsWith("w:")?120:key.startsWith("q:")?20:key.startsWith("d:")&&/:(mission-[123]|central-1|sorpresa)$/.test(key)?40:key.startsWith("g:")?60:30;
 const totalHearts=activities.reduce((sum,a)=>sum+calcPoints(a.task_key),0);
 const ratingFor=(task)=>aiRatings.find(f=>f.activity_id===task.id)?.rating||0;
 const dailyAbout=ABOUT_QUESTIONS.find(q=>!reflections.some(r=>r.question_id===q[0]))||ABOUT_QUESTIONS[(new Date(date+"T12:00:00").getDate())%ABOUT_QUESTIONS.length];
 const profileCompletion=profileProgress(profileCards);
 const knowledge=profileKnowledge({cards:profileCards,reflections,importantDates,feedback:aiRatings,completions:activities.filter(x=>x.user_id===user?.id)});
 const upcomingDates=upcomingOccasions(importantDates,date,30);
 const weeklyPrompt=weeklyPersonalQuestion({userId:user?.id||"",week,partnerName:partner?.display_name||"tu pareja",missionDays:centralSchedule?.dayNumbers||[]});
 const weeklyPromptReady=date>=weeklyPrompt.due&&!reflections.some(x=>x.question_id===weeklyPrompt.id)&&dismissedPulse!==weeklyPrompt.id;
 const currentProfileQuestion=PROFILE_QUESTIONS.find(q=>q.key===profileQuestion)||PROFILE_QUESTIONS[0];
 const games=[{slug:"escapada",title:"Si pudiéramos escaparnos…",intro:"¿A dónde irías con tu pareja sin pensarlo demasiado?",options:[["playa","🏖️ A la playa"],["montana","⛰️ A la montaña"],["ciudad","🏙️ A una ciudad"],["campo","🌿 Al campo"]]},{slug:"cita",title:"Nuestra cita perfecta",intro:"¿Cuál de estos planes elegirías para esta noche?",options:[["cena","🍝 Una cena"],["peli","🎬 Una película"],["paseo","🌙 Un paseo"],["cocinar","👩‍🍳 Cocinar juntos"]]}];
 async function revealGame(key){const {data,error}=await db.rpc("cp_game_reveal",{p_space:member.space_id,p_key:key});if(error)setNotice(getError(error));else setGameResults(old=>({...old,[key]:data}))}
 async function playGame(key,answer){if(!partner)return;setBusy(true);setNotice("");const {error}=await db.from("cp_game_entries").upsert({space_id:member.space_id,game_key:key,user_id:user.id,answer},{onConflict:"space_id,game_key,user_id"});if(error){setNotice(getError(error))}else{if(!mineDone(key))await db.from("cp_completions").insert({space_id:member.space_id,user_id:user.id,task_key:key});await load(user);await revealGame(key)}setBusy(false)}
 async function mark(key){if(!member)return;setBusy(true);setNotice("");const was=mineDone(key);const r=was?await db.from("cp_completions").delete().eq("user_id",user.id).eq("space_id",member.space_id).eq("task_key",key):await db.from("cp_completions").insert({space_id:member.space_id,user_id:user.id,task_key:key});if(r.error)setNotice(getError(r.error));else await load(user);setBusy(false)}
 function selectProfileQuestion(key){
  const card=profileCards.find(p=>p.question_key===key);
  setProfileQuestion(key);setProfileAnswer(card?.answer_code||"");setProfileShare(Boolean(card?.share_with_partner_ai));
 }
 async function saveStructuredProfile(){
  if(!user||busy)return;
  const question=PROFILE_QUESTIONS.find(q=>q.key===profileQuestion);
  if(!question||!question.options.some(x=>x[0]===profileAnswer))return;
  setBusy(true);setNotice("");
  const {error}=await db.from("cp_ai_profile_cards").upsert({
   user_id:user.id,question_key:profileQuestion,answer_code:profileAnswer,
   share_with_partner_ai:profileShare,updated_at:new Date().toISOString()
  },{onConflict:"user_id,question_key"});
  if(error){setNotice("No pude guardar tu preferencia: "+getError(error));setBusy(false);return}
  const next=PROFILE_QUESTIONS.find(q=>q.key!==profileQuestion&&!profileCards.some(c=>c.question_key===q.key));
  setNotice(profileShare?"Preferencia guardada y autorizada como pista. La IA del otro la usará solo si activás el permiso general.":"Preferencia guardada solo en tu cuenta. Tu pareja no puede verla.");
  if(next){setProfileQuestion(next.key);setProfileAnswer("");setProfileShare(false)}
  await load(user);await refreshCentral();setBusy(false);
 }
 async function removeStructuredProfile(key){
  if(!user||busy)return;
  setBusy(true);
  const {error}=await db.from("cp_ai_profile_cards").delete().eq("user_id",user.id).eq("question_key",key);
  setBusy(false);
  if(error)setNotice(getError(error));else{setNotice("Esa respuesta se eliminó. Las nuevas recomendaciones ya no usarán esa pista.");await load(user);await refreshCentral();if(key===profileQuestion){setProfileAnswer("");setProfileShare(false)}}
 }
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
 async function checkOpenAI(){
  if(!user||checkingAI)return;
  setCheckingAI(true);
  try{
   const {data:{session}}=await db.auth.getSession();
   if(!session?.access_token)throw new Error("Primero iniciá sesión");
   const response=await fetch("/api/ai-health",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"No se pudo comprobar OpenAI");
   setAiCheck(data);
  }catch(e){setNotice("No se pudo comprobar OpenAI: "+getError(e))}
  finally{setCheckingAI(false)}
 }
 async function saveImportantDate(){
  if(!user||!member||busy)return;
  const label=importantDateLabel.trim();
  if(label.length<3||label.length>90||!DATE_TYPES.some(x=>x[0]===importantDateKind)||!/^\d{4}-\d{2}-\d{2}$/.test(importantDateOn)){setNotice("Completá una fecha válida y un nombre de 3 a 90 caracteres.");return}
  setBusy(true);setNotice("");
  const {error}=await db.from("cp_important_dates").insert({user_id:user.id,space_id:member.space_id,kind:importantDateKind,label,event_on:importantDateOn,repeat_yearly:importantDateRepeats,share_with_partner:importantDateShare});
  if(error)setNotice("No pude guardar la fecha: "+getError(error));
  else{setImportantDateLabel("");setImportantDateOn("");setImportantDateShare(false);setImportantDateKind("aniversario");setNotice("Fecha guardada. Tu IA podrá usarla para darte ideas apropiadas.");await load(user);await refreshCentral()}
  setBusy(false);
 }
 async function changeDateShare(row){
  if(!user||row.user_id!==user.id||busy)return;
  setBusy(true);
  const {error}=await db.from("cp_important_dates").update({share_with_partner:!row.share_with_partner,updated_at:new Date().toISOString()}).eq("id",row.id).eq("user_id",user.id);
  if(error)setNotice(getError(error));else{setNotice(row.share_with_partner?"La fecha ahora es privada.":"La fecha quedó visible para los dos.");await load(user);await refreshCentral()}
  setBusy(false);
 }
 async function deleteImportantDate(row){
  if(!user||row.user_id!==user.id||busy)return;
  setBusy(true);
  const {error}=await db.from("cp_important_dates").delete().eq("id",row.id).eq("user_id",user.id);
  if(error)setNotice(getError(error));else{setNotice("Fecha eliminada de tu perfil.");await load(user);await refreshCentral()}
  setBusy(false);
 }
 async function answerWeeklyPrompt(){
  if(!user||!weeklyAnswer.trim()||busy||!weeklyPromptReady)return;
  setBusy(true);setNotice("");
  const {error}=await db.from("cp_reflections").upsert({
   user_id:user.id,question_id:weeklyPrompt.id,question:weeklyPrompt.question,
   answer:weeklyAnswer.trim().slice(0,1200),ai_use_allowed:weeklyAllowAI,
   share_for_surprises:false,share_theme:null,updated_at:new Date().toISOString()
  },{onConflict:"user_id,question_id"});
  if(error)setNotice(getError(error));else{
   setWeeklyAnswer("");setWeeklyAllowAI(false);setNotice("Respuesta privada guardada. Gracias por compartir un recuerdo de la semana.");await load(user);if(weeklyAllowAI)await refreshCentral();
  }
  setBusy(false);
 }
 async function saveAbout(){
  if(!aboutAnswer.trim()||!user)return;
  if(aboutShare&&(!aboutAllowAI||!aboutShareTheme||aboutQuestion==="q07"||aboutQuestion.startsWith("pulse:")){setNotice("Para compartir una pista elegí un tema positivo y autorizá que tu IA use la respuesta.");return}
  const q=aboutQuestion===weeklyPrompt.id?[weeklyPrompt.id,weeklyPrompt.question]:ABOUT_QUESTIONS.find(x=>x[0]===aboutQuestion);
  if(!q)return;
  setBusy(true);setNotice("");
  const {error}=await db.from("cp_reflections").upsert({user_id:user.id,question_id:q[0],question:q[1],answer:aboutAnswer.trim().slice(0,1200),ai_use_allowed:aboutAllowAI,share_for_surprises:aboutShare,share_theme:aboutShare?aboutShareTheme:null,updated_at:new Date().toISOString()},{onConflict:"user_id,question_id"});
  setNotice(error?getError(error):"Tu respuesta privada quedó guardada.");
  if(!error){setAboutAnswer("");setAboutAllowAI(false);setAboutShare(false);setAboutShareTheme("");await load(user);await refreshCentral()}
  setBusy(false);
 }
 function pickAbout(id){
  const x=reflections.find(r=>r.question_id===id);
  setAboutQuestion(id);setAboutAnswer(x?.answer||"");setAboutAllowAI(x?.ai_use_allowed||false);setAboutShare(id.startsWith("pulse:")?false:x?.share_for_surprises||false);setAboutShareTheme(id.startsWith("pulse:")?"":x?.share_theme||"");
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
 
 async function exportMyData(){
  if(!user||busy)return;
  setBusy(true);setNotice("");
  try{
   const {data,error}=await db.rpc("cp_export_my_personal_data");
   if(error)throw error;
   if(!data||data.user_id!==user.id)throw new Error("No se pudo verificar la exportación privada.");
   const contents=JSON.stringify(data,null,2);
   const blob=new Blob([contents],{type:"application/json;charset=utf-8"});
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");
   link.href=url;link.download="complices-mis-datos-"+todayKey()+".json";
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),2000);
   setNotice("Se preparó la descarga de tus datos personales. El archivo puede contener información íntima: guardalo en un lugar seguro.");
  }catch(e){setNotice("No pude exportar los datos: "+getError(e))}
  finally{setBusy(false)}
 }
 async function clearMyAiMemory(){
  if(!user||busy)return;
  const accepted=window.confirm("Esto borrará permanentemente tus respuestas personales, recuerdos, notas privadas, misiones generadas y evaluaciones de IA. Tus mensajes, corazones y espacio de pareja permanecerán. ¿Querés continuar?");
  if(!accepted)return;
  const confirmation=window.prompt("Para confirmar el borrado definitivo de tu memoria, escribí BORRAR:");
  if(confirmation!=="BORRAR"){setNotice("No se modificó tu memoria.");return}
  setBusy(true);setNotice("");
  try{
   const {data,error}=await db.rpc("cp_reset_my_ai_profile");
   if(error)throw error;
   setMemories([]);setReflections([]);setAiRatings([]);setProfileCards([]);setNotes([]);setCentralActivities([]);setCentralSchedule(null);setPartnerInsightCount(0);setCentralMode("guiado");setCentralError("");
   setNoteText("");setAboutAnswer("");setAboutAllowAI(false);setAboutShare(false);setAboutShareTheme("");
   setMemoryText("");setMemoryShare(false);setMemoryShareTheme("");setEditingMemory(null);setProfileQuestion("afecto");setProfileAnswer("");setProfileShare(false);setSurprise(DEFAULT_SURPRISE);
   await load(user);
   setNotice("Se eliminó tu memoria de IA ("+(data?.deleted_memories||0)+" recuerdos, "+(data?.deleted_reflections||0)+" respuestas y "+(data?.deleted_profile_cards||0)+" gustos estructurados). El chat compartido, tus corazones y la cuenta no cambiaron.");
  }catch(e){setNotice("No se pudo borrar la memoria: "+getError(e))}
  finally{setBusy(false)}
 }
 async function saveNote(){if(!noteText.trim())return;setBusy(true);const {error}=await db.from("cp_ai_notes").insert({user_id:user.id,body:noteText.trim()});setNotice(error?getError(error):"La nota quedó guardada solo para vos.");setNoteText("");await load(user);setBusy(false)}
 if(loading)return <main className="app"><div className="brand"><span className="mark">♡</span> Cómplices</div><p className="muted" style={{marginTop:55}}>Preparando nuestro rincón…</p></main>;

 if(!user)return <main className="app marketing">
  <header className="top"><div className="brand"><span className="mark">♡</span> Cómplices</div><span className="status-chip">♡ Una historia para dos</span></header>
  <section className="hero-grid">
   <div className="hero-copy"><span className="tiny">EL LUGAR MÁS LINDO ES CON VOS</span>
    <h1>Un poquito más cerca.<br/><span>Todos los días.</span></h1>
    <p>Preguntas que nos hacen descubrirnos, misiones que sorprenden y pequeños momentos para seguir eligiéndose. Todo en un espacio privado para dos.</p>
    <Button onClick={()=>document.querySelector("#acceso")?.scrollIntoView({behavior:"smooth"})}>Empezar nuestra historia ♡</Button>
    <div className="mood-divider">Pequeños gestos · Grandes conexiones</div>
   </div>
   <div className="hero-art" role="img" aria-label="Ilustración de una pareja abrazada al atardecer"><div className="float one">♡ Tu desafío de hoy</div><div className="float two">+40 corazones por una sonrisa</div></div>
  </section>
  <div className="features">
   <article><h3>♡ Misiones con intención</h3><p>Ideas diarias y semanales para disfrutar juntos, sin competir ni sumar obligaciones.</p></article>
   <article><h3>✦ Preguntas que acercan</h3><p>Conversaciones, juegos cooperativos y desafíos para descubrirse un poco más.</p></article>
   <article><h3>⌁ Tu cómplice personal</h3><p>Sugerencias pensadas para ustedes a partir de gustos que cada uno decide compartir.</p></article>
  </div>
  <p className="brand-story"><strong>El mejor momento pasa fuera de la pantalla.</strong> Cómplices solo ayuda a que haya más de esos momentos.</p>
  <section className="auth-card" id="acceso">
   <div className="glass box">
    <span className="tiny">BIENVENIDOS AL RINCÓN DE USTEDES</span>
    <h2 style={{margin:"10px 0 9px"}}>{authMode==="entrar"?"Qué lindo volver a verte.":"Toda historia empieza por algo."}</h2>
    <p className="subtle" style={{marginBottom:18}}>{authMode==="entrar"?"Entrá a su espacio y descubrí qué los espera hoy.":"Creá tu cuenta personal y después invitá a tu pareja."}</p>
    <div className="tabs" style={{marginBottom:20}}>
     <button type="button" className={authMode==="entrar"?"active":""} onClick={()=>{setAuthMode("entrar");setNotice("")}}>Ya tengo cuenta</button>
     <button type="button" className={authMode==="crear"?"active":""} onClick={()=>{setAuthMode("crear");setNotice("")}}>Crear cuenta</button>
    </div>
    <form onSubmit={login}>
     <div className="form-field"><label htmlFor="cp-email">Correo electrónico</label><input id="cp-email" className="input" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/></div>
     <div className="form-field"><label htmlFor="cp-pass">Contraseña (mínimo 6 caracteres)</label><input id="cp-pass" className="input" type="password" minLength={6} required autoComplete={authMode==="entrar"?"current-password":"new-password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/></div>
     <Button full type="submit" disabled={busy}>{busy?"Un momento…":authMode==="entrar"?"Entrar a nuestro espacio →":"Crear mi cuenta →"}</Button>
    </form>
    {notice&&<div className="alert" role="status">{notice}</div>}
    {authMode==="crear"&&<button type="button" className="link-button" style={{marginTop:13}} onClick={()=>{setAuthMode("entrar");setNotice("")}}>Ya confirmé mi correo · Iniciar sesión</button>}
    <p className="auth-helper">🔒 Un espacio para dos personas adultas. Cada uno tiene su propia cuenta y sus datos personales.</p>
   </div>
  </section>
  <footer className="page-bottom">Cómplices · Con cariño y respeto por su privacidad · Una experiencia de TeHiceEsto</footer>
 </main>;

 if(!member)return <main className="app onboarding-route">
  <header className="top"><div className="brand"><span className="mark">♡</span> Cómplices</div><button type="button" className="profile-back" onClick={logout}>Cerrar sesión</button></header>
  <section className="auth-card" style={{marginTop:36}}>
   <span className="tiny">TU NUEVA HISTORIA COMIENZA ACÁ</span>
   <h1>Un rincón <span style={{color:"#cf5b87"}}>para los dos.</span></h1>
   <p className="muted" style={{margin:"13px 0 19px"}}>{inviteInput?"Recibiste una invitación para entrar a un espacio privado.":"Creá su espacio o usá el enlace que te compartió tu pareja."}</p>
   <div className="onboarding-art" role="img" aria-label="Dos personas abrazadas mirando un atardecer"/>
   <div className="onboarding-intro"><h3>Sus conversaciones, sus aventuras, sus recuerdos ♡</h3><p>Un espacio común, dos cuentas individuales y la libertad de compartir solo lo que cada uno elija.</p></div>
   <div className="glass box" style={{marginTop:21}}>
    <form onSubmit={inviteInput?joinSpace:createSpace}>
     <div className="form-field"><label htmlFor="cp-name">¿Cómo querés que te llamemos?</label><input className="input" id="cp-name" maxLength={40} required value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre"/></div>
     <div className="form-field"><label htmlFor="cp-invite">Código de invitación (opcional)</label><input className="input" id="cp-invite" value={inviteInput} onChange={e=>setInviteInput(e.target.value)} placeholder="Pegá aquí el código si te invitaron"/></div>
     <Button full disabled={busy} type="submit">{busy?"Guardando…":inviteInput?"Unirme a nuestra pareja ♡":"Crear nuestro espacio ♡"}</Button>
    </form>
    {notice&&<div role="status" className="alert">{notice}</div>}
    <p className="auth-helper">🔒 Solo dos integrantes por espacio. La invitación no permite consultar recuerdos privados.</p>
   </div>
  </section>
 </main>;

 return <main className="app main-app">
  <header className="top">
   <div className="brand"><span className="mark">♡</span> Cómplices</div>
   <div className="top-actions"><span className="heart-pill">♥ {totalHearts} corazones</span>
    <button type="button" className={"profile-trigger"+(tab==="perfil"?" active":"")} aria-label="Perfil y privacidad" title="Perfil y privacidad" onClick={()=>{setTab("perfil");setNotice("");window.scrollTo({top:0,behavior:"smooth"})}}><NavIcon name="perfil"/></button>
   </div>
  </header>
  {tab==="hoy"&&<div className="welcome"><div><span className="tiny">SU HISTORIA SIGUE</span><h1>Hola, {member.display_name} <span style={{color:"#e85c8e"}}>♡</span></h1><p className="muted">{partner?"Un espacio para "+member.display_name+" y "+partner.display_name:"Tu rincón ya está listo. Invitá a tu pareja para empezar juntos."}</p></div></div>}
  <nav className="tabs desktop" aria-label="Secciones">
   {NAV.map(([key,emoji,title])=><button type="button" key={key} className={(tab===key||(tab==="preguntas"&&key==="juegos"))?"active":""} onClick={()=>{setNotice("");setTab(key)}}><NavIcon name={key}/>{title}</button>)}
  </nav>
  {notice&&<div className="alert" role="status">{notice}</div>}
 {tab==="hoy"&&<><div className="dashboard"><div className="accent-card"><span className="tiny">LA CONEXIÓN SE CONSTRUYE CADA DÍA</span><h2 style={{fontSize:42,margin:"12px 0"}}>Lo más lindo de hoy todavía puede pasar.</h2><p className="subtle">No hace falta una fecha especial para tener un gesto especial.</p><div className="row wrap" style={{marginTop:22}}><Button onClick={()=>setTab("misiones")}>Ver misiones →</Button><Button secondary onClick={()=>setTab("preguntas")}>Enviar pregunta</Button></div></div><div className="glass box stack"><div className="between row"><span className="tiny">PROGRESO COMPARTIDO</span><span>💕</span></div><h2>{totalHearts} corazones</h2><div className="progress-track"><div className="progress-bar" style={{width:(totalHearts%500)/5+"%"}}/></div><p className="subtle">Cada gesto cuenta. No hay competencia ni días perdidos.</p>{!partner?<><div className="note">Invitá a tu pareja para jugar y conversar juntos.</div><Button small onClick={shareInvite}>Compartir invitación</Button><p className="subtle">Código: {space?.invite_code}</p></>:<p className="subtle">Conectados: {member.display_name} + {partner.display_name} ♡</p>}</div></div>{profileCompletion.remaining.length>0&&<div className="central-daily-checkin"><div className="central-checkin-symbol" aria-hidden="true">✦</div><div className="grow"><span className="tiny">TU IA APRENDE DE VOS</span><h3>Una pregunta para conocerte mejor</h3><p className="subtle">{profileCompletion.remaining[0].question} Respondé cuando quieras: tus gustos ayudan a elegir mejores ideas.</p></div><Button small secondary onClick={()=>{selectProfileQuestion(profileCompletion.remaining[0].key);setTab("complice");window.scrollTo({top:0,behavior:"smooth"})}}>Responder ♡</Button></div>}<div className="section-title"><h2>Tu misión de hoy</h2><Pill>{centralLoading?"Preparando…":centralMode==="generativa"?"IA personalizada":"Misiones con intención"}</Pill></div>{centralError&&<div className="note">No pude actualizar la agenda. {centralError}</div>}
 <p className="subtle" style={{marginBottom:12}}>Tres días de misión para vos en cada semana. Los días asignados no son plazos: podés completarlas después si lo necesitás.</p>
 <div className="cards">{todayTasks.map(task=><Task key={task.key} task={task} done={mineDone(task.key)} other={partnerDone(task.key)} partner={partner} busy={busy} rating={ratingFor(task)} onRate={value=>rateActivity(task,value)} onToggle={()=>mark(task.key)}/>)}</div>
 {todayTasks.length===0&&<div className="mission-rest-note">♡ Hoy no tenés una misión nueva. El cariño no necesita marcar casillas todos los días.</div>}
 {pendingTasks.length>0&&<div className="mission-catchup"><p className="tiny">MISIONES ANTERIORES DE ESTA SEMANA</p><div className="cards">{pendingTasks.map(task=><Task key={task.key} task={task} done={mineDone(task.key)} other={partnerDone(task.key)} partner={partner} busy={busy} rating={ratingFor(task)} onRate={value=>rateActivity(task,value)} onToggle={()=>mark(task.key)}/>)}</div></div>}
 <div className="section-title"><h2>La misión semanal</h2><Pill gold>+120 ❤️</Pill></div>
 {weeklyTasks.map(task=><Task key={task.key} task={task} done={mineDone(task.key)} other={partnerDone(task.key)} partner={partner} busy={busy} rating={ratingFor(task)} onRate={value=>rateActivity(task,value)} onToggle={()=>mark(task.key)}/>)}
 {!weeklyTasks.length&&<div className="mission-rest-note">{centralSchedule?.weeklyMode==="solo"&&partner?"Esta semana la misión semanal está a cargo de tu pareja. Ya tendrás tu turno.":"La misión semanal se está preparando."}</div>}
 <div className="section-title"><h2>Una pregunta que acerca</h2></div><div className="glass box"><p style={{fontSize:18,marginBottom:17}}>{QUESTION_BANK.romance[new Date().getDate()%QUESTION_BANK.romance.length]}</p><Button secondary onClick={()=>{setQuestionTopic("romance");setTab("preguntas")}}>Preguntársela a mi pareja</Button></div><div className="section-title"><h2>Hoy tu cómplice quiere conocerte</h2></div><div className="glass box stack"><span className="tiny">UNA PREGUNTA PERSONAL</span><h3>{dailyAbout[1]}</h3><p className="subtle">Solo vos podés ver tu respuesta. Podés decidir si tu IA la utiliza en las sugerencias.</p><Button secondary onClick={()=>{pickAbout(dailyAbout[0]);setTab("complice");window.scrollTo({top:0,behavior:"smooth"})}}>Responder en mi espacio privado →</Button></div></>}

 {tab==="misiones"&&<>
  <div className="section-title"><div><span className="tiny">MISIONES QUE CONSTRUYEN ALGO REAL</span><h2>Nuestras misiones ♡</h2></div><Pill gold>{totalHearts} corazones</Pill></div>
  <p className="subtle">Cada integrante recibe tres misiones diferentes durante la semana. Se alternan los días y el domingo no hay misión diaria. La misión semanal puede ser tuya, de tu pareja o para hacer juntos.</p>
  {centralSchedule&&<div className="mission-week-overview"><span className="tiny">TUS TRES DÍAS ESTA SEMANA</span><div className="mission-days">{dayLabels.map((label,i)=><span className="mission-day" key={i}>♡ {label}</span>)}</div><p className="subtle">{centralSchedule.weeklyMode==="juntos"?"Esta semana la misión semanal es para los dos.":centralSchedule.weeklyAssigned?"Esta semana la misión semanal está a tu cargo.":"Esta semana tu pareja tiene la misión semanal."}</p></div>}
  <div className="mission-filter" role="group" aria-label="Filtrar misiones">
   <button type="button" className={missionFilter==="diarias"?"active":""} onClick={()=>setMissionFilter("diarias")}>Misiones diarias · 3</button>
   <button type="button" className={missionFilter==="semanales"?"active":""} onClick={()=>setMissionFilter("semanales")}>Misión semanal · 1</button>
  </div>
  {missionFilter==="diarias"&&<><div className="cards">{dailyTasks.map(task=><Task key={task.key} task={task} done={mineDone(task.key)} other={partnerDone(task.key)} partner={partner} busy={busy} rating={ratingFor(task)} onRate={value=>rateActivity(task,value)} onToggle={()=>mark(task.key)}/>)}</div>{dailyTasks.length===0&&<div className="mission-rest-note">♡ Todavía no llegó tu primer turno de misión esta semana.</div>}{futureTasks.length>0&&<div className="mission-rest-note">Hay {futureTasks.length} {futureTasks.length===1?"misión":"misiones"} preparada{futureTasks.length===1?"":"s"} para tus próximos días asignados. Las descubrirás cuando llegue el momento.</div>}</>}
  {missionFilter==="semanales"&&<><div className="cards">{weeklyTasks.map(task=><Task key={task.key} task={task} done={mineDone(task.key)} other={partnerDone(task.key)} partner={partner} busy={busy} rating={ratingFor(task)} onRate={value=>rateActivity(task,value)} onToggle={()=>mark(task.key)}/>)}</div>{weeklyTasks.length===0&&<div className="mission-rest-note">{centralSchedule?.weeklyMode==="solo"&&partner?"Esta semana la misión semanal está a cargo de tu pareja.":"La misión semanal se está preparando."}</div>}</>}
  <div className="faq-soft" style={{marginTop:19}}><h3>♡ Con significado, sin obligación</h3><p>Las misiones no son una competencia ni una prueba de amor. Podés realizarlas otro día o pasarlas; los corazones ya ganados nunca se pierden.</p></div>
 </>}
 {tab==="juegos"&&<><div className="section-title"><div><span className="tiny">UN RATO JUNTOS PUEDE CAMBIAR EL DÍA</span><h2>Juguemos ♡</h2></div><Pill>Conocerse jugando</Pill></div><p className="subtle" style={{marginBottom:20}}>Preguntas, elecciones secretas y pequeñas aventuras para descubrirse más.</p>{byCentralSlot.game_1&&<div className="glass box stack" style={{marginBottom:16}}><span className="tiny">EL JUEGO QUE TU CÓMPLICE ELIGIÓ PARA HOY</span><h2>💞 {byCentralSlot.game_1.title}</h2><p className="muted">{byCentralSlot.game_1.body}</p><p className="subtle">Esta pregunta fue elegida a partir de tus gustos; el texto no revela tus respuestas privadas.</p><Button disabled={busy||!partner} onClick={()=>sendMessage("pregunta",byCentralSlot.game_1.body,"romance")}>Enviar este juego a mi pareja</Button></div>}<div className="grid2">{games.map(game=>{const key="g:"+date+":"+game.slug,own=gameAnswers[key],result=gameResults[key];return <div className="glass box stack" key={game.slug}><span className="tiny">JUEGO COOPERATIVO</span><h2>{game.title}</h2><p className="muted">{game.intro}</p><div className="choice-grid">{game.options.map(([val,label])=><button className={"choice"+(own===val?" selected":"")} key={val} disabled={busy||!partner} onClick={()=>playGame(key,val)}>{label}</button>)}</div>{own&&<div className="note">Tu elección quedó guardada en privado. La otra persona no la verá hasta que ambos jueguen.</div>}{result?.ready?<div className="accent-card"><span className="tiny">¡LOS DOS JUGARON!</span><h3 style={{margin:"12px 0"}}>Descubran sus respuestas 💞</h3>{result.answers?.map((a,i)=><p key={i} style={{marginTop:5}}><strong>{a.user_id===user.id?member.display_name:partner?.display_name||"Tu pareja"}:</strong> {game.options.find(o=>o[0]===a.answer)?.[1]||"Respuesta"}</p>)}</div>:result?<p className="subtle">Aún falta la respuesta de tu pareja.</p>:null}<Button small secondary onClick={()=>revealGame(key)} disabled={!partner}>Ver si ya respondió mi pareja</Button></div>})}</div><div className="section-title"><h2>¿Cuánto nos conocemos?</h2></div><div className="glass box stack"><p className="muted">Respondan preguntas sobre gustos y recuerdos. Pueden descubrir las respuestas en la sección Preguntas, y charlar sobre lo que cada uno eligió.</p><Button secondary onClick={()=>{setTab("preguntas");setQuestionTopic("romance")}}>Empezar una ronda de preguntas →</Button></div></>}

 {tab==="preguntas"&&<>
  <div className="section-title"><div><span className="tiny">CONVERSACIONES QUE NOS ACERCAN</span><h2>Preguntame algo ♡</h2></div><Pill>+20 ♥ al responder</Pill></div>
  <p className="subtle" style={{marginBottom:17}}>Descúbranse, rían y anímense a conversar de cosas diferentes.</p>
  <div className="topic-chips" role="group" aria-label="Categoría de la pregunta">
   {TOPICS.map(([v,title])=><button type="button" className={"choice"+(questionTopic===v?" selected":"")} key={v} onClick={()=>setQuestionTopic(v)}>{title}</button>)}
  </div>
  <div className="question-spotlight" style={{margin:"19px 0"}}>
   <h2>{(QUESTION_BANK[questionTopic]||QUESTION_BANK.romance)[new Date().getDate()%(QUESTION_BANK[questionTopic]||QUESTION_BANK.romance).length]}</h2>
   <p>Una buena conversación puede empezar por algo pequeño.</p>
  </div>
  {questionTopic==="picante"&&<p className="note" style={{margin:"10px 0"}}>Esta categoría solo está disponible para dos personas adultas que eligieron habilitarla.</p>}
  <div className="stack" style={{marginBottom:23}}>
   <Button full disabled={busy||!partner} onClick={()=>sendMessage("pregunta",(QUESTION_BANK[questionTopic]||QUESTION_BANK.romance)[new Date().getDate()%(QUESTION_BANK[questionTopic]||QUESTION_BANK.romance).length],questionTopic)}>♡ Enviar esta pregunta a mi pareja</Button>
   <div className="glass box stack">
    <h3>¿Querés preguntar algo diferente?</h3>
    <div className="form-field" style={{margin:0}}><label htmlFor="custom-question">Escribí tu propia pregunta</label><textarea id="custom-question" maxLength={1000} className="textarea" value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="¿Qué te gustaría preguntarle?"/></div>
    <Button secondary disabled={busy||!partner||!messageText.trim()} onClick={()=>sendMessage("pregunta",messageText,questionTopic)}>Enviar pregunta personalizada 💌</Button>
   </div>
  </div>
  <div className="section-title"><h2>Preguntas entre ustedes</h2></div><div className="question-list">{messages.filter(m=>m.kind==="pregunta").slice().reverse().map(q=>{const mine=q.sender_id===user.id;const response=messages.find(m=>m.reply_to===q.id);return <div key={q.id} className="glass box"><div className="row between"><Pill>{TOPICS.find(t=>t[0]===q.topic)?.[1]||"Pregunta"}</Pill><span className="subtle">{humanTime(q.created_at)}</span></div><h3 style={{margin:"15px 0"}}>{q.body}</h3><p className="subtle">{mine?"La enviaste vos":"Te la envió "+(partner?.display_name||"tu pareja")}</p>{response?<p className="note" style={{marginTop:12}}>Respuesta: {response.body}</p>:mine?<p className="subtle" style={{marginTop:12}}>Esperando su respuesta ❤️</p>:replyTo===q.id?<div className="stack" style={{marginTop:13}}><textarea className="textarea" maxLength={1000} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Tu respuesta…"/><Button disabled={busy||!replyText.trim()} onClick={()=>respond(q)}>Enviar respuesta +20 ❤️</Button></div>:<div style={{marginTop:14}}><Button small onClick={()=>setReplyTo(q.id)}>Responder</Button></div>}</div>})}{!messages.some(m=>m.kind==="pregunta")&&<div className="empty">Todavía no se enviaron preguntas. ¡Empezá vos!</div>}</div></>}
 {tab==="mensajes"&&<><div className="section-title"><div><span className="tiny">UN LUGAR PARA ESCRIBIRSE BONITO</span><h2>Nuestro chat 💌</h2></div><Pill>Solo para ustedes</Pill></div><div className="glass box chat-panel"><div className="chat-stream">{messages.filter(m=>m.kind==="mensaje").map(m=><div key={m.id} className={"message"+(m.sender_id===user.id?" mine":"")}><div className="meta">{m.sender_id===user.id?"Vos":partner?.display_name||"Tu pareja"} · {humanTime(m.created_at)}</div><p>{m.body}</p></div>)}{!messages.some(m=>m.kind==="mensaje")&&<div className="empty">Un espacio solo para ustedes. Empezá con un mensaje lindo.</div>}</div><div className="row" style={{marginTop:16}}><input className="input" maxLength={1000} value={messageText} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();sendMessage("mensaje",messageText)}}} onChange={e=>setMessageText(e.target.value)} placeholder="Escribile algo…"/><Button disabled={busy||!partner||!messageText.trim()} onClick={()=>sendMessage("mensaje",messageText)}>Enviar</Button></div></div><p className="subtle" style={{marginTop:13}}>Los mensajes quedan guardados en la base privada de su espacio. Por ahora no existe cifrado de extremo a extremo.</p></>}

 {tab==="complice"&&<>
  <div className="ai-heading"><div><span className="tiny">PERSONALIZACIÓN AUTOMÁTICA · SIN CHATEAR CON LA IA</span><h2>El corazón de Cómplices ♡</h2><p className="ai-top-sub">Tu IA aprende de los gustos que elegís compartir, de las misiones que hacés y de las propuestas que valorás. Después prepara ideas nuevas para ustedes.</p></div><div className="ai-mascot" aria-hidden="true">💗</div></div>
  <div className="central-intro-grid">
   <div className="glass box stack"><span className="tiny">TU PERFIL PERSONAL</span><h3>Ya tengo {profileCompletion.answered} de {profileCompletion.total} respuestas</h3><div className="progress-track" role="progressbar" aria-valuenow={profileCompletion.answered} aria-valuemin={0} aria-valuemax={profileCompletion.total} aria-label="Progreso de gustos"><div className="progress-bar" style={{width:Math.round(100*profileCompletion.answered/profileCompletion.total)+"%"}}/></div><p className="subtle">Es tu perfil privado. Podés corregir o borrar tus gustos cuando quieras.</p></div>
   <div className="glass box stack"><span className="tiny">SUGERENCIAS PREPARADAS SOLAS</span><h3>{centralLoading?"Preparando tus propuestas…":centralMode==="generativa"?"OpenAI está creando propuestas":"Actividades seleccionadas para vos"}</h3><p className="subtle">{partner?partnerInsightCount>0?"El sistema puede considerar las pistas que tu pareja autorizó, sin mostrar sus respuestas.":"Todavía no hay pistas autorizadas de tu pareja; las ideas no presumen conocer sus gustos.":"Aún falta que se una tu pareja. Mientras tanto, tu IA puede conocer tus gustos personales."}</p><Button small secondary disabled={centralLoading} onClick={refreshCentral}>Actualizar recomendaciones</Button></div>
  </div>
  <div className="accent-card central-recommendation"><span className="tiny">UNA IDEA SELECCIONADA PARA HOY</span><h2 style={{margin:"12px 0"}}>{focusMission?.title||"Las mejores ideas no se apuran"}</h2><p className="subtle">{focusMission?.body||"Hoy no te toca una misión nueva. Las que preparó tu cómplice aparecerán en sus días asignados."}</p><Button onClick={()=>{setTab("misiones");window.scrollTo({top:0,behavior:"smooth"})}}>Ver mis desafíos ♡</Button></div>
  <div className="section-title"><div><span className="tiny">VOS CONTROLÁS LO QUE LA IA APRENDE</span><h2>Tu mapa de cariño</h2></div><Pill>{profileCompletion.answered}/{profileCompletion.total}</Pill></div>
  <div className="glass box stack central-consent">
   <h3>Un perfil tuyo, no de tu pareja</h3>
   <p className="subtle">Tus elecciones son personales. La IA usa tus respuestas para preparar tus actividades. Para recomendarle sorpresas al otro, solo utiliza las pistas que vos autorizás de forma específica.</p>
   {pref&&<><label className="toggle"><input type="checkbox" checked={pref.allow_surprises} onChange={e=>setPref({...pref,allow_surprises:e.target.checked})}/> Habilitar que mi pareja reciba propuestas basadas únicamente en las pistas que autoricé abajo</label><Button small secondary disabled={busy} onClick={savePref}>Guardar permiso general</Button></>}
   <p className="subtle">Desactivado de forma predeterminada. No se comparten respuestas escritas, recuerdos ni confesiones privadas. Podés revocar permisos cuando quieras.</p>
  </div>
  <div className="section-title"><div><span className="tiny">CUANTO MÁS NOS CONOCEMOS, MEJORES IDEAS NACEN</span><h2>Tu mapa de cariño ♡</h2></div><Pill>{profileCompletion.answered}/{profileCompletion.total}</Pill></div>
<div className="glass box stack profile-questions">
 <p className="subtle">Contale a tu cómplice qué te gusta de verdad. Son preguntas breves que podés cambiar o eliminar. Solo una pista que autorices podrá inspirar sugerencias para la otra persona.</p>
 <div className="progress-track" role="progressbar" aria-valuenow={profileCompletion.answered} aria-valuemin={0} aria-valuemax={profileCompletion.total} aria-label="Preguntas de gustos respondidas"><div className="progress-bar" style={{width:Math.round(100*profileCompletion.answered/profileCompletion.total)+"%"}}/></div>
 <label htmlFor="profileQuestionSelect">Elegí algo que tu cómplice debería conocer</label>
 <select className="select" id="profileQuestionSelect" value={profileQuestion} onChange={e=>selectProfileQuestion(e.target.value)}>{PROFILE_QUESTIONS.map(q=><option value={q.key} key={q.key}>{q.emoji} {q.question}{profileCards.some(a=>a.question_key===q.key)?" ✓":""}</option>)}</select>
 <div className="profile-question-spotlight"><span className="profile-question-emoji" aria-hidden="true">{currentProfileQuestion.emoji}</span><h3>{currentProfileQuestion.question}</h3><p className="subtle">Elegí la opción que más se parece a vos.</p></div>
 <div className="profile-answer-grid" role="group" aria-label={currentProfileQuestion.question}>{currentProfileQuestion.options.map(([value,label])=><button type="button" key={value} aria-pressed={profileAnswer===value} className={"choice"+(profileAnswer===value?" selected":"")} disabled={busy} onClick={()=>setProfileAnswer(value)}>{label}</button>)}</div>
 <label className="toggle profile-share-permission"><input type="checkbox" checked={profileShare} onChange={e=>setProfileShare(e.target.checked)}/> Permito que la IA de mi pareja utilice <strong>esta elección</strong> para preparar sorpresas y desafíos.</label>
 {profileShare&&<p className="note">La IA del otro recibirá solamente esta preferencia estructurada. No recibirá tus notas privadas, preguntas personales ni confesiones. Podés revocar esta autorización.</p>}
 {profileShare&&!pref?.allow_surprises&&<p className="subtle">Para activar la pista, también tenés que habilitar «Permitir sorpresas» en la sección de preferencias de arriba. Podés dejar esta elección preparada para más adelante.</p>}
 <Button full disabled={busy||!profileAnswer} onClick={saveStructuredProfile}>Guardar preferencia y seguir <span aria-hidden="true">♡</span></Button>
 {profileCards.length>0&&<div className="profile-saved-answers"><p className="tiny">ASÍ ME VAS CONOCIENDO</p>{PROFILE_QUESTIONS.filter(q=>profileCards.some(a=>a.question_key===q.key)).map(q=>{
  const entry=profileCards.find(a=>a.question_key===q.key);
  return <div className="profile-saved-item" key={q.key}><span className="profile-question-emoji" aria-hidden="true">{q.emoji}</span><div className="grow"><strong>{q.options.find(o=>o[0]===entry.answer_code)?.[1]||"Respuesta"}</strong><p className="subtle">{entry.share_with_partner_ai?"Pista autorizada para la IA de tu pareja":"Solo para tu perfil privado"}</p></div><button className="link-button" type="button" onClick={()=>selectProfileQuestion(q.key)}>Editar</button><button className="link-button" type="button" disabled={busy} onClick={()=>removeStructuredProfile(q.key)}>Eliminar</button></div>
 })}</div>}
</div>
  <details className="central-advanced"><summary>Quiero agregar más gustos o recuerdos (opcional)</summary><div className="central-advanced-body"><div className="section-title"><h2>Conoceme mejor ✨</h2><Pill>{reflections.filter(x=>ABOUT_QUESTIONS.some(q=>q[0]===x.question_id)).length}/{ABOUT_QUESTIONS.length}</Pill></div><div className="glass box stack"><p className="subtle">Si querés, podés dejar información adicional para afinar futuras propuestas. Tus respuestas son privadas: <strong>nunca se muestran directamente a tu pareja</strong>. Vos decidís si la IA puede usarlas para tus recomendaciones personales.</p><SelectField label="Elegí una pregunta personal" value={aboutQuestion} onChange={pickAbout} options={weeklyPromptReady?[[weeklyPrompt.id,"✨ Pregunta especial de esta semana"],...ABOUT_QUESTIONS]:ABOUT_QUESTIONS}/><div className="subtle">{aboutQuestion===weeklyPrompt.id?weeklyPrompt.question:"Una buena respuesta puede contar cómo, cuándo y por qué, no solo qué te gusta."}</div><textarea className="textarea" maxLength={1200} value={aboutAnswer} onChange={e=>setAboutAnswer(e.target.value)} placeholder="Respondé con tus palabras…"/><label className="toggle"><input type="checkbox" checked={aboutAllowAI} onChange={e=>{setAboutAllowAI(e.target.checked);if(!e.target.checked)setAboutShare(false)}}/> Mi IA puede usar esta respuesta para darme ideas personales</label>
<label className="toggle"><input type="checkbox" disabled={!aboutAllowAI||aboutQuestion==="q07"||aboutQuestion.startsWith("pulse:")} checked={aboutShare} onChange={e=>setAboutShare(e.target.checked)}/> También quiero que mi pareja reciba sugerencias basadas SOLO en un tema que yo elija</label>
{aboutShare&&<SelectField label="¿Qué tema le puede inspirar a tu pareja?" value={aboutShareTheme} onChange={setAboutShareTheme} options={SHARE_THEMES}/>}
<p className="subtle">Tu respuesta escrita nunca se comparte. Las pistas están desactivadas de forma predeterminada.</p>
<Button disabled={busy||!aboutAnswer.trim()||(aboutShare&&!aboutShareTheme)} onClick={saveAbout}>Guardar mi respuesta</Button>{reflections.length>0&&<div className="stack">{reflections.map(q=><div className="mini-card" key={q.id}><div className="row between wrap"><strong style={{fontSize:13}}>{q.question}</strong><button className="link-button" onClick={()=>pickAbout(q.question_id)}>Editar</button></div><p>{q.answer}</p><div className="row between wrap" style={{marginTop:10}}><span className="subtle">{q.share_for_surprises?"Pista compartible: "+(SHARE_THEMES.find(t=>t[0]===q.share_theme)?.[1]||"Tema"):q.ai_use_allowed?"Solo para mi IA":"No utilizada por la IA"}</span><button className="link-button" disabled={busy} onClick={()=>deleteAbout(q.id)}>Eliminar</button></div></div>)}</div>}</div><div className="section-title"><h2>Lo que mi cómplice recuerda 🧠</h2><Pill>{memories.filter(x=>x.use_for_ai).length} recuerdos activos</Pill></div><div className="glass box stack"><p className="subtle">Agregá gustos, planes, actividades que disfrutás o cosas que preferís evitar. Solo se guarda lo que vos elijas guardar. El texto no se comparte nunca con tu pareja.</p><SelectField label="¿Qué querés recordar?" value={memoryCategory} onChange={v=>{setMemoryCategory(v);if(v==="evitar")setMemoryShare(false)}} options={[["gustos","Mis gustos"],["planes","Planes que disfruto"],["evitar","Cosas que prefiero evitar"],["prioridades","Mis prioridades"],["otro","Otro recuerdo"]]}/><textarea className="textarea" maxLength={350} value={memoryText} onChange={e=>setMemoryText(e.target.value)} placeholder="Ejemplo: Me encantan las caminatas cortas, pero prefiero planes económicos."/>
<label className="toggle"><input type="checkbox" disabled={memoryCategory==="evitar"} checked={memoryShare} onChange={e=>setMemoryShare(e.target.checked)}/> Permitir que mi cómplice transforme un tema de este recuerdo en ideas para mi pareja</label>
{memoryShare&&<SelectField label="Tema seguro que autorizo compartir" value={memoryShareTheme} onChange={setMemoryShareTheme} options={SHARE_THEMES}/>}
<p className="subtle">Solo se utiliza el tema seleccionado, nunca tus palabras. Podés cambiarlo o desactivarlo cuando quieras.</p>
<div className="row wrap"><Button disabled={busy||!memoryText.trim()||(memoryShare&&!memoryShareTheme)} onClick={saveMemory}>{editingMemory?"Guardar cambios":"Guardar para mi cómplice"}</Button>{editingMemory&&<Button secondary small onClick={()=>{setEditingMemory(null);setMemoryText("");setMemoryShare(false);setMemoryShareTheme("");setMemoryCategory("gustos")}}>Cancelar edición</Button>}</div>{memories.length>0&&<div className="stack">{memories.map(m=><div className="mini-card" key={m.id}><p style={{color:"#5b3b55"}}>{m.body}</p><div className="row between wrap" style={{marginTop:10}}><span className="subtle">{m.category} · {m.share_for_surprises&&m.use_for_ai?"Pista temática habilitada":m.use_for_ai?"Solo para mi IA":"No disponible para mi IA"}</span><div className="row"><button className="link-button" disabled={busy} onClick={()=>editMemory(m)}>Editar</button><button className="link-button" disabled={busy} onClick={()=>toggleMemory(m)}>{m.use_for_ai?"No usar":"Usar"}</button><button className="link-button" disabled={busy} onClick={()=>deleteMemory(m)}>Eliminar</button></div></div></div>)}</div>}</div></div></details>
  <details className="central-advanced"><summary>Notas privadas y configuración adicional</summary><div className="central-advanced-body">
    <div className="glass box stack"><h3>Preferencias complementarias</h3>{pref&&<>
      <SelectField label="Un detalle que disfrutás" value={pref.favorite_treat} onChange={v=>setPref({...pref,favorite_treat:v})} options={TREAT}/>
      <SelectField label="Un plan que te gusta" value={pref.favorite_plan} onChange={v=>setPref({...pref,favorite_plan:v})} options={PLAN}/>
      <SelectField label="Cómo preferís recibir cariño" value={pref.love_language} onChange={v=>setPref({...pref,love_language:v})} options={LANG}/>
      <label className="toggle"><input type="checkbox" checked={pref.adult_mode} onChange={e=>setPref({...pref,adult_mode:e.target.checked})}/> Soy mayor de edad y quiero habilitar preguntas íntimas voluntarias</label>
      <Button secondary disabled={busy} onClick={savePref}>Guardar preferencias complementarias</Button>
     </>}</div>
   <div className="section-title"><h2>Mis notas privadas</h2></div><div className="glass box stack"><p className="subtle">Anotá algo que no querés olvidar. No se comparte automáticamente con tu pareja.</p><textarea className="textarea" maxLength={600} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Una idea, un recuerdo, una preferencia…"/><Button secondary disabled={busy||!noteText.trim()} onClick={saveNote}>Guardar nota privada</Button>{notes.map(n=><div key={n.id} className="mini-card"><p>{n.body}</p><span className="subtle">{humanTime(n.created_at)}</span></div>)}</div>
  </div></details>
  <details className="central-advanced"><summary>Estado técnico de OpenAI</summary><div className="central-advanced-body"><div className="glass box stack"><p className="subtle">La IA genera propuestas automáticamente al entrar a Cómplices y después de actualizar tus gustos. No hace falta escribirle. Las propuestas ya preparadas pueden mantenerse hasta que cambien los datos o llegue un nuevo día.</p><Button secondary small disabled={checkingAI} onClick={checkOpenAI}>{checkingAI?"Comprobando…":"Comprobar conexión OpenAI"}</Button>{aiCheck&&<p className="subtle" role="status">{!aiCheck.configured?"Falta configurar OpenAI":aiCheck.reachable?"Modelo accesible · no equivale a una prueba de generación":aiCheck.reason==="invalid_key"?"Clave incorrecta o sin permiso":aiCheck.reason==="billing"?"Revisar facturación":"No se pudo acceder al modelo: "+(aiCheck.reason||"error")}</p>}</div></div></details>
 </>}
  {tab==="perfil"&&<div className="profile-page">
  <div className="section-title"><div><span className="tiny">UN ESPACIO ÚNICO, DOS PERSONAS</span><h2>Perfil y privacidad</h2></div><button type="button" className="profile-back" onClick={()=>setTab("hoy")}>← Volver</button></div>
  <div className="profile-hero"><div className="profile-icon">♡</div><div><h3>{member.display_name}{partner?" & "+partner.display_name:" · Espacio privado"}</h3><p className="subtle">{partner?"Dos cómplices compartiendo una historia":"Invitá a tu pareja para comenzar juntos"}</p></div></div>
<div className="section-title"><h2>Mis datos y privacidad 🔐</h2></div><div className="glass box stack"><p className="subtle">Tus respuestas, recuerdos y notas personales solo pertenecen a tu cuenta. Podés conservar una copia de tus datos o empezar de nuevo con tu cómplice.</p><div className="row wrap"><Button secondary small disabled={busy} onClick={exportMyData}>↓ Exportar mis datos</Button><button type="button" className="btn ghost small" disabled={busy} onClick={clearMyAiMemory}>Borrar mi memoria de IA</button></div><p className="subtle">El borrado de memoria es irreversible y requiere dos confirmaciones. Conserva tus mensajes entre ambos y los corazones ya ganados. No elimina tu cuenta de Supabase Auth ni afecta TeHiceEsto.</p></div><div className="section-title"><h2>Tu espacio</h2></div><div className="glass box stack"><div className="row between wrap"><div><h3>Notificaciones privadas</h3><p className="subtle">Avisos de mensajes y preguntas, sin mostrar el contenido en la pantalla bloqueada.</p></div><div className="row wrap"><Button secondary small onClick={requestNotifications}>Activar en este celular</Button>{notificationSettings.enabled&&<Button secondary small disabled={busy} onClick={disableNotifications}>Desactivar avisos</Button>}</div></div><div className="row wrap"><label className="grow">Desde qué hora no molestar<input className="input" type="time" value={notificationSettings.quiet_start?.slice(0,5)||"22:00"} onChange={e=>setNotificationSettings(p=>({...p,quiet_start:e.target.value}))}/></label><label className="grow">Hasta qué hora no molestar<input className="input" type="time" value={notificationSettings.quiet_end?.slice(0,5)||"08:00"} onChange={e=>setNotificationSettings(p=>({...p,quiet_end:e.target.value}))}/></label></div><Button secondary small disabled={busy} onClick={()=>saveNotificationSettings()}>Guardar horario de silencio</Button><p className="subtle">Horario de Argentina. Si los dos horarios son iguales, no se aplica un período de silencio. Cada integrante configura sus propios avisos.</p>{!partner&&<div className="stack"><p className="subtle">Invitación privada: {space?.invite_code}</p><Button secondary onClick={shareInvite}>Compartir invitación con mi pareja</Button></div>}<p className="subtle">Piloto sin cobros. Sin mensajes WhatsApp automáticos ni recordatorios diarios con la web cerrada todavía. No compartas información especialmente sensible.</p></div>
  <div className="glass box stack" style={{marginTop:15}}><h3>Mi cuenta</h3><p className="subtle">Tu cuenta es personal. Si cerrás sesión, este celular dejará de recibir tus notificaciones.</p><Button secondary onClick={logout}>Cerrar sesión</Button></div>
 </div>}
 <footer className="page-bottom">Cómplices · Desarrollado sobre recursos de TeHiceEsto · Un espacio privado para dos ♡</footer><nav className="bottom-nav" aria-label="Navegación principal">{NAV.map(([key,emoji,title])=><button type="button" key={key} aria-current={(tab===key||(tab==="preguntas"&&key==="juegos"))?"page":undefined} className={(tab===key||(tab==="preguntas"&&key==="juegos"))?"active":""} onClick={()=>{setTab(key);setNotice("");window.scrollTo({top:0,behavior:"smooth"})}}><b><NavIcon name={key}/></b>{title}</button>)}</nav></main>
}
function Task({task,done,other,partner,busy,onToggle,rating,onRate}){
 return <article className={"task-card"+(done?" done":"")}>
  <div className="task-content">
   <span className="task-icon" aria-hidden="true">{task.icon}</span>
   <div className="task-main"><h3>{task.title}</h3><p>{task.body}</p></div>
   <Pill gold>+{task.points} ♥</Pill>
  </div>
  <div className="task-footer">
   <span className="subtle">{done?"♡ ¡Qué lindo! Ya la marcaste como realizada":partner&&other?"♡ Tu pareja también hizo esta misión":"Un pequeño gesto que suma"}</span>
   <Button secondary={done} disabled={busy} small onClick={onToggle}>{done?"✓ Hecha":"Marcar hecho ✓"}</Button>
  </div>
  {task.id&&<div className="row between wrap feedback-row"><span className="subtle">¿Te gustó esta idea?</span><div className="row">
   <button type="button" disabled={busy} onClick={()=>onRate?.(1)} className={"feedback-btn"+(rating===1?" active":"")} aria-label="Me gustó esta idea">👍</button>
   <button type="button" disabled={busy} onClick={()=>onRate?.(-1)} className={"feedback-btn"+(rating===-1?" active":"")} aria-label="No me gustó esta idea">👎</button>
  </div></div>}
 </article>
}