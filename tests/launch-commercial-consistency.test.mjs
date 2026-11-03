import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("app/page.tsx");
const catalog=read("app/coleccion/[categoria]/page.tsx");
const pack=read("app/juegos/pack/page.tsx");
const checkout=read("components/QuickCheckout.tsx");
const jar=read("components/Jar365Checkout.tsx");
const seven=read("components/SevenDaysCheckout.tsx");
const backend=read("supabase/functions/order-create/index.ts");
const retired=read("app/comprar/sticker-bomb-amistad/page.tsx");

test("Home and catalog never advertise the obsolete 3-game ARS 1,000 pack",()=>{
  for(const [name,content] of [["Home",home],["catalog",catalog],["pack",pack]]){
    assert.doesNotMatch(content,/\$1\.000|3 JUEGOS|Tres juegos\.|Los tres completos/i,name);
    assert.match(content,/\$25\.000/,name);
    assert.match(content,/cuatro|4 JUEGOS/i,name);
  }
  for(const label of ["CÓMPLICES","ENTRE DOS","TRAZO CÓMPLICE","MEME MATCH"])assert.ok(home.includes(label),label);
});

test("Both special experiences display actual checkout price and verify provider response before redirect",()=>{
 for(const [name,s] of [["Frasco 365",jar],["Siete Días",seven]]){
   assert.match(s,/\$25\.000 ARS · pago único/,name);
   assert.doesNotMatch(s,/precio de prueba|\$1\.000/i,name);
   assert.match(s,/Number\(data.priceMinor\)!==2_500_000\|\|data.currency!==\"ARS\"/,name);
   assert.ok(s.indexOf("price_mismatch")<s.indexOf("window.location.assign(data.checkoutUrl)"),name);
 }
});

test("Cross-check regular checkout and backend current normal price contract",()=>{
 assert.match(checkout,/const basePriceMinor=2_500_000/);
 assert.match(backend,/const basePriceMinor=experienceSlug==="pack-juegos"&&!trialPricing\?2500000:commercePriceMinor/);
 assert.match(backend,/const addonPriceMinor=trialPricing\?100000:1000000/);
});

test("Withdrawn Sticker Bomb product is not buyable through its dedicated checkout or order API",()=>{
 assert.match(retired,/notFound\(\)/);
 assert.match(backend,/\["abuelos","aniversario","propuesta","club-amigos","sticker-bomb-amistad"\]/);
});
