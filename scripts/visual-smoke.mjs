import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const out = path.resolve("visual-smoke");
await fs.mkdir(out,{recursive:true});

const routes = [
  ["/","home"],
  ["/crear","crear"],
  ...["pareja","cumpleanos","hijos","abuelos","aniversario","propuesta","mama","papa","amistad"]
    .map(slug=>[`/experiencias/${slug}`,`demo-${slug}`]),
];

const configs=[
  ["desktop",1440,1000],
  ["mobile",390,844],
];

const browser=await chromium.launch({headless:true});
const report=[];

for(const [mode,width,height] of configs){
  const context=await browser.newContext({viewport:{width,height},locale:"es-AR"});
  const page=await context.newPage();
  for(const [route,name] of routes){
    const errors=[];
    page.removeAllListeners("console");
    page.removeAllListeners("pageerror");
    page.on("console",m=>{if(m.type()==="error") errors.push(m.text())});
    page.on("pageerror",e=>errors.push(String(e)));
    const response=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:30000});
    await page.waitForTimeout(900);
    const metrics=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,
      innerWidth:window.innerWidth,
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      scrollHeight:document.documentElement.scrollHeight,
      title:document.title,
      currentScene:document.querySelector(".experience-shell")?.getAttribute("data-current-scene")||null,
    }));
    const file=`${name}-${mode}.png`;
    await page.screenshot({path:path.join(out,file),fullPage:route==="/"||route==="/crear"});
    report.push({route,mode,status:response?.status()??null,file,metrics,errors});
  }
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
