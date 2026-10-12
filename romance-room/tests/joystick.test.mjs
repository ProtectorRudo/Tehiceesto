import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// Strip TS-only declarations to exercise the real pure implementation in Node without tsx.
const input=fs.readFileSync(new URL('../src/game/joystick.ts',import.meta.url),'utf8')
  .replace('export type Stick = {x:number;y:number};','')
  .replaceAll(':number','').replaceAll(':Stick','').replaceAll('export function','function');
const {stickVector,stickOffset}=new Function(input+';return {stickVector,stickOffset}')();
test('touch dead zone prevents drift',()=>assert.deepEqual(stickVector(1,-1),{x:0,y:0}));
test('full forward / reverse stable',()=>{
  assert.equal(stickVector(0,-100).y,-1);
  assert.equal(stickVector(0,100).y,1);
});
test('diagonal normalized',()=>{
  const p=stickVector(50,-50);
  assert.ok(Math.abs(Math.hypot(p.x,p.y)-1)<.0001);
});
test('visual thumb remains inside ring',()=>{
  assert.ok(Math.abs(stickOffset(1000,0).x-44)<.00001);
});
