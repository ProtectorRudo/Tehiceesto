import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildEditorialSchema,evaluateEditorialCandidate,selectEditorialMissions,EDITORIAL_ENGINE_VERSION} from "../lib/mission-editorial.mjs";
import {getMissionEditorialModel,callOpenAI} from "../lib/openai-client.mjs";
const central=readFileSync(new URL("../app/api/central/route.js",import.meta.url),"utf8");
const sql=readFileSync(new URL("../sql/20261116_editorial_quality_guard.sql",import.meta.url),"utf8");
const profile={detalle:"mate",plan:"charlar",afecto:"palabras"};
const idea=(title,body,mechanic="sorpresa")=>({title,body,mechanic});
const original=idea("El termo guarda una sorpresa",
 "Prepará un mate como suele disfrutarlo tu pareja y, cuando llegue, dejá junto al termo una nota con un esfuerzo suyo que admirás. Ofrecéselo sin pedir nada a cambio.");
const alternate=idea("Una pausa que te reconozca",
 "Organizá un mate tranquilo y, antes de sentarse, contale algo concreto que admirás de su manera de acompañarte. Si prefiere descansar, dejale ese momento libre.","atencion");
const generic=idea("Una ronda de adivinanzas nuestras",
 "Inventá tres pistas sobre recuerdos compartidos y proponé que las adivinen mientras toman mate para volver a reír.","humor");
