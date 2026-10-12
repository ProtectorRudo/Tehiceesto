import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const folder=mkdtempSync(join(tmpdir(),'campanada-fresh-'));
execFileSync('tsc',['--target','ES2022','--module','ES2022','--skipLibCheck','--outDir',folder,new URL('../src/game/logic.ts',import.meta.url).pathname],{stdio:'pipe'});
const {createNewProgress,applyAction}=await import(pathToFileURL(join(folder,'logic.js')));
test('each new visit resets all solved puzzles and the final challenge',()=>{
  let old=createNewProgress();
  old={...old,keyFound:true};
  old=applyAction(old,{type:'CLOCK',hour:9,minute:15}).next;
  old=applyAction(old,{type:'RECORD',record:'azul'}).next;
  old=applyAction(old,{type:'CODE',code:'274'}).next;
  for(const book of ['luna','lluvia','flor'])old=applyAction(old,{type:'BOOK',book}).next;
  old=applyAction(old,{type:'LANTERN',index:0}).next;
  assert.equal(old.stage,4);
  assert.deepEqual(createNewProgress(),{stage:0,keyFound:false,books:[],lanterns:[],rushing:false});
});
test('new visit does not reuse mutable arrays from an older game',()=>{
  const old=createNewProgress();old.books.push('luna');old.lanterns.push(0);old.keyFound=true;
  const now=createNewProgress();
  assert.deepEqual(now.books,[]);assert.deepEqual(now.lanterns,[]);assert.equal(now.keyFound,false);
  assert.notStrictEqual(old.books,now.books);
});
test('new session ignores old saved progress and reloads history cache',()=>{
 const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
 assert.match(app,/useRef<Progress>\(createNewProgress\(\)\)/);
 assert.doesNotMatch(app,/localStorage\.getItem|localStorage\.setItem/);
 assert.match(app,/localStorage\.removeItem\('ultima-campanada-v1'\)/);
 assert.match(app,/event\.persisted\)window\.location\.reload\(\)/);
 assert.match(app,/const resetAll=\(\)=>\{window\.location\.reload\(\)\}/);
 assert.match(app,/explorationClock\.current\.start\(performance\.now\(\),360000\)/);
});
process.on('exit',()=>rmSync(folder,{recursive:true,force:true}));
