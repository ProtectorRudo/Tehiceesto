import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,processInbound,REDIRECT,RISK} from '../src/flow.mjs';

const today='2026-11-19',now='2026-11-19T13:20:00.000Z';
const first=['hola','ACEPTO','Ana','Mamá','2','Luz','9','dibujar, inventar','fortalecer la escucha','Tomi','4','bloques, música','jugar sin apuros','18:00'];

function feed(messages, state=initialState(), day=today){
 let s=state,outputs=[];
 for(const input of messages){
  const result=processInbound(input,{state:s,today:day,now});
  s=result.state;outputs.push(...result.messages);
 }
 return {state:s,outputs};
}
const registered=()=>{
 const result=feed(first);
 assert.equal(result.state.status,'active');
 assert.equal(result.state.children.length,2);
 return result.state;
};

test('menu lists bounded functions, preserves the profile and does not initiate free chat',()=>{
 const s=registered(),original=structuredClone(s);
 const r=feed(['MENÚ'],s);
 assert.equal(r.state.status,'active');
 assert.equal(r.state.flow,'idle');
 assert.deepEqual(r.state.children,original.children);
 assert.equal(r.state.consentAt,original.consentAt);
 assert.match(r.outputs[0].body,/Menú HUELLA/);
 assert.deepEqual(r.outputs[0].options,['MISIONES','OBJETIVO','OBJETIVOS SEMANA','HORARIO','ÁNIMO','DATOS','BAJA']);
});

test('messages unrelated to a defined flow produce at most one fixed redirection daily',()=>{
 const start=registered();
 const once=feed(['No sabés lo que pasó con Luz','Te puedo contar mi problema?'],start);
 assert.deepEqual(once.outputs.map(m=>m.body),[REDIRECT]);
 assert.deepEqual(once.state.children,start.children);
 const next=feed(['Hola, quiero conversar'],once.state,'2026-11-20');
 assert.deepEqual(next.outputs.map(m=>m.body),[REDIRECT]);
});

test('profile command reads registered preferences without modifying them',()=>{
 const start=registered(),out=feed(['DATOS'],start);
 assert.match(out.outputs[0].body,/Ana/);
 assert.match(out.outputs[0].body,/Luz \(9\)/);
 assert.match(out.outputs[0].body,/Tomi \(4\)/);
 assert.deepEqual(out.state.children,start.children);
});

test('goal changes require valid text and cannot corrupt the old goal',()=>{
 const s=registered(),oldGoal=s.monthlyGoal;
 let r=feed(['OBJETIVO','ok'],s);
 assert.equal(r.state.monthlyGoal,oldGoal);
 assert.equal(r.state.flow,'change_goal');
 r=feed(['escuchar con paciencia cada día'],r.state);
 assert.equal(r.state.monthlyGoal,'escuchar con paciencia cada día');
 assert.equal(r.state.flow,'idle');
});

test('delivery time is validated before updating the saved preference',()=>{
 const original=registered();
 let r=feed(['HORARIO','25:90'],original);
 assert.equal(r.state.deliveryTime,'18:00');
 assert.equal(r.state.flow,'change_time');
 r=feed(['07:15'],r.state);
 assert.equal(r.state.deliveryTime,'07:15');
 assert.equal(r.state.status,'active');
 assert.equal(r.state.flow,'idle');
});

test('mood is optional, checked against choices, and scoped to the day',()=>{
 let r=feed(['ÁNIMO','desesperado'],registered());
 assert.equal(r.state.mood,null);
 assert.equal(r.state.flow,'mood');
 r=feed(['Cansado/a'],r.state);
 assert.deepEqual(r.state.mood,{value:'cansado',day:today});
 assert.equal(r.state.flow,'idle');
});

test('asking for missions before scheduling never fabricates completed missions',()=>{
 const s=registered(),r=feed(['MISIONES'],s);
 assert.match(r.outputs[0].body,/Todavía no están generadas/);
 assert.deepEqual(r.state.history,[]);
});

test('menu during onboarding repeats the same pending question without overwriting input',()=>{
 const r=feed(['Hola','ACEPTO','Ana','Papá','MENÚ','2']);
 assert.equal(r.state.status,'onboarding');
 assert.equal(r.state.flow,'child_name');
 assert.equal(r.state.adultName,'Ana');
 assert.equal(r.state.expectedChildren,2);
 assert.ok(r.outputs.some(m=>/continuemos con esta pregunta/.test(m.body)));
});

test('canceling deletion does not erase any profile or reopen onboarding',()=>{
 const s=registered(),r=feed(['BORRAR','CANCELAR'],s);
 assert.equal(r.state.status,'active');
 assert.equal(r.state.flow,'idle');
 assert.equal(r.state.deleted,false);
 assert.deepEqual(r.state.children,s.children);
 assert.match(r.outputs.at(-2).body,/Operación cancelada/);
});

test('confirmed deletion clears personal profile, goals and history',()=>{
 const s=registered();
 s.history=[{day:today,children:[]}];
 const r=feed(['BORRAR','ELIMINAR'],s);
 assert.equal(r.state.deleted,true);
 assert.equal(r.state.status,'stopped');
 assert.equal(r.state.children.length,0);
 assert.equal(r.state.adultName,'');
 assert.equal(r.state.monthlyGoal,'');
 assert.deepEqual(r.state.history,[]);
});

test('unsubscribing is idempotent and a later ALTA never carries a previous profile',()=>{
 const s=registered();
 let r=feed(['BAJA'],s);
 assert.equal(r.state.status,'stopped');
 assert.equal(r.state.consentAt,null);
 assert.equal(r.outputs.length,1);
 const repeated=feed(['BAJA','STOP'],r.state);
 assert.equal(repeated.outputs.length,0,'no repeated opt-out WhatsApp spam');
 r=feed(['ALTA'],repeated.state);
 assert.equal(r.state.status,'pending');
 assert.equal(r.state.flow,'consent');
 assert.equal(r.state.adultName,'');
 assert.deepEqual(r.state.children,[]);
 assert.equal(r.state.expectedChildren,undefined,'no leftover auxiliary fields');
 assert.equal(r.state.consentAt,null);
 assert.equal(r.outputs.length,1);
 assert.match(r.outputs[0].body,/¿Aceptás recibir/);
 const accept=feed(['ACEPTO'],r.state);
 assert.equal(accept.state.status,'onboarding');
 assert.equal(accept.state.flow,'adult_name');
});

test('emergency shortcut remains fixed and never enters a therapeutic dialogue',()=>{
 const s=registered(),r=feed(['Mi hijo no respira'],s);
 assert.equal(r.outputs.length,1);
 assert.equal(r.outputs[0].body,RISK);
 assert.equal(r.state.flow,'idle');
});
