import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const botany=readFileSync(new URL('../src/scene/botany.ts',import.meta.url),'utf8');
const world=readFileSync(new URL('../src/scene/World.ts',import.meta.url),'utf8');
test('roses have three concentric sculpted petal layers',()=>{for(const n of ['count:5','count:7','count:9','computeVertexNormals'])assert.ok(botany.includes(n));});
test('trees use instanced branches and curved leaves instead of balls',()=>{for(const k of ['createLeafGeometry','trunks.setMatrixAt','twigs.setMatrixAt','leaves.setMatrixAt'])assert.ok(botany.includes(k));assert.doesNotMatch(world.split('private createExteriorLandscape(){')[1].split('private createWindow(')[0],/this.sphere/);});
test('natural vegetation preserves clock, key and puzzle hotspots',()=>{for(const name of ['key','clock','books','gramophone','gardenGate'])assert.ok(world.includes("'"+name+"'"));assert.ok(world.includes('setRushIntensity(t:number)'));assert.ok(world.includes('setExplorationIntensity(value:number)'));});
