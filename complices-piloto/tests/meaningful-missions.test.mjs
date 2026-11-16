import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {evaluateMission,MISSION_EDITORIAL_RULES} from "../lib/mission-quality.mjs";
import {meaningfulPartnerPlan} from "../lib/meaningful-partner.mjs";
import {MEANINGFUL_PLAYBOOK} from "../lib/meaningful-playbook.mjs";
import {mergeGeneratedIdeas,generateGuidedPlan} from "../lib/central-content.mjs";
import {isIdeaCompatible} from "../lib/ai-profile.mjs";

test("rechaza frases vacías que no son misiones concretas",()=>{
 const x=evaluateMission({title:"Un gesto especial",body:"Hagan algo lindo juntos y pásenla bien, así demuestran cuánto se quieren.",slot:"daily_1"});
 assert.equal(x.pass,false);
 assert.ok(x.issues.includes("platitude")||x.issues.includes("no_concrete_detail"));
});
test("rechaza tareas que requieren demasiado tiempo",()=>{
 const x=evaluateMission({title:"La gran aventura",body:"Organizá una fiesta para toda la noche y viajá todo el día para sorprender a tu pareja.",slot:"daily_1"});
 assert.equal(x.pass,false);
 assert.ok(x.issues.includes("too_difficult"));
});
test("con gustos autorizados la IA debe mencionar algo relacionado",()=>{
 const accepted=evaluateMission({
  title:"Un mate con un recuerdo",
  body:"Si ya tienen mate, prepará uno y dejá una nota con un detalle que admirás de tu pareja.",
  slot:"daily_1",partnerProfile:{detalle:"mate"}
 });
 assert.equal(accepted.pass,true,accepted.issues.join(", "));
 assert.equal(accepted.personalized,true);
 const unrelated=evaluateMission({
  title:"Un mensaje cualquiera",
  body:"Dejale una nota con un agradecimiento sincero, que pueda leer en privado sin apuro.",
  slot:"daily_1",partnerProfile:{detalle:"mate"}
 });
 assert.equal(unrelated.pass,false);
 assert.ok(unrelated.issues.includes("no_approved_taste_anchor"));
});
test("no confunde preparar una nota con el gusto autorizado por cocinar",()=>{
 const x=evaluateMission({
  title:"Una nota para vos",
  body:"Prepará una nota con una frase que le recuerde un momento lindo juntos.",
  slot:"daily_1",partnerProfile:{plan:"cocinar"}
 });
 assert.equal(x.pass,false);
 assert.ok(x.issues.includes("no_approved_taste_anchor"));
});
test("una misión concreta que respeta cocinar y presupuesto es admisible",()=>{
 const x=evaluateMission({
  title:"Nuestra receta corta",
  body:"Con ingredientes que ya tengan, elegí una receta sencilla y cocinen diez minutos mientras recuerdan una anécdota de ustedes.",
  slot:"daily_2",partnerProfile:{plan:"cocinar",presupuesto:"gratis"}
 });
 assert.equal(x.pass,true,x.issues.join(", "));
});
test("no repite misiones con distinto día si el título ya apareció",()=>{
 const x=evaluateMission({
  title:"Una nota que queda",
  body:"Escribí una nota con un agradecimiento concreto que te gustaría contarle a tu pareja.",
  slot:"daily_1",recentTitles:["una nota QUE queda"]
 });
 assert.equal(x.pass,false);
 assert.ok(x.issues.includes("repeated"));
});
test("el juego tiene que contener una pregunta real",()=>{
 const base={title:"Un juego",body:"Contale una anécdota sobre algo divertido que haya ocurrido en la semana",slot:"game_1"};
 assert.equal(evaluateMission(base).pass,false);
 assert.equal(evaluateMission({...base,body:"¿Qué anécdota compartida te hizo reír esta semana?"}).pass,true);
});
test("si falta una ancla de gusto, se preserva la alternativa guiada",()=>{
 const fallback=generateGuidedPlan({userId:"00000000-0000-0000-0000-000000000005",date:"2026-11-16",week:"2026-11-16",preferences:{},reflections:[],memories:[],recent:[],ratings:[]});
 const response={
  daily_1:{title:"Una nota bonita",body:"Dejale una nota con un detalle concreto que admirás de tu pareja."},
  daily_2:{title:"Un juego de recuerdos",body:"Preguntale qué foto de ustedes elegiría guardar por muchos años."},
  weekly_1:{title:"Una merienda para los dos",body:"Con lo que tienen en casa, prepará una merienda tranquila y compartan un recuerdo."},
  game_1:{title:"La historia favorita",body:"¿Qué anécdota de nosotros querés recordar más a menudo?"}
 };
 const done=mergeGeneratedIdeas(fallback,response,text=>isIdeaCompatible(text,{detalle:"mate"}),{partnerProfile:{detalle:"mate"}});
 assert.equal(done[0].mode,"guiado");
 assert.equal(done[0].body,fallback[0].body);
});
test("el respaldo personalizado adapta detalles, planes y objetivos por separado",()=>{
 const p=meaningfulPartnerPlan({detalle:"mate",plan:"cocinar",objetivo:"equipo",presupuesto:"gratis"});
 assert.equal(p.hasSignals,true);
 assert.match(p.ideas[0].body,/mate/i);
 assert.match(p.ideas[1].body,/ingredientes|receta/i);
 assert.match(p.ideas[2].body,/receta/i);
 assert.equal(p.ideas.length,3);
 assert.match(p.game.body,/\?/);
});
test("el consentimiento de gasto cero se respeta sin quitar el significado",()=>{
 const x=meaningfulPartnerPlan({detalle:"chocolate",plan:"paseo",presupuesto:"gratis"});
 assert.match(x.ideas[0].body,/nota/i);
 assert.doesNotMatch(x.ideas.map(v=>v.body).join(" "),/compr[aá]|pag[aá]l[eo]/i);
 assert.match(x.ideas[1].body,/gratuit|diez minutos|breve/i);
});
test("el respaldo no asegura conocer a la pareja sin pistas",()=>{
 const p=meaningfulPartnerPlan({});
 assert.equal(p.hasSignals,false);
 assert.ok(p.ideas.every(x=>x.body.length>=60));
});
test("el repertorio ofrece propuestas distintas para ocho intereses",()=>{
 assert.equal(Object.keys(MEANINGFUL_PLAYBOOK).length,8);
 for(const [theme,variant] of Object.entries(MEANINGFUL_PLAYBOOK)){
  assert.equal(variant.daily.length,3,theme);
  assert.equal(variant.weekly.length,2,theme);
  assert.equal(variant.game.length,2,theme);
  assert.ok(variant.daily.every(x=>x[1].length>=60),theme);
  assert.ok(variant.weekly.every(x=>x[1].length>=60),theme);
  assert.ok(variant.game.every(x=>x.includes("?")),theme);
 }
});
test("reglas editoriales ponen significado y facilidad por delante de tareas largas",()=>{
 assert.match(MISSION_EDITORIAL_RULES.dailyMinutes,/15/);
 assert.match(MISSION_EDITORIAL_RULES.meaning,/conocido|escuchado|recordado/);
});
test("el motor pide cuatro misiones concretas y rechaza propuestas vagas",()=>{
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const central=readFileSync(resolve(root,"app/api/central/route.js"),"utf8");
 assert.ok(central.includes("MISSION_EXAMPLES"));
 assert.ok(central.includes("Prohibido"));
 assert.ok(central.includes("EDITORIAL_ENGINE_VERSION"));
 assert.ok(central.includes("buildWeeklyMissions"));
 assert.ok(central.includes("recentTitles"));
 assert.ok(central.includes("maxOutputTokens:2200"));
});

test("la IA no impone compras para completar misiones",()=>{
 const x=evaluateMission({title:"Compra un regalo",body:"Comprale una caja de chocolates para mostrarle tu cariño.",slot:"daily_1"});
 assert.equal(x.pass,false);
 assert.ok(x.issues.includes("requires_spending"));
});
test("la IA no propone contacto sin preguntar",()=>{
 const x=evaluateMission({title:"Un abrazo sorpresa",body:"Abrazala por sorpresa cuando no lo espere para mostrarle cuánto te importa.",slot:"daily_1"});
 assert.equal(x.pass,false);
 assert.ok(x.issues.includes("unconsented_contact"));
});
