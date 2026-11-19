import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,processInbound} from '../src/flow.mjs';
import {nextWeekMonday,goalChoices,beginWeeklyGoals,weeklyGoalFor,weeklyGoalPrompt} from '../src/huella-weekly-goals.mjs';
import {generatePremiumWeek} from '../src/huella-ai.mjs';

const NOW='2026-11-29T21:00:00Z',DAY='2026-11-29',NEXT='2026-11-30';
const state=()=>{
 const s=initialState();
 s.status='active';s.flow='weekly_reflection';s.consentAt='2026-11-01T12:00:00Z';
 s.monthlyGoal='compartir tiempo sin pantallas';
 s.children=[
  {name:'Kaia',age:0,ageMonths:6,interests:['música'],goal:'acompañar con cariño'},
  {name:'Allegra',age:9,interests:['dibujar'],goal:'escuchar sus ideas'}
 ];
 s.huellaWeekV2={key:'2026-11-23',batch:{},sentSlots:['reflection']};
 return s;
};
const answer=(text,s,day=DAY)=>processInbound(text,{state:s,today:day,now:NOW});
test('Sunday asks one weekly goal per child after the usual reflection, without losing it',()=>{
 let r=answer('Un momento hermoso fue leer juntas y conversar sin apurarnos',state());
 assert.equal(r.state.weeklyReflections.length,1);
 assert.equal(r.state.flow,'weekly_goal_choice');
 assert.equal(r.state.weeklyGoalSelection.weekKey,NEXT);
 assert.match(r.messages.at(-1).body,/Kaia/);
 assert.match(r.messages.at(-1).body,/1\./);
 assert.match(r.messages.at(-1).body,/Otro objetivo/);
 const options=goalChoices(r.state.children[0],NEXT,0);
 r=answer('1',r.state);
 assert.equal(r.state.flow,'weekly_goal_choice');
 assert.equal(weeklyGoalFor(r.state,0,NEXT),options[0]);
 assert.match(r.messages[0].body,/Allegra/);
 r=answer('4',r.state);
 assert.equal(r.state.flow,'weekly_goal_custom');
 assert.match(r.messages[0].body,/Allegra/);
 r=answer('Escuchar sus decisiones con más paciencia',r.state);
 assert.equal(r.state.flow,'idle');
 assert.equal(r.state.weeklyGoalSelection,null);
 assert.equal(weeklyGoalFor(r.state,1,NEXT),'Escuchar sus decisiones con más paciencia');
 assert.equal(r.state.weeklyGoals.length,1);
 assert.match(r.messages.at(-1).body,/Sol los tendrá en cuenta/);
 assert.equal(r.state.huellaPilotStartDay,null);
});
test('Sunday questions may be omitted: weekly generation keeps using known goals',()=>{
 let r=answer('OMITIR',state());
 assert.equal(r.state.weeklyReflections.length,0);
 assert.equal(r.state.flow,'weekly_goal_choice');
 r=answer('0',r.state);
 r=answer('0',r.state);
 assert.equal(r.state.flow,'idle');
 assert.equal(weeklyGoalFor(r.state,0,NEXT),null);
 assert.equal(weeklyGoalFor(r.state,1,NEXT),null);
 assert.match(r.messages[0].body,/no se frenará ninguna actividad/);
});
test('options change across Sundays and respect developmental stages',()=>{
 assert.equal(nextWeekMonday('2026-11-29'),NEXT);
 assert.equal(nextWeekMonday('2026-11-30'),'2026-12-07');
 const s=state(),baby=s.children[0],older=s.children[1];
 const a=goalChoices(baby,NEXT,0);
 const b=goalChoices(baby,'2026-12-07',0);
 const c=goalChoices(older,NEXT,1);
 assert.equal(a.length,3);
 assert.equal(new Set(a).size,3);
 assert.notDeepEqual(a,b);
 assert.equal(a.filter(x=>b.includes(x)).length,0,'all three suggestions should change the following Sunday');
 assert.ok(a.every(x=>typeof x==='string'&&x.length>15));
 assert.ok(!c.some(x=>/bebé|lactancia|siesta/i.test(x)));
 assert.notDeepEqual(a,c);
});
test('explicit OBJETIVOS SEMANA restarts a guided question, never a free chatbot',()=>{
 const s=state();s.flow='idle';
 let r=answer('OBJETIVOS SEMANA',s);
 assert.equal(r.state.flow,'weekly_goal_choice');
 assert.match(r.messages[0].body,/Kaia/);
 r=answer('0',r.state);
 r=answer('0',r.state);
 assert.equal(r.state.flow,'idle');
 r=answer('No sabés lo que me pasó hoy',r.state);
 assert.match(r.messages[0].body,/HUELLA funciona/);
});
test('previous weekly goal can be kept using option 5, without copying objectives to siblings',()=>{
 const s=state();
 s.weeklyGoals=[{weekKey:'2026-11-23',choices:{
  '0':{childName:'Kaia',goal:'Disfrutar más música en familia',source:'suggested'}
 }}];
 let r=answer('OMITIR',s);
 assert.match(r.messages[0].body,/5\. Mantener/);
 r=answer('5',r.state);
 assert.equal(weeklyGoalFor(r.state,0,NEXT),'Disfrutar más música en familia');
 assert.equal(weeklyGoalFor(r.state,1,NEXT),null);
});
test('a goal cannot change an already-generated week; only future weeks are eligible',()=>{
 const s=state();
 s.flow='idle';s.huellaWeekV2.key=NEXT;
 const r=answer('OBJETIVOS SEMANA',s);
 assert.equal(r.state.flow,'idle');
 assert.equal(r.state.weeklyGoalSelection,null);
 assert.match(r.messages[0].body,/ya fue preparado/);
});
test('Sol receives exact child-specific next-week objectives in the sole weekly API request',async()=>{
 let s=state();
 s.flow='idle';
 s.weeklyGoals=[{weekKey:NEXT,choices:{
  '0':{childName:'Kaia',goal:'Conocer sus momentos de calma',source:'custom'},
  '1':{childName:'Allegra',goal:'Escuchar sus decisiones con más paciencia',source:'custom'}
 }}];
 let calls=0,captured;
 const env={OPENAI_API_KEY:'test-only-key',HUELLA_CONTENT_MODEL:'gpt-6.2-sol'};
 await generatePremiumWeek(s,NEXT,{env,fetcher:async(_url,options)=>{
  calls++;
  captured=JSON.parse(options.body);
  return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({
   children:[],family:null
  })}]}]}),{status:200});
 }});
 assert.equal(calls,1);
 const input=JSON.parse(captured.input);
 assert.equal(input.children[0].weeklyGoal,'Conocer sus momentos de calma');
 assert.equal(input.children[1].weeklyGoal,'Escuchar sus decisiones con más paciencia');
 assert.match(captured.instructions,/PRIORIDAD de la semana/);
 assert.equal(captured.store,false);
 assert.equal(captured.reasoning.effort,'high');
 assert.equal(JSON.parse((await Promise.resolve(JSON.stringify(input)))).monthlyGoal,'compartir tiempo sin pantallas');
 assert.equal(s.weeklyGoalSelection,null);
});
