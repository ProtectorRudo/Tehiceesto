/**
 * Responsive audit of the complete 15-model registry. Eight published models
 * must render; seven withdrawn/unlaunched models are checked without making
 * them public again. Screenshots and JSON stay in local QA output only.
 *
 * Run: PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64
 *      AUDIT_BASE_URL=https://tehiceesto.com node scripts/visual-model-matrix.mjs
 */
import {chromium,webkit} from "playwright";
import {readFileSync} from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const source=readFileSync(new URL("../data/experiences.ts",import.meta.url),"utf8");
const slugs=[...source.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].map(match=>match[1]);
const hiddenLine=source.match(/export const hiddenExperienceSlugs = new Set\(\[([^\]]+)\]\)/)?.[1]||"";
const hidden=new Set([...hiddenLine.matchAll(/"([a-z0-9-]+)"/g)].map(match=>match[1]));
if(slugs.length!==15||new Set(slugs).size!==15)throw Error("visual_matrix_registry_changed");

const base=(process.env.AUDIT_BASE_URL||"https://tehiceesto.com").replace(/\/$/,"");
const engineName=process.env.AUDIT_ENGINE==="webkit"?"webkit":"chromium";
const out=process.env.AUDIT_REPORT_DIR||"visual-smoke/model-matrix-"+engineName;
const sizes=[
 {name:"android-compact",width:320,height:740,isMobile:true,hasTouch:true},
 {name:"android-phone",width:390,height:844,isMobile:true,hasTouch:true},
 {name:"desktop",width:1440,height:900,isMobile:false,hasTouch:false},
];
await fs.mkdir(out,{recursive:true});
const browser=await (engineName==="webkit"?webkit:chromium).launch({
 headless:true,...(engineName==="chromium"?{args:["--no-sandbox"]}:{})
});
const report=[];
try{
 for(const screen of sizes){
  const context=await browser.newContext({
   viewport:{width:screen.width,height:screen.height},
   isMobile:screen.isMobile,hasTouch:screen.hasTouch,
   locale:"es-AR",reducedMotion:"reduce",
   deviceScaleFactor:screen.isMobile?2:1,
  });
  const page=await context.newPage();
  for(const slug of slugs){
   const errors=[];
   const onError=e=>errors.push(e.message);
   page.on("pageerror",onError);
   let status=0,title="",metrics={},failure="";
   try{
    const result=await page.goto(base+"/experiencias/"+slug,{
     waitUntil:"domcontentloaded",timeout:32000
    });
    status=result?.status()||0;
    await page.waitForTimeout(600);
    title=await page.title();
    metrics=await page.evaluate(()=>{
     const root=document.documentElement;
     const badImages=Array.from(document.images)
      .filter(img=>img.complete&&img.naturalWidth===0&&img.getAttribute("src"))
      .map(img=>img.getAttribute("src")).slice(0,9);
     return {
      viewportWidth:window.innerWidth,documentWidth:root.scrollWidth,
      heading:(document.querySelector("h1")?.textContent||"").trim().slice(0,120),
      brokenImages:badImages,
      buttonCount:document.querySelectorAll("button").length,
      hasMain:Boolean(document.querySelector("main")),
      hasContent:Boolean(document.body?.innerText?.trim()),
      noindex:Boolean(document.querySelector('meta[name="robots"][content*="noindex"]')),
      hasBuyLink:Boolean(document.querySelector('a[href^="/comprar/"]')),

     };
    });
    if(status===200 && !hidden.has(slug)&&screen.name!=="android-compact"){
     await page.screenshot({path:path.join(out,screen.name+"-"+slug+".png"),fullPage:false});
    }
    if(!hidden.has(slug)&&status!==200)failure="public_model_http_"+status;
    if(status===200){
     if(errors.length)failure+=" js_error";
     if(metrics.documentWidth>screen.width+2)failure+=" horizontal_overflow";
     if(metrics.brokenImages?.length)failure+=" broken_images";
     if(!metrics.hasContent)failure+=" empty_body";
     if(hidden.has(slug)&&(!metrics.noindex||metrics.hasBuyLink))
      failure+=" unlaunched_publicly_promoted";
    }
   }catch(error){failure="navigation_failure:"+String(error.message||error).slice(0,180);}
   page.off("pageerror",onError);
   const entry={slug,screen:screen.name,expectedPublic:!hidden.has(slug),
    status,title,metrics,errors,failure:failure.trim()};
   report.push(entry);
   console.log("MODEL_QA",JSON.stringify({
    slug,screen:screen.name,status,public:!hidden.has(slug),
    overflow:metrics.documentWidth>screen.width+2,
    missing:metrics.brokenImages?.length||0,jsErrors:errors.length,
    failure:entry.failure
   }));
  }
  await context.close();
 }
}finally{
 await browser.close();
}
const summary={
 generatedAt:new Date().toISOString(),engine:engineName,base,slugs:slugs.length,public:slugs.filter(s=>!hidden.has(s)).length,
 widths:sizes.map(s=>s.width),checks:report.length,
 failures:report.filter(x=>x.failure).map(x=>({slug:x.slug,screen:x.screen,
  failure:x.failure,status:x.status,metrics:x.metrics,errors:x.errors})),
 hidden200:report.filter(x=>!x.expectedPublic&&x.status===200).map(x=>x.slug)
};
summary.hidden200=[...new Set(summary.hidden200)];
await fs.writeFile(path.join(out,"report.json"),JSON.stringify({summary,report},null,2));
console.log("MATRIX_SUMMARY",JSON.stringify(summary));
if(summary.failures.length)process.exitCode=1;
