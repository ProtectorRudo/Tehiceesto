/** CERCA: deterministic, finite-state WhatsApp interaction. No chatbot fallback. */
export const REDIRECT = 'CERCA funciona con misiones, objetivos y seguimiento de crianza. Escribí MENÚ para ver las opciones disponibles.';
export const RISK = 'Si hay peligro inmediato para alguien, llamá al servicio de emergencias de tu zona (911 en Argentina) o acudí a un centro de atención. CERCA no atiende emergencias.';
const clean = v => String(v ?? '').trim().replace(/\s+/g, ' ');
const norm = v => clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const is = (v, choices) => choices.includes(norm(v));
const affirmative = v => is(v,['si','sí','acepto','aceptar','1','consiento']);
const short = (v,n=90) => clean(v).slice(0,n);
const validName = v => /^[\p{L}][\p{L} .'-]{0,49}$/u.test(clean(v));
export function initialState(){return {status:'pending',consentAt:null,adultName:'',children:[],currentChild:0,flow:'consent',deliveryTime:'18:00',timezone:'America/Argentina/Buenos_Aires',mood:null,lastDailyDay:null,lastWeeklyWeek:null,history:[],monthlyGoal:'',lastRedirectDate:null,deleted:false,subscription:'pilot',consentPrompted:false,feedbackLog:[],feedbackPending:null};}
const q=(body,options=[])=>({body,options});
const askConsent=()=>q('Hola, soy CERCA 🌱. Enviamos misiones breves para conectar con tus hijos. No somos un chat de consultas. ¿Aceptás recibir mensajes de CERCA y guardar un perfil familiar mínimo? Podés escribir BAJA cuando quieras.',['ACEPTO','NO']);
function question(state){
 switch(state.flow){
  case 'feedback_child':return q('Elegí el número del hijo o hija cuya misión querés registrar.');
  case 'feedback_mission':return q('¿Cuál misión querés registrar?',['Conectar','Comprender','Sembrar']);
  case 'adult_name':return q('¿Cómo te gustaría que te llamemos?');
  case 'children_count':return q(`¡Un gusto, ${state.adultName}! ¿Cuántos hijos querés registrar? (1 a 6)`,['1','2','3']);
  case 'child_name':return q(`¿Cómo se llama o qué apodo querés usar para tu hijo/a ${state.currentChild+1}?`);
  case 'child_age':return q(`¿Qué edad tiene ${state.children[state.currentChild]?.name}? Podés escribir 0 si es bebé de menos de un año.`);
  case 'child_interests':return q(`¿Qué le gusta hacer a ${state.children[state.currentChild]?.name}? Por ejemplo: inventar historias, dibujar, música, fútbol. Podés poner VARIOS.`);
  case 'child_goal':return q(`¿Qué te gustaría fortalecer con ${state.children[state.currentChild]?.name}? Por ejemplo: confianza para hablar, escuchar sin apuros, autonomía.`);
  case 'monthly_goal':return q('¿Cuál es tu objetivo familiar de crianza para este mes? Por ejemplo: disfrutar ratos sin pantallas.');
  case 'delivery_time':return q('¿A qué hora querés recibir las misiones? (horario de Argentina). Elegí una opción o escribí HH:MM.',['08:00','13:00','18:00']);
  case 'mood':return q('¿Cómo te sentís hoy? La respuesta es opcional.',['Bien','Cansado/a','Difícil']);
  case 'change_time':return q('Decime el nuevo horario de envío en formato HH:MM.',['08:00','13:00','18:00']);
  case 'change_goal':return q('Escribí un objetivo familiar concreto para este mes.');
  case 'feedback':return q('¿Cómo resultó la misión?',['Hecha','No pude','Omitir']);
  case 'delete_confirm':return q('Esto eliminará el perfil familiar, misiones y recuerdos guardados. Escribí ELIMINAR para confirmar o CANCELAR.');
  default:return q(REDIRECT);
 }
}
function menu(){return q('Menú CERCA 🌱. Elegí qué querés hacer:',['MISIONES','OBJETIVO','HORARIO','ÁNIMO','DATOS','BAJA']);}
const emergency = v => /\b(no respira|se esta muriendo|se está muriendo|quiero matar a mi hijo|voy a matar a mi hijo|me quiero matar ahora|se quiere matar ahora|abuso sexual en este momento|en peligro inmediato)\b/i.test(norm(v));
const normalizeTime=t=>{const m=clean(t).match(/^([01]?\d|2[0-3]):([0-5]\d)$/);return m?`${m[1].padStart(2,'0')}:${m[2]}`:null;};
export function processInbound(input,{state:original=initialState(),today='2026-11-16',now=new Date().toISOString()}={}){
 const state=structuredClone(original);const txt=clean(input), n=norm(txt);const messages=[];
 const reply=(body,options)=>messages.push(q(body,options));
 if(emergency(txt)){reply(RISK);return {state,messages};}
 if(is(n,['baja','stop','cancelar suscripcion','cancelar suscripción'])){
  // Already unsubscribed: never send repeated opt-out confirmations.
  if(state.status==='stopped'){state.flow='idle';return {state,messages};}
  state.status='stopped';state.flow='idle';state.consentAt=null;
  reply('Desactivamos los envíos de CERCA. No vas a recibir más misiones. Si querés volver, escribí ALTA.');return {state,messages};
 }
 if(state.status==='stopped' && state.flow!=='delete_confirm'){
  if(n==='alta'){
   // Replace the complete old profile, including auxiliary onboarding keys.
   const fresh=initialState();fresh.consentPrompted=true;
   const prompt=askConsent();
   return {state:fresh,messages:[prompt]};
  }
  if(n==='borrar'){state.flow='delete_confirm';reply(question(state).body);}
  // Ignore all other messages rather than re-engaging unsubscribed adults.
  return {state,messages};
 }
 if(state.flow==='consent'||state.status==='pending'){
  if(affirmative(n)&&state.consentPrompted){state.consentAt=now;state.status='onboarding';state.flow='adult_name';reply(question(state).body);}
  else if(n==='no'){state.status='stopped';state.flow='idle';reply('Entendido. No te enviaremos mensajes.');}
  else {state.consentPrompted=true;const v=askConsent();reply(v.body,v.options);}
  return {state,messages};
 }
 if(state.flow==='delete_confirm'){
  if(n==='eliminar'){
   const replacement=initialState();replacement.status='stopped';replacement.flow='idle';replacement.deleted=true;replacement.consentAt=null;
   reply('El perfil y los recuerdos se eliminaron. Los envíos quedaron desactivados.');return {state:replacement,messages,erase:true};
  } state.flow='idle';reply('Operación cancelada.');reply(menu().body,menu().options);return {state,messages};
 }
 // Explicit commands are allowed at any time; no free-form conversations.
 if(is(n,['menu','menú','opciones'])){
  if(state.status==='onboarding'){reply('Para completar el registro, continuemos con esta pregunta:');const current=question(state);reply(current.body,current.options);}
  else {state.flow='idle';state.feedbackPending=null;const m=menu();reply(m.body,m.options);}
  return {state,messages};
 }
 if(state.status==='active' && state.flow==='idle'){
  if(n==='misiones'){const todaySet=(state.history||[]).find(h=>h.day===today);reply(todaySet?formatMissions(todaySet):'Todavía no están generadas las misiones de hoy. Llegarán en tu horario elegido.');return {state,messages};}
  if(n==='objetivo'){state.flow='change_goal';const m=question(state);reply(m.body,m.options);return {state,messages};}
  if(n==='horario'){state.flow='change_time';const m=question(state);reply(m.body,m.options);return {state,messages};}
  if(is(n,['animo','ánimo'])){state.flow='mood';const m=question(state);reply(m.body,m.options);return {state,messages};}
  if(is(n,['datos','mi perfil'])){reply(`Tu perfil: ${state.adultName}. Hijos: ${state.children.map(c=>`${c.name} (${c.age})`).join(', ')}. Objetivo del mes: ${state.monthlyGoal}. Horario: ${state.deliveryTime}. Para borrar todos tus datos, escribí BORRAR.`);return {state,messages};}
  if(n==='borrar'){state.flow='delete_confirm';reply(question(state).body);return {state,messages};}
  if(is(n,['hecha','no pude','omitir'])){
   if(!(state.history||[]).some(h=>h.day===today)){reply('Todavía no generamos las misiones de hoy. Podés volver a intentarlo más tarde.');return {state,messages};}
   state.feedbackPending={answer:n,day:today,childIndex:null};
   if(state.children.length===1){state.feedbackPending.childIndex=0;state.flow='feedback_mission';reply('¿Qué misión de '+state.children[0].name+' querés registrar?',['Conectar','Comprender','Sembrar']);}
   else {state.flow='feedback_child';reply('¿De quién es la misión? Elegí un número: '+state.children.map((c,i)=>`${i+1}: ${c.name}`).join(', '),state.children.map((_,i)=>String(i+1)));}
   return {state,messages};
  }
  if(state.lastRedirectDate!==today){state.lastRedirectDate=today;reply(REDIRECT);}return {state,messages};
 }
 switch(state.flow){
  case 'feedback_child':{
   const index=Number(n)-1;
   if(!Number.isInteger(index)||index<0||index>=state.children.length){reply('Elegí uno de los números mostrados, o escribí MENÚ para salir.');break;}
   state.feedbackPending.childIndex=index;state.flow='feedback_mission';reply(`¿Qué misión de ${state.children[index].name} querés registrar?`,['Conectar','Comprender','Sembrar']);break;
  }
  case 'feedback_mission':{
   if(!['conectar','comprender','sembrar'].includes(n)){reply('Elegí Conectar, Comprender o Sembrar; o escribí MENÚ para salir.',['Conectar','Comprender','Sembrar']);break;}
   const f=state.feedbackPending;const entry={day:f.day,childIndex:f.childIndex,kind:n,answer:f.answer,recordedAt:now};
   state.feedbackLog=(state.feedbackLog||[]).filter(x=>!(x.day===entry.day&&x.childIndex===entry.childIndex&&x.kind===entry.kind));
   state.feedbackLog.push(entry);state.feedbackLog=state.feedbackLog.slice(-90);
   state.feedbackPending=null;state.flow='idle';reply('Registramos tu experiencia. Gracias por compartirla, sin exigencias ni premios.');break;
  }
  case 'adult_name':
   if(!validName(txt)){reply('Por favor, escribí un nombre o apodo breve.');break;}
   state.adultName=short(txt,50);state.flow='children_count';reply(question(state).body,question(state).options);break;
  case 'children_count':{
   const count=Number(txt);if(!Number.isInteger(count)||count<1||count>6){reply('El piloto permite registrar de 1 a 6 hijos. Escribí un número.');break;}
   state.expectedChildren=count;state.currentChild=0;state.children=[];state.flow='child_name';reply(question(state).body);break;
  }
  case 'child_name':
   if(!validName(txt)){reply('Usá un nombre o apodo de hasta 50 caracteres.');break;}
   state.children.push({name:short(txt,50),age:null,interests:[],goal:''});state.flow='child_age';reply(question(state).body);break;
  case 'child_age':{
   const age=Number(txt);if(!Number.isInteger(age)||age<0||age>17){reply('Necesito una edad en años de 0 a 17.');break;}
   state.children[state.currentChild].age=age;state.flow='child_interests';reply(question(state).body);break;
  }
  case 'child_interests':
   if(txt.length<3||txt.length>180){reply('Contame algunos intereses en una frase corta (3 a 180 caracteres).');break;}
   state.children[state.currentChild].interests=txt.split(/[,;]+/).map(x=>short(x,50)).filter(Boolean).slice(0,5);
   state.flow='child_goal';reply(question(state).body);break;
  case 'child_goal':
   if(txt.length<8||txt.length>220){reply('Escribí un objetivo breve y concreto (8 a 220 caracteres).');break;}
   state.children[state.currentChild].goal=short(txt,220);
   state.currentChild++;
   if(state.currentChild<state.expectedChildren){state.flow='child_name';}else{state.flow='monthly_goal';}
   reply(question(state).body);break;
  case 'monthly_goal':
  case 'change_goal':
   if(txt.length<8||txt.length>220){reply('Necesito un objetivo breve y concreto (8 a 220 caracteres).');break;}
   state.monthlyGoal=short(txt,220);
   if(state.flow==='monthly_goal'){state.flow='delivery_time';reply(question(state).body,question(state).options);}
   else{state.flow='idle';reply('Objetivo mensual actualizado.');}
   break;
  case 'delivery_time':
  case 'change_time':{
   const time=normalizeTime(txt);if(!time){reply('Escribí un horario válido, por ejemplo 18:00.');break;}
   state.deliveryTime=time;
   if(state.flow==='delivery_time'){state.flow='idle';state.status='active';reply(`¡Ya está, ${state.adultName}! 🌱 Registramos ${state.children.length} perfil(es) y el horario ${time}. Vas a recibir tres misiones por hijo al día y una misión familiar semanal. Escribí MISIONES para consultar las disponibles.`);}
   else{state.flow='idle';reply(`Nuevo horario guardado: ${time}.`);}
   break;
  }
  case 'mood':{
   const mood={'bien':'bien','cansado/a':'cansado','dificil':'dificil','difícil':'dificil'}[n];
   if(!mood){reply('Elegí Bien, Cansado/a o Difícil.');break;}
   state.mood={value:mood,day:today};state.flow='idle';reply('Gracias. Vamos a adaptar el ritmo de las próximas misiones sin exigirte más.');break;
  }
  default:
   state.flow='idle';if(state.lastRedirectDate!==today){reply(REDIRECT);state.lastRedirectDate=today;}
 }
 return {state,messages};
}
export function formatMissions(batch){
 const lines=[`🌱 CERCA — ${batch.day}`];
 for(const kid of batch.children){lines.push(`\n*${kid.name}*`);for(const m of kid.missions)lines.push(`• ${m.kind.toUpperCase()}: ${m.title}. ${m.how}`);}
 if(batch.weekly)lines.push(`\n🏡 *Familia*: ${batch.weekly.title}. ${batch.weekly.how}`);
 lines.push('\nRespondé HECHA, NO PUDE o MENÚ para continuar.');return lines.join('\n');
}