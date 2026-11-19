/** Third, focused editorial retest (three infant missions + one family).
 * One authorized paid inference; never turns HUELLA into an open chatbot.
 */
import {tokenKey,localClock} from './scheduler.mjs';
import {mondayOf,missionText,familyText} from './huella-weekly.mjs';
import {previewPermitted} from './huella-preview.mjs';
import {generateInfantFocus} from './huella-infant-ai.mjs';
import {validInfantMonths} from './huella-ai.mjs';

export const INFANT_REVIEW_REVISION='infant-stage-naturalness-20261119-v1';
const normalized=x=>String(x||'').trim().toLocaleLowerCase('es-AR')
 .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export const infantReviewIntent=t=>['previa bebe','previa bebe ver'].includes(normalized(t));
const nextMonday=today=>{
 const d=new Date(mondayOf(today)+'T12:00:00Z');
 d.setUTCDate(d.getUTCDate()+7);
 return d.toISOString().slice(0,10);
};
const service=(body,key,index,receivedAt)=>({
 key:tokenKey(key+':'+index),channel:'service',payload:{body},
 expires_at:new Date(new Date(receivedAt).getTime()+23*3600000).toISOString()
});
const format=(batch)=>{
 const messages=[{
  body:'🌱 *HUELLA · Prueba enfocada de calidad*\n\nTres misiones nuevas para '+batch.childName+
   ' ('+batch.ageMonths+' meses aprox.) y una propuesta para toda la familia. Son ejemplos para evaluar, no activan el mes de prueba.'
 }];
 for(const mission of batch.missions||[])messages.push({body:missionText(batch.childName,mission)});
 messages.push({body:familyText(batch.family)});
 if(messages.length!==5||messages.some(x=>!x.body||x.body.length>3400))
  throw Error('huella_infant_preview_invalid');
 return messages;
};
const errorCode=error=>{
 const str=String(error?.message||'');
 if(/^huella_ai_http_\d{3}$/.test(str))return str;
 if(['huella_ai_quality_rejected','huella_ai_incomplete','huella_ai_empty',
  'huella_ai_bad_json','huella_ai_refusal','huella_infant_focus_single_only',
  'huella_infant_months_missing','huella_infant_preview_invalid',
  'huella_content_too_long'].includes(str))return str;
 return error?.name==='AbortError'?'huella_ai_timeout':'huella_infant_preview_failed';
};
export async function handleInfantReview(m,{db,env=process.env,now=new Date(),
 generate=generateInfantFocus,flush=async()=>{},defer=work=>work()}={}){
 if(!infantReviewIntent(m.text)||!previewPermitted(m.phone,env))return null;
 const row=await db.family(m.phone);
 if(!row?.state||row.state.status!=='active'||!row.state.consentAt||row.state.deleted)return 'not_active';
 const eventId=tokenKey('whatsapp:'+m.id);
 const infants=row.state.children.map((c,i)=>Number(c.age)<2?i:-1).filter(i=>i>=0);
 const note=body=>db.commit(m.phone,row.revision,eventId,row.state,[service(body,eventId+':note',0,m.receivedAt)]);
 if(infants.length!==1)
  return (await note('Esta prueba enfocada requiere exactamente un bebé en el perfil. No se llamó a OpenAI.')).status;
 const index=infants[0],child=row.state.children[index];
 if(!validInfantMonths(child)){
  return (await note('Para personalizar las propuestas de '+child.name+' primero necesito su edad aproximada en meses. Escribí EDAD BEBÉ; luego podrás enviar PREVIA BEBÉ. No hice ninguna llamada paga.')).status;
 }
 const previous=row.state.huellaInfantReview;
 if(previous?.revision===INFANT_REVIEW_REVISION){
  const body=previous.status==='ready'?
    'Esta revisión ya fue generada. Escribí PREVIA BEBÉ VER para volver a ver las misiones sin hacer otra llamada a OpenAI.':
    previous.status==='processing'?
    'La revisión para el bebé se está preparando. No hace falta enviar el comando de nuevo.':
    'La revisión no pudo completarse. Por seguridad se consumió el único intento permitido; no haré otra llamada paga automáticamente.';
  const jobs=previous.status==='ready'&&normalized(m.text)==='previa bebe ver'
   ?format(previous.batch).map((x,i)=>service(x.body,eventId+':view',i,m.receivedAt))
   :[service(body,eventId+':status',0,m.receivedAt)];
  return (await db.commit(m.phone,row.revision,eventId,row.state,jobs)).status;
 }
 if(normalized(m.text)==='previa bebe ver')
  return (await note('Aún no generamos esa revisión. Escribí PREVIA BEBÉ para crearla una sola vez.')).status;
 const weekKey=nextMonday(localClock(now).day),runId=tokenKey('infant-review:'+m.id);
 const reserve=structuredClone(row.state);
 reserve.huellaInfantReview={revision:INFANT_REVIEW_REVISION,runId,weekKey,
  status:'processing',attempts:1,childIndex:index,ageMonths:child.ageMonths,startedAt:now.toISOString()};
 const ack=await db.commit(m.phone,row.revision,eventId,reserve,[
  service('🌱 Voy a preparar una nueva evaluación de tres misiones para '+child.name+
   ' y una familiar, con su etapa en meses. Es una única generación con Sol; no inicia los 30 días ni activa mensajes automáticos.',eventId+':ack',0,m.receivedAt)
 ]);
 if(ack.status!=='applied')return ack.status;
 try{await flush(2);}catch{/* queued safely */}
 return defer(async()=>{
  let result=null,messages=null,error=null;
  try{result=await generate(reserve,weekKey,{env});messages=format(result);}
  catch(e){error=errorCode(e);}
  for(let attempt=0;attempt<3;attempt++){
   const latest=await db.family(m.phone),live=latest?.state;
   if(!live||live.deleted||live.status!=='active'||!live.consentAt||
      live.huellaInfantReview?.runId!==runId||live.children?.[index]?.ageMonths!==child.ageMonths)
    return 'cancelled';
   const updated=structuredClone(live);
   const replyKey=tokenKey('infant-review-result:'+m.id);
   if(error){
    updated.huellaInfantReview={...updated.huellaInfantReview,
     status:'failed',error,finishedAt:new Date().toISOString()};
    messages=[{body:'La nueva propuesta no pasó los controles de calidad o no pudo generarse. No envié misiones de relleno. No se activó el piloto ni habrá otro intento pago automático.'}];
   }else{
    updated.huellaInfantReview={...updated.huellaInfantReview,
     status:'ready',batch:result,finishedAt:new Date().toISOString()};
   }
   const outbox=messages.map((x,i)=>service(x.body,replyKey,i,m.receivedAt));
   try{
    const saved=await db.commit(m.phone,latest.revision,replyKey,updated,outbox);
    if(saved.status==='applied'){try{await flush(15);}catch{/* durable jobs remain queued */}}
    return saved.status;
   }catch(e){
    if(!['database_409','database_400'].includes(e.message)||attempt===2)throw e;
   }
  }
  return 'conflict';
 });
}
