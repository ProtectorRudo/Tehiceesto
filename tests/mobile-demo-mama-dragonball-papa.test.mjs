import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Papá is removed from public discovery, not deleted from purchased gift models",()=>{
  const catalog=read("data/experiences.ts");
  const categories=read("data/recipient-categories.ts");
  const sitemap=read("app/sitemap.ts");
  assert.match(catalog,/hiddenExperienceSlugs\s*=\s*new Set\(\[[^\]]*"papa"/);
  assert.match(catalog,/slug:\s*"papa"/,"Preserve Papá as an internal/previously purchased model");
  assert.doesNotMatch(categories,/id:\s*"papa"/,"No empty public Papá collection");
  assert.doesNotMatch(sitemap,/\/(?:coleccion|experiencias)\/papa/);
  assert.match(read("app/r/[code]/page.tsx"),/getExperience|renderer/i,"Private gifts remain resolvable");
});

test("Mamá demo restores original audio and includes mobile GPU optimization",()=>{
  const mp3=readFileSync(new URL("../public/mama-voz-web.mp3",import.meta.url));
  assert.ok(mp3.length>100000,"Actual user-provided voice recording must be present");
  assert.equal(mp3.toString("ascii",0,3),"ID3");
  const renderer=read("components/legacy-v5/ExperienceEngine.tsx");
  assert.match(renderer,/mama-voz-web\.mp3/);
  const css=read("components/legacy-v5/tehiceesto-mama-voices-fix.css");
  assert.match(css,/Mobile Mamá performance/);
});

test("Dragon Ball demo opens closed sticker envelopes, does not scroll back when flipping, and supports Android holds",()=>{
  const src=read("public/dragon-ball-pareja-demo-mobile.html");
  assert.match(src,/function go\(n,keepScroll=false\)/);
  assert.match(src,/function flipMemory\(i\)[^\n]*go\(S\.page,true\)/);
  assert.match(src,/function beat\(i\)[^\n]*go\(S\.page,true\)/);
  assert.match(src,/reveal-zone .*demo-sealed/);
  assert.match(src,/function unsealSticker\(\)/);
  assert.match(src,/#chargeBtn\{touch-action:none;-webkit-touch-callout:none;/);
  assert.match(src,/performance\.now\(\)-startedAt/);
  assert.match(src,/if\(!giftMode&&zone\?\.classList/,"New envelope sequence is demo-only");
  assert.match(read("public/dragon-ball-pareja.html"),/function restartJourney\(\)/,"Locked purchased gift replay behavior remains intact");
});
