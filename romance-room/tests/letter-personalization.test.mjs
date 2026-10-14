import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const letter=readFileSync(new URL('../src/ui/LetterReveal.tsx',import.meta.url),'utf8');
const defaults=JSON.parse(readFileSync(new URL('../public/config/invitation.json',import.meta.url),'utf8'));

test('personalized letter is distinct from final invitation',()=>{
 assert.match(app,/letter:\['letter','carta'\]/);
 assert.match(app,/message:\['message','mensaje'\]/);
 assert.match(app,/personalLetter=\{invitation\.letter\}/);
 assert.match(app,/\{invitation\.message\}/);
 assert.match(app,/field==='letter'\?1200:field==='message'\?650:190/);
});
test('personalized envelope preserves puzzle clues',()=>{
 assert.match(letter,/personalLetter\.trim\(\)/);
 assert.match(letter,/\{personalLetter\}/);
 assert.match(letter,/\{recipient\}/);
 assert.match(letter,/Con cariño, \$\{sender\}/);
 for(const clue of ['Primero nació una flor','La lluvia le dio vida','Cuando llegó la luna','la lluvia mojará la noche','bajo la luna florecerá'])
  assert.ok(letter.includes(clue),'missing original clue '+clue);
});
test('event date, time, place, receiver, sender and RSVP are editable',()=>{
 assert.match(app,/time:\['time','hora'\]/);
 assert.match(app,/\{invitation\.date\}/);
 assert.match(app,/invitation\.time/);
 for(const field of ['recipient','sender','question','message','letter','date','time','place','replyPhone','voiceUrl'])
  assert.ok(Object.hasOwn(defaults,field),field);
});
