/** Private one-family, one-week preview. Not a general chat and never schedules missions. */
import {tokenKey,isSessionMessagingReady,localClock} from './scheduler.mjs';
import {mondayOf,questionText} from './huella-weekly.mjs';
import {generatePremiumWeek} from './huella-ai.mjs';
import {verifiedStoryFor,formatVerifiedStory} from './huella-sources.mjs';

const normalized=v=>String(v||'').trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export const previewIntent=text=>['previa','previa ver','previa reintentar'].includes(normalized(text));
export const previewPermitted=(phone,env=process.env)=>{
 const allow=String(env.CERCA_TEST_WA_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
 return env.HUELLA_PREVIEW_ENABLED==='true'&&env.CERCA_PROVIDER==='evolution'&&
   env.CERCA_SEND_MODE==='test'&&allow.length===1&&allow[0]===String(phone)&&
   Boolean(env.OPENAI_API_KEY)&&isSessionMessagingReady(env);
};
const nextMonday=day=>{
 const monday=mondayOf(day);
 const d=new Date(monday+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7);
 return d.toISOString().slice(0,10);
};
const service=(text,eventId,index,receivedAt)=>({
 key:tokenKey(eventId+':'+index),channel:'service',payload:{body:text},
 expires_at:new Date(new Date(receivedAt).getTime()+23*3600000).toISOString()
});
const safe=(body)=>{if(typeof body!=='string'||!body.trim()||body.length>3600)throw Error('preview_message_length');return {body};};
function description(m,day){
 return ['*'+day+' · '+String(m.title||'')+'*',
 '*De qué se trata:* '+(m.intro||'Esta experiencia se explica en los pasos siguientes.'),
 ...(m.setup?['*Preparación:* '+m.setup]:[]),
 ...(m.opening?['*Qué decir para empezar:* '+m.opening]:[]),
 '*Cómo hacerlo:*',...(m.steps||[]).map((step,i)=>(i+1)+'. '+step),
 ...(m.example?['*Ejemplo de cómo jugar:* '+m.example]:[]),
 '*Qué buscamos con esta experiencia:* '+m.why,
 '*Qué observar, sin exigir resultados:* '+m.observe,
 ...(m.ifNo?['*Si hoy no tiene ganas:* '+m.ifNo]:[]),...(m.kind==='sembrar'&&m.skill?['*Habilidad que se practica:* '+m.skill]:[])].join('\n');
}
export function previewMessages(batch,state,weekStart){
 if(!batch||batch.children?.length!==state.children?.length||!batch.weekly)throw Error('preview_incomplete');
 const msg=[safe('🌱 *HUELLA — Vista previa privada*\nSemana que comienza el '+weekStart+'.\n\nEstas propuestas son para evaluar su calidad. No activan el calendario ni cuentan como misiones realizadas.')];
 const f=batch.weekly;
 msg.push(safe(['🏡 *LUNES · Experiencia familiar*',description(f,'FAMILIA'),'Participación voluntaria; adaptala a las edades de todos.'].join('\n\n')));
 const days=[['conectar','MARTES · CONECTAR'],['comprender','JUEVES · COMPRENDER'],['sembrar','SÁBADO · SEMBRAR']];
 for(let i=0;i<batch.children.length;i++){
  const child=batch.children[i],blocks=days.map(([kind,day])=>{
   const m=child.missions.find(x=>x.kind===kind);
   if(!m)throw Error('preview_incomplete_missions');
   return description(m,day);
  });
  const title='🌱 *'+state.children[i].name+'* · Misiones de la semana';
  const composed=[title,...blocks].join('\n\n');
  if(composed.length<=3600){msg.push(safe(composed));continue;}
  for(const block of blocks)msg.push(safe(title+'\n\n'+block));
 }
 const story=formatVerifiedStory(verifiedStoryFor(state,weekStart));
 msg.push(safe('📖 *MIÉRCOLES*\n'+story));
 msg.push(safe('💬 *DOMINGO*\n'+questionText(state,weekStart)+'\n\nEl balance real se generará cuando haya experiencias registradas. No inventaremos avances.'));
 if(msg.length>12)throw Error('preview_too_many_messages');
 return msg;
}
const errorCode=error=>{
 const str=String(error?.message||'');
 if(/^huella_ai_http_\d{3}$/.test(str))return str;
 if(['huella_ai_incomplete','huella_ai_bad_json','huella_ai_quality_rejected','huella_ai_refusal','huella_ai_empty','huella_ai_not_configured','huella_ai_profile_invalid'].includes(str))return str;
 return error?.name==='AbortError'?'huella_ai_timeout':'huella_preview_failed';
};
/** Returns null for any message that is not an authorized preview command. */
export async function handlePreviewInbound(m,{db,env=process.env,now=new Date(),generate=generatePremiumWeek,flush=async()=>{},defer=work=>work()}={}){
 if(!previewIntent(m.text)||!previewPermitted(m.phone,env))return null;
 const requested=normalized(m.text);
 const today=localClock(now).day,weekKey=nextMonday(today);
 const row=await db.family(m.phone);
 if(!row?.state||row.state.status!=='active'||!row.state.consentAt||row.state.deleted)return 'not_active';
 const incomingKey=tokenKey('whatsapp:'+m.id);
 const previous=row.state.huellaPreview;
 const sameWeek=previous?.weekKey===weekKey;
 const note=(body,suffix)=>db.commit(m.phone,row.revision,incomingKey,row.state,[service(body,incomingKey+':'+suffix,0,m.receivedAt)]);
 if(sameWeek&&previous.status==='ready'){
  if(requested==='previa ver'){
   const messages=previewMessages(previous.batch,row.state,weekKey);
   const jobs=messages.map((x,i)=>service(x.body,incomingKey+':view',i,m.receivedAt));
   return (await db.commit(m.phone,row.revision,incomingKey,row.state,jobs)).status;
  }
  return (await note('Ya preparé una previa de esta semana. Escribí PREVIA VER para verla de nuevo, sin usar más IA.','ready')).status;
 }
 if(sameWeek&&previous.status==='processing'){
  const began=Date.parse(previous.startedAt||'');
  const stale=Number.isFinite(began)&&now.getTime()-began>240000;
  if(!stale){
   return (await note('Estoy preparando la vista previa que pediste. No hace falta enviarla otra vez.','processing')).status;
  }
  if(requested!=='previa reintentar'){
   return (await note('La generación anterior quedó interrumpida. Podés escribir PREVIA REINTENTAR para intentar nuevamente, con el límite semanal de seguridad.','stale')).status;
  }
 }
 if(sameWeek&&previous.status==='failed'&&requested!=='previa reintentar'){
  return (await note('La generación anterior no superó la comprobación. Si querés hacer un último intento, escribí PREVIA REINTENTAR.','failed')).status;
 }
 const priorAttempts=sameWeek?Number(previous.attempts)||0:0;
 if((requested==='previa reintentar'&&!sameWeek)||priorAttempts>=2){
  return (await note('Para proteger el presupuesto, HUELLA limita esta prueba a dos intentos por semana.','limit')).status;
 }
 const reservation=structuredClone(row.state),runId=tokenKey('preview-run:'+m.id);
 reservation.huellaPreview={weekKey,status:'processing',attempts:priorAttempts+1,runId,startedAt:now.toISOString()};
 const committed=await db.commit(m.phone,row.revision,incomingKey,reservation,[
  service('🌱 Voy a preparar una semana privada con Sol para evaluar la calidad de las misiones. No comienza tu mes de prueba ni activa envíos programados.',incomingKey+':ack',0,m.receivedAt)
 ]);
 if(committed.status!=='applied')return committed.status;
 try{await flush(2);}catch{/* Persistent outbox will be retried. */}
 // The webhook returns after a durable reservation; the caller may defer the
 // expensive editorial work without holding the provider HTTP request open.
 return defer(async()=>{
 let batch=null,failed=null;
 try{batch=await generate(reservation,weekKey,{env});if(!batch)throw Error('huella_ai_empty');}
 catch(err){failed=errorCode(err);}
 for(let retry=0;retry<3;retry++){
  const latest=await db.family(m.phone);
  const current=latest?.state;
  if(!current||current.status!=='active'||!current.consentAt||current.deleted||
    current.huellaPreview?.runId!==runId)return 'cancelled';
  const updated=structuredClone(current);
  const eventId=tokenKey('preview-result:'+m.id);
  let messages;
  if(failed){
   updated.huellaPreview={...updated.huellaPreview,status:'failed',error:failed,finishedAt:new Date().toISOString()};
   messages=[safe('HUELLA no pudo preparar una semana que pase los controles de calidad. No envié misiones genéricas. La prueba no inició tu mes. Podés escribir PREVIA REINTENTAR para un único intento adicional.')];
  }else{
   try{messages=previewMessages(batch,current,weekKey);
    updated.huellaPreview={...updated.huellaPreview,status:'ready',batch,finishedAt:new Date().toISOString()};}
   catch(err){failed=errorCode(err);updated.huellaPreview={...updated.huellaPreview,status:'failed',error:failed,finishedAt:new Date().toISOString()};
    messages=[safe('La IA respondió, pero el contenido no pasó las comprobaciones de formato. No se enviaron misiones incompletas. Podés escribir PREVIA REINTENTAR.')];}
  }
  const jobs=messages.map((x,i)=>service(x.body,eventId,i,m.receivedAt));
  try{
   const result=await db.commit(m.phone,latest.revision,eventId,updated,jobs);
   if(result.status==='applied'){try{await flush(15);}catch{/* Outbox remains for later delivery. */}}
   return result.status;
  }catch(err){if(!['database_409','database_400'].includes(err.message)||retry===2)throw err;}
 }
 return 'conflict';
 });
}