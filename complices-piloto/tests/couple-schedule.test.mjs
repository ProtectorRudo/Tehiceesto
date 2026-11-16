import test from "node:test";
import assert from "node:assert/strict";
import {scheduleFor,weekNumber,mondayOf,taskDayFromKey,unlockedTasks} from "../lib/mission-schedule.mjs";
import {buildWeeklyMissions} from "../lib/weekly-missions.mjs";
import {meaningfulPartnerPlan} from "../lib/meaningful-partner.mjs";
import {evaluateMission} from "../lib/mission-quality.mjs";
import {mergeGeneratedIdeas} from "../lib/central-content.mjs";
const A="11111111-1111-4111-8111-111111111111",B="22222222-2222-4222-8222-222222222222",S="33333333-3333-4333-8333-333333333333";
const members=[{user_id:A,joined_at:"2026-11-15T10:00:00Z"},{user_id:B,joined_at:"2026-11-15T11:00:00Z"}];
const plan=(userId,week,m=members,p={})=>buildWeeklyMissions({userId,spaceId:S,week,members:m,partnerProfile:p});
test("fechas y lunes de semana no dependen de la zona horaria del navegador",()=>{
 assert.equal(mondayOf("2026-11-16"),"2026-11-16");
 assert.equal(mondayOf("2026-11-22"),"2026-11-16");
 assert.equal(mondayOf("2026-11-23"),"2026-11-23");
 assert.equal(weekNumber("2026-11-16"),0);
 assert.equal(weekNumber("2026-11-23"),1);
});
test("cada uno tiene exactamente tres días, nunca el mismo día que el otro",()=>{
 for(const week of ["2026-11-16","2026-11-23","2026-11-30","2026-12-07"]){
  const a=scheduleFor({members,userId:A,week});
  const b=scheduleFor({members,userId:B,week});
  assert.equal(a.days.length,3);assert.equal(b.days.length,3);
  assert.equal(new Set([...a.days.map(x=>x.date),...b.days.map(x=>x.date)]).size,6);
  assert.ok(a.dayNumbers.every(i=>i!==6));assert.ok(b.dayNumbers.every(i=>i!==6));
  assert.equal(a.week,b.week);
 }
});
test("los días se alternan entre semanas",()=>{
 const a0=scheduleFor({members,userId:A,week:"2026-11-16"});
 const a1=scheduleFor({members,userId:A,week:"2026-11-23"});
 assert.deepEqual(a0.dayNumbers,[0,2,4]);
 assert.deepEqual(a1.dayNumbers,[1,3,5]);
});
test("la misión semanal gira: integrante A, integrante B y luego ambos",()=>{
 const first=scheduleFor({members,userId:A,week:"2026-11-16"}),otherFirst=scheduleFor({members,userId:B,week:"2026-11-16"});
 assert.equal(first.weeklyMode,"solo");assert.equal(first.weeklyAssigned,true);
 assert.equal(otherFirst.weeklyAssigned,false);
 const second=scheduleFor({members,userId:B,week:"2026-11-23"}),third=scheduleFor({members,userId:A,week:"2026-11-30"});
 assert.equal(second.weeklyAssigned,true);
 assert.equal(second.weeklyMode,"solo");
 assert.equal(third.weeklyMode,"juntos");
 assert.equal(third.weeklyAssigned,true);
 assert.equal(scheduleFor({members,userId:B,week:"2026-11-30"}).weeklyAssigned,true);
});
test("sin segunda cuenta el piloto funciona sin simular que hay dos personas",()=>{
 const one=scheduleFor({members:[members[0]],userId:A,week:"2026-11-23"});
 assert.equal(one.days.length,3);
 assert.equal(one.weeklyMode,"solo");
 assert.equal(one.weeklyAssigned,true);
});
test("la agenda muestra tres misiones por persona y solo una semanal por pareja",()=>{
 for(const week of ["2026-11-16","2026-11-23","2026-11-30"]){
  const a=plan(A,week),b=plan(B,week);
  assert.equal(a.activities.filter(x=>x.slot.startsWith("mission_")).length,3);
  assert.equal(b.activities.filter(x=>x.slot.startsWith("mission_")).length,3);
  assert.equal(a.activities.filter(x=>x.slot==="weekly_1").length+b.activities.filter(x=>x.slot==="weekly_1").length,
   a.schedule.cooperative?2:1);
  assert.ok(a.activities.every(x=>x.period_key==="w:"+week));
  assert.ok(b.activities.every(x=>x.period_key==="w:"+week));
 }
});
test("misiones individuales tienen claves únicas; el juego no cuenta como misión",()=>{
 const a=plan(A,"2026-11-16");
 assert.equal(new Set(a.activities.map(x=>x.task_key)).size,a.activities.length);
 assert.equal(a.activities.filter(x=>x.kind==="mission").length,4);
 assert.equal(a.activities.filter(x=>x.kind==="game").length,1);
 assert.ok(a.activities.filter(x=>x.slot.startsWith("mission_")).every(x=>x.points===40));
});
test("cuando la misión semanal es conjunta ambos reciben exactamente la misma",()=>{
 const a=plan(A,"2026-11-30",members,{plan:"cocinar",detalle:"mate"});
 const b=plan(B,"2026-11-30",members,{plan:"pelicula",detalle:"nota"});
 const x=a.activities.find(y=>y.slot==="weekly_1"),y=b.activities.find(y=>y.slot==="weekly_1");
 assert.deepEqual({title:x.title,body:x.body,theme:x.theme,task_key:x.task_key},{title:y.title,body:y.body,theme:y.theme,task_key:y.task_key});
});
test("un único miembro no recibe misiones asignadas a la cuenta inexistente",()=>{
 const p=plan(A,"2026-11-16",[members[0]]);
 assert.equal(p.activities.filter(x=>x.slot.startsWith("mission_")).length,3);
});
test("antes del día asignado la misión individual permanece oculta, pero sin vencimiento al día siguiente",()=>{
 const p=plan(A,"2026-11-16");
 assert.equal(unlockedTasks(p.activities,"2026-11-15").filter(x=>x.slot.startsWith("mission_")).length,0);
 assert.equal(unlockedTasks(p.activities,"2026-11-16").filter(x=>x.slot.startsWith("mission_")).length,1);
 assert.equal(unlockedTasks(p.activities,"2026-11-22").filter(x=>x.slot.startsWith("mission_")).length,3);
 assert.equal(taskDayFromKey(p.activities[0].task_key),"2026-11-16");
});
test("la opción de perfil reconoce el deseo emocional sin repetir deseos literales",()=>{
 const p=meaningfulPartnerPlan({deseo:"reconocimiento"});
 assert.equal(p.hasSignals,true);
 assert.match(p.ideas[0].body,/construyen|elegido|admir|valor/i);
 assert.match(p.ideas[2].body,/recuerdos|construyen|foto/i);
 assert.doesNotMatch(JSON.stringify(p),/whatsapp|foto de perfil|actualiz[aá] tu estado/i);
});
test("la IA rechaza reproducir literalmente un cambio de perfil",()=>{
 const q=evaluateMission({title:"Una foto en tu perfil",body:"Poné una foto de perfil con tu pareja en WhatsApp para cumplir el deseo.",slot:"mission_1",partnerProfile:{deseo:"reconocimiento"}});
 assert.equal(q.pass,false);assert.ok(q.issues.includes("literal_wish_echo"));
});
test("las tareas semanales compartidas no pueden ser reescritas por la IA individual",()=>{
 const base=plan(A,"2026-11-30").activities;
 const proposals={weekly_1:{title:"Cambia tu perfil",body:"Poné una foto pública en redes sociales para que tu pareja se sienta querida."}};
 const merged=mergeGeneratedIdeas(base,proposals,()=>true,{protectedSlots:["weekly_1"]});
 assert.deepEqual(merged.find(x=>x.slot==="weekly_1"),base.find(x=>x.slot==="weekly_1"));
});
test("guardar un código emocional válido no autoriza copiar el deseo literal",()=>{
 const x=plan(A,"2026-11-16",members,{deseo:"reconocimiento"});
 const first=x.activities.find(v=>v.slot==="mission_1");
 assert.match(first.body,/construyen|elegido/i);
 assert.doesNotMatch(first.body,/whatsapp|perfil/i);
});
