import assert from "node:assert/strict";
import { chromium } from "playwright";

const sha="b380be4d8490fa60c9063026bc462f46e1b632d7";
const base="https://tehiceesto.vercel.app";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const checked=[];
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const ver=await page.goto(base+"/api/version",{waitUntil:"domcontentloaded",timeout:50000});
  assert.equal(ver?.status(),200,"Native Vercel API version is unavailable");
  const version=JSON.parse(await page.locator("body").innerText());
  assert.equal(version.service,"tehiceesto");
  assert.equal(version.commit,sha,"Native Vercel is serving wrong commit");
  assert.equal(version.environment,"production","Expected production environment");
  console.log("VERCEL_VERSION_PASS",width,JSON.stringify(version));
  for(const path of ["/","/crear","/mis-regalos","/comprar/pareja","/experiencias/dragon-ball-pareja","/experiencias/sticker-bomb-amistad","/dragon-ball-pareja.html"]){
   const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:50000});
   assert.equal(response?.status(),200,path+" returned "+response?.status());
   assert.ok(!page.url().includes("vercel.com/login"),path+" requires Vercel authentication");
   await page.waitForTimeout(450);
   const body=await page.locator("body").innerText();
   assert.ok(body.trim().length>50||path==="/dragon-ball-pareja.html",path+" empty");
   if(path==="/")assert.ok(body.includes("Un regalo que no termina cuando lo abrís."),"Persuasive copy not on Vercel production");
   if(path==="/dragon-ball-pareja.html"){
    await page.evaluate(()=>go(3));
    assert.equal(await page.locator(".pack.opened").count(),0,"Demo has stale envelopes");
    assert.equal(await page.locator("#stickerCount").innerText(),"0/9");
   }
   console.log("VERCEL_ROUTE_PASS",width,path);
  }
  assert.deepEqual(errors,[],"Browser JS errors on native Vercel");
  await page.close();checked.push(width);
 }
 console.log("VERCEL_NATIVE_PRODUCTION_PASS",JSON.stringify({sha,viewports:checked,routesPerViewport:7}));
}finally{await browser.close()}
