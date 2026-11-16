import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {pickFocusMission,focusMissionHeading,OPTIONAL_GESTURE} from "../lib/today-focus.mjs";
import {buildWeeklyMissions} from "../lib/weekly-missions.mjs";
const page=readFileSync(new URL("../app/page.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/paired-redesign.css",import.meta.url),"utf8");
const central=readFileSync(new URL("../app/api/central/route.js",import.meta.url),"utf8");

const due="2026-11-16";
const today={key:"d:2026-11-16:mission-1",slot:"mission_1",due};
const old={key:"d:2026-11-14:mission-2",slot:"mission_2",due:"2026-11-14"};
const weekly={key:"w:2026-11-16:central-week",slot:"weekly_1"};
const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const S="33333333-3333-4333-8333-333333333333";
const members=[{user_id:A,joined_at:"2026-11-15T10:00:00Z"},{user_id:B,joined_at:"2026-11-15T11:00:00Z"}];

test("la misión de hoy es lo primero cuando está pendiente",()=>{
 assert.equal(pickFocusMission({todayTasks:[today],pendingTasks:[old],weeklyTasks:[weekly]})?.key,today.key);
 assert.equal(focusMissionHeading(today,due),"Tu misión de hoy");
});
test("sin misión de hoy, recuperar una pendiente o mostrar la semanal",()=>{
 assert.equal(pickFocusMission({pendingTasks:[old],weeklyTasks:[weekly]})?.key,old.key);
 assert.equal(pickFocusMission({pendingTasks:[old],weeklyTasks:[weekly],isDone:key=>key===old.key})?.key,weekly.key);
 assert.equal(focusMissionHeading(weekly,due),"Tu gesto de esta semana");
 assert.equal(focusMissionHeading(old,due),"Una misión que te espera");
});
test("un día libre muestra un gesto opcional y nunca destapa futuras misiones",()=>{
 assert.equal(pickFocusMission({todayTasks:[],pendingTasks:[],weeklyTasks:[]}),null);
 assert.equal(pickFocusMission({todayTasks:[today],weeklyTasks:[weekly],isDone:()=>true}),null);
 assert.match(OPTIONAL_GESTURE.body,/No suma puntos ni es una obligación/);
 assert.match(page,/OPTIONAL_GESTURE.title/);
 assert.match(page,/centralLoading\?<div className="mission-rest-note">Preparando/);
});
test("una navegación con cinco destinos y las preguntas dentro de Juegos",()=>{
 const nav=page.match(/const NAV=(\[\[.*?\]\]);/);
 assert.ok(nav);
 assert.equal((nav[1].match(/\["/g)||[]).length,5);
 assert.ok(!nav[1].includes('"misiones"'));
 assert.ok(page.includes('className="play-hub-nav"'));
 assert.ok(page.includes('className="mission-archive"'));
 assert.ok(!page.includes('tab==="misiones"'));
});
test("el estado emocional queda abajo de las recomendaciones y misiones",()=>{
 const h=page.split(' {tab==="hoy"&&<>')[1].split(' {(tab==="juegos"||tab==="preguntas")')[0];
 assert.ok(h.indexOf('className="primary-mission"')<h.indexOf('className="mission-archive"'));
 assert.ok(h.indexOf('className="mission-archive"')<h.indexOf('Una pregunta que acerca'));
 assert.ok(h.indexOf('partnerCareHint&&')<h.indexOf('<DailyMoodCard'));
});
test("retiro total de la ilustración de personas sin romper la bienvenida",()=>{
 assert.equal(existsSync(new URL("../public/couple-sunset.svg",import.meta.url)),false);
 assert.doesNotMatch(page,/couple-sunset\.svg|Dos personas abrazadas mirando un atardecer/);
 assert.doesNotMatch(css,/couple-sunset\.svg/);
 assert.match(page,/hero-art hero-abstract/);
 assert.match(page,/onboarding-art onboarding-abstract/);
 assert.match(page,/today-welcome/);
});
test("el aprendizaje solo se pregunta después de completar, es opcional y privado",()=>{
 assert.match(page,/task\.id&&done&&<div className="mission-outcome"/);
 assert.match(page,/¿Cómo sentís que salió este gesto\?/);
 assert.match(page,/Tu impresión es privada/);
 assert.match(page,/Nos acercó/);
 assert.match(page,/No era el momento/);
 assert.match(page,/onRate\?\.\(1\)/);
 assert.match(page,/onRate\?\.\(-1\)/);
 assert.match(page,/cp_ai_feedback/);
});
test("el motor guiado evita temporalmente los temas que no funcionaron",()=>{
 const x=buildWeeklyMissions({userId:A,spaceId:S,week:due,members,avoidThemes:["recuerdos","humor"]});
 assert.ok(x.activities.filter(t=>t.kind==="mission").every(t=>!["recuerdos","humor"].includes(t.theme)));
 const preferred=buildWeeklyMissions({userId:A,spaceId:S,week:due,members,preferThemes:["cocina"]});
 assert.equal(preferred.activities.find(t=>t.slot==="mission_1")?.theme,"cocina");
 assert.match(central,/recentRatingCutoff=Date\.now\(\)-21\*86400000/);
 assert.match(central,/avoidThemes,preferThemes/);
 assert.match(central,/select\("activity_id,rating,updated_at"\)/);
});
test("se conserva la misión compartida y no se filtra feedback del otro",()=>{
 const week="2026-11-30";
 const a=buildWeeklyMissions({userId:A,spaceId:S,week,members,avoidThemes:["cocina"],preferThemes:["paseo"]});
 const b=buildWeeklyMissions({userId:B,spaceId:S,week,members,avoidThemes:["humor"],preferThemes:["charla"]});
 assert.deepEqual(a.activities.find(x=>x.slot==="weekly_1"),b.activities.find(x=>x.slot==="weekly_1"));
});
