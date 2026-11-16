import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 CARE_NEEDS,localDay,selectAuthorizedCareHint,buildContextualCareIdea,pickCareAwareMission
} from "../lib/contextual-care.mjs";
const central=readFileSync(new URL("../app/api/central/route.js",import.meta.url),"utf8");
const page=readFileSync(new URL("../app/page.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/paired-redesign.css",import.meta.url),"utf8");
const moodSQL=readFileSync(new URL("../sql/20261116_mi_momento_de_hoy.sql",import.meta.url),"utf8");
const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const C="33333333-3333-4333-8333-333333333333";
const date="2026-11-16";
const approved=[{user_id:B,day:date,care_need:"descanso"}];
const context={today:date,recipientId:A,memberIds:[A,B]};

test("sólo se utiliza la necesidad autorizada de la otra persona de esta pareja, en el día local",()=>{
 assert.deepEqual(selectAuthorizedCareHint(approved,context),approved[0]);
 assert.equal(selectAuthorizedCareHint(approved,{...context,recipientId:B}),null);
 assert.equal(selectAuthorizedCareHint(approved,{...context,memberIds:[A,C]}),null);
 assert.equal(selectAuthorizedCareHint(approved,{...context,today:"2026-11-17"}),null);
 assert.equal(selectAuthorizedCareHint([{user_id:B,day:date,care_need:"angustia"}],context),null);
 assert.equal(selectAuthorizedCareHint([{user_id:B,day:date,care_need:"escucha"},{user_id:C,day:date,care_need:"abrazo"}],{...context,memberIds:[A,B,C]}),null);
 assert.equal(selectAuthorizedCareHint([],context),null);
});
test("al vencer o revocarse el permiso no se puede construir ninguna recomendación",()=>{
 assert.equal(buildContextualCareIdea({hint:null}),null);
 assert.equal(buildContextualCareIdea({hint:{user_id:B,day:date,care_need:"tristeza"}}),null);
 assert.equal(selectAuthorizedCareHint(approved,{...context,today:"2026-11-17"}),null);
 assert.equal(localDay(new Date("2026-11-16T02:15:00Z")),"2026-11-15");
});
test("las cinco necesidades producen ideas realizables sin revelar el estado emocional ni prometer terapia",()=>{
 assert.equal(CARE_NEEDS.length,5);
 const forbidden=/\b(angustia|tristeza|estresada|cansada|diagnóstic|terapia|tu pareja está|hoy se siente)\b/i;
 for(const care_need of CARE_NEEDS){
  const suggestion=buildContextualCareIdea({hint:{user_id:B,day:date,care_need}});
  assert.ok(suggestion?.title?.length>5,care_need);
  assert.ok(suggestion?.body?.length>=70,care_need);
  assert.equal(suggestion.kind,"care_suggestion");
  assert.equal(suggestion.day,date);
  assert.equal(suggestion.source_user_id,B);
  assert.equal(suggestion.source_code,care_need);
  assert.doesNotMatch(suggestion.title+" "+suggestion.body,forbidden);
 }
});
test("preferencias compartidas personalizan la necesidad sin atribuir gustos inventados",()=>{
 const hint={user_id:B,day:date,care_need:"descanso"};
 const withHelp=buildContextualCareIdea({hint,partnerProfile:{afecto:"ayuda"}});
 assert.match(withHelp.title,/peso menos/i);
 const withMate=buildContextualCareIdea({hint,partnerProfile:{afecto:"ayuda",detalle:"mate",presupuesto:"flexible"}});
 assert.match(withMate.body,/mate/i);
 const without=buildContextualCareIdea({hint,partnerProfile:{}});
 assert.doesNotMatch(without.body,/mate|chocolate|flores/i);
 const noMoney=buildContextualCareIdea({hint,partnerProfile:{detalle:"chocolate",presupuesto:"gratis"}});
 assert.doesNotMatch(noMoney.body,/chocolate/i);
});
test("feedback privado permite escoger una alternativa mejor sin usar respuestas ajenas",()=>{
 const hint={user_id:B,day:date,care_need:"descanso"};
 const initial=buildContextualCareIdea({hint});
 assert.equal(initial.theme,"detalles");
 const after=buildContextualCareIdea({hint,feedback:[{theme:"detalles",rating:-1},{theme:"charla",rating:1}]});
 assert.equal(after.theme,"charla");
});
test("las misiones pendientes siguen siendo primero; no se ofrecen tareas futuras",()=>{
 const today=[{key:"d:2026-11-16:one",theme:"humor"},{key:"d:2026-11-16:two",theme:"detalles"}];
 const pending=[{key:"d:2026-11-15:old",theme:"charla"}];
 const weekly=[{key:"w:2026-11-16:week",theme:"charla"}];
 const preferred=pickCareAwareMission({todayTasks:today,pendingTasks:pending,weeklyTasks:weekly,careNeed:"descanso"});
 assert.equal(preferred.key,today[1].key);
 const completed=pickCareAwareMission({todayTasks:today,pendingTasks:pending,weeklyTasks:weekly,careNeed:"descanso",isDone:key=>key===today[1].key});
 assert.equal(completed.key,today[0].key);
 const next=pickCareAwareMission({todayTasks:today,pendingTasks:pending,weeklyTasks:weekly,careNeed:"descanso",isDone:key=>today.some(x=>x.key===key)});
 assert.equal(next.key,pending[0].key);
 assert.equal(pickCareAwareMission({todayTasks:[],pendingTasks:[],weeklyTasks:[],careNeed:"descanso"}),null);
});
test("el servidor consulta exclusivamente la pista consentida y no la tabla de emociones",()=>{
 assert.match(central,/db\.from\("cp_partner_care_hints"\)\.select\("user_id,day,care_need"\)/);
 assert.doesNotMatch(central,/db\.from\("cp_today_moods"\)/);
 assert.match(central,/selectAuthorizedCareHint\(careHintRows\.data/);
 assert.match(central,/recipientId:user\.id,memberIds:/);
 assert.match(central,/careSuggestion:contextualCare/);
 assert.doesNotMatch(central,/safeContext\.[a-zA-Z]*[Mm]ood|mood:contextualCare|emotion:contextualCare/);
 assert.match(central,/const failed=\[.*careHintRows\]/);
});
test("la personalización temporal no se guarda en misiones ni altera los completados",()=>{
 assert.ok(!central.includes("context:{...context,authorizedHint")); // No en fingerprint persistente.
 assert.match(central,/const contextualCare=buildContextualCareIdea/);
 assert.match(central,/careSuggestion:contextualCare/);
 assert.match(central,/doneKeys\.has\(item\.task_key\)/);
 assert.match(moodSQL,/user_id <> \(select auth\.uid\(\)\)/);
 assert.match(moodSQL,/day = \(now\(\) at time zone 'America\/Argentina\/Buenos_Aires'\)::date/);
});
test("la interfaz retira al instante una pista revocada y no la replica en otra sección",()=>{
 assert.match(page,/if\(!careHintSignature\)\{setCarePlan\(null\);return\}/);
 assert.match(page,/carePlan\?\.source_user_id===partnerCareHint\.user_id/);
 assert.match(page,/carePlan\?\.source_code===partnerCareHint\.care_need/);
 assert.match(page,/carePlan\?\.day===date/);
 assert.match(page,/setCarePlan\(data\.careSuggestion\|\|null\)/);
 assert.match(page,/pickCareAwareMission\(/);
 assert.equal(page.split('className="mission-care-cue"').length-1,1);
 assert.match(css,/\.mission-care-cue\{/);
 assert.match(page,/No revela cómo se siente ni suma puntos/);
});
