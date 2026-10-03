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
    const metrics=await page.evaluate((isDemo)=>{
      const rect=(selector)=>{
        const el=document.querySelector(selector);
        if(!el) return null;
        const r=el.getBoundingClientRect();
        return {selector,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
      };
      const overlaps=(a,b)=>{
        if(!a||!b) return false;
        return Math.min(a.right,b.right)-Math.max(a.left,b.left)>3 &&
          Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3;
      };

      let syntheticSoundtrack=null;
      if(isDemo){
        const ghost=document.createElement("button");
        ghost.className="soundtrack-control not-started";
        ghost.style.visibility="hidden";
        ghost.innerHTML="<span>♪</span><div><small>Tocar para activar</small><strong>Música de fondo</strong></div><i><b></b><b></b><b></b><b></b></i>";
        document.body.appendChild(ghost);
        const r=ghost.getBoundingClientRect();
        syntheticSoundtrack={selector:".soundtrack-control(synthetic)",left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
        ghost.remove();
      }

      const chrome=[
        rect(".demo-ribbon"),
        rect(".floating-whatsapp"),
        rect(".experience-topbar"),
        syntheticSoundtrack,
      ].filter(Boolean);

      const collisions=[];
      for(let i=0;i<chrome.length;i++){
        for(let j=i+1;j<chrome.length;j++){
          if(overlaps(chrome[i],chrome[j])) collisions.push([chrome[i].selector,chrome[j].selector]);
        }
      }

      return {
        scrollWidth:document.documentElement.scrollWidth,
        innerWidth:window.innerWidth,
        overflow:document.documentElement.scrollWidth-window.innerWidth,
        scrollHeight:document.documentElement.scrollHeight,
        title:document.title,
        currentScene:document.querySelector(".experience-shell")?.getAttribute("data-current-scene")||null,
        chrome,
        collisions,
      };
    },route.startsWith("/experiencias/"));
    const file=`${name}-${mode}.png`;
    await page.screenshot({path:path.join(out,file),fullPage:route==="/"||route==="/crear"});
    report.push({route,mode,status:response?.status()??null,file,metrics,errors});
  }
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
