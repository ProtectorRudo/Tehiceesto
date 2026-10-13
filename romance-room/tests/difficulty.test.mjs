import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const folder=mkdtempSync(join(tmpdir(),'campanada-difficulty-'));
try {
 execFileSync('tsc',['--target','ES2022','--module','ES2022','--skipLibCheck','--outDir',folder,new URL('../src/game/logic.ts',import.meta.url).pathname],{stdio:'pipe'});
 const {applyAction,createNewProgress,bookOrder,lanternOrder}=await import(pathToFileURL(join(folder,'logic.js')));
 test('clock requires a different, deduced time',()=>{
  const s={...createNewProgress(),keyFound:true};
  assert.equal(applyAction(s,{type:'CLOCK',hour:9,minute:15}).success,false);
  assert.equal(applyAction(s,{type:'CLOCK',hour:8,minute:40}).success,true);
 });
 test('books reward comprehension of the poem, not shelf order',()=>{
  const s={...createNewProgress(),stage:3};
  assert.deepEqual(bookOrder,['flor','lluvia','luna']);
  assert.equal(applyAction(s,{type:'BOOK',book:'luna'}).success,false);
  let state=s;for(const book of bookOrder)state=applyAction(state,{type:'BOOK',book}).next;
  assert.equal(state.stage,4);
 });
 test('wrong lantern resets the partial sequence and correct non-linear order wins',()=>{
  assert.deepEqual(lanternOrder,[2,0,1]);
  let s={...createNewProgress(),stage:4,rushing:true};
  s=applyAction(s,{type:'LANTERN',index:2}).next;
  assert.deepEqual(s.lanterns,[2]);
  s=applyAction(s,{type:'LANTERN',index:1}).next;
  assert.deepEqual(s.lanterns,[]);
  for(const i of lanternOrder)s=applyAction(s,{type:'LANTERN',index:i}).next;
  assert.equal(s.stage,5);
 });
 test('scene contains discoverable physical clues, not a written clock answer',()=>{
  const scene=readFileSync(new URL('../src/scene/World.ts',import.meta.url),'utf8');
  assert.match(scene,/createClueStations\(\)/);
  assert.match(scene,/hotspot\(solar,'sundial'/);
  assert.match(scene,/hotspot\(water,'waterBasin'/);
  assert.doesNotMatch(scene,/9:15/);
 });
 test('hints only disclose solutions on demand at third tier',()=>{
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
  assert.match(app,/PISTA \{activeHintLevel\+1\} DE 3/);
  assert.match(app,/activeHintLevel<2/);
  assert.match(app,/setHintLevels/);
  assert.doesNotMatch(app,/izquierda, centro y derecha/);
 });
} finally {process.on('exit',()=>rmSync(folder,{recursive:true,force:true}));}
