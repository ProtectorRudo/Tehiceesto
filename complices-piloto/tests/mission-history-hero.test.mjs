import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isMissionCompletion,buildMissionHistory,missionDateLabel} from "../lib/mission-history.mjs";
const page=readFileSync(new URL("../app/page.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/paired-redesign.css",import.meta.url),"utf8");

test("separar misiones realizadas de preguntas, juegos y tareas futuras",()=>{
 assert.equal(isMissionCompletion("d:2026-11-16:mission-1"),true);
 assert.equal(isMissionCompletion("w:2026-11-16:central-week"),true);
 assert.equal(isMissionCompletion("q:pregunta"),false);
 assert.equal(isMissionCompletion("g:2026-11-16:game"),false);
 assert.equal(isMissionCompletion("nota"),false);
});
test("cada cuenta ve exclusivamente sus títulos históricos",()=>{
 const completions=[
  {user_id:"a",task_key:"d:2026-11-16:mission-1",completed_at:"2026-11-16T14:00:00Z"},
  {user_id:"b",task_key:"d:2026-11-16:mission-2",completed_at:"2026-11-16T14:05:00Z"},
  {user_id:"a",task_key:"q:2026-11-16:question",completed_at:"2026-11-16T14:10:00Z"},
  {user_id:"a",task_key:"w:2026-11-16:central-week",completed_at:"2026-11-16T15:00:00Z"}
 ];
 const details=[
  {user_id:"a",task_key:"d:2026-11-16:mission-1",title:"Una foto para recordar",icon:"📸"},
  {user_id:"b",task_key:"d:2026-11-16:mission-2",title:"Secreto personal",icon:"🤫"},
  {user_id:"b",task_key:"w:2026-11-16:central-week",title:"Título privado ajeno",icon:"🤐"}
 ];
 const history=buildMissionHistory(completions,details,"a");
 assert.equal(history.length,2);
 assert.equal(history[0].type,"Misión semanal");
 assert.equal(history[0].title,"Misión realizada");
 assert.equal(history[1].title,"Una foto para recordar");
 assert.equal(history[1].icon,"📸");
 assert.ok(!JSON.stringify(history).includes("Secreto personal"));
 assert.ok(!JSON.stringify(history).includes("Título privado ajeno"));
 assert.deepEqual(buildMissionHistory(completions,details,null),[]);
});
test("desmarcar una tarea deja de mostrarla en el historial",()=>{
 const old=[{user_id:"a",task_key:"d:2026-11-16:mission-1",completed_at:"2026-11-16T14:00:00Z"}];
 assert.equal(buildMissionHistory(old,[],"a").length,1);
 assert.equal(buildMissionHistory([],[],"a").length,0);
});
test("fechas del historial son legibles en Argentina y no inventan datos",()=>{
 assert.match(missionDateLabel("2026-11-16T14:00:00Z"),/16 nov 2026/);
 assert.equal(missionDateLabel(""),"Fecha no registrada");
 assert.equal(missionDateLabel("not-a-date"),"Fecha no registrada");
});
test("los títulos provienen de actividades propias guardadas, sin nueva tabla",()=>{
 assert.match(page,/db\.from\("cp_completions"\)\.select\("\*"\)\.eq\("space_id",m\.space_id\)/);
 assert.match(page,/db\.from\("cp_ai_activities"\)\.select\("user_id,task_key,title,icon"\)\.eq\("user_id",u\.id\)\.eq\("kind","mission"\)/);
 assert.match(page,/buildMissionHistory\(activities,missionHistoryDetails\|\|\[\],user\?\.id\)/);
 assert.match(page,/missionDateLabel\(item\.completedAt\)/);
});
test("misión destacada antes del historial, calendario, pregunta y emoción",()=>{
 const today=page.split(' {tab==="hoy"&&<>')[1]?.split(' {(tab==="juegos"||tab==="preguntas")')[0];
 assert.ok(today);
 const tokens=['className="primary-mission mission-spotlight"','className="mission-history"','className="mission-archive"','className="section-title today-question-title"','<DailyMoodCard'];
 const positions=tokens.map(t=>today.indexOf(t));
 assert.ok(positions.every(n=>n>=0),JSON.stringify(positions));
 assert.ok(positions.every((n,i)=>i===0||n>positions[i-1]),JSON.stringify(positions));
 assert.match(today,/missionHistory\.length===1\?"misión realizada":"misiones realizadas"/);
 assert.match(today,/Ver todo el historial/);
 assert.match(today,/missionHistoryError/);
});
test("misión visualmente dominante con CTA accesible y pregunta secundaria",()=>{
 for(const s of [".mission-spotlight{",".mission-spotlight .primary-mission-heading h2{",".mission-spotlight .primary-mission-cards .task-card{",".mission-spotlight .primary-mission-cards .task-card .task-footer>.btn{",".mission-history-entry{",".today-question-card{","@media(max-width:760px)"])
  assert.ok(css.includes(s),s);
 assert.match(page,/aria-label="Tu misión destacada"/);
 assert.match(page,/aria-label="Historial personal de misiones realizadas"/);
 assert.match(page,/aria-expanded=\{showAllMissionHistory\}/);
});
