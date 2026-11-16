import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import {CENTRAL_SLOTS,mergeGeneratedIdeas,generateGuidedPlan,deriveThemes} from "../lib/central-content.mjs";
import {isIdeaCompatible} from "../lib/ai-profile.mjs";
import {GET as retiredGet,POST as retiredPost} from "../app/api/complice/route.js";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=(file)=>readFileSync(resolve(root,file),"utf8");
const base=generateGuidedPlan({userId:"e8f88715-66d3-4c32-b700-18ac878d0001",date:"2026-11-16",week:"2026-11-16",preferences:{},reflections:[],memories:[],recent:[],ratings:[],partnerSignals:[]});
const generated={
 daily_1:{title:"Una nota alegre",body:"Dejale una nota a tu pareja con un agradecimiento concreto y sencillo."},
 daily_2:{title:"Un paseo breve",body:"Invitá a tu pareja a una caminata corta por un lugar cercano, sin apuros."},
 weekly_1:{title:"Una cita con sentido",body:"Elijan juntos una canción que les recuerde una tarde linda y cuenten qué detalle recuerdan de ese día."},
 game_1:{title:"Una pregunta para conocerse",body:"¿Qué momento de esta semana te hizo sonreír?"}
};
test("la IA central crea cuatro slots distintos para la pareja",()=>{
 assert.deepEqual(base.map(x=>x.slot),CENTRAL_SLOTS);
 assert.deepEqual(base.map(x=>x.kind),["mission","mission","mission","game"]);
});
test("aplica las cuatro propuestas generativas preservando claves de tarea y puntos",()=>{
 const result=mergeGeneratedIdeas(base,generated);
 assert.equal(result.length,4);
 assert.ok(result.every(x=>x.mode==="generativa"));
 assert.deepEqual(result.map(x=>x.task_key),base.map(x=>x.task_key));
 assert.deepEqual(result.map(x=>x.points),base.map(x=>x.points));
 assert.equal(result[3].body,generated.game_1.body);
});
test("una propuesta contraria a límites privados vuelve a la alternativa guiada",()=>{
 const unsafe={...generated,daily_1:{title:"Comprar regalo",body:"Comprale un regalo costoso para celebrar su día."}};
 const result=mergeGeneratedIdeas(base,unsafe,(text)=>isIdeaCompatible(text,{presupuesto:"gratis"}));
 assert.equal(result[0].mode,"guiado");
 assert.equal(result[0].body,base[0].body);
 assert.equal(result[1].mode,"generativa");
});
test("si el juego no contiene pregunta, usa juego guiado seguro",()=>{
 const invalid={...generated,game_1:{title:"Un secreto",body:"Contale un secreto sin ninguna pregunta."}};
 const result=mergeGeneratedIdeas(base,invalid);
 assert.equal(result[3].mode,"guiado");
 assert.equal(result[3].task_key,base[3].task_key);
});
test("un texto vacío o excesivo no reemplaza una propuesta válida",()=>{
 const invalid={...generated,daily_1:{title:"",body:"algo"},weekly_1:{title:"Plan",body:"x".repeat(300)}};
 const result=mergeGeneratedIdeas(base,invalid);
 assert.equal(result[0].mode,"guiado");
 assert.equal(result[2].mode,"guiado");
});
test("las acciones realizadas agregan una señal gradual, no una orden",()=>{
 const baseScore=deriveThemes({preferences:{},ratings:[]});
 const learned=deriveThemes({preferences:{},ratings:[],completedThemes:["paseo","paseo"]});
 assert.ok(learned.paseo>baseScore.paseo);
 assert.ok(learned.paseo-baseScore.paseo<=3);
});
test("la actividad personal no autoriza compartir datos con la otra cuenta",()=>{
 const p=read("app/api/central/route.js");
 assert.ok(p.includes('db.from("cp_ai_profile_cards").select("question_key,answer_code").eq("user_id",user.id)'));
 assert.ok(p.includes('db.rpc("cp_partner_profile"'));
 assert.ok(p.includes("context.partnerProfile"));
 assert.ok(!p.includes("select(\"*\").eq(\"user_id\",partner"));
});
test("el perfil aparece en el inicio y es editable sin conversación de IA",()=>{
 const p=read("app/page.jsx");
 assert.ok(p.includes("central-daily-checkin"));
 assert.ok(p.includes("profileCompletion.remaining[0].question"));
 assert.ok(p.includes("Guardar y continuar"));
 assert.ok(p.includes('await load(user);'));assert.ok(p.includes('.select("question_key,answer_code").single()'));
 assert.ok(!p.includes("Conversá con tu cómplice"));
 assert.ok(!p.includes("async function askAI("));
 assert.ok(!p.includes("onSubmit={askAI}"));
});
test("el chat de IA está deshabilitado y el chat de pareja se conserva",async()=>{
 const r=await retiredPost();
 assert.equal(r.status,410);
 const data=await r.json();
 assert.equal(data.mode,"central");
 const get=await retiredGet();assert.equal((await get.json()).chat,false);
 const p=read("app/page.jsx");
 assert.ok(p.includes('tab==="mensajes"'));
 assert.ok(p.includes('db.from("cp_messages")'));
});
test("las propuestas están disponibles al entrar, sin escritura de mensajes ni tareas en segundo plano",()=>{
 const p=read("app/page.jsx"),central=read("app/api/central/route.js");
 assert.ok(p.includes('fetch("/api/central"'));
 assert.ok(p.includes('document.addEventListener("visibilitychange"'));
 assert.ok(!central.includes('db.from("cp_messages")'));
 assert.ok(central.includes("EDITORIAL_ENGINE_VERSION"));
 assert.ok(central.includes('readySlots.some(slot=>'));
});
test("el generador incluye tres misiones individuales y la semanal rotativa",()=>{
 const p=read("app/api/central/route.js");
 for(const key of ["mission_1","mission_2","mission_3","weekly_1"])assert.ok(p.includes(key));
 assert.ok(p.includes('maxOutputTokens:2200'));
});
