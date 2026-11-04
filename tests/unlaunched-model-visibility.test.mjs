import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Unlaunched demos remain reviewable but do not advertise unavailable purchases or get indexed",()=>{
 const model=read("app/experiencias/[slug]/page.tsx");
 assert.match(model,/hiddenExperienceSlugs\.has\(slug\)/);
 assert.match(model,/robots:\{index:false,follow:false,nocache:true\}/);
 assert.match(model,/!isUnlaunched&&<Link href=\{"\/comprar\/"/);
 assert.match(model,/!isUnlaunched&&<Link href="\/comprar\/dragon-ball-pareja"/);
 assert.match(model,/VISTA PREVIA · /);
 const catalog=read("data/experiences.ts");
 assert.match(catalog,/publicExperiences = experiences\.filter\(experience=>!hiddenExperienceSlugs\.has\(experience\.slug\)\)/);
 assert.match(model,/slug==="club-amigos" \|\| slug==="sticker-bomb-amistad"\) notFound/);
});

test("Three-size matrix audits all models with responsive and unpublished SEO checks",()=>{
 const source=read("scripts/visual-model-matrix.mjs");
 assert.match(source,/slugs\.length!==15/);
 assert.match(source,/width:320/);
 assert.match(source,/width:390/);
 assert.match(source,/width:1440/);
 assert.match(source,/brokenImages/);
 assert.match(source,/horizontal_overflow/);
 assert.match(source,/unlaunched_publicly_promoted/);
 assert.match(source,/AUDIT_ENGINE/);
});
