import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const dir=process.env.AUDIT_OUTPUT_DIR||"visual-creator-grid";
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const report=[];
const viewports=[
  {name:"android-320",width:320,height:720},
  {name:"android-390",width:390,height:844},
  {name:"tablet-768",width:768,height:1024},
  {name:"desktop-1440",width:1440,height:900},
];

for(const viewport of viewports){
 const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,isMobile:viewport.width<600,hasTouch:viewport.width<600});
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 const response=await page.goto(base+"/crear",{waitUntil:"domcontentloaded",timeout:45000});
 if(!response||response.status()!==200)throw Error(viewport.name+": create page unavailable");
 const grid=page.locator(".create-gallery-grid");
 await grid.waitFor({state:"visible",timeout:15000});
 const cards=page.locator(".create-gallery-card");
 if(await cards.count()<7)throw Error(viewport.name+": experience grid missing expected product cards");
 const columns=await grid.evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(" ").length);
 const expectedColumns=viewport.width<=600?1:viewport.width<=980?2:3;
 if(columns!==expectedColumns)throw Error(viewport.name+": expected "+expectedColumns+" columns, got "+columns);
 const header=page.locator(".site-header");
 const bg=await header.evaluate(el=>getComputedStyle(el).backgroundColor);
 if(!bg.includes("255, 253, 250"))throw Error(viewport.name+": page header does not match warm light Home; found "+bg);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
 if(overflow)throw Error(viewport.name+": horizontal overflow");
 if(await page.locator(".choice-grid").count())throw Error(viewport.name+": legacy dark selection grid still present");
 await page.screenshot({path:path.join(dir,viewport.name+"-01-gallery.png"),fullPage:true});
 const first=cards.first();
 await first.getByRole("button",{name:/Probar demo de/i}).click();
 const iframe=first.locator("iframe.ethos-scaled-iframe");
 await iframe.waitFor({state:"attached",timeout:12000});
 await iframe.contentFrame().locator("body").waitFor({state:"visible",timeout:15000});
 if(!((await iframe.getAttribute("src"))||"").includes("/experiencias/"))throw Error(viewport.name+": demo is not the real experience route");
 await page.screenshot({path:path.join(dir,viewport.name+"-02-demo.png"),fullPage:false});
 await first.getByRole("button",{name:/Cerrar demo/}).click();
 await page.locator(".create-gallery-card").filter({hasText:"Nuestra historia"}).getByRole("button",{name:/Elegir esta experiencia/}).click();
 await page.getByRole("heading",{name:"¿Quién hace esto y para quién?"}).waitFor({state:"visible",timeout:5000});
 if(errors.length)throw Error(viewport.name+": JS errors "+errors.join("; "));
 report.push({viewport:viewport.name,columns,cards:await cards.count(),demo:true,selectionContinues:true,overflow:false});
 await page.close();
}
const sales=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await sales.goto(base+"/crear",{waitUntil:"domcontentloaded",timeout:45000});
await sales.locator(".create-gallery-card").filter({hasText:"Un año de cosas lindas"}).getByRole("button",{name:/Elegir esta experiencia/}).click();
await sales.waitForURL("**/comprar/frasco365",{timeout:7500});
if(await sales.getByText(/todavía no habilitamos pagos/i).count()<1)throw Error("Unverified Frasco365 checkout was enabled");
report.push({viewport:"specialized-checkout",jarProtected:true});
await sales.close();
await browser.close();
await fs.writeFile(path.join(dir,"report.json"),JSON.stringify(report,null,2));
console.log("CREATOR GRID AUDIT SUCCESS "+JSON.stringify(report));
