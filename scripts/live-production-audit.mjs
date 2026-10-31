import {chromium} from "playwright";
import fs from "node:fs/promises";
const origin="https://tehiceesto.com";
const paths=["/","/crear","/coleccion/todos","/coleccion/amigos","/coleccion/pareja","/coleccion/juegos","/mis-regalos","/escapes","/juegos/pack","/juegos/pack/completo","/juegos/pack/pedido","/juegos/entre-dos","/juegos/complices","/juegos/trazo-complice","/comprar/pareja","/comprar/mama","/comprar/amistad","/comprar/sticker-bomb-amistad","/comprar/pack-juegos","/experiencias/pareja","/experiencias/amistad","/experiencias/club-amigos","/experiencias/sticker-bomb-amistad"];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"es-AR"});
const report=[];const hrefs=new Set();await fs.mkdir("audit-live",{recursive:true});
try{
 for(const p of paths){
  let result={path:p};let errors=[];const onerror=e=>errors.push(e.message);
  page.on("pageerror",onerror);
  try{
   const response=await page.goto(origin+p,{waitUntil:"domcontentloaded",timeout:26000});
   await page.waitForTimeout(400);
   result.status=response?.status();result.title=await page.title();
   result.metrics=await page.evaluate(()=>({width:innerWidth,contentWidth:document.documentElement.scrollWidth,heading:(document.querySelector("h1")?.textContent||"").trim().slice(0,70),brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src).slice(0,8)}));
   const links=await page.locator("a[href]").evaluateAll(a=>a.map(x=>x.getAttribute("href")));
   if(["/","/crear","/coleccion/amigos"].includes(p))for(const h of links){
    if(h?.startsWith("/")&&!h.startsWith("//")&&!h.startsWith("/#"))hrefs.add(h.split("?")[0].split("#")[0]);
   }
   if(["/","/coleccion/amigos","/juegos/pack","/comprar/pareja","/comprar/sticker-bomb-amistad"].includes(p)){
    await page.screenshot({path:"audit-live/"+(p==="/"
      ?"home":p.replaceAll("/","_"))+".png",fullPage:true});
   }
   result.hasDiscount=(await page.locator("body").innerText()).includes("60% OFF");
   result.hasExperienceOffer=await page.locator("#add-experience,.quick-checkout-addon--experience").count()>0;
  }catch(e){result.error=String(e).slice(0,190)}
  page.off("pageerror",onerror);result.errors=errors.slice(0,3);report.push(result);
 }
 for(const href of [...hrefs].filter(x=>!paths.includes(x)).slice(0,50)){
  try{const r=await page.request.get(origin+href,{timeout:16000});report.push({path:href,linkOnly:true,status:r.status()})}
  catch(e){report.push({path:href,linkOnly:true,error:String(e).slice(0,120)})}
 }
 await fs.writeFile("audit-live/report.json",JSON.stringify(report,null,2));
 const bad=report.filter(x=>x.error||x.status>=400||x.metrics?.contentWidth>x.metrics?.width+3||x.errors?.length||x.metrics?.brokenImages?.length);
 console.log("AUDIT",JSON.stringify({count:report.length,failures:bad,checkout:report.filter(x=>x.path.startsWith("/comprar/")).map(x=>({path:x.path,discount:x.hasDiscount,experienceOffer:x.hasExperienceOffer}))}).slice(0,22000));
}finally{await browser.close()}
