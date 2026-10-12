import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// The logic is TypeScript-only. Load a transpiled copy when the local TypeScript CLI exists.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const tmp=mkdtempSync(join(tmpdir(),'campanada-'));
const src=readFileSync(new URL('../src/game/logic.ts',import.meta.url),'utf8');
if(!src.includes('export function applyAction'))throw Error('logic missing');
execFileSync('tsc',['--target','ES2022','--module','ES2022','--skipLibCheck','--outDir',tmp,new URL('../src/game/logic.ts',import.meta.url).pathname],{stdio:'pipe'});
const {applyAction,initialProgress,formatRemaining,safeReplyLink}=await import(pathToFileURL(join(tmp,'logic.js')));
test('complete romance path plus early failures',()=>{
 let s=initialProgress;
 assert.equal(applyAction(s,{type:'CLOCK',hour:9,minute:15}).success,false);
 s={...s,keyFound:true};
 s=applyAction(s,{type:'CLOCK',hour:9,minute:15}).next;
 s=applyAction(s,{type:'RECORD',record:'azul'}).next;
 assert.equal(applyAction(s,{type:'CODE',code:'321'}).success,false);
 s=applyAction(s,{type:'CODE',code:'274'}).next;
 for(const book of ['luna','lluvia','flor'])s=applyAction(s,{type:'BOOK',book}).next;
 assert.equal(s.stage,4);
 for(const index of [0,1,2])s=applyAction(s,{type:'LANTERN',index}).next;
 assert.equal(s.stage,5);
});
test('failed order resets books and final sprint resets lanterns',()=>{
 let s={...initialProgress,stage:3,books:['luna']};
 s=applyAction(s,{type:'BOOK',book:'flor'}).next;
 assert.deepEqual(s.books,[]);
 s={...s,stage:4,lanterns:[0]};
 s=applyAction(s,{type:'RESET_RUSH'}).next;
 assert.deepEqual(s.lanterns,[]);
});
test('format and safe reply URL',()=>{
 assert.equal(formatRemaining(120000),'02:00');
 assert.equal(formatRemaining(-100),'00:00');
 assert.equal(safeReplyLink('','a','b'),null);
 assert.match(safeReplyLink('+54 9 221 555 1212','a','b'),/wa.me\/5492215551212/);
});
process.on('exit',()=>{rmSync(tmp,{recursive:true,force:true})});

const navSrc=new URL('../src/game/navigation.ts',import.meta.url).pathname;
const timerSrc=new URL('../src/game/RushClock.ts',import.meta.url).pathname;
execFileSync('tsc',['--target','ES2022','--module','ES2022','--skipLibCheck','--outDir',tmp,navSrc,timerSrc],{stdio:'pipe'});
const {resolveMovement,isWalkable}=await import(pathToFileURL(join(tmp,'navigation.js')));
const {RushClock}=await import(pathToFileURL(join(tmp,'RushClock.js')));
test('physical collision prevents walking through furniture, but retains sliding',()=>{
 assert.equal(isWalkable({x:-3.6,z:2},0),false,'desk must be solid');
 assert.equal(isWalkable({x:3.85,z:-1.85},0),false,'gramophone must be solid');
 assert.equal(isWalkable({x:0,z:-7.1},0),false,'locked garden inaccessible');
 assert.equal(isWalkable({x:0,z:-7.1},4),true,'gate unlocks after book puzzle');
 assert.equal(isWalkable({x:3.5,z:-7.1},4),false,'side wall remains solid');
 assert.deepEqual(resolveMovement({x:-1.5,z:2},{x:-2.1,z:2},0),{x:-1.5,z:2});
 assert.deepEqual(resolveMovement({x:-1.5,z:3.4},{x:-2.1,z:2.8},0),{x:-2.1,z:3.4},'should slide along desk');
 assert.equal(isWalkable({x:0,z:-15.2},5),false,'garden table solid');
});
test('countdown is deterministic, pauses while tab is hidden, resumes and stops',()=>{
 const clock=new RushClock();
 assert.equal(clock.active,false);
 clock.start(1000,120000);
 assert.equal(clock.remaining(41000),80000);
 clock.pause(41000);
 assert.equal(clock.paused,true);
 assert.equal(clock.remaining(9999999),80000);
 clock.resume(9000000);
 assert.equal(clock.remaining(9000030),79970);
 clock.stop();
 assert.equal(clock.active,false);
 assert.equal(clock.remaining(9999999),0);
});
