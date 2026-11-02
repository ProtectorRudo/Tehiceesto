import assert from "node:assert/strict";
import {chromium} from "playwright";
const origin="https://tehiceesto.com";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const jsErrors=[];
 page.on("pageerror",e=>jsErrors.push(e.message));
 const resources=[];
 page.on("response",r=>{if(r.status()>=400&&/demo-previews|_next\/static|tehiceesto\/|dragon-ball-pareja.html/.test(r.url()))resources.push({url:r.url(),status:r.status()});});
 const res=await page.goto(origin+"/",{waitUntil:"networkidle",timeout:120000});
 assert.equal(res?.status(),200,"Commercial homepage status");
 const home=(await page.locator("body").innerText()).replace(/\s+/g," ");
 assert.ok(home.includes("UN ESTUDIO DE REGALOS QUE SE VIVEN"),"Old homepage still deployed");
 assert.ok(home.includes("Y otros que"),"Expected boutique heading missing");
 assert.equal(page.url(),origin+"/");
 const homeAssets=await page.evaluate(()=>({styles:[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>x.href),scripts:[...document.scripts].map(x=>x.src).filter(Boolean)}));
 assert.ok(homeAssets.styles.some(x=>x.startsWith("https://tehiceesto.com/_next/static/chunks/")),"Canonical-host CSS origin incorrect");
 console.log("LIVE_NEW_HOME_PASS",JSON.stringify({head:home.slice(0,200),styles:homeAssets.styles.length,scripts:homeAssets.scripts.length}));
 // Click through the actual hydrated CTA rather than only requesting a URL.
 const cta=page.getByRole("link",{name:/Quiero hacer un regalo/i}).first();
 await cta.click({timeout:20000});
 await page.waitForURL("**/crear",{timeout:60000});
 assert.ok((await page.locator("body").innerText()).includes("El regalo más lindo es"),"CTA did not load updated creator");
 console.log("LIVE_CREATOR_NAVIGATION_PASS");
 for(const path of ["/experiencias/pareja","/experiencias/dragon-ball-pareja","/experiencias/sticker-bomb-amistad"]){
  const response=await page.goto(origin+path,{waitUntil:"domcontentloaded",timeout:90000});
  assert.equal(response?.status(),200,path+" status");
  assert.ok(!page.url().includes("vercel.com/login"),path+" protected by SSO");
  await page.waitForTimeout(1000);
  if(path.includes("dragon-ball"))assert.ok(await page.locator('iframe[src*="dragon-ball-pareja.html"]').count()>0,"Dragon Ball HTML iframe missing");
  else assert.ok((await page.locator("body").innerText()).includes("DEMO"),path+" not new demo");
  console.log("LIVE_DEMO_PASS",path);
 }
 const acc=await page.goto(origin+"/mis-regalos",{waitUntil:"domcontentloaded",timeout:90000});
 assert.equal(acc?.status(),200,"Customer account blocked");
 await page.getByText("Tus regalos. Tu historia. Tu lugar.",{exact:false}).first().waitFor({timeout:12000});
 console.log("LEGACY_CUSTOMER_ACCESS_PRESERVED");
 const buy=await page.goto(origin+"/comprar/pareja",{waitUntil:"domcontentloaded",timeout:90000});
 assert.equal(buy?.status(),200,"Existing checkout route blocked");
 console.log("LEGACY_CHECKOUT_ACCESS_PRESERVED");
 console.log("LIVE_FAILED_RESOURCES",JSON.stringify(resources));
 console.log("LIVE_JS_ERRORS",JSON.stringify(jsErrors));
 assert.deepEqual(resources,[],"Missing critical media or scripts");
 assert.deepEqual(jsErrors,[],"Runtime errors found");
 console.log("LIVE_NEW_DESIGN_CANONICAL_PASS");
}finally{await browser.close()}
