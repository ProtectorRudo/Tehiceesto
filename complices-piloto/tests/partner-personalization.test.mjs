import test from "node:test";
import assert from "node:assert/strict";
import {PROFILE_QUESTIONS,profileProgress,safeProfile,partnerGuidedIdeas,profileForOwnAI,isIdeaCompatible} from "../lib/ai-profile.mjs";

test("el cuestionario incluye diez preguntas y respuestas estructuradas válidas",()=>{
 assert.equal(PROFILE_QUESTIONS.length,10);
 assert.equal(new Set(PROFILE_QUESTIONS.map(q=>q.key)).size,10);
 for(const q of PROFILE_QUESTIONS){assert.ok(q.question.length>20);assert.ok(q.options.length>=3);assert.equal(new Set(q.options.map(x=>x[0])).size,q.options.length)}
});
test("el progreso cuenta respuestas válidas una sola vez",()=>{
 assert.deepEqual(profileProgress([]),{answered:0,total:10,remaining:PROFILE_QUESTIONS});
 const x=profileProgress([{question_key:"plan",answer_code:"cocinar"},{question_key:"plan",answer_code:"cocinar"},{question_key:"detalle",answer_code:"no_existe"}]);
 assert.equal(x.answered,1);assert.equal(x.remaining.length,9);
});
test("la validación elimina datos libres, códigos inventados y categorías ajenas",()=>{
 assert.deepEqual(safeProfile({plan:"cocinar",presupuesto:"gratis",email:"no",detalle:"malicioso"}),{plan:"cocinar",presupuesto:"gratis"});
 assert.deepEqual(safeProfile([]),{});
 assert.deepEqual(safeProfile(null),{});
});
test("el motor genera misiones, semana y juego útiles a partir de las pistas",()=>{
 const v=partnerGuidedIdeas({plan:"cocinar",detalle:"mate",objetivo:"equipo"});
 assert.equal(v.hasSignals,true);assert.equal(v.count,3);
 assert.equal(v.ideas.length,3);
 assert.match(v.ideas[0].body,/mate/i);
 assert.match(v.ideas[1].body,/receta|preparar|ingredientes/i);
 assert.match(v.ideas[2].body,/juntos|equipo/i);
 assert.equal(v.ideas[1].theme,"cocina");
});
test("si la pareja prefiere sin gastos, no se le recomienda comprar obsequios",()=>{
 const v=partnerGuidedIdeas({detalle:"chocolate",presupuesto:"gratis",objetivo:"romance"});
 assert.match(v.ideas[0].body,/nota/i);
 assert.doesNotMatch(v.ideas[0].body,/compr[aá]|comprar|llev[aá]/i);
});
test("una preferencia de evitar gastar prevalece sobre regalos",()=>{
 const v=partnerGuidedIdeas({detalle:"flores",evitar:"gastos"});
 assert.match(v.ideas[0].title,/no cuesta nada/i);
 assert.match(v.ideas[0].body,/nota/i);
 assert.doesNotMatch(v.ideas[0].body,/flor/i);
});
test("no recomienda abrazos sorpresivos cuando se rechaza el contacto sin preguntar",()=>{
 const v=partnerGuidedIdeas({afecto:"contacto",evitar:"contacto_sin_avisar",plan:"descanso"});
 assert.match(v.ideas[1].body,/pregunt[aá]|preguntá/i);
});
test("los planes cortos respetan la preferencia de evitar salidas largas",()=>{
 const v=partnerGuidedIdeas({plan:"paseo",evitar:"salidas_largas",ritmo:"tranquilo"});
 assert.match(v.ideas[1].body,/corto|tranquilo/i);
});
test("los planes íntimos o públicos se evitan si se marcaron límites",()=>{
 const p=partnerGuidedIdeas({evitar:"sorpresas_publicas"});
 assert.match(p.ideas[0].body,/privada/i);
 const q=partnerGuidedIdeas({evitar:"actividades_intimas"});
 assert.match(q.ideas[2].body,/evit[aá].*íntimas/i);
});
test("sin pistas devuelve acciones generales y no simula conocer a la pareja",()=>{
 const v=partnerGuidedIdeas({});
 assert.equal(v.hasSignals,false);assert.equal(v.count,0);
 assert.match(v.ideas[0].why,/general/i);
});
test("la generación no reproduce confidencias ni texto libre",()=>{
 const privateText="Mi confesión confidencial que nadie debe conocer";
 const v=partnerGuidedIdeas({plan:"cocinar",confesion:privateText,recuerdo:privateText});
 assert.equal(JSON.stringify(v).includes(privateText),false);
});
test("solo perfiles estructurados validan datos para IA",()=>{
 const p=profileForOwnAI([{question_key:"plan",answer_code:"cocinar"},{question_key:"plan",answer_code:"imposible"},{question_key:"afecto",answer_code:"palabras"}]);
 assert.deepEqual(p,{plan:"cocinar",afecto:"palabras"});
});
test("ninguna actividad supera los límites de longitud permitidos por base",()=>{
 const x=partnerGuidedIdeas({plan:"paseo",detalle:"chocolate",evitar:"contacto_sin_avisar",momento:"noche",objetivo:"rutina"});
 for(const a of x.ideas){assert.ok(a.title.length<=110);assert.ok(a.body.length<=420);assert.ok(a.body.length>=8)}
 assert.ok(x.game.body.length>=8);
});

test("no aceptar regalos que requieren gastar cuando la persona pidió gratis",()=>{
 assert.equal(isIdeaCompatible("Comprale chocolates caros para mañana",{presupuesto:"gratis"}),false);
 assert.equal(isIdeaCompatible("Dejale una nota cariñosa en su mesa",{presupuesto:"gratis"}),true);
});
test("los límites de contacto, exposición pública e intimidad se aplican también a ideas generativas",()=>{
 assert.equal(isIdeaCompatible("Abrazala por sorpresa cuando no mire",{evitar:"contacto_sin_avisar"}),false);
 assert.equal(isIdeaCompatible("Hacé un anuncio en público para todos",{evitar:"sorpresas_publicas"}),false);
 assert.equal(isIdeaCompatible("Proponele un juego picante",{evitar:"actividades_intimas"}),false);
 assert.equal(isIdeaCompatible("Hablen de sus sueños con tranquilidad",{evitar:"actividades_intimas"}),true);
});
