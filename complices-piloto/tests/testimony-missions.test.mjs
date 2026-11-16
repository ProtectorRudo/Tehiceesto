import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PUBLIC_INSPIRATION,selectInspiration,TESTIMONY_LIBRARY_VERSION} from "../lib/testimony-inspiration.mjs";
import {auditMissionSubstance} from "../lib/mission-substance.mjs";
import {meaningfulPartnerPlan} from "../lib/meaningful-partner.mjs";
import {evaluateEditorialCandidate} from "../lib/mission-editorial.mjs";
const central=readFileSync(new URL("../app/api/central/route.js",import.meta.url),"utf8");

test("la biblioteca tiene inspiración rastreable, no copia testimonios ni identidades",()=>{
 assert.equal(PUBLIC_INSPIRATION.length,6);
 assert.equal(new Set(PUBLIC_INSPIRATION.map(x=>x.id)).size,6);
 assert.ok(PUBLIC_INSPIRATION.every(x=>x.mechanism.length>35&&x.action.length>55&&x.care));
 assert.ok(PUBLIC_INSPIRATION.every(x=>/^https:\/\/www\.(reddit\.com|gottman\.com)\//.test(x.source)));
 assert.ok(TESTIMONY_LIBRARY_VERSION.includes("testimony"));
 const safe=selectInspiration({partnerProfile:{plan:"jugar"}});
 assert.ok(safe.length<=4&&safe.length>=3);
 assert.ok(safe.every(x=>!Object.hasOwn(x,"source")&&!Object.hasOwn(x,"matches")));
});
test("el criterio se adapta a gustos autorizados sin datos personales privados",()=>{
 const playing=selectInspiration({partnerProfile:{plan:"jugar",objetivo:"diversion"}});
 assert.equal(playing[0].id,"tiempo_preparado");
 const relief=selectInspiration({partnerProfile:{afecto:"ayuda",objetivo:"equipo"}});
 assert.equal(relief[0].id,"alivio_concreto");
 const recognition=selectInspiration({partnerProfile:{afecto:"palabras",deseo:"reconocimiento"}});
 assert.equal(recognition[0].id,"reconocimiento_especifico");
 const invalid=selectInspiration({partnerProfile:{plan:"una_confesion_privada",deseo:"ver_emocion"}});
 const none=selectInspiration({partnerProfile:{}});
 assert.deepEqual(invalid,none);
});
test("la misión semanal de la captura es rechazada por falta de instrucciones concretas",()=>{
 const weekly={slot:"weekly_1",title:"Una cita para reír a nuestra manera",
  body:"Organizá vos un rato de veinte minutos con un juego que tu pareja disfrute. Prepará todo con lo que tengan, sumá un guiño a una historia real de ustedes e invitale a compartirlo si tiene ganas."};
 const r=auditMissionSubstance(weekly);
 assert.equal(r.pass,false);
 assert.ok(r.issues.includes("vague_instruction"));
 const daily={slot:"mission_1",title:"Inventá algo entretenido",
  body:"Elegí un juego breve que tu pareja realmente disfrute. Compartí con ella un rato especial."};
 assert.ok(auditMissionSubstance(daily).issues.includes("vague_instruction"));
});
test("el respaldo ahora ofrece nombres y pasos concretos sin inventar gustos específicos",()=>{
 const p=meaningfulPartnerPlan({plan:"jugar",objetivo:"diversion",presupuesto:"gratis"});
 assert.match(p.ideas[1].body,/Trazo o Entre Dos/);
 assert.match(p.ideas[2].body,/Trazo o Entre Dos/);
 assert.match(p.ideas[2].body,/abrí Juegos en Cómplices/i);
 assert.match(p.ideas[2].body,/Al terminar/);
 assert.equal(auditMissionSubstance({...p.ideas[2],slot:"weekly_1"}).pass,true);
 assert.equal(auditMissionSubstance({...p.ideas[1],slot:"mission_2"}).pass,true);
});
test("sigue exigiendo cuidado relacional y consentimiento, no un juego por sí solo",()=>{
 const empty={slot:"weekly_1",title:"Una partida por la tarde",
  body:"Abrí Juegos en Cómplices y proponé jugar veinte minutos. Después comparten algo divertido."};
 assert.equal(auditMissionSubstance(empty).pass,false);
 const care={slot:"weekly_1",title:"La partida que ya preparaste",
  body:"Esta semana abrí Juegos en Cómplices y elegí Trazo o Entre Dos. Prepará un rato de veinte minutos sin interrupciones e invitá a tu pareja a jugar si quiere. Al terminar, contale qué disfrutaste de estar juntos."};
 assert.equal(auditMissionSubstance(care).pass,true);
});
test("inspiraciones llegan al editor generativo con los códigos autorizados solamente",()=>{
 assert.match(central,/testimonyInspiredPatternsBySlot:/);
 assert.match(central,/selectInspiration\(\{partnerProfile:context\.partnerProfile,slot,limit:2\}\)/);
 assert.match(central,/Las inspiraciones editoriales son mecanismos abstraídos de testimonios públicos/);
 assert.match(central,/No dejes que el usuario tenga que inventar el plan/);
 assert.match(central,/sin inventar una favorita/i);
 assert.doesNotMatch(central,/db\.from\("cp_today_moods"\)/);
});
test("las propuestas generativas incomprensibles son descartadas aunque estén bien escritas",()=>{
 const vague=evaluateEditorialCandidate({
  title:"Una cita para reír a nuestra manera",
  body:"Organizá vos un rato de veinte minutos con un juego que tu pareja disfrute. Prepará todo con lo que tengan, sumá un guiño a una historia real de ustedes e invitale a compartirlo si tiene ganas.",
  mechanic:"experiencia"
 },{slot:"weekly_1",partnerProfile:{plan:"jugar"}});
 assert.equal(vague.pass,false);
 assert.ok(vague.issues.includes("vague_instruction"));
});
