/**
 * Assert that Sticker Bomb is an illustrated, functional 12-sticker experience.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3000 node scripts/sticker-bomb-sticker-audit.mjs
 */
import {chromium} from "playwright";
const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:width===1440?900:844},isMobile:width<600,hasTouch:width<600});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const response=await page.goto(base+"/experiencias/sticker-bomb-amistad?embed=1",{waitUntil:"domcontentloaded"});
  if(response?.status()!==200)throw Error("Demo HTTP "+response?.status());
  await page.getByRole("button",{name:/Abrir nuestro expediente/}).click();
  const stickers=new Set();
  for(let i=0;i<12;i++){
   const part=page.locator("section[aria-label^='Capítulo']");
   const title=await part.locator("h1").innerText();
   const sticker=part.getByRole("button",{name:/Despegar el sticker/});
   if(await sticker.count()!==1)throw Error("Missing original-inspired sticker "+title);
   const aria=await sticker.getAttribute("aria-label");stickers.add(aria);
   if(await sticker.locator("svg").count()!==1)throw Error("Missing sticker illustration at "+i);
   await sticker.click();if(await sticker.getAttribute("aria-pressed")!=="true")throw Error("Sticker did not peel "+title);
   if(await part.getByText("STICKER DESBLOQUEADO").count()!==1)throw Error("Speech reveal not shown "+title);
   if(i<11)await page.getByRole("button",{name:"Ir al siguiente capítulo"}).click();
  }
  if(stickers.size!==12)throw Error("Stickers not distinct: "+stickers.size);
  await page.getByRole("button",{name:"Abrir la carta"}).click();
  if(await page.locator("article").filter({hasText:"Para mi persona favorita"}).count()!==1)throw Error("Final letter failed");
  if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+5))throw Error("Horizontal overflow");
  if(errors.length)throw Error("Uncaught errors "+errors.join(";"));
  results.push({width,stickers:stickers.size,finalLetter:true,overflow:false,errors:0});
  await page.close();
 }
 console.log(JSON.stringify({pass:true,results},null,2));
}finally{await browser.close();}
