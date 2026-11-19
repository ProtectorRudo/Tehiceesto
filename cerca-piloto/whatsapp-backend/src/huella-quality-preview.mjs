/** One editorial-quality retest, isolated from the original paid preview budget.
 * No background scheduling, no onboarding changes, no free-form assistant.
 */
import {tokenKey,localClock} from './scheduler.mjs';
import {mondayOf} from './huella-weekly.mjs';
import {previewPermitted,previewMessages} from './huella-preview.mjs';
import {generatePremiumWeek} from './huella-ai.mjs';

export const QUALITY_PREVIEW_REVISION='executable-missions-20261119-v1';
export const RECOVERY_PREVIEW_REVISION='complete-mission-slots-20261119-v1';
const normalized=text=>String(text||'').trim().toLocaleLowerCase('es-AR').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'');
export const isQualityPreviewIntent=text=>normalized(text)==='previa calidad';
/** One independent, owner-authorized validation after previous preview budgets were used. */
export const isRecoveryPreviewIntent=text=>normalized(text)==='previa completa';

const nextMonday=day=>{
 const monday=mondayOf(day),d=new Date(monday+'T12:00:00Z');
 d.setUTCDate(d.getUTCDate()+7);
 return d.toISOString().slice(0,10);
};
const service=(body,key,index,receivedAt)=>({
 key:tokenKey(key+':'+index),channel:'service',payload:{body},
 expires_at:new Date(new Date(receivedAt).getTime()+23*3600000).toISOString()
});
const reason=e=>{
 const str=String(e?.message||'');
 return /^huella_ai_http_\d{3}$/.test(str)?str:
 ['huella_ai_quality_rejected','huella_ai_safety_or_structure','huella_ai_incomplete','huella_ai_bad_json',
 'huella_ai_empty','huella_ai_refusal','huella_profile_invalid',
 'preview_message_length','preview_too_many_messages'].includes(str)?str:
 e?.name==='AbortError'?'huella_ai_timeout':'huella_quality_preview_failed';
};
export async function handleQualityPreviewInbound(m,{
 db,env=process.env,now=new Date(),generate=generatePremiumWeek,flush=async()=>{},defer=work=>work()
}={}){
 const recovery=isRecoveryPreviewIntent(m.text);
 if((!recovery&&!isQualityPreviewIntent(m.text))||!previewPermitted(m.phone,env))return null;
 const storageField=recovery?'huellaRecoveryPreview':'huellaQualityPreview';
 const revision=recovery?RECOVERY_PREVIEW_REVISION:QUALITY_PREVIEW_REVISION;
 const row=await db.family(m.phone);
 if(!row?.state||row.state.status!=='active'||!row.state.consentAt||row.state.deleted)return 'not_active';
 const eventId=tokenKey('whatsapp:'+m.id);
 const existing=row.state[storageField];
 if(existing?.revision===revision){
  // This revision authorizes at most ONE billed inference, even after a timeout.
  const msg=existing.status==='ready'
   ?'Ya tenés la nueva vista previa. Para evaluarla, compartí las misiones en el chat de pruebas. No volveré a generar otra semana ni a cobrar otra llamada.'
   :existing.status==='processing'
   ?'La nueva vista previa ya está en preparación. No necesitás volver a enviar el comando.'
   :'La segunda evaluación no pudo completarse. No haré más llamadas pagas automáticamente; primero revisaremos el error.';
  const job=service(msg,eventId+':status',0,m.receivedAt);
  return (await db.commit(m.phone,row.revision,eventId,row.state,[job])).status;
 }
 const weekKey=nextMonday(localClock(now).day);
 const updated=structuredClone(row.state);
 const runId=tokenKey((recovery?'recovery-preview:':'quality-preview:')+m.id);
 updated[storageField]={revision,weekKey,
  status:'processing',attempts:1,runId,startedAt:now.toISOString()};
 const reserved=await db.commit(m.phone,row.revision,eventId,updated,[
  service(recovery?'🌱 Validación final autorizada: Sol preparará tres misiones por hijo y una familiar. Es una única generación, sin activar el calendario ni los 30 días.':'🌱 Segunda prueba de calidad iniciada. HUELLA preparará nuevas misiones más detalladas con Sol. Es una única generación, no activa el calendario ni tus 30 días.',eventId+':ack',0,m.receivedAt)
 ]);
 if(reserved.status!=='applied')return reserved.status;
 try{await flush(2);}catch{/* Durable outbox can be retried. */}
 // Webhook returns now. No long AI request is held open.
 return defer(async()=>{
  let batch=null,messages=null,error=null;
  try{
   const editorial=structuredClone(updated);
   const first=recovery&&updated.huellaQualityPreview?.status==='ready'?updated.huellaQualityPreview.batch:
    updated.huellaPreview?.status==='ready'?updated.huellaPreview.batch:null;
   // Use previous titles only as anti-repetition context; never record them
   // as completed experiences, and never overwrite the first preview.
   if(first?.children?.length){
    editorial.history=[...(editorial.history||[]),{
      day:'editorial-reference',children:first.children.map(c=>({
        name:c.name,missions:(c.missions||[]).map(x=>({title:x.title}))
      })),weekly:null
    }].slice(-24);
   }
   batch=await generate(editorial,weekKey,{env});
   messages=previewMessages(batch,editorial,weekKey);
  }catch(e){error=reason(e);}
  for(let i=0;i<3;i++){
   const latest=await db.family(m.phone),live=latest?.state;
   if(!live||live.deleted||live.status!=='active'||!live.consentAt||
      live[storageField]?.runId!==runId)return 'cancelled';
   const next=structuredClone(live);
   const delivery=tokenKey((recovery?'recovery-result:':'quality-result:')+m.id);
   if(error){
    next[storageField]={...next[storageField],
     status:'failed',error,finishedAt:new Date().toISOString()};
    messages=[{body:recovery?'La validación de HUELLA no pudo completarse. No inicié los 30 días ni haré otra generación paga automáticamente.':'La nueva generación no terminó o no pasó los controles editoriales. No envié contenido de relleno ni inicié el piloto. Por seguridad no habrá otro intento pago automático.'}];
   }else{
    next[storageField]={...next[storageField],
     status:'ready',batch,finishedAt:new Date().toISOString()};
   }
   const jobs=messages.map((x,index)=>service(x.body,delivery,index,m.receivedAt));
   try{
    const result=await db.commit(m.phone,latest.revision,delivery,next,jobs);
    if(result.status==='applied'){try{await flush(15);}catch{/* Outbox remains pending. */}}
    return result.status;
   }catch(e){if(!['database_400','database_409'].includes(e.message)||i===2)throw e;}
  }
  return 'conflict';
 });
}