import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const view=readFileSync(new URL('../src/ui/LetterReveal.tsx',import.meta.url),'utf8');
const world=readFileSync(new URL('../src/scene/World.ts',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/ui/letter-reveal.css',import.meta.url),'utf8');

test('code solution begins a sealed-envelope reveal, not instant text',()=>{
  assert.match(app,/if\(action\.type==='CODE'&&success\)\{setLetterPhase\('sealed'\);setModal\('letter'\)/);
  assert.match(view,/phase==='sealed'\?'Romper el sello de cera del sobre'/);
  assert.match(view,/onClick=\{phase==='sealed'\?onBreakSeal:onRead\}/);
});
test('breaking the seal and unfolding the paper are separate user actions',()=>{
  assert.match(app,/const breakLetterSeal=\(\)=>\{setLetterPhase\('opened'\)/);
  assert.match(app,/const unfoldLetter=\(\)=>\{setLetterPhase\('read'\)/);
  assert.match(view,/letter-phase-'/);
  assert.match(styles,/\.letter-phase-opened \.envelope-flap/);
  assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
});
test('the clue letter is rereadable without resealing it',()=>{
  assert.match(app,/letterWasRead\.current\?'read':'sealed'/);
  assert.match(app,/onClose=\{\(\)=>setModal\(null\)\}/);
  for(const fragment of ['Primero nació una flor','La lluvia le dio vida','Cuando llegó la luna','la lluvia mojará la noche','bajo la luna florecerá'])assert.ok(view.includes(fragment),fragment);
});
test('the cabinet contains an animated drawer and visible envelope after the code',()=>{
  assert.match(world,/private letterDrawer\?:THREE\.Group/);
  assert.match(world,/letterDrawerTarget=stage>=3\?\.61:0/);
  assert.match(world,/THREE\.MathUtils\.damp\(this\.letterDrawer\.position\.z/);
  assert.match(world,/const envelope=new THREE\.Group\(\)/);
});
test('envelope reveal is keyboard and touch accessible',()=>{
  assert.match(view,/<button className="envelope-control"/);
  assert.match(view,/aria-label=\{phase==='sealed'/);
  assert.match(styles,/touch-action:manipulation/);
});
