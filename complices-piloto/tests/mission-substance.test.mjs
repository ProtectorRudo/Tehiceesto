import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditMissionSubstance,isClearlyWeakMission,QUALITY_STANDARD_VERSION} from "../lib/mission-substance.mjs";
import {evaluateEditorialCandidate,EDITORIAL_ENGINE_VERSION} from "../lib/mission-editorial.mjs";
import {meaningfulPartnerPlan} from "../lib/meaningful-partner.mjs";
const central=readFileSync(new URL("../app/api/central/route.js",import.meta.url),"utf8");
const page=readFileSync(new URL("../app/page.jsx",import.meta.url),"utf8");
const playbook=readFileSync(new URL("../lib/meaningful-playbook.mjs",import.meta.url),"utf8");

test("rechaza la misión semanal real, que no tiene gesto afectivo",()=>{
 const existing={slot:"weekly_1",title:"Menú de juego tranquilo",
  body:"En 25 minutos, prepará con lo que haya un bocado sencillo y armá un menú de fantasía con nombres graciosos para cada integrante. Ofrecéselo sin apuro y guardá el menú por si después quiere mirarlo."};
 const quality=auditMissionSubstance(existing);
 assert.equal(quality.pass,false);
 assert.ok(quality.issues.includes("shallow_activity_not_care"));
 assert.equal(isClearlyWeakMission(existing),true);
});
test("el mismo filtro se aplica a ocurrencias superficiales diarias",()=>{
 const examples=[
  {slot:"mission_1",title:"Tres pistas para adivinar",body:"Inventá tres pistas sobre una anécdota y proponé que tu pareja adivine de qué se trata."},
  {slot:"mission_2",title:"Nombres graciosos",body:"Prepará un juego con nombres graciosos para objetos de la casa y disfruten juntos."},
  {slot:"weekly_1",title:"Un menú imaginario",body:"Armen un menú imaginario con nombres graciosos para cada integrante y compartan un bocado juntos."},
  {slot:"weekly_1",title:"Tres preguntas absurdas",body:"Inventá tres preguntas absurdas y jugá a responderlas con tu pareja."}
 ];
 for(const e of examples)
  assert.ok(!auditMissionSubstance(e).pass,JSON.stringify(e));
});
test("acepta gestos concretos de reconocimiento, apoyo o conexión",()=>{
 const weekly={slot:"weekly_1",title:"Una cita para cuidar la semana",
  body:"Organizá vos una noche tranquila con una película que tu pareja disfrute. Prepará todo en casa y compartan ese momento para reconocer lo que construyen juntos, sin pedir nada a cambio."};
 const daily={slot:"mission_1",title:"Un agradecimiento oportuno",
  body:"Prepará una nota sobre un gesto de tu pareja que admirás, dejásela en un lugar privado y contale cuándo te ayudó de verdad."};
 assert.equal(auditMissionSubstance(weekly).pass,true);
 assert.equal(auditMissionSubstance(daily).pass,true);
});
test("rechaza editorial generativa con fantasía de menú aunque tenga una acción",()=>{
 const candidate={title:"Menú de juego tranquilo",mechanic:"humor",
  body:"Prepará un bocado con lo que haya y armá un menú de fantasía con nombres graciosos para tu pareja. Dejá que lo mire después si quiere para recordar el momento."};
 const result=evaluateEditorialCandidate(candidate,{slot:"weekly_1",partnerProfile:{}});
 assert.equal(result.pass,false);
 assert.ok(result.issues.includes("shallow_activity_not_care"));
});
test("los respaldos actuales de juego no dependen de tres adivinanzas",()=>{
 const p=meaningfulPartnerPlan({plan:"jugar",objetivo:"diversion"});
 assert.doesNotMatch(p.ideas.map(x=>x.title+" "+x.body).join(" "),/tres pistas|adivinar tres an[eé]cdotas/i);
 assert.doesNotMatch(playbook,/Premios inventados|Una noche de tres preguntas|El título absurdo/);
});
test("ni el cache ni el cliente conservan una misión débil sólo por venir de IA",()=>{
 assert.ok(EDITORIAL_ENGINE_VERSION.includes(QUALITY_STANDARD_VERSION));
 assert.match(central,/isClearlyWeakMission\(item\)/);
 assert.match(central,/!isClearlyWeakMission\(old\)/);
 assert.match(central,/doneKeys\.has\(item\.task_key\)/);
 assert.match(page,/!isClearlyWeakMission\(a\)\|\|activities\.some/);
 assert.match(central,/Las misiones individuales deben ser gestos/);
 assert.match(central,/La misión semanal dura de 15 a 45 minutos/);
 assert.doesNotMatch(central,/guidedExamples:guided/);
});
