import test from "node:test";
import assert from "node:assert/strict";
import {deriveThemes,generateGuidedPlan,answerIsSafe,THEMES} from "../lib/central-content.mjs";
const base={userId:"test-user-1",date:"2026-11-15",week:"2026-11-09",preferences:{favorite_plan:"cocinar",favorite_treat:"ninguno",love_language:"tiempo"},reflections:[],memories:[],recent:[],ratings:[],hint:null};
test("actividades consistentes y guardables en las cuatro secciones",()=>{
 const a=generateGuidedPlan(base),b=generateGuidedPlan(base);
 assert.deepEqual(a,b);
 assert.deepEqual(a.map(x=>x.slot),["daily_1","daily_2","weekly_1","game_1"]);
 assert.equal(new Set(a.map(x=>x.task_key)).size,4);
 assert.deepEqual(a.map(x=>x.points),[40,30,120,20]);
 for(const item of a){assert.ok(THEMES.includes(item.theme));assert.ok(item.body.length>=8)}
});
test("las preferencias elegidas aumentan el tema afín",()=>{
 const score=deriveThemes(base);
 assert.ok(score.cocina>score.humor);
});
test("lo que una persona no autorizó no afecta la selección",()=>{
 const baseline=deriveThemes(base);
 const withSecret=deriveThemes({...base,reflections:[{question_id:"q01",answer:"Quiero cocinar",ai_use_allowed:false}],memories:[{category:"gustos",body:"Me encanta cocinar",use_for_ai:false}]});
 assert.deepEqual(baseline,withSecret);
});
test("una preferencia de evitar descarta ese tema",()=>{
 const score=deriveThemes({...base,memories:[{category:"evitar",body:"Prefiero evitar cocinar recetas largas",use_for_ai:true}]});
 assert.ok(score.cocina<score.charla);
});
test("feedback negativo reduce una categoría y positivo la aumenta",()=>{
 const negative=deriveThemes({...base,ratings:[{theme:"pelicula",rating:-1}]}),positive=deriveThemes({...base,ratings:[{theme:"pelicula",rating:1}]});
 assert.ok(positive.pelicula>negative.pelicula);
});
test("las pistas autorizadas de la pareja solo alteran una misión personal",()=>{
 const a=generateGuidedPlan({...base,hint:{title:"Una sorpresa dulce",body:"Tené un detalle agradable con tu pareja"}}); 
 assert.equal(a[0].title,"Una sorpresa dulce");
 assert.ok(a.slice(1).every(item=>!item.body.includes("Una sorpresa dulce")));
});
test("el juego propuesto no revela textos privados",()=>{
 const privateText="CONFESION_PRIVADA_NO_COMPARTIR";
 const a=generateGuidedPlan({...base,reflections:[{question_id:"q01",answer:privateText,ai_use_allowed:true}]});
 assert.ok(a.every(x=>!x.title.includes(privateText)&&!x.body.includes(privateText)));
});
test("el contenido libre rechaza URLs y textos fuera de rango",()=>{
 assert.equal(answerIsSafe("Un paseo tranquilo para dos"),true);
 assert.equal(answerIsSafe("https://malicious.example/x"),false);
 assert.equal(answerIsSafe("corto"),false);
});

test("la pista voluntaria de pareja prioriza un tema sin mostrar sus palabras",()=>{
 const secret="NUNCA_REVELAR_TEXTO_LIBRE_DE_MI_PAREJA";
 const activities=generateGuidedPlan({...base,partnerSignals:["paseo"],reflections:[]});
 assert.equal(activities[0].theme,"paseo");
 assert.equal(activities[3].theme,"paseo");
 assert.ok(activities.every(x=>!x.body.includes(secret)&&!x.title.includes(secret)));
});
test("temas desconocidos o pistas no autorizadas no afectan el motor",()=>{
 const untrusted=generateGuidedPlan({...base,partnerSignals:["NO_AUTORIZADO","nombre",""]});
 const standard=generateGuidedPlan(base);
 assert.deepEqual(untrusted,standard);
});
test("el plan sigue determinista con varios temas permitidos",()=>{
 const config={...base,partnerSignals:["charla","cocina","humor"]};
 assert.deepEqual(generateGuidedPlan(config),generateGuidedPlan(config));
});
