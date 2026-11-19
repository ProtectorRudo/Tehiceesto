/** HUELLA: deterministic, finite-state WhatsApp interaction. No chatbot fallback. */
export const REDIRECT = 'HUELLA funciona con misiones, objetivos y seguimiento de crianza. Escribí MENÚ para ver las opciones disponibles.';
export const RISK = 'Si hay peligro inmediato para alguien, llamá al servicio de emergencias de tu zona (911 en Argentina) o acudí a un centro de atención. HUELLA no atiende emergencias.';
const clean = v => String(v ?? '').trim().replace(/\s+/g, ' ');
const norm = v => clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const is = (v, choices) => choices.includes(norm(v));
const affirmative = v => is(v,['si','sí','acepto','aceptar','1','consiento']);
const short = (v,n=90) => clean(v).slice(0,n);
const validName = v => /^[\p{L}][\p{L} .'-]{0,49}$/u.test(clean(v));
export function initialState(){return {status:'pending',consentAt:null,adultName:'',children:[],currentChild:0,flow:'consent',deliveryTime:'18:00',timezone:'America/Argentina/Buenos_Aires',mood:null,lastDailyDay:null,lastWeeklyWeek:null,history:[],monthlyGoal:'',lastRedirectDate:null,deleted:false,subscription:'pilot',consentPrompted:false,feedbackLog:[],feedbackPending:null,huellaWeekV2:null,huellaPilotStartDay:null,weeklyReflections:[],babyAgePendingIndex:null};}
const q=(body,options=[])=>({body,options});
const askConsent=()=>q('Hola, soy HUELLA 🌱. Enviamos misiones breves para conectar con tus hijos. No somos un chat de consultas. ¿Aceptás recibir mensajes de HUELLA y guardar un perfil familiar mínimo? Podés escribir BAJA cuando quieras.',['ACEPTO','NO']);
function question(state){
 switch(state.flow){
  case 'feedback_child':return q('Elegí el número del hijo o hija cuya misión querés registrar.');
  case 'feedback_mission':return q('¿Cuál misión querés registrar?',['Conectar','Comprender','Sembrar']);
  case 'adult_name':return q('¿Cómo te gustaría que te llamemos?');
  case 'children_count':return q(`¡Un gusto, ${state.adultName}! ¿Cuántos hijos querés registrar? (1 a 6)`,['1','2','3']);
  case 'child_name':return q(`¿Cómo se llama o qué apodo querés usar para tu hijo/a ${state.currentChild+1}?`);
  case 'child_age':return q(`¿Qué edad tiene ${state.children[state.currentChild]?.name}? Podés escribir 0 si es bebé de menos de un año. HUELLA acompaña edades de 0 a 15 años.`);
  case 'child_age_months':return q(`Para personalizar las experiencias de ${state.children[state.currentChild]?.name}, ¿cuántos meses tiene aproximadamente? Un número entre ${state.children[state.currentChild]?.age===0?0:12} y ${state.children[state.currentChild]?.age===0?11:23}. No necesitamos la fecha de nacimiento. Podés escribir OMITIR.`);
  case 'baby_age_choose':return q('¿De qué bebé querés actualizar la edad? Elegí el número indicado.');
  case 'change_baby_months':return q(`¿Cuántos meses tiene aproximadamente ${state.children[state.babyAgePendingIndex]?.name}? Escribí un número de 0 a 23. No necesitamos la fecha de nacimiento, o podés escribir CANCELAR.`);
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
function menu(state){const options=['MISIONES','OBJETIVO','HORARIO','ÁNIMO','DATOS'];
 if(state?.children?.some(c=>Number(c.age)<2))options.push('EDAD BEBÉ');
 options.push('BAJA');
 return q('Menú HUELLA 🌱. Elegí qué querés hacer:',options);
}
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
  reply('Desactivamos los envíos de HUELLA. No vas a recibir más misiones. Si querés volver, escribí ALTA.');return {state,messages};
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
  } state.flow='idle';reply('Operación cancelada.');reply(menu(state).body,menu(state).options);return {state,messages};
 }
 // Explicit commands are allowed at any time; no free-form conversations.
 if(is(n,['menu','menú','opciones'])){
  if(state.status==='onboarding'){reply('Para completar el registro, continuemos con esta pregunta:');const current=question(state);reply(current.body,current.options);}
  else {state.flow='idle';state.feedbackPending=null;state.babyAgePendingIndex=null;const m=menu(state);reply(m.body,m.options);}
  return {state,messages};
 }
 if(state.status==='active' && state.flow==='idle'){
  if(n==='misiones'){
   const todaySet=(state.history||[]).find(h=>h.day===today);
   if(!todaySet){reply('Todavía no están generadas las misiones de hoy. Llegarán en tu horario elegido.');}
   else {
    // One complete message per child, never a combined oversized text that
    // Evolution would silently truncate at its transport boundary.
    for(const child of todaySet.children||[])reply(formatMissions({day:today,children:[child],weekly:null}));
    if(todaySet.weekly)reply(formatMissions({day:today,children:[],weekly:todaySet.weekly}));
   }
   return {state,messages};
  }
  if(is(n,['edad bebe','meses bebe'])){
   const indices=state.children.map((c,i)=>Number(c.age)<2?i:-1).filter(i=>i>=0);
   if(!indices.length){reply('No hay bebés menores de dos años registrados en el perfil.');return {state,messages};}
   if(indices.length===1){
    state.babyAgePendingIndex=indices[0];state.flow='change_baby_months';
    reply(question(state).body);
   }else{
    state.flow='baby_age_choose';state.babyAgePendingIndex=null;
    reply('Elegí el número del bebé: '+indices.map(i=>`${i+1}: ${state.children[i].name}`).join(', '),indices.map(i=>String(i+1)));
   }
   return {state,messages};
  }
  if(n==='objetivo'){state.flow='change_goal';const m=question(state);reply(m.body,m.options);return {state,messages};}
  if(n==='horario'){state.flow='change_time';const m=question(state);reply(m.body,m.options);return {state,messages};}
  if(is(n,['animo','ánimo'])){state.flow='mood';const m=question(state);reply(m.body,m.options);return {state,messages};}
  if(is(n,['datos','mi perfil'])){reply(`Tu perfil: ${state.adultName}. Hijos: ${state.children.map(c=>`${c.name} (${Number(c.age)<2&&Number.isInteger(c.ageMonths)?c.ageMonths+' meses aprox.':c.age})`).join(', ')}. Objetivo del mes: ${state.monthlyGoal}. Horario: ${state.deliveryTime}. Para borrar todos tus datos, escribí BORRAR.`);return {state,messages};}
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
  case 'baby_age_choose':{
   const idx=Number(n)-1;
   if(!Number.isInteger(idx)||idx<0||idx>=state.children.length||Number(state.children[idx].age)>=2){
    reply('Elegí el número de un bebé registrado, o escribí MENÚ para salir.');break;
   }
   state.babyAgePendingIndex=idx;state.flow='change_baby_months';reply(question(state).body);break;
  }
  case 'change_baby_months':{
   if(is(n,['cancelar','omitir'])){
    state.babyAgePendingIndex=null;state.flow='idle';reply('No modificamos la edad aproximada.');break;
   }
   const months=/^(?:[0-9]|1[0-9]|2[0-3])$/.test(txt)?Number(txt):NaN;
   if(!Number.isInteger(months)){reply('Escribí un número entre 0 y 23 meses, o CANCELAR.');break;}
   const idx=state.babyAgePendingIndex;
   if(!Number.isInteger(idx)||idx<0||idx>=state.children.length||Number(state.children[idx].age)>=2){
    state.babyAgePendingIndex=null;state.flow='idle';reply('No pude identificar el perfil; escribí EDAD BEBÉ para comenzar de nuevo.');break;
   }
   const child=state.children[idx],name=child.name;
   child.ageMonths=months;child.age=Math.floor(months/12);child.ageMonthsUpdatedAt=today;
   state.babyAgePendingIndex=null;state.flow='idle';
   reply(`Edad aproximada actualizada: ${name}, ${months} meses. No guardamos su fecha de nacimiento.`);break;
  }
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
   state.children.push({name:short(txt,50),age:null,ageMonths:null,ageMonthsUpdatedAt:null,interests:[],goal:''});state.flow='child_age';reply(question(state).body);break;
  case 'child_age':{
   const age=Number(txt);if(!Number.isInteger(age)||age<0||age>15){reply('Necesito una edad en años de 0 a 15.');break;}
   state.children[state.currentChild].age=age;state.flow=age<2?'child_age_months':'child_interests';reply(question(state).body);break;
  }
  case 'child_age_months':{
   const child=state.children[state.currentChild];
   if(n==='omitir'){child.ageMonths=null;child.ageMonthsUpdatedAt=null;state.flow='child_interests';reply(question(state).body);break;}
   const months=/^(?:[0-9]|1[0-9]|2[0-3])$/.test(txt)?Number(txt):NaN;
   const min=child.age===0?0:12,max=child.age===0?11:23;
   if(!Number.isInteger(months)||months<min||months>max){
    reply(`Para la edad en años que seleccionaste, escribí un número entre ${min} y ${max} meses, u OMITIR.`);break;
   }
   child.ageMonths=months;child.ageMonthsUpdatedAt=today;
   state.flow='child_interests';reply(question(state).body);break;
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
   if(state.flow==='delivery_time'){state.flow='idle';state.status='active';reply(`¡Ya está, ${state.adultName}! 🌱 Registramos ${state.children.length} perfil(es) y el horario ${time}. Cuando activemos el nuevo calendario del piloto, recibirás tres misiones por hijo por semana y una misión familiar semanal. Mientras tanto, escribí MENÚ para consultar las funciones disponibles.`);}
   else{state.flow='idle';reply(`Nuevo horario guardado: ${time}.`);}
   break;
  }
  case 'weekly_reflection':{
   if(n==='omitir'){state.flow='idle';reply('Está bien. No necesitás responder todas las semanas. Gracias por estar presente.');break;}
   if(txt.length<12||txt.length>320){reply('Si querés, contame en una frase de 12 a 320 caracteres qué descubriste. O escribí OMITIR.');break;}
   state.weeklyReflections=[...(state.weeklyReflections||[]),{weekKey:state.huellaWeekV2?.key||today,text:short(txt,320),answeredAt:now}].slice(-8);
   state.flow='idle';reply('Gracias por compartirlo. Lo tendré en cuenta para elegir las próximas experiencias, sin sacar conclusiones que no nos contaste.');break;
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
 const lines=[`🌱 HUELLA — ${batch.day}`];
 const missionDetails=m=>typeof m.how==='string'?m.how:[
   m.intro?'*De qué se trata:* '+m.intro:null,
   m.setup?'*Preparación:* '+m.setup:null,
   m.opening?'*Qué decir para empezar:* '+m.opening:null,
   Array.isArray(m.steps)?'*Cómo hacerlo:*\n'+m.steps.map((step,i)=>(i+1)+'. '+step).join('\n'):null,
   m.example?'*Ejemplo de cómo jugar:* '+m.example:null,
   m.why?'*Qué buscamos con esta experiencia:* '+m.why:null,
   m.observe?'*Qué observar:* '+m.observe:null,
   m.ifNo?'*Si no quiere participar:* '+m.ifNo:null,
   m.kind==='sembrar'&&m.skill?'*Habilidad:* '+m.skill:null
 ].filter(Boolean).join('\n');
 for(const kid of batch.children||[]){
  lines.push(`\n*${kid.name}*`);
  for(const m of kid.missions||[])lines.push(`*• ${String(m.kind).toUpperCase()}: ${m.title}*\n${missionDetails(m)}`);
 }
 if(batch.weekly)lines.push(`\n🏡 *Familia: ${batch.weekly.title}*\n${missionDetails(batch.weekly)}`);
 lines.push('\nRespondé HECHA, NO PUDE o MENÚ para continuar.');
 const text=lines.join('\n');
 if(text.length>3600)throw Error('huella_mission_reply_too_long');
 return text;
}