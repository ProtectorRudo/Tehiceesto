import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import {DEEP_QUESTIONS,weeklyPersonalQuestion,profileKnowledge,upcomingOccasions,occasionMission,DATE_TYPES} from "../lib/relationship-intelligence.mjs";
import {GET as engagementGet,POST as engagementPost} from "../app/api/engagement/dispatch/route.js";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=x=>readFileSync(resolve(root,x),"utf8");
test("doce preguntas profundas únicas y abiertas, distintas de gustos triviales",()=>{
 assert.equal(DEEP_QUESTIONS.length,12);
 assert.equal(new Set(DEEP_QUESTIONS.map(x=>x[0])).size,12);
 assert.ok(DEEP_QUESTIONS.every(x=>x[1].length>=65&&x[1].includes("?")));
 assert.ok(DEEP_QUESTIONS.some(x=>/elegid|tenid.*cuenta|admir/i.test(x[1])));
});
test("pregunta semanal personal, estable y sin coincidir con días de misión cuando hay alternativas",()=>{
 const a=weeklyPersonalQuestion({userId:"persona-A",week:"2026-11-16",partnerName:"Mauro",missionDays:[0,2,4]});
 const b=weeklyPersonalQuestion({userId:"persona-A",week:"2026-11-16",partnerName:"Mauro",missionDays:[0,2,4]});
 assert.deepEqual(a,b);
 assert.equal(a.id,"pulse:2026-11-16");
 assert.match(a.question,/Mauro|ustedes/);
 assert.ok(["2026-11-17","2026-11-19"].includes(a.due));
});
test("la pregunta especial es una por semana aunque sea otro día",()=>{
 const a=weeklyPersonalQuestion({userId:"persona-A",week:"2026-11-16"});
 const b=weeklyPersonalQuestion({userId:"persona-A",week:"2026-11-20"});
 const c=weeklyPersonalQuestion({userId:"persona-A",week:"2026-11-23"});
 assert.equal(a.id,b.id);
 assert.notEqual(a.id,c.id);
});
test("sin respuestas el índice es cero y no presume saber de la relación",()=>{
 const k=profileKnowledge();
 assert.equal(k.percent,0);
 assert.match(k.meaning,/no precisión|no.*precisión/i);
});
test("el índice distingue volumen de respuestas autorizadas e interacciones reales",()=>{
 const cards=Array.from({length:10},(_,i)=>({question_key:"k"+i,answer_code:"code"}));
 const reflections=Array.from({length:4},(_,i)=>({question_id:"q"+String(i+9).padStart(2,"0"),ai_use_allowed:true}));
 const dates=[{id:"a"},{id:"b"}],feedback=Array.from({length:3},()=>({rating:1})),completions=[{task_key:"a"}];
 const k=profileKnowledge({cards,reflections,importantDates:dates,feedback,completions});
 assert.equal(k.percent,100);
 assert.deepEqual(k.dimensions,{preferences:40,depth:32,dates:12,experience:16});
});
test("no cuenta respuestas profundas no autorizadas para IA",()=>{
 const k=profileKnowledge({reflections:[{question_id:"q09",ai_use_allowed:false},{question_id:"q10",ai_use_allowed:true}]});
 assert.equal(k.percent,8);
});
test("reconoce fechas anuales próximas sin tocar las privadas de terceros",()=>{
 const dates=[{id:"1",kind:"aniversario",label:"Nuestro aniversario",event_on:"2022-11-20",repeat_yearly:true,share_with_partner:false},
  {id:"2",kind:"otro",label:"Una sola vez",event_on:"2025-11-17",repeat_yearly:false,share_with_partner:true}];
 const next=upcomingOccasions(dates,"2026-11-16");
 assert.equal(next.length,1);
 assert.equal(next[0].days_until,4);
 assert.equal(next[0].next_on,"2026-11-20");
});
test("el 29 de febrero se ajusta al 28 en año no bisiesto y se mantiene en bisiesto",()=>{
 const item={id:"leap",kind:"aniversario",label:"Nuestro día",event_on:"2024-02-29",repeat_yearly:true};
 assert.equal(upcomingOccasions([item],"2027-02-27")[0].next_on,"2027-02-28");
 assert.equal(upcomingOccasions([item],"2028-02-28")[0].next_on,"2028-02-29");
});
test("fechas con valores imposibles o demasiado lejanas no activan un gesto",()=>{
 assert.deepEqual(upcomingOccasions([{event_on:"2025-02-30",label:"Incorrecta"}],"2026-11-16"),[]);
 assert.equal(occasionMission({label:"Memoria",days_until:40}),null);
});
test("una fecha real próxima inspira un gesto sin pedir compras",()=>{
 const m=occasionMission({label:"Nuestro primer paseo",days_until:3});
 assert.match(m.body,/foto|anécdota/i);
 assert.doesNotMatch(m.body,/comprar|pagar|hotel/i);
 assert.equal(m.theme,"recuerdos");
});
test("las categorías de fechas son explícitas y no inventan datos",()=>{
 assert.ok(DATE_TYPES.some(x=>x[0]==="aniversario"));
 assert.ok(DATE_TYPES.some(x=>x[0]==="cumpleanos"));
 assert.equal(new Set(DATE_TYPES.map(x=>x[0])).size,DATE_TYPES.length);
});
test("el panel muestra índice, pregunta profunda, calendario y permiso separado de push",()=>{
 const p=source("app/page.jsx");
 for(const x of ["knowledge.percent","weeklyPromptReady","DEEP_QUESTIONS","cp_important_dates","Guardar fecha importante","reflexiones profundas","reflection_prompts_enabled"])assert.ok(p.includes(x),x);
 assert.ok(p.includes("Guardar respuesta"));
});
test("IA de misiones recibe solamente fechas permitidas por RLS",()=>{
 const s=source("app/api/central/route.js");
 assert.ok(s.includes('db.from("cp_important_dates")'));
 assert.ok(s.includes("upcomingOccasions"));
 assert.ok(s.includes("importantDates:context.importantDates"));
 assert.ok(s.includes("occasionMission"));
});
test("cron privado no responde a llamadas sin autenticación interna",async()=>{
 const a=await engagementGet();assert.equal(a.status,405);
 const b=await engagementPost(new Request("https://complices-piloto.onrender.com/api/engagement/dispatch",{method:"POST"}));
 assert.equal(b.status,401);
});
