import {localClock,tokenKey} from './scheduler.mjs';
import {generatePremiumWeek} from './huella-ai.mjs';
import {verifiedStoryFor,formatVerifiedStory} from './huella-sources.mjs';

const SLOTS={Mon:'family',Tue:'conectar',Wed:'story',Thu:'comprender',Sat:'sembrar',Sun:'reflection'};
const KIND_NAMES={conectar:'CONECTAR',comprender:'COMPRENDER',sembrar:'SEMBRAR'};
const dateAtUTC=day=>new Date(day+'T12:00:00Z');
export function mondayOf(day){
 const d=dateAtUTC(day);if(!Number.isFinite(d.getTime()))throw Error('invalid_week_date');
 d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
 return d.toISOString().slice(0,10);
}
const spanDays=(a,b)=>Math.floor((dateAtUTC(a)-dateAtUTC(b))/86400000);
const expiry=day=>new Date(day+'T23:59:59-03:00').toISOString();
const shorten=(s,n)=>String(s||'').trim().slice(0,n);
function compact(body,enforceLimit=true){
 const trimmed=body.trim();
 // Never truncate text. The weekly slots can split long missions at paragraph
 // boundaries; story and reflection still have their own transport limits.
 if(enforceLimit&&trimmed.length>3400)throw Error('huella_content_too_long');
 return trimmed;
}
/** Split long messages into complete paragraphs; no silent truncation.
 * Provider/template-specific limits must be checked separately before production.
 */
