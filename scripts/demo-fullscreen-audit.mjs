import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const dir=process.env.AUDIT_OUTPUT_DIR||"visual-demo-fullscreen";
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const report=[];

for(const viewport of [
 {name:"android-320",width:320,height:720},
 {name:"android-390",width:390,height:844},
 {name:"desktop-1440",width:1440,height:900},
]){
 for(const route of ["/crear","/"]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,isMobile:viewport.width<=600,hasTouch:viewport.width<=600});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  const resp=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:45000});
  if(resp?.status()!==200)throw Error(viewport.name+" "+route+" failed to load");
  const cards=page.locator(route==="/crear"?".create-gallery-card":".ethos-like-card");
  await cards.first().waitFor({state:"visible",timeout:10000});
  const count=await cards.count();
  if(count<6)throw Error(viewport.name+" "+route+" too few cards: "+count);
  const buttons=page.locator(".demo-expand-trigger");
  if(await buttons.count()!==count)throw Error(viewport.name+" "+route+" missing fullscreen options");
  const first=cards.first();
  await first.getByRole("button",{name:/en pantalla completa/i}).click();
  const dialog=page.getByRole("dialog",{name:/pantalla completa/i});
  await dialog.waitFor({state:"visible",timeout:8000});
  const frame=dialog.locator("iframe.demo-fullscreen-iframe");
  await frame.waitFor({state:"visible",timeout:10000});
  const src=await frame.getAttribute("src");
  if(!src?.includes("/experiencias/")||!src.includes("?embed=1"))
    throw Error(viewport.name+" "+route+" not rendering real full demo route: "+src);
  const geometry=await frame.boundingBox();
  if(!geometry||geometry.width<Math.min(viewport.width,600)-3||geometry.height<viewport.height-110)
    throw Error(viewport.name+" "+route+" preview too small: "+JSON.stringify(geometry));
  const bodyOverflow=await page.evaluate(()=>getComputedStyle(document.body).overflow);
  if(bodyOverflow!=="hidden")throw Error("Backdrop scrolling not locked");
  await page.screenshot({path:path.join(dir,viewport.name+"-"+(route==="/crear"?"crear":"home")+"-fullscreen.png"),fullPage:false});
  await dialog.getByRole("button",{name:/Cerrar pantalla completa y volver/}).click();
  await dialog.waitFor({state:"detached",timeout:3000});
  if(await page.locator(".demo-fullscreen").count())throw Error("overlay remains after close");
  if(await page.evaluate(()=>document.body.style.overflow)==="hidden")throw Error("body remains locked after close");
  await first.getByRole("button",{name:/en pantalla completa/i}).click();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog",{name:/pantalla completa/i}).waitFor({state:"detached",timeout:3000});
  if(errors.length)throw Error(viewport.name+" "+route+": JS errors "+errors.join("; "));
  report.push({viewport:viewport.name,route,cards:count,fullscreen:true,back:true,escape:true,width:geometry.width,height:geometry.height});
  await page.close();
 }
}
await browser.close();
await fs.writeFile(path.join(dir,"report.json"),JSON.stringify(report,null,2));
console.log("DEMO FULLSCREEN AUDIT OK "+JSON.stringify(report));
