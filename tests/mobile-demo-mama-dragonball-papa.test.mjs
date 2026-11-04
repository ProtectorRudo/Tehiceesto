import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Papá is removed from public discovery, not deleted from purchased gift models",()=>{
  const catalog=read("data/experiences.ts");
  const categories=read("data/recipient-categories.ts");
  const sitemap=read("app/sitemap.ts");
  assert.match(read("data/public-experiences.ts"),/experience\.slug !== "papa"/);
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
  const publicDemo=read("components/legacy-v5/MamaDemoEngine.tsx");
  assert.match(publicDemo,/demoVoiceUtteranceRef\.current=utterance/,"Retain Android TTS utterance");
  assert.match(publicDemo,/utterance\.onend=\(\)=>/,"Mark textual voices heard only after playback");
  assert.match(publicDemo,/Math\.abs\(percent-previous\)>=3/,"Reduce CPU churn for audio progress");
  const route=read("app/experiencias/[slug]/page.tsx");
  assert.match(route,/slug==="mama"\?MamaDemoExperience/,"Only the public Mamá demo gets the new renderer");
  assert.match(route,/slug==="papa"\) notFound\(\)/,"Hide direct Papá demo route");
  const css=read("components/legacy-v5/tehiceesto-mama-voices-fix.css");
  assert.match(css,/Mobile Mamá performance/);
  assert.match(css,/\.thi-mama-demo \.thi-theme-mama/,"Mobile optimization must not affect purchased gifts");
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
