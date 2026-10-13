import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';

const world=readFileSync(new URL('../src/scene/World.ts',import.meta.url),'utf8');
const glb=readFileSync(new URL('../public/models/heritage-rose-planter.glb',import.meta.url));

test('asset is an original GLB with detailed meshes, not a picture',()=>{
  assert.equal(glb.toString('ascii',0,4),'glTF');
  assert.equal(glb.readUInt32LE(4),2);
  assert.equal(glb.readUInt32LE(8),glb.byteLength);
  assert.ok(glb.byteLength>40000);
  assert.ok(glb.byteLength<450000);
  const jsonLength=glb.readUInt32LE(12);
  const data=JSON.parse(glb.toString('utf8',20,20+jsonLength));
  assert.ok(data.meshes.length>=6&&data.meshes.length<=12);
  assert.ok(data.materials.length>=5);
});

test('roof is physically pitched, rather than horizontal glass sheet',()=>{
  assert.match(world,/const yEave=5\.06,yPeak=7\.15/);
  assert.match(world,/geometry\.setAttribute\('position',new THREE\.Float32BufferAttribute\(vertices,3\)\)/);
});

test('flowers are petaled geometry, garden still wilts under countdown',()=>{
  assert.match(world,/private createBloomGeometry\(\)/);
  assert.match(world,/flowerGeo=this\.createBloomGeometry\(\)/);
  assert.match(world,/this\.updateBloomState\(\.28\+this\.storm\*\.72\)/);
  assert.match(world,/this\.botanicalMaterials\.forEach/);
});

test('premium flowering planters loaded as GLB with fallback and shared geometry',()=>{
  assert.match(world,/loader\.load\('\/models\/heritage-rose-planter\.glb'/);
  assert.match(world,/gltf\.scene\.clone\(true\)/);
  assert.match(world,/provisional\[i\]\.visible=false/);
});

test('furniture and final reveal receive detailed finishes and contact shadows',()=>{
  assert.match(world,/private createRomanticCanopy\(\)/);
  assert.match(world,/Roman|romanTexture/);
  assert.match(world,/this\.contactShadow\(0,-15\.2/);
});
