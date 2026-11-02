import assert from "node:assert/strict";
import { chromium } from "playwright";

const hooks={
  pareja:"Su historia merece algo más que una foto juntos.",
  cumpleanos:"Que no sea un cumpleaños más.",
  mama:"Hay gracias que no entran en un mensaje.",
  papa:"Que sepa cuánto de él vive en vos.",
  amistad:"Nadie más entendería esos códigos. Y eso lo hace especial.",
  "sticker-bomb-amistad":"Primero se van a reír. Después, quizá necesiten un abrazo.",
  frasco365:"Un regalo que no termina cuando lo abrís.",
  "siete-dias":"Siete días. Siete momentos para volver a emocionarse.",
  "dragon-ball-pareja":"Una historia de amor digna de su propia saga.",
};
const base="https://tehiceesto.com/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
try{
 for(const width of [360,390,1280]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500, ...(width<500 ? {userAgent:"Mozilla/5.0 (Linux; Android 14; moto edge 30 pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36"} : {})});
  const consoleErrors=[]; page.on("pageerror",e=>consoleErrors.push(e.message));
  const res=await page.goto(base,{waitUntil:"networkidle",timeout:120000});
  assert.equal(res?.status(),200,"Canonical homepage HTTP");
  console.log("MOBILE_CACHE_HEADERS",width,JSON.stringify({
    origin:page.url(),
    cacheControl:res?.headers()["cache-control"],
    age:res?.headers()["age"],
    vercelCache:res?.headers()["x-vercel-cache"],
    appState:res?.headers()["x-nextjs-cache"],
  }));
  const cards=page.locator(".ethos-like-card");
  assert.equal(await cards.count(),Object.keys(hooks).length,"Unexpected number of public gift models");
  for(const [slug,hook] of Object.entries(hooks)){
   const card=page.locator(".ethos-like-card--"+slug);
   assert.equal(await card.count(),1,"Missing card "+slug);
   const title=await card.locator(".ethos-card-information h3").textContent();
   const lead=await card.locator(".ethos-card-pitch strong").textContent();
   const body=await card.locator(".ethos-card-pitch span").textContent();
   assert.equal(lead?.trim(),hook,"Incorrect persuasive headline on "+slug);
   assert.ok((body||"").trim().length>75,"Missing/too-short distinct description on "+slug);
   assert.ok(!/undefined|null|lorem ipsum/i.test(body||""),"Placeholder content "+slug);
   const pitchBox=await card.locator(".ethos-card-pitch").boundingBox();
   const titleBox=await card.locator(".ethos-card-information h3").boundingBox();
   const buttonBox=await card.getByRole("link",{name:/Comprar esta experiencia/i}).boundingBox();
   assert.ok(pitchBox&&titleBox&&buttonBox,slug+" missing visible layout");
   assert.ok(pitchBox.y>=titleBox.y+titleBox.height,slug+" pitch overlaps title");
   assert.ok(buttonBox.y>=pitchBox.y+pitchBox.height,slug+" CTA overlaps description");
   const clipping=await card.evaluate(el=>{
    const pitch=el.querySelector(".ethos-card-pitch");
    return pitch ? pitch.scrollHeight-pitch.clientHeight : 99;
   });
   assert.ok(clipping<3,slug+" paragraph is vertically clipped by "+clipping);
   console.log("CARD_COPY_PASS",width,slug,JSON.stringify({title,hook,characters:body.length}));
  }
  if(width===390){
    // A returning in-app browser may retain the same URL after a previous visit.
    await page.reload({waitUntil:"networkidle",timeout:120000});
    assert.equal(await page.locator(".ethos-like-card--frasco365 .ethos-card-pitch strong").innerText(),hooks.frasco365,"Android revisit still serves stale catalogue");
    console.log("ANDROID_REVISIT_LATEST_COPY_PASS");
  }
  assert.deepEqual(consoleErrors,[],"Browser runtime error on "+width+"px");
  await page.close();
  results.push(width);
 }
 console.log("PERSUASIVE_CARD_PRODUCTION_PASS",JSON.stringify({viewports:results,cards:Object.keys(hooks).length,checks:results.length*Object.keys(hooks).length}));
}finally{await browser.close();}
