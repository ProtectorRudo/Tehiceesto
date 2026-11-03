import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {purchasedRendererFor,NON_GIFT_PRODUCTS,PURCHASED_RENDERERS} from "../lib/gifts/purchased-renderers.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("historically purchased gift-version combinations remain explicit and accepted",()=>{
 const historicallyObserved={
  "abuelos":["premium-v3"],"amistad":["premium-v5"],"aniversario":["premium-v3"],
  "club-amigos":["premium-v2"],"cumpleanos":["premium-v3"],
  "dragon-ball-pareja":["dragon-ball-v1"],"frasco365":["premium-v2"],
  "hijos":["premium-v3"],"mama":["premium-v5"],"papa":["premium-v3"],
  "pareja":["premium-v3","premium-v4","premium-v5"],"propuesta":["premium-v3"],
  "secreto":["premium-v3"],"siete-dias":["premium-v2"],
  "sticker-bomb-amistad":["premium-v2"]
 };
 for(const [slug,versions] of Object.entries(historicallyObserved)){
  for(const version of versions){
   const family=purchasedRendererFor(slug,version);
   assert.ok(family,slug+" "+version);
  }
 }
});

test("newly sold special models are pinned to their own renderer family",()=>{
 const expected={
  "dragon-ball-pareja":["dragon-ball-v1","dragon-ball"],
  "club-amigos":["club-v1","club"],
  "sticker-bomb-amistad":["sticker-bomb-v2","sticker-bomb"],
  "frasco365":["jar365-v1","jar365"],
  "siete-dias":["seven-days-v1","seven-days"],
 };
 for(const [slug,[version,family]] of Object.entries(expected)){
  assert.equal(purchasedRendererFor(slug,version),family,slug);
 }
});

test("unknown versions and non-gift purchases never silently become a generic page",()=>{
 const invalid=[
  ["dragon-ball-pareja","premium-v3"],
  ["mama","premium-v3"],["pareja","dragon-ball-v1"],
  ["siete-dias","premium-v3"],["unknown","premium-v3"],
  ["pareja","premium-v99"],["pareja",""],
 ];
 for(const [slug,version] of invalid){
  assert.throws(()=>purchasedRendererFor(slug,version),/gift_renderer_version_/);
 }
 for(const slug of NON_GIFT_PRODUCTS){
  assert.throws(()=>purchasedRendererFor(slug,"premium-v2"),/gift_renderer_version_/);
 }
});

test("public gift-read includes immutable template_version so the app can decide correctly",()=>{
 const edge=read("supabase/functions/gift-read/index.ts");
 assert.match(edge,/experience_slug,template_version,giver_name/);
 const repo=read("lib/gifts/repository.ts");
 assert.match(repo,/const rendererFamily=purchasedRendererFor\(row\.experience_slug,row\.template_version\)/);
 assert.match(repo,/templateVersion: row\.template_version/);
 assert.match(repo,/rendererFamily,/);
});

test("every special purchased model uses the registered renderer, not the latest demo slug",()=>{
 const source=read("app/r/[code]/page.tsx");
 for(const family of ["dragon-ball","sticker-bomb","jar365","seven-days"])
  assert.ok(source.includes('storedGift.rendererFamily==="'+family+'"'),family);
 assert.match(source,/!\["premium-legacy","secret","club"\]\.includes\(storedGift\.rendererFamily\)/);
 assert.ok(!source.includes('if(storedGift.experience.slug==="dragon-ball-pareja")'));
 assert.ok(!source.includes('if (storedGift.experience.slug==="frasco365")'));
});

test("all declared registry products are real supported experience slugs",()=>{
 const data=read("data/experiences.ts");
 const declared=[...data.matchAll(/\bslug: "([a-z0-9-]+)"/g)].map(x=>x[1]);
 for(const slug of Object.keys(PURCHASED_RENDERERS))assert.ok(declared.includes(slug),slug);
});
