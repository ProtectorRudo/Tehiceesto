import test from "node:test";
import assert from "node:assert/strict";
import {arrangeScenePhotos} from "../lib/gifts/arrange-scene-photos.ts";

const photo=(id,scene="memories")=>({id,metadata:{scene},url:"https://private.invalid/"+id});

test("unchanged gifts render the exact original photo order and references",()=>{
  const a=photo("a"),b=photo("b");
  const source=[a,b];
  const output=arrangeScenePhotos(source,undefined,["intro","memories"]);
  assert.deepEqual(output.map(x=>x.item.id),["a","b"]);
  assert.ok(output[0].item===a);
  assert.deepEqual(source,[a,b]);
});

test("explicit slot override replaces exact scene position but not other scenes",()=>{
  const a=photo("a"),b=photo("b"),c=photo("c","gallery");
  const result=arrangeScenePhotos([a,b,c],{"memories:0":{mediaId:"b"}},["intro","memories","gallery"]);
  assert.deepEqual(result.map(x=>[x.item.id,x.scene]),[["b","memories"],["a","memories"],["c","gallery"]]);
});

test("unknown ids and unsafe or unapproved scenes cannot modify a gift",()=>{
  const photos=[photo("a")];
  const result=arrangeScenePhotos(photos,{"memories:0":{mediaId:"other-buyers-photo"},"escape:0":{mediaId:"a"},"memories:99":{mediaId:"a"}},["intro","memories"]);
  assert.deepEqual(result.map(x=>x.item.id),["a"]);
});

test("empty scene can assign one real uploaded photo to an approved position",()=>{
  const a=photo("a","intro");
  const output=arrangeScenePhotos([a],{"memories:0":{mediaId:"a"}},["intro","memories"]);
  assert.ok(output.some(x=>x.scene==="memories"&&x.item.id==="a"));
});

test("no slot means no loss of paid gift's assets",()=>{
  const photos=[photo("a","memories"),photo("voice-jacket","intro"),photo("c","gallery")];
  const output=arrangeScenePhotos(photos,{},["intro","memories","gallery"]);
  assert.deepEqual(output.map(x=>x.item.id),photos.map(x=>x.id));
});