test("la IA propone dos ideas editables por cada misión bajo esquema estricto",()=>{
 const schema=buildEditorialSchema(["mission_1","mission_2","weekly_1"]);
 assert.equal(schema.additionalProperties,false);
 assert.deepEqual(schema.required,["mission_1","mission_2","weekly_1"]);
 for(const key of schema.required){
  assert.deepEqual(schema.properties[key].required,["a","b"]);
  assert.deepEqual(schema.properties[key].properties.a.required,["title","body","mechanic"]);
  assert.equal(schema.properties[key].properties.b.properties.mechanic.enum.length,7);
 }
});
test("la ronda de adivinanzas repetida deja de pasar el editor",()=>{
 const result=evaluateEditorialCandidate(generic,{slot:"mission_1",partnerProfile:profile});
 assert.equal(result.pass,false);
 assert.ok(result.issues.includes("generic_idea"));
});
test("un gesto emotivo anclado en un gusto permitido sí pasa",()=>{
 const result=evaluateEditorialCandidate(original,{slot:"mission_1",partnerProfile:profile});
 assert.equal(result.pass,true,result.issues.join(", "));
 assert.equal(result.original,true);
 assert.equal(result.meaningful,true);
});
test("descarta confesiones, compras y contacto sin consentimiento",()=>{
 const confession=idea("Ya sé lo que necesitás",
 "Prepará un mate como le gusta y, cuando llegue, recordale que tu pareja está triste y necesita que la acompañes.");
 assert.ok(evaluateEditorialCandidate(confession,{slot:"mission_1",partnerProfile:profile}).issues.includes("invented_emotional_fact"));
 const purchase=idea("Una sorpresa costosa",
 "Comprale flores y un regalo pago con el dinero de tu semana para demostrarle que valorás su compañía.");
 const r=evaluateEditorialCandidate(purchase,{slot:"mission_1",partnerProfile:{...profile,presupuesto:"gratis"}});
 assert.equal(r.pass,false);
 assert.ok(r.issues.includes("consent_boundary")||r.issues.includes("requires_spending"));
});
test("si la primera opción es vulgar, elige la segunda sin perder identificadores",()=>{
 const guided=[{slot:"mission_1",kind:"mission",title:"Idea guiada",body:"Guía de respaldo",task_key:"d:2026-11-16:mission-1",points:40,mode:"guiado"}];
 const revised=selectEditorialMissions({guided,partnerProfile:profile,proposals:{mission_1:{a:generic,b:original}}});
 assert.equal(revised[0].mode,"generativa");
 assert.equal(revised[0].title,original.title);
 assert.equal(revised[0].task_key,guided[0].task_key);
 assert.equal(revised[0].points,40);
});
test("si ninguna propuesta es adecuada conserva respaldo sin fingir ser IA creativa",()=>{
 const guided=[{slot:"mission_1",title:"Idea cuidada",body:"Realizá un gesto breve",mode:"guiado",task_key:"d:2026-11-16:mission-1"}];
 const result=selectEditorialMissions({guided,partnerProfile:profile,proposals:{mission_1:{a:generic,b:generic}}});
 assert.deepEqual(result,guided);
});
test("una misión compartida nunca cambia según IA individual",()=>{
 const guided=[{slot:"weekly_1",title:"Para los dos",body:"La misma misión",mode:"guiado",task_key:"w:2026-11-16:central-week"}];
 const result=selectEditorialMissions({guided,partnerProfile:profile,protectedSlots:["weekly_1"],proposals:{weekly_1:{a:original,b:alternate}}});
 assert.deepEqual(result,guided);
});
test("no acepta dos ideas casi iguales como variedad real",()=>{
 const r=evaluateEditorialCandidate(alternate,{slot:"mission_2",partnerProfile:profile,
  selectedTexts:[alternate.title+" "+alternate.body]});
 assert.equal(r.pass,false);
 assert.ok(r.issues.includes("near_duplicate"));
});
test("solo la edición de misiones utiliza Terra; el resto conserva modelo previo",()=>{
 assert.equal(getMissionEditorialModel({}),"gpt-6.1-terra");
 assert.equal(getMissionEditorialModel({CP_MISSION_MODEL:"gpt-6-luna"}),"gpt-6-luna");
 assert.equal(getMissionEditorialModel({CP_MISSION_MODEL:"inventado"}),"gpt-6.1-terra");
 assert.match(central,/getMissionEditorialModel\(\)/);
 assert.match(central,/maxOutputTokens:2200/);
 assert.match(central,/selectEditorialMissions/);
 assert.match(central,/EDITORIAL_ENGINE_VERSION/);
 assert.ok(EDITORIAL_ENGINE_VERSION.includes("editorial"));
});
test("Terra dispone de cupo de salida con razonamiento bajo",async()=>{
 let captured;
 const result=await callOpenAI({key:"sk-test-not-real-1234567",model:"gpt-6.1-terra",maxOutputTokens:2200,editorial:true,input:"a",instructions:"b",fetcher:async(_url,config)=>{
  captured=JSON.parse(config.body);
  return Response.json({output:[{content:[{type:"output_text",text:"{}"}]}]});
 }});
 assert.equal(result.ok,true);
 assert.equal(captured.model,"gpt-6.1-terra");
 assert.equal(captured.reasoning.effort,"low");
 assert.equal(captured.max_output_tokens,2200);
 assert.equal(captured.store,false);
});
test("cupo en Supabase no puede superar dos ediciones diarias ni lo llama el cliente",()=>{
 assert.match(sql,/where comp_private\.cp_editorial_calls\.requests < 2/);
 assert.match(sql,/public\.cp_claim_editorial_slot/);
 assert.match(sql,/revoke all on comp_private\.cp_editorial_calls from public,anon,authenticated/);
 assert.match(sql,/revoke all on function public\.cp_claim_editorial_slot\(\) from public,anon/);
 assert.match(central,/db\.rpc\("cp_claim_editorial_slot"\)/);
 assert.match(central,/if\(editorError\|\|!editorSlot\)return guided/);
});
test("si Terra no produce mejora, no reemplaza misiones generativas ya creadas",()=>{
 assert.match(central,/if\(old\.mode==="generativa"&&item\.mode!=="generativa"\)continue/);
 assert.match(central,/doneKeys\.has\(item\.task_key\)/);
});
