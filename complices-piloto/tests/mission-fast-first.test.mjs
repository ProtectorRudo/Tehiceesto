import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectCachedWeeklyActivities,hasCachedMissions} from "../lib/mission-cache.mjs";
const page=readFileSync(new URL("../app/page.jsx",import.meta.url),"utf8");
const central=readFileSync(new URL("../app/api/central/route.js",import.meta.url),"utf8");
const U="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
const SPACE="33333333-3333-4333-8333-333333333333";
const OTHER_SPACE="44444444-4444-4444-8444-444444444444";
const W="2026-11-16";
const args={userId:U,spaceId:SPACE,week:W};
const row=(slot,key,fields={})=>({
 user_id:U,space_id:SPACE,period_key:"w:"+W,slot,task_key:key,
 kind:slot==="game_1"?"game":"mission",title:"Misión de esta semana",
 body:"Prepará algo concreto y elegí un momento para compartirlo.",
 mode:"generativa",...fields
});
test("se muestran misiones válidas de esta semana sin esperar a que se genere nada",()=>{
 const activities=[
  row("mission_2","d:2026-11-18:mission-2"),
  row("mission_1","d:2026-11-16:mission-1"),
  row("weekly_1","w:2026-11-16:central-week"),
  row("game_1","g:2026-11-16:central-game")
 ];
 const result=selectCachedWeeklyActivities(activities,args);
 assert.deepEqual(result.map(x=>x.slot),["mission_1","mission_2","weekly_1","game_1"]);
 assert.equal(hasCachedMissions(result),true);
 assert.equal(hasCachedMissions([result.at(-1)]),false);
 assert.equal(hasCachedMissions([]),false);
});
test("nunca se reutiliza la misión de otra cuenta, espacio o semana",()=>{
 const ok=row("mission_1","d:2026-11-16:mission-1");
 const invalid=[
  row("mission_1","d:2026-11-16:mission-1",{user_id:OTHER}),
  row("mission_1","d:2026-11-16:mission-1",{space_id:OTHER_SPACE}),
  row("mission_1","d:2026-11-16:mission-1",{period_key:"w:2026-11-09"}),
  row("mission_1","d:2026-11-23:mission-1"),
  row("weekly_1","w:2026-11-09:central-week"),
  row("game_1","g:2026-11-09:central-game"),
  row("mission_1","d:2026-11-16:mission-2"),
  row("mission_4","d:2026-11-16:mission-4"),
  row("mission_2","d:2026-11-18:mission-2",{title:" "}),
  row("mission_3","d:2026-11-20:mission-3",{body:" "})
 ];
 assert.deepEqual(selectCachedWeeklyActivities([...invalid,ok],args),[ok]);
 assert.deepEqual(selectCachedWeeklyActivities([ok],{...args,userId:OTHER}),[]);
 assert.deepEqual(selectCachedWeeklyActivities([ok],{...args,spaceId:OTHER_SPACE}),[]);
 assert.deepEqual(selectCachedWeeklyActivities([ok],{...args,week:"2026-11-09"}),[]);
});
test("sin semana válida, sin identidad o con datos corruptos no hay cache",()=>{
 const ok=row("mission_1","d:2026-11-16:mission-1");
 assert.deepEqual(selectCachedWeeklyActivities([ok],{...args,userId:null}),[]);
 assert.deepEqual(selectCachedWeeklyActivities([ok],{...args,spaceId:null}),[]);
 assert.deepEqual(selectCachedWeeklyActivities([ok],{...args,week:"2026-11-17"}),[]);
 assert.deepEqual(selectCachedWeeklyActivities([ok],{...args,week:"inventada"}),[]);
 assert.deepEqual(selectCachedWeeklyActivities(null,args),[]);
});
test("las filas repetidas no crean misiones duplicadas ni desplazan la primera",()=>{
 const a=row("mission_1","d:2026-11-16:mission-1");
 const b=row("mission_1","d:2026-11-16:mission-1",{title:"Duplicado"});
 assert.deepEqual(selectCachedWeeklyActivities([a,b],args),[a]);
});
test("la carga guardada precede a la llamada IA, sin almacenarse en navegador",()=>{
 const fast=page.indexOf('db.from("cp_ai_activities")\n     .select("*").eq("user_id",ownerId)');
 const refresh=page.indexOf("if(!cancelled)refreshCentral();",fast);
 assert.ok(fast>0&&refresh>fast);
 assert.match(page,/\.eq\("space_id",spaceId\)/);
 assert.match(page,/\.eq\("period_key","w:"\+week\)/);
 assert.match(page,/selectCachedWeeklyActivities\(data,\{userId:ownerId,spaceId,week\}\)/);
 assert.match(page,/hasCachedMissions\(saved\)/);
 assert.match(page,/setCentralActivities\(saved\)/);
 assert.doesNotMatch(page,/localStorage\.setItem\("cp_mission|sessionStorage\.setItem\("cp_mission/);
});
test("la IA trabaja sin tapar la misión y conserva el respaldo ante errores",()=>{
 assert.match(page,/focusMission\?"Afinando ideas…":"Buscando misiones…"/);
 assert.match(page,/setCentralActivities\(prev=>fresh\.length\?fresh:prev\)/);
 assert.match(page,/setCentralLoading\(true\)/);
 assert.match(page,/Tu misión guardada sigue disponible/);
 assert.match(page,/centralAppliedRef\.current===before/);
 assert.match(page,/centralRequestRef\.current/);
 assert.match(page,/if\(!cancelled\)refreshCentral\(\)/);
 assert.match(page,/a\.period_key==="w:"\+week/);
 assert.match(central,/doneKeys\.has\(item\.task_key\)/);
 assert.match(central,/if\(old\.mode==="generativa"&&item\.mode!=="generativa"\)continue/);
});
