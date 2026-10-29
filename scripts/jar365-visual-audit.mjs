import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const dir=process.env.AUDIT_OUTPUT_DIR||"visual-jar365";
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const report=[];
for (const size of [{name:"mobile-320",width:320,height:720},{name:"mobile-390",width:390,height:844},{name:"desktop",width:1440,height:900}]) {
 const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1,isMobile:size.width<600,hasTouch:size.width<600});
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 const response=await page.goto(base+"/experiencias/frasco365",{waitUntil:"networkidle",timeout:45000});
 if(!response||response.status()!==200)throw Error(size.name+": demo route failed");
 await page.screenshot({path:path.join(dir,size.name+"-01-frasco.png"),fullPage:true});
 if(await page.getByRole("button",{name:/Sacar mi papelito/i}).count()!==1)throw Error(size.name+": draw button missing");
 const wide=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 if(wide)throw Error(size.name+": horizontal overflow");
 await page.getByRole("button",{name:/Sacar mi papelito/i}).click();
 const modal=page.getByRole("dialog",{name:/Papelito 1/i});
 await modal.waitFor({state:"visible",timeout:5000});
 const text=await modal.locator(".jar365-note-message").innerText();
 if(!text||text.length<18)throw Error(size.name+": empty opening text");
 await page.screenshot({path:path.join(dir,size.name+"-02-abierto.png"),fullPage:true});
 await modal.getByRole("button",{name:/Guardar y cerrar/i}).click();
 await page.getByRole("button",{name:/Mis papelitos abiertos/i}).click();
 const history=page.getByRole("dialog",{name:"Papelitos que ya abriste"});
 await history.waitFor({state:"visible",timeout:4000});
 if(await history.locator(".jar365-history-note").count()!==1)throw Error(size.name+": history missing opened note");
 await page.screenshot({path:path.join(dir,size.name+"-03-historial.png"),fullPage:true});
 if(errors.length)throw Error(size.name+": JavaScript errors "+errors.join(" | "));
 report.push({viewport:size.name,status:"OK",firstNote:text,overflow:false});
 await page.close();
}
await browser.close();
await fs.writeFile(path.join(dir,"report.json"),JSON.stringify(report,null,2));
console.log("JAR365 VISUAL AUDIT OK "+JSON.stringify(report));
