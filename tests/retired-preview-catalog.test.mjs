import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Retired Sticker Bomb never appears in the public Home or catalog",()=>{
  const source=read("data/experiences.ts");
  const home=read("app/page.tsx");
  const catalog=read("app/coleccion/[categoria]/page.tsx");
  const demo=read("app/experiencias/[slug]/page.tsx");
  const checkout=read("app/comprar/sticker-bomb-amistad/page.tsx");
  assert.match(source,/hiddenExperienceSlugs\s*=\s*new Set\(\[[^\]]*"sticker-bomb-amistad"/);
  assert.match(source,/publicExperiences\s*=\s*experiences\.filter/);
  assert.match(home,/<BoutiqueGallery experiences=\{publicExperiences\}/);
  assert.match(catalog,/categoria==="todos"\?publicExperiences:publicExperiences\.filter/);
  assert.match(demo,/slug==="sticker-bomb-amistad"\) notFound\(\)/);
  assert.match(checkout,/notFound\(\)/);
  assert.match(read("app/r/[code]/page.tsx"),/rendererFamily==="sticker-bomb"/,
    "Previously shared private gifts must keep their original renderer");
});

test("Every publicly sold experience has an actual non-empty preview asset",()=>{
  const source=read("data/experiences.ts");
  const slugs=[...source.matchAll(/    slug: "([a-z0-9-]+)"/g)].map(x=>x[1]);
  const hidden=source.match(/hiddenExperienceSlugs\s*=\s*new Set\(\[([^\]]+)\]/);
  assert.ok(hidden,"missing hidden experience list");
  const withdrawn=new Set([...hidden[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]));
  const svg=new Set(["frasco365","siete-dias","club-amigos","dragon-ball-pareja","sticker-bomb-amistad"]);
  for(const slug of slugs.filter(x=>!withdrawn.has(x))){
    const path="public/demo-previews/"+slug+(svg.has(slug)?".svg":".jpg");
    assert.ok(existsSync(new URL("../"+path,import.meta.url)),path+" is missing");
    assert.ok(read(path).length>100,"preview is empty: "+path);
  }
});

test("Home still advertises four games at the approved price, not the obsolete offer",()=>{
  const home=read("app/page.tsx");
  assert.match(home,/CUATRO MUNDOS, UNA SOLA COMPRA/);
  assert.match(home,/<strong>4 JUEGOS\.<br\/>1 COMPRA\.<br\/>\$25\.000 ARS\.<\/strong>/);
  assert.doesNotMatch(home,/3 JUEGOS|\$1\.000 ARS/i);
});
