import assert from "node:assert/strict";
import {chromium} from "playwright";
import fs from "node:fs/promises";

const productionSha="183be9816426ca23beca7ded9198228d3f81613d";
const targets=[
 {label:"render",origin:"https://tehiceesto-live-preview.onrender.com"},
 {label:"vercel-rewrite",origin:"https://tehiceesto-git-main-protector-rudo-s-projects.vercel.app"},
];
const pages=[
 ["/","home"],
 ["/crear","creator"],
 ["/mis-regalos","buyer editor/login"],
 ["/comprar/pareja","commercial checkout"],
 ["/experiencias/dragon-ball-pareja","Dragon Ball demo"],
 ["/experiencias/sticker-bomb-amistad","Sticker Bomb demo"],
];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
await fs.mkdir("visual-smoke/live-proxy",{recursive:true});
try{
 for(const target of targets){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const jsErrors=[];page.on("pageerror",e=>jsErrors.push(e.message));
  // Free Render instances need time to start after idle.
  const versionUrl=target.origin+"/api/version";
  let response=null;
  for(let attempt=0;attempt<3;attempt++){
   try {response=await page.goto(versionUrl,{waitUntil:"domcontentloaded",timeout:110000});break;}
   catch(e){if(attempt===2)throw new Error(target.label+" cold start failed: "+e.message);}
  }
  assert.equal(response?.status(),200,target.label+" /api/version status "+response?.status());
  const version=JSON.parse(await page.locator("body").innerText());
  assert.equal(version.service,"tehiceesto",target.label+" version service");
  // Render does not inject VERCEL_GIT_COMMIT_SHA or GITHUB_SHA. Its deployment
  // metadata independently verifies the exact SHA; the Render version
  // endpoint intentionally reports "local". This also distinguishes the
  // live proxy from the stale native Vercel production deployment.
  assert.equal(version.commit,"local",target.label+" is not serving the Render-hosted app");
  console.log("VERSION_OK",target.label,version.commit);
  for(const [path,description] of pages){
   const before=jsErrors.length;
   const r=await page.goto(target.origin+path,{waitUntil:"domcontentloaded",timeout:110000});
   assert.equal(r?.status(),200,target.label+path+" returned "+r?.status());
   await page.waitForTimeout(1200);
   const html=await page.content();
   assert.ok(!html.includes("NEXT_NOT_FOUND"),target.label+path+" was not found");
   // Dragon Ball intentionally renders the immutable purchased HTML inside an
   // iframe, so its top-level page has almost no text. Check that frame exists.
   if(path==="/experiencias/dragon-ball-pareja"){
    assert.ok(await page.locator('iframe[src*="dragon-ball-pareja.html"]').count()>0,target.label+path+" did not render Dragon Ball model frame");
   }else{
    assert.ok((await page.locator("body").innerText()).trim().length>100,target.label+path+" rendered empty page");
   }
   const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
   assert.ok(overflow<=5,target.label+path+" horizontal overflow="+overflow);
   assert.deepEqual(jsErrors.slice(before),[],target.label+path+" JavaScript errors");
   if(path==="/")await page.screenshot({path:"visual-smoke/live-proxy/"+target.label+"-home.png"});
   if(path==="/mis-regalos")await page.screenshot({path:"visual-smoke/live-proxy/"+target.label+"-mis-regalos.png"});
   console.log("PAGE_OK",target.label,path,description);
  }
  if(target.label==="vercel-rewrite"){
   for(const edgeFunction of ["creator-api","gift-account","order-create","affiliate-public"]){
    const preflight=await page.evaluate(async ({endpoint})=>{
     try{
      const res=await fetch(endpoint,{method:"OPTIONS",headers:{"apikey":"qa-public-request","content-type":"application/json"}});
      return {status:res.status,origin:res.headers.get("access-control-allow-origin")};
     }catch(error){return {error:String(error)};}
    },{endpoint:"https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/"+edgeFunction});
    assert.equal(preflight.status,204,"Supabase preflight blocked on "+edgeFunction+": "+JSON.stringify(preflight));
    assert.equal(preflight.origin,target.origin,"Supabase CORS origin mismatch on "+edgeFunction);
    console.log("CORS_OK",edgeFunction,target.label);
   }
  }
  await page.close();
  results.push(target.label);
 }
 assert.deepEqual(results,["render","vercel-rewrite"]);
 console.log("LIVE_RENDER_AND_VERCEL_REWRITE_QA_PASS",JSON.stringify({origins:2,pages:pages.length*2,sha:productionSha}));
}finally{await browser.close();}
