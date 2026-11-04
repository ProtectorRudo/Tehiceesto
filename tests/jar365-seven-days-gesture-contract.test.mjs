import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const jar=read("components/Jar365Experience.tsx");

test("365 public demo stops at five unique mimos; paid gifts and staff preview are exempt",()=>{
 assert.match(jar,/const limitedDemo=demo&&!*\(previewNotes\?\.length===365\)/);
 assert.match(jar,/const demoStorage="jar365-public-demo-opened-v1"/);
 assert.match(jar,/Math\.min\(5,n\)/);
 assert.match(jar,/JAR365_SEED\.slice\(0,saved\)/);
 assert.match(jar,/limitedDemo&&current>=5/);
 assert.match(jar,/note=opened\[demoDay%5\]/);
 assert.match(jar,/if\(limitedDemo\)try\{localStorage\.setItem\(demoStorage,String\(next\.openedCount\)\)/);
 assert.match(jar,/disabled=\{!available\|\|busy\|\|drawing\|\|\(!limitedDemo&&current>=365\)\}/);
 assert.match(jar,/Volver a ver mis mimos/);
 assert.match(jar,/aria-valuemax=\{limitedDemo\?5:365\}/);
 assert.match(jar,/if\(demo\)\{[\s\S]*?\}else\{\s*const response=await fetch\("\/api\/jar365"/);
});

test("Seven-day gestures use touch-friendly inputs while retaining accessible alternatives",()=>{
 const d3=read("public/siete-dias/dia-03.html");
 assert.match(d3,/\.intro \[data-action="investigate"\]/);
 assert.match(d3,/min-width:min\(87vw,290px\)/);
 assert.match(d3,/root\.addEventListener\('pointerup'/);
 assert.match(d3,/action==='investigate'&&stage==='arrival'/);
 const d4=read("public/siete-dias/dia-04.html");
 assert.match(d4,/holdTimer=setTimeout/);
 assert.match(d4,/performance\.now\(\)/);
 assert.match(d4,/b\.addEventListener\('pointerdown',beginHug\)/);
 assert.match(d4,/b\.addEventListener\('contextmenu'/);
 assert.match(d4,/action==='accessibleHug'/);
 const d5=read("public/siete-dias/dia-05.html");
 assert.match(d5,/slider\.addEventListener\('pointerdown'/);
 assert.match(d5,/slider\.addEventListener\('pointermove',onMove\)/);
 assert.match(d5,/slider\.addEventListener\('pointerup'/);
 assert.match(d5,/slider\.setPointerCapture/);
 assert.match(d5,/e\.clientX-pointerStart>32/);
 assert.match(d5,/a==='unwrap'/);
 const d6=read("public/siete-dias/dia-06.html");
 assert.match(d6,/travel>Math\.max\(150,w\*1\.55\)/);
 assert.match(d6,/c\.addEventListener\('pointerdown',begin\)/);
 assert.match(d6,/c\.addEventListener\('pointermove',wipe\)/);
 assert.match(d6,/touchmove.*passive:false/);
 assert.match(d6,/a==='reveal'/);
});
