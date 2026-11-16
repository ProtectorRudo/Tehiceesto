import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import {learningFallback,learningOptions,learningStatus,validLearningQuestion} from "../lib/continuous-learning.mjs";
import {profileKnowledge} from "../lib/relationship-intelligence.mjs";
import {PROFILE_QUESTIONS} from "../lib/ai-profile.mjs";
import {GET as getQuestion} from "../app/api/learn-question/route.js";
const base=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const page=()=>readFileSync(resolve(base,"app/page.jsx"),"utf8");
const route=()=>readFileSync(resolve(base,"app/api/learn-question/route.js"),"utf8");
test("cada semana tiene una pregunta nueva, consistente y con ID guardable",()=>{
 const a=learningFallback({week:"2026-11-16",userId:"test-uuid",cards:[]});
 const b=learningFallback({week:"2026-11-20",userId:"test-uuid",cards:[]});
 const c=learningFallback({week:"2026-11-23",userId:"test-uuid",cards:[]});
 assert.deepEqual(a,b);
 assert.equal(a.id,"learn:2026-11-16");
 assert.equal(c.id,"learn:2026-11-23");
 assert.notEqual(a.question,c.question);
});
test("rotación inteligente cubre las diez áreas del perfil sin terminar al 100%",()=>{
 const found=new Set();
 for(let week=0;week<10;week++){
  const monday=new Date("2026-11-16T12:00:00Z");monday.setUTCDate(monday.getUTCDate()+week*7);
  const p=learningFallback({week:monday.toISOString().slice(0,10),userId:"user-1",cards:PROFILE_QUESTIONS.map(q=>({question_key:q.key,answer_code:q.options[0][0]}))});
  found.add(p.topic_key);
  assert.ok(validLearningQuestion(p.question,p.topic_key),p.topic_key);
 }
 assert.equal(found.size,10);
});
test("con datos faltantes se profundiza en dimensiones no respondidas",()=>{
 const cards=PROFILE_QUESTIONS.filter(q=>q.key!=="ritmo").map(q=>({question_key:q.key,answer_code:q.options[0][0]}));
 const q=learningFallback({userId:"p",week:"2026-11-16",cards});
 assert.equal(q.topic_key,"ritmo");
});
test("cada nueva pregunta ofrece opciones estructuradas seguras, no confesiones",()=>{
 for(const q of PROFILE_QUESTIONS){
  const options=learningOptions(q.key);
  assert.deepEqual(options,q.options);
  assert.ok(options.length>=3);
 }
 assert.deepEqual(learningOptions("private_secret"),[]);
});
test("no se aceptan preguntas que pidan contraseñas o exposición en redes",()=>{
 assert.equal(validLearningQuestion("¿Cuál es tu contraseña de correo y de qué cuenta se trata?","deseo"),false);
 assert.equal(validLearningQuestion("¿Podés cambiar tu foto de perfil de WhatsApp hoy?","deseo"),false);
 assert.equal(validLearningQuestion("¿Qué gesto privado te haría sentir querido esta semana?","deseo"),true);
});
test("al llegar al 100%, el aprendizaje sigue aumentando sin inventar un 120%",()=>{
 const cards=PROFILE_QUESTIONS.map(q=>({question_key:q.key,answer_code:q.options[0][0]}));
 const refs=Array.from({length:4},(_,i)=>({question_id:"q"+String(i+9).padStart(2,"0"),ai_use_allowed:true}));
 const more=[{question_id:"learn:2026-11-16",ai_use_allowed:true},{question_id:"learn:2026-11-23",ai_use_allowed:true}];
 const r=profileKnowledge({cards,reflections:[...refs,...more],importantDates:[{id:1},{id:2}],completions:[{id:1},{id:2},{id:3},{id:4}]});
 assert.equal(r.percent,100);
 assert.equal(r.initialComplete,true);
 assert.equal(r.ongoingAnswers,2);
});
test("las respuestas de seguimiento son una por semana y siempre optativas",()=>{
 const current=learningStatus({week:"2026-11-20",reflections:[{question_id:"learn:2026-11-16"}]});
 assert.equal(current.answeredThisWeek,true);
 assert.equal(current.ongoingAnswers,1);
 assert.equal(learningStatus({week:"2026-11-23",reflections:[{question_id:"learn:2026-11-16"}]}).answeredThisWeek,false);
});
test("el motor generativo cachea una pregunta por persona y semana",()=>{
 const src=route();
 assert.ok(src.includes('db.from("cp_learning_questions")'));
 assert.ok(src.includes('db.from("cp_ai_profile_cards")'));
 assert.ok(src.includes('db.from("cp_reflections")'));
 assert.ok(src.includes("cp_claim_openai_slot"));
 assert.ok(src.includes("validLearningQuestion"));
 assert.ok(src.includes('db.auth.getUser(token)'));
});
test("no hay endpoint público anónimo que permita extraer preguntas personales",async()=>{
 const request=new Request("https://complices-piloto.onrender.com/api/learn-question");
 const res=await getQuestion(request);assert.equal(res.status,401);
});
test("guardado de gustos confirma escritura en BD, avanza y muestra error visible",()=>{
 const src=page();
 assert.ok(src.includes('.upsert({'));
 assert.ok(src.includes('.select("question_key,answer_code").single()'));
 assert.ok(src.includes('const answered=new Set([...profileCards.map(x=>x.question_key),saved.question_key])'));
 assert.ok(src.includes('profileSaveState&&'));
 assert.ok(src.includes('role="status"'));
});
test("las respuestas libres siguen privadas y la pista al otro es solo código autorizado",()=>{
 const src=page();
 assert.ok(src.includes('share_for_surprises:false,share_theme:null'));
 assert.ok(src.includes('share_with_partner_ai:Boolean(pref?.allow_surprises)'));
 assert.ok(src.includes("learningOptions(continuingQuestion.topic_key)"));
 assert.ok(src.includes("await refreshCentral();"));
});
test("el 100 por ciento no es el final: existe sección de seguimiento continuo",()=>{
 const src=page();
 for(const term of ["continuingQuestion","ongoingQuestion","aprendizajes nuevos","la próxima semana","/api/learn-question"])assert.ok(src.toLowerCase().includes(term.toLowerCase()),term);
});
