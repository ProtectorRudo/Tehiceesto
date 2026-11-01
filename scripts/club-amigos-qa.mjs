import {chromium} from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const report=[];
try{
 for(const viewport of [{width:320,height:720},{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  for(const route of ["/experiencias/club-amigos","/experiencias/club-amigos?embed=1","/comprar/club-amigos"]){
   const response=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:45000});
   assert.equal(response?.status(),404,"Retired Club de Amigos must be unavailable: "+route);
  }
  const collection=await page.goto(base+"/coleccion/amigos",{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(collection?.status(),200);
  assert.equal(await page.locator('a[href*="club-amigos"]').count(),0,"Retired Club is not in the friendship catalog");
  assert.ok(await page.getByText("Sticker Bomb").count()>0,"Sticker Bomb stays available");
  const create=await page.goto(base+"/crear",{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(create?.status(),200);
  assert.equal(await page.locator('a[href*="comprar/club-amigos"]').count(),0);
  assert.equal(await page.getByText("Club de Amigos de Toda la Vida").count(),0,"Retired product is hidden");
  assert.deepEqual(errors,[],"No JavaScript exceptions");
  report.push({width:viewport.width,demo404:true,checkout404:true,clubHidden:true,stickerBombPreserved:true});
  await page.close();
 }
}finally{await browser.close();}
const files=["components/ClubAmigosExperience.tsx","data/experiences.ts","supabase/functions/order-create/index.ts","supabase/functions/creator-api/index.ts"];
const text=await Promise.all(files.map(f=>fs.readFile(f,"utf8")));
assert.match(text[0],/sceneTextOverrides\?\.club\?\.\[value\]/,"Existing gifts retain custom text");
assert.match(text[0],/photoMedia\[i\]\?\.url/,"Existing gifts retain their photographs");
assert.match(text[0],/audioMedia\[0\]\.url/,"Existing gifts retain audio");
assert.match(text[1],/slug: "club-amigos"/,"Historical template stays available for existing gifts");
assert.match(text[1],/hiddenExperienceSlugs[\s\S]*?"club-amigos"/,"New catalog excludes retired experience");
assert.match(text[2],/\["abuelos","aniversario","propuesta","club-amigos"\]/,"New purchase is rejected at backend");
assert.match(text[2],/"club-amigos": \["club"\]/,"Existing gift recipe stays available");
assert.match(text[3],/"club-amigos": \["club"\]/,"Existing gift editor stays available");
console.log("CLUB_AMIGOS_RETIRED_EXISTING_GIFTS_SAFE",JSON.stringify(report));
