import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,processInbound,REDIRECT,RISK,formatMissions} from '../src/flow.mjs';
import {editorialBatch} from '../src/missions.mjs';
import {isMessagingReady} from '../src/scheduler.mjs';

const opts={today:'2026-11-19',now:'2026-11-19T14:00:00.000Z'};
const input=(text,state=initialState())=>processInbound(text,{...opts,state});
const registered=()=>{
 const inputs=['Hola HUELLA','ACEPTO','Ana','Mamá','1','Luz','9','pintar','escuchar sus ideas','18:00'];
 let state=initialState(),messages=[];
 for(const x of inputs){const response=input(x,state);state=response.state;messages.push(...response.messages);}
 assert.equal(state.status,'active');
 return {state,messages};
};

test('HUELLA is the product name in all visible onboarding messages and consent',()=>{
 const r=input('Hola HUELLA');
 assert.match(r.messages[0].body,/Hola, soy HUELLA/);
 assert.match(r.messages[0].body,/mensajes de HUELLA/);
 assert.doesNotMatch(r.messages[0].body,/CERCA/);
 const ready=registered();
 assert.match(ready.messages.at(-1).body,/tres misiones por hijo por semana/);
 assert.doesNotMatch(ready.messages.at(-1).body,/tres misiones por hijo al día/);
 assert.match(ready.messages.at(-1).body,/HUELLA registró/);
 assert.match(ready.messages.at(-1).body,/Tu calendario comienza el 2026-11-20/);
 assert.equal(ready.state.huellaRegisteredDay,'2026-11-19');
 assert.equal(ready.state.children.length,1);
});

test('existing family is not re-enrolled by the branding change; menu and redirection use HUELLA',()=>{
 const s=registered().state;
 const menu=input('MENÚ',s);
 assert.match(menu.messages[0].body,/Menú HUELLA/);
 assert.deepEqual(menu.state.children,s.children);
 assert.equal(menu.state.consentAt,s.consentAt);
 const redirect=input('Quiero que seas mi consejera personal',menu.state);
 assert.equal(redirect.messages[0].body,REDIRECT);
 assert.match(REDIRECT,/HUELLA funciona/);
 assert.doesNotMatch(REDIRECT,/CERCA/);
 assert.match(RISK,/HUELLA no atiende emergencias/);
});

test('HUELLA mission headers use new brand and weekly scheduling remains disabled',()=>{
 const s=registered().state;
 const batch=editorialBatch(s,'2026-11-19');
 assert.match(formatMissions(batch),/HUELLA/);
 const env={CERCA_PROVIDER:'evolution',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:'5492211234567',CERCA_EVOLUTION_SCHEDULED_ALLOWED:'false'};
 assert.equal(isMessagingReady(env),false);
});

test('new onboarding enforces the agreed 0–15 age range',()=>{
 let state=initialState();
 for(const msg of ['Hola','ACEPTO','Ana','Mamá','1','Luz'])state=input(msg,state).state;
 let age=input('16',state);
 assert.equal(age.state.flow,'child_age');
 assert.match(age.messages[0].body,/0 a 15/);
 age=input('15',age.state);
 assert.equal(age.state.flow,'child_interests');
 assert.equal(age.state.children[0].age,15);
});
