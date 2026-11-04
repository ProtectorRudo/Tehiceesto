import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyLockedRenderers} from "../scripts/verify-renderer-lock.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const day1=read("public/siete-dias/dia-01.html");

test("Mimo's day-one envelope uses a shallow paper peek and explicit folded layering",()=>{
 const section=day1.split("/* Mimo · day 01.")[1]?.split("@media(prefers-reduced-motion:reduce)")[0];
 assert.ok(section,"Specific day-one mobile repair should be present");
 assert.match(section,/\.envelope-scene \.envelope\{[\s\S]*?aspect-ratio:278\/176/);
 assert.match(section,/\.envelope-scene \.envelope \.paper-in\{[\s\S]*?top:-8%/);
 assert.match(section,/\.envelope-scene \.envelope \.paper-in\{[\s\S]*?height:82%;z-index:1/);
 assert.match(section,/\.envelope-scene \.envelope \.front\{[\s\S]*?z-index:2/);
 assert.match(section,/\.envelope-scene \.envelope \.topfold\{[\s\S]*?z-index:3/);
 assert.match(section,/\.envelope-scene \.envelope \.wax\{z-index:4/);
 assert.match(section,/\.envelope-scene \.envelope\.opening \.paper-in\{transform:translateY\(-68%\)/);
 assert.match(section,/@media\(max-width:370px\)/);
 // At 320px, the sealed preview shows only ~10px of the 156px-high envelope.
 // At 390px, only ~14px of the 172px-high envelope is visible.
 for(const viewport of [320,360,375,390,414,430]){
  const width=Math.min(viewport*(viewport<=370?.79:.78),viewport<=370?246:272);
  const height=width*176/278;
  const peek=height*.08;
  assert.ok(width<=viewport-24,`Envelope overflow on ${viewport}px phone`);
  assert.ok(peek>=8&&peek<=16,`Letter should only peek at ${viewport}px: ${peek}px`);
 }
});

test("The private letter still reveals on touch or click, including reduced motion",()=>{
 assert.match(day1,/class="envelope" aria-label="Sobre premium rosado/);
 assert.match(day1,/class="paper-in"/);
 assert.match(day1,/class="topfold"/);
 assert.match(day1,/class="front"/);
 assert.match(day1,/class="wax"/);
 assert.match(day1,/data-action="letter"/);
 assert.match(day1,/if\(action==='letter'\)/);
 assert.match(day1,/root\.querySelector\('\.envelope'\)\?\.classList\.add\('opening'\)/);
 assert.match(day1,/stage='letter';completed=true;render\(\)/);
 assert.match(day1,/matchMedia\('\(prefers-reduced-motion:reduce\)'\)/);
});

test("The other six chapter visuals and independent envelope designs are unaffected",()=>{
 for(let day=2;day<=7;day++){
  const source=read("public/siete-dias/dia-"+String(day).padStart(2,"0")+".html");
  assert.doesNotMatch(source,/class="envelope"/,`Day ${day} unexpectedly shares Mimo's CSS`);
  assert.doesNotMatch(source,/class="topfold"/,`Day ${day} unexpectedly shares Mimo's flap`);
 }
 const sticker=read("components/sticker-bomb-experience.module.css");
 assert.match(sticker,/\.envelopeFlap\{/);
 assert.match(sticker,/\.envelopeSeal\{/);
 const legacy=read("components/legacy-v5/tehiceesto-premium-v1.css");
 assert.match(legacy,/\.thi-envelope \.front\{/);
 assert.match(legacy,/\.thi-envelope \.paper\{/);
 assert.doesNotMatch(sticker,/\.envelope-scene \.envelope/);
 assert.doesNotMatch(legacy,/\.envelope-scene \.envelope/);
 const locked=verifyLockedRenderers();
 assert.ok(locked.protectedFiles>=18,"Sold renderer hashes must remain locked");
});