export function splitLongMission(body,max=3400){
 const pieces=[],paragraphs=String(body||'').trim().split(/\n\n+/);
 let group='';
 for(const paragraph of paragraphs){
  if(paragraph.length>max)throw Error('huella_paragraph_too_long');
  const candidate=group?group+'\n\n'+paragraph:paragraph;
  if(candidate.length>max){pieces.push(group);group=paragraph;}
  else group=candidate;
 }
 if(group)pieces.push(group);
 return pieces;
}
const steps=m=>m.steps.map((s,i)=>String(i+1)+'. '+s).join('\n');
export function missionText(name,m){
 return compact(['🌱 HUELLA · '+name+' · '+KIND_NAMES[m.kind],
  '*'+m.title+'*',
  '*De qué se trata:* '+(m.intro||'La misión se explica en los siguientes pasos.'),
  ...(m.setup?['*Preparación:* '+m.setup]:[]),
  ...(m.opening?['*Qué decir para empezar:* '+m.opening]:[]),
  '*Cómo hacerlo:*\n'+steps(m),
  ...(m.example?['*Ejemplo de cómo jugar:* '+m.example]:[]),
  '*Qué buscamos con esta experiencia:* '+m.why,
  '*Qué observar, sin exigir resultados:* '+m.observe,
  ...(m.ifNo?['*Si hoy no tiene ganas:* '+m.ifNo]:[]),
  ...(m.kind==='sembrar'&&m.skill?['*Habilidad que se practica:* '+m.skill]:[]),
  'Duración sugerida: 5–15 minutos. Si no quiere participar, respetá su decisión.'].join('\n\n'),false);
}
export function familyText(m){
 return compact(['🏡 HUELLA · Momento familiar','*'+m.title+'*',
  '*De qué se trata:* '+(m.intro||'Una propuesta para compartir en familia.'),
  ...(m.setup?['*Preparación:* '+m.setup]:[]),
  ...(m.opening?['*Qué decir para empezar:* '+m.opening]:[]),
  '*Cómo hacerlo:*\n'+steps(m),
  ...(m.example?['*Ejemplo de cómo hacerlo:* '+m.example]:[]),
  '*Qué buscamos con esta experiencia:* '+m.why,
  '*Qué observar, sin exigir resultados:* '+m.observe,
  ...(m.ifNo?['*Si no se da hoy:* '+m.ifNo]:[]),...(m.kind==='sembrar'&&m.skill?['*Habilidad:* '+m.skill]:[]),
  'Pueden adaptarla a las edades de todos. Nadie tiene obligación de participar.'].join('\n\n'),false);
}
export function questionText(state,weekKey){
 const count=(state.children||[]).length;
 const nth=Math.abs(Math.floor(Date.parse(weekKey+'T12:00:00Z')/604800000))%Math.max(1,count);
 const child=state.children[nth];
 if(!child)throw Error('huella_missing_child');
 const q=child.age<=2
  ?'Esta semana, ¿qué señal nueva o preferencia observaste en '+child.name+'? Si no hubo novedades, también sirve contarlo.'
  :'Esta semana, ¿en qué momento sentiste que escuchaste mejor a '+child.name+' y qué descubriste sobre sus gustos o su forma de pensar?';
 return '🌱 HUELLA · Una pregunta importante\n\n'+q+'\n\nPodés contestar en una frase o escribir OMITIR. Tu respuesta ayudará a personalizar la próxima semana.';
}
export function progressSummary(state,weekKey){
 const monday=weekKey;
 const feedback=(state.feedbackLog||[]).filter(f=>typeof f.day==='string'&&f.day>=monday&&spanDays(f.day,monday)<=6);
 const completed=feedback.filter(f=>f.answer==='hecha'),skipped=feedback.filter(f=>f.answer==='no pude');
 const children=(state.children||[]);
 const items=[];
 if(completed.length){
  const names=[...new Set(completed.map(f=>children[f.childIndex]?.name).filter(Boolean))];
  items.push('Registraste '+completed.length+' experiencia(s) realizada(s)'+(names.length?' con '+names.join(' y '):'')+'.');
 }
 if(skipped.length)items.push('También marcaste '+skipped.length+' que no pudiste realizar. HUELLA no penaliza los días difíciles.');
 if(!feedback.length)items.push('Esta semana todavía no tenemos experiencias registradas. No voy a inventar avances: lo importante es conocer cómo te fue de verdad.');
 if(feedback.length&&!completed.length&&!skipped.length)items.push('Registraste experiencias de la semana, aunque aún no tenemos datos para afirmar un cambio.');
 return compact('🌿 HUELLA · Balance de la semana\n\n'+items.join('\n\n')+
  '\n\nEl progreso no se mide por cumplir todas las actividades. Si hubo un momento de escucha o presencia que valió la pena, podés compartirlo en la pregunta de hoy.');
}
const tagged=(label,body,template,phone,day,slot,index)=>{
 if(!template)throw Error('huella_template_missing');
 return {key:tokenKey('huella:v2:'+phone+':'+day+':'+slot+':'+index),
  channel:'marketing',payload:{kind:'template',name:template,params:[label,body]},expires_at:expiry(day)};
};
export function weeklyEnabled(env=process.env){
 const recipients=String(env.CERCA_TEST_WA_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
 return env.HUELLA_WEEKLY_V2_ENABLED==='true'&&env.HUELLA_SOLO_PILOT_ENABLED==='true'&&
  env.CERCA_SEND_MODE==='test'&&recipients.length===1&&/^[1-9]\d{7,14}$/.test(recipients[0])&&
  env.CERCA_PROVIDER==='evolution'&&env.CERCA_EVOLUTION_SCHEDULED_ALLOWED==='true'&&
  !!env.EVOLUTION_TEMPLATE_DAILY&&!!env.EVOLUTION_TEMPLATE_WEEKLY&&!!env.OPENAI_API_KEY;
}
export async function prepareWeeklyDispatch(state,phone,now,{env=process.env,generate=generatePremiumWeek,storyFor=verifiedStoryFor}={}){
 if(!weeklyEnabled(env))return null;
 const clock=localClock(now,state.timezone||'America/Argentina/Buenos_Aires');
 const slot=SLOTS[clock.weekday];
 if(!slot||state.status!=='active'||!state.consentAt||state.deleted)return null;
 if(String(phone)!==String(env.CERCA_TEST_WA_IDS).trim())return null;
 const desired=String(state.deliveryTime||'18:00');
 if(clock.time.slice(0,2)!==desired.slice(0,2)||Number(clock.time.slice(3))<Number(desired.slice(3)))return null;
 if(state.huellaPilotStartDay&&spanDays(clock.day,state.huellaPilotStartDay)>=30)return null;
 const key=mondayOf(clock.day);
 const stateCopy=structuredClone(state);
 if(!stateCopy.huellaWeekV2||stateCopy.huellaWeekV2.key!==key){
  // Fail CLOSED. A failed model call must never lead to arbitrary fallback content.
  if(stateCopy.huellaLastGenerationFailureDay===clock.day)return null;
  let batch;
  try{
   batch=await generate(stateCopy,key,{env});
   if(!batch||!Array.isArray(batch.children)||!batch.weekly)throw Error('huella_invalid_batch');
  }catch{
   // Persist a one-day circuit breaker, never spend repeatedly on every cron tick.
   stateCopy.huellaLastGenerationFailureDay=clock.day;
   return {updated:stateCopy,jobs:[],slot,day:clock.day,weekKey:key,
    eventId:tokenKey('huella:ai-failed:'+phone+':'+clock.day),generationBlocked:true};
  }
  stateCopy.huellaWeekV2={key,batch,sentSlots:[]};
 }
 if(stateCopy.huellaWeekV2.sentSlots.includes(slot))return null;
 const batch=stateCopy.huellaWeekV2.batch;
 const jobs=[];
 const daily=env.EVOLUTION_TEMPLATE_DAILY,weekly=env.EVOLUTION_TEMPLATE_WEEKLY;
 if(slot==='family'){
  const messages=splitLongMission(familyText(batch.weekly));
  messages.forEach((body,part)=>jobs.push(tagged('Familia',body,weekly,phone,clock.day,slot,part)));
 }
 if(['conectar','comprender','sembrar'].includes(slot)){
  for(let index=0;index<batch.children.length;index++){
   const child=batch.children[index];
   if(child.name!==stateCopy.children[index]?.name)throw Error('huella_family_mismatch');
   const mission=child.missions.find(m=>m.kind===slot);
   if(!mission)throw Error('huella_mission_missing');
   const messages=splitLongMission(missionText(child.name,mission));
   messages.forEach((body,part)=>jobs.push(tagged(child.name,body,daily,phone,clock.day,slot,
     messages.length===1?index:index+'-'+part)));
  }
  const historyEntry={day:clock.day,children:batch.children.map(c=>({name:c.name,missions:c.missions.filter(m=>m.kind===slot)})),weekly:null};
  stateCopy.history=[...(stateCopy.history||[]),historyEntry].slice(-30);
 }
 if(slot==='story'){
  const story=storyFor(stateCopy,key);
  // Verified story is shorter than template field limits; use one source-checked case per week.
  jobs.push(tagged('Historia real',compact(formatVerifiedStory(story)),daily,phone,clock.day,slot,0));
 }
 if(slot==='reflection'){
  const report=progressSummary(stateCopy,key),question=questionText(stateCopy,key);
  jobs.push(tagged('Balance semanal',compact(report+'\n\n'+question),daily,phone,clock.day,slot,0));
  if(stateCopy.flow==='idle')stateCopy.flow='weekly_reflection';
 }
 if(!jobs.length)throw Error('huella_empty_slot');
 stateCopy.huellaWeekV2.sentSlots.push(slot);
 if(!stateCopy.huellaPilotStartDay)stateCopy.huellaPilotStartDay=clock.day;
 return {updated:stateCopy,jobs,slot,day:clock.day,weekKey:key,
  eventId:tokenKey('huella:weekly:'+phone+':'+clock.day+':'+slot)};
}
export const WEEKLY_SLOTS=Object.freeze({...SLOTS});