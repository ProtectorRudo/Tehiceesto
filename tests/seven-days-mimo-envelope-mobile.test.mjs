import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const day=(n)=>readFileSync(new URL("../public/siete-dias/dia-"+String(n).padStart(2,"0")+".html",import.meta.url),"utf8");
const one=day(1);
const patch=one.slice(one.indexOf("/* Mimo · day 01."),one.indexOf("</style>"));

test("Day 1 Mimo keeps a closed envelope with bounded peeking paper and correct layer ordering",()=>{
 assert.ok(patch.startsWith("/* Mimo · day 01."),"Responsive fix must follow all older rules");
 assert.match(patch,/\.envelope-scene \.envelope-area\{height:clamp\(/);
 assert.match(patch,/\.envelope-scene \.envelope\{[^}]*aspect-ratio:278\/176/s);
 assert.match(patch,/\.envelope-scene \.envelope \.paper-in\{[^}]*top:-8%/s);
 assert.match(patch,/\.envelope-scene \.envelope \.paper-in\{[^}]*z-index:1/s);
 assert.match(patch,/\.envelope-scene \.envelope \.front\{[^}]*z-index:2/s);
 assert.match(patch,/\.envelope-scene \.envelope \.topfold\{[^}]*z-index:3/s);
 assert.match(patch,/\.envelope-scene \.envelope \.wax\{[^}]*z-index:4/s);
 assert.match(patch,/\.envelope-scene \.envelope\.opening \.paper-in\{transform:translateY\(-68%\)/);
 assert.match(patch,/@media\(max-width:370px\)/);
});
test("Closing Mimo's envelope leaves the interactive journey and personal message untouched",()=>{
 assert.match(one,/if\(stage==='envelope'\).*Abrir mi cartita/);
 assert.match(one,/root\.querySelector\('\.envelope'\)\?\.classList\.add\('opening'\)/);
 assert.match(one,/setTimeout\(\(\)=>\{stage='letter';completed=true;render\(\)\}/);
 assert.match(one,/PARA \$\{escapeHtml\(gift\.recipient\.toUpperCase\(\)\)\}/);
 assert.match(one,/Mimo vino a buscar tus besos/);
});
test("All seven days exist and only Mimo uses this particular layered envelope",()=>{
 for(let i=1;i<=7;i++){
  const source=day(i);
  assert.match(source,/<!doctype html>/i,`chapter ${i} missing`);
  assert.ok(source.includes("</html>"),`chapter ${i} truncated`);
  if(i===1)assert.equal(source.split('class="envelope"').length-1,1);
  else assert.equal(source.split('class="envelope"').length-1,0,`Unexpected shared envelope in chapter ${i}`);
 }
 assert.match(day(2),/class="letter"/);
 assert.match(day(3),/class="letter"/);
});
test("Different envelope renderers stay separate from Mimo's scoped CSS",()=>{
 assert.ok(patch.split("}.envelope").length<2);
 assert.doesNotMatch(patch,/\.thi-envelope/);
 assert.doesNotMatch(patch,/\.envelopeFlap/);
 assert.doesNotMatch(patch,/\.envelopeSeal/);
});
