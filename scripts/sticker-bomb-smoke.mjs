/**
 * Public Sticker Bomb regression smoke.
 * Usage: AUDIT_BASE_URL=http://localhost:3000 node scripts/sticker-bomb-smoke.mjs
 * Requires playwright (used by the repository's existing browser QA scripts).
 */
import { chromium } from "playwright";
const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:width===1440?900:844},isMobile:width<600,hasTouch:width<600});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const response=await page.goto(base+"/experiencias/sticker-bomb-amistad?embed=1",{waitUntil:"domcontentloaded"});
  if(response?.status()!==200)throw new Error("Demo unavailable at "+width+"px");
  await page.getByRole("button",{name:/Abrir nuestro expediente/}).click();
  const titles=[];
  for(let i=0;i<12;i++){
   titles.push(await page.locator("section[aria-label^='Capítulo'] h1").innerText());
   if(i<11)await page.getByRole("button",{name:"Ir al siguiente capítulo"}).click();
  }
  if(new Set(titles).size!==12)throw new Error("Missing unique chapters: "+titles.length);
  await page.getByRole("button",{name:"Abrir la carta"}).click();
  if(await page.locator("article").filter({hasText:"Para mi persona favorita"}).count()!==1)
   throw new Error("Final letter did not open at "+width+"px");
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+5))
   throw new Error("Mobile horizontal overflow at "+width+"px");
  if(errors.length)throw new Error("Browser errors: "+errors.join("; "));
  results.push({width,chapters:titles.length,letter:"open",overflow:"none",errors:0});
  await page.close();
 }
 const home=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await home.goto(base+"/",{waitUntil:"domcontentloaded"});
 const card=home.locator(".ethos-like-card--sticker-bomb-amistad");
 const cover=card.locator(".ethos-phone-screen img");
 await cover.scrollIntoViewIfNeeded();
 await home.waitForFunction(()=>{const i=document.querySelector(".ethos-like-card--sticker-bomb-amistad .ethos-phone-screen img");return !!i&&i.complete&&i.naturalWidth>0;},{timeout:15000});
 if(!(await cover.getAttribute("src"))?.endsWith("/sticker-bomb-amistad.svg"))throw new Error("Wrong public thumbnail");
 await card.getByRole("button",{name:/Iniciar demo/}).click();
 const frame=card.locator("iframe");await frame.waitFor();
 const embedded=frame.contentFrame();await embedded.getByRole("button",{name:/Abrir nuestro expediente/}).click();
 if(!(await embedded.locator("section[aria-label^='Capítulo'] h1").innerText()).includes("Atención"))
  throw new Error("Embedded demo did not start");
 results.push({homepage:"preview SVG loaded and embedded demo opens"});
 await home.close();
 console.log(JSON.stringify({pass:true,results},null,2));
}finally{await browser.close();}
