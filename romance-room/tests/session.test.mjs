import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const folder=mkdtempSync(join(tmpdir(),'campanada-fresh-'));
try {
  execFileSync('tsc',['--target','ES2022','--module','ES2022','--skipLibCheck','--outDir',folder,new URL('../src/game/logic.ts',import.meta.url).pathname],{stdio:'pipe'});
  const {createNewProgress,applyAction}=await import(pathToFileURL(join(folder,'logic.js')));
  test('opening the link always begins at puzzle zero, even after completing the prior visit',()=>{
    let game=createNewProgress();
    game={...game,keyFound:true};
    game=applyAction(game,{type:'CLOCK',hour:8,minute:40}).next;
    game=applyAction(game,{type:'RECORD',record:'azul'}).next;
    game=applyAction(game,{type:'CODE',code:'274'}).next;
    for(const book of ['flor','lluvia','luna']) game=applyAction(game,{type:'BOOK',book}).next;
    game=applyAction(game,{type:'LANTERN',index:0}).next;
    assert.equal(game.stage,4);
    assert.deepEqual(createNewProgress(),{stage:0,keyFound:false,books:[],lanterns:[],rushing:false});
  });
  test('a new game owns independent puzzle arrays and never carries keys or lanterns forward',()=>{
    const old=createNewProgress();
    old.books.push('luna');old.lanterns.push(0);old.keyFound=true;
    const fresh=createNewProgress();
    assert.deepEqual(fresh.books,[]);
    assert.deepEqual(fresh.lanterns,[]);
    assert.equal(fresh.keyFound,false);
    assert.notStrictEqual(fresh.books,old.books);
  });
  test('React session does not restore saved progress, and handles browser history cache',()=>{
    const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
    assert.match(app,/useRef<Progress>\(createNewProgress\(\)\)/);
    assert.doesNotMatch(app,/localStorage\.getItem|localStorage\.setItem/);
    assert.match(app,/localStorage\.removeItem\('ultima-campanada-v1'\)/);
    assert.match(app,/event\.persisted\)window\.location\.reload\(\)/);
    assert.match(app,/const resetAll=\(\)=>\{window\.location\.reload\(\)\}/);
    assert.match(app,/explorationClock\.current\.start\(performance\.now\(\),540000\)/);
  });
} finally {
  process.on('exit',()=>rmSync(folder,{recursive:true,force:true}));
}
