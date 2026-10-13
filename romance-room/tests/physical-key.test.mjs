import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const world=readFileSync(new URL('../src/scene/World.ts',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/ui/style.css',import.meta.url),'utf8');
test('a physically modelled, direct-touch brass key exists on the desk',()=>{
 assert.match(world,/type Interactive = 'key'\|'desk'/);
 assert.match(world,/new THREE\.MeshStandardMaterial\(\{color:0xf4c778/);
 assert.match(world,/this\.keyHotspot=this\.hotspot\(display,'key'/);
 assert.match(world,/key:'Tomar llave de bronce'/);
 assert.match(world,/this\.interactive=this\.interactive\.filter\(object=>object!==this\.keyHotspot\)/);
});
test('examining the desk cannot silently collect the key',()=>{
 const start=app.indexOf("if(what==='desk')");
 const end=app.indexOf("if(what==='sundial')",start);
 const code=app.slice(start,end);
 assert.doesNotMatch(code,/keyFound:true|setKeyFound\(true\)|audio\.current\?\.success/);
 assert.match(app,/if\(what==='key'\)/);
 assert.match(app,/setKeyFound\(true\)/);
});
test('the clock cannot open before physical key pickup',()=>{
 assert.match(app,/if\(!progressRef\.current\.keyFound\)/);
});
test('mobile and desktop notifications stay clear of the focus action',()=>{
 assert.match(css,/V7: one clearly reserved vertical lane/);
 assert.match(css,/\.toast\{[\s\S]*?bottom:calc\(192px/);
 assert.match(css,/@media\(pointer:coarse\)\{[\s\S]*?\.toast\{bottom:calc\(232px/);
});
